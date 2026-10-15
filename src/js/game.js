const G_HP_K=2.4,G_DMG_K=1.0,BASE_POWER=1.6;
/* XP gems: when the ground gets crowded the farthest gems are merged into one big red gem parked just outside the screen */
const GEM_CAP=90,GEM_KEEP=55;
const XP_MUL=.5,BOSS_HP_MUL=.95,ENEMY_SPD_MUL=1.1,ENEMY_HP_MUL=1.1,ENEMY_DMG_MUL=1.2;
'use strict';
/* ====== Game core (no DOM access: UI/renderer observe it) ====== */
class Game{
  constructor(o,env){
    this.env=env;this.save=env.save.d;this.audio=env.audio;this.progress=env.progress;
    this.stageIdx=o.stage;this.stage=STAGES[o.stage];this.sd=this.stage.dif!==undefined?this.stage.dif:o.stage;World.setTheme(this.stage.theme);this.C=CHARS.find(c=>c.id===o.char);
    this.diffId=o.diff;this.D=DIFF[o.diff];this.x2=!!o.x2;this.sandbox=!!o.sandbox;
    this.t=0;this.kills=0;this.lvl=1;this.xp=0;this.need=xpNeed(1);
    this.p={x:0,y:0,hp:1,maxHp:1,face:1,inv:0,mv:false};
    this.input={x:0,y:0,interact:false};
    this.en=[];this.pr=[];this.eb=[];this.gm=[];this.rg=null;this.loot=[];this.feat=[];this.chests=[];this.fx=[];this.tx=[];
    this.weapons=new Map();this.pass={};this.trinkets=[];
    this.formsUnlocked=0;this.formIdx=-1;this.formColor=null;
    this.buffs={dmg:0,haste:0};this.tempBuffs=[];this.luckBonus=0;this.wishLog=[];this.cast=null;
    this.run={bossKills:0,evos:0,legendary:0,coins:0,chests:0,perfect:0,balls:0,wishes:0};
    this.bank={kills:0,bossKills:0,chests:0,balls:0,wishes:0,perfect:0,coins:0,t:0,counted:false,cleared:false};
    this.balls=0;this.senzu=0;this.senzuCd=0;this.revives=0;this.totemLuck=0;this.totemFx={};this.totemTag=null;this.stormT=0;this.pulseT=0;this.abCd=0;this.regenT=0;this.regenRate=0;this.clones=null;this.cloneT=0;this.critT=0;this.shieldT=0;this.tsT=0;this.abBuf=null;this.dashT=0;this.dashHit=null;this.hpHist=[];this.histT=0;this.bshock=null;this.riskT=0;this.kai=0;this.bers=0;this.bersCd=0;this.bersT=0;this.bv=null;this.xform=null;this.afterX=null;this.shocks=[];this.shockId=0;this.inHeal=false;this.emo=null;this.emoT=0;this.modal=null;this.banner=null;this.flash=0;this.flashC='#fff';this.shake=0;
    this.vw=960;this.vh=560;
    this.TS=1;this.CR=this.x2?2:1;this.rt=0;this.dur=this.stage.time*this.TS;this.trialN=0;
    this.spAcc=0;this.hordeT=130*this.TS;this.packT=40;this.bossQ=this.stage.bosses.map(b=>({id:b[0],t:b[1]*this.TS,final:!!b[2],done:false}));
    this.bossHit=false;this.finalSpawned=false;this.cleared=false;this.ended=false;
    this.slowT=0;this.slowCd=12;this.shockCd=8;this.barrierT=0;this.barrierReady=false;this.auraAcc=0;this.ck=0;
    this.timeScale=1;this.sb={god:false,nospawn:false};this.showNums=this.save.settings.dmgNum;
    this.bossAlive=0;this.trial=null;this.swap={might:0,spd:0,cd:0,hp:0};this.bombOn=false;this.bombT=rnd(90,150);this.bombEnd=0;this.shootOn=false;this.shootT=rnd(60,100);this.shootEnd=0;this.bz=[];this.vortex=null;this.seenT=1;this.newSeen=false;
    this.map=new MapDirector(this);
    for(const id of this.C.start)this.addWeapon(id);
    this.revives=(this.save.shop.revive||0);
    this.luckT=0;this.initPet(o.pet||this.save.pet||'dende');
    this.recalc();this.p.hp=this.p.maxHp;
  }
  get viewR(){return Math.hypot(this.vw,this.vh)/2+50;}
  get formMax(){return Math.min(FORM_TIERS.length,LINES[this.C.line||'saiyan'].length);}
  get form(){return this.formIdx>=0?Object.assign({idx:this.formIdx},FORM_TIERS[this.formIdx]):null;}
  get formEntry(){return this.formIdx>=0?LINES[this.C.line||'saiyan'][this.formIdx]:null;}
  has(sp){return this.trinkets.some(id=>{const t=TRINKETS.find(x=>x.id===id);return t&&t.sp===sp;});}
  say(txt,col,dur){this.banner={txt,col:col||'#ffd23f',t:0,dur:dur||2.6};}
  floatText(x,y,s,c){if(this.tx.length<50)this.tx.push({x,y,t:0,s,c:c||0});}

  /* ---------- stats ---------- */
  tMods(){
    const m={might:0,spd:0,cd:0,xp:0,gold:0,crit:0,armor:0,regen:0,dodge:0,area:0,magnet:0,hpPct:0,lootRate:0};
    for(const id of this.trinkets){const t=TRINKETS.find(x=>x.id===id);if(t&&t.m)for(const k in t.m)m[k]+=t.m[k];}
    return m;
  }
  recalc(){
    const C=this.C,P=this.pass,sl=id=>this.save.shop[id]||0,tm=this.tMods(),fm=this.form,sh={might:0,spd:0,cd:0,hp:0,regen:0,magnet:0};
    for(const b of this.tempBuffs)sh[b.k]+=b.v;
    const S={};
    S.might=BASE_POWER*C.might*(1+.15*(P.might||0))*(1+(C.lvMight||0)*(this.lvl-1))*(1+.03*sl('might'))*(1+(fm?fm.might:0))*(1+tm.might+sh.might)*(this.buffs.dmg>0?1.15:1);
    S.spd=C.spd*(1+.08*(P.speed||0))*(1+.02*sl('speed'))*(1+(fm?fm.spd:0)+tm.spd+sh.spd);
    S.cd=Math.max(.35,(C.cd||1)-.08*(P.haste||0)-.02*sl('cd')-(fm?fm.cd:0)-tm.cd-sh.cd-(this.buffs.haste>0?.12:0));
    S.magnet=100*(C.mag||1)*(1+.35*(P.magnet||0))*(1+.1*sl('magnet')+tm.magnet+sh.magnet);
    S.armor=(P.armor||0)+(C.armor||0)+.5*sl('armor')+(fm?fm.armor:0)+tm.armor;
    S.regen=C.regen+.5*(P.regen||0)+.1*sl('regen')+(fm?fm.regen:0)+tm.regen+sh.regen;
    S.xp=C.xpm*(1+.12*(P.growth||0))*(1+.05*sl('exp')+tm.xp)*(this.x2?.18:1);
    S.gold=1+.1*sl('gold')+tm.gold;
    S.crit=.05+.02*sl('crit')+tm.crit;S.critDmg=1.75;
    S.dodge=Math.min(.75,(fm?fm.dodge:0)+tm.dodge);
    S.area=1+tm.area+(fm?fm.idx*.03:0);
    S.proj=fm?(fm.idx>=6?2:fm.idx>=3?1:0):0;
    S.luck=Math.min(.9,.05*sl('luck')+this.luckBonus+(this.luckT>0?.03:0));S.lootRate=tm.lootRate;S.taken=1+(fm?fm.taken:0);
    if(this.riskT>0){S.xp*=2;S.taken*=1.5;}
    if(this.bers>0){S.might*=1.8;S.armor+=3;S.taken*=.7;}
    if(this.critT>0)S.crit+=.35;
    if(this.abBuf){S.might*=1+(this.abBuf.m||0);S.spd*=1+(this.abBuf.s||0);S.taken*=1+(this.abBuf.tk||0);}
    if(this.kai>0){const km=this.kai===1?2:4;S.might*=km;S.spd*=1+.4*(km-1);S.cd=Math.max(.15,S.cd/km);}
    S.might*=1+this.swap.might;S.spd*=1+this.swap.spd;S.cd=Math.max(.3,S.cd*(1-this.swap.cd));
    {const tf=this.totemFx;if(tf.might)S.might*=1+tf.might;if(tf.cd)S.cd=Math.max(.3,S.cd*(1+tf.cd));if(tf.gold)S.gold+=tf.gold;if(tf.magnet)S.magnet*=1+tf.magnet;if(tf.regen)S.regen+=tf.regen;}
    this.S=S;
    const mh=Math.round((C.hp+20*(P.vit||0)+8*sl('hp')+sh.hp)*(1+tm.hpPct+(this.totemFx.hp||0))*(1+this.swap.hp));
    if(mh>this.p.maxHp)this.p.hp+=mh-this.p.maxHp;else if(this.p.hp>mh)this.p.hp=mh;
    this.p.maxHp=mh;
    const e=this.formEntry;this.formColor=e?e.aura:null;
    const cfg=cfgForForm(C,this.formIdx);
    this.pc=cfg;this.pcKey=C.id+':'+this.formIdx;
  }

  /* ---------- weapons / upgrades ---------- */
  addWeapon(id){if(this.weapons.has(id))return this.weapons.get(id);const w=Weapon.create(this,id);this.weapons.set(id,w);return w;}
  evolveWeapon(id){
    const w=this.weapons.get(id);if(!w||w.evo>=this.maxEvo(id))return false;
    w.evolve();this.run.evos++;this.audio.sfx('evolve');
    this.say(this.env.tr(w.evoName)+'!',w.def.c,3);this.flash=.5;this.flashC=w.def.c;
    this.ring(this.p.x,this.p.y,220,w.def.c,.7);this.burst(this.p.x,this.p.y-20,40,w.def.c);
    this.pillar(this.p.x,this.p.y,w.def.c,1);this.bolt(this.p.x,this.p.y-20,160,w.def.c,6);
    this.recalc();return true;
  }
  maxEvo(id){return this.sandbox?2:1+(this.save.we[id]?1:0);}
  /* a weapon evolves (from a chest) when it is at max level and the matching passive is owned */
  evoReady(w){return w.maxed&&w.evo<this.maxEvo(w.id)&&(this.sandbox||(this.pass[evoPass(w.id,w.evo)]||0)>0);}
  /* passives that a maxed weapon is still waiting for */
  neededPass(){const out=[];for(const w of this.weapons.values()){if(!w.maxed||w.evo>=this.maxEvo(w.id))continue;const p=evoPass(w.id,w.evo);if(p&&!(this.pass[p]>0)&&!out.includes(p))out.push(p);}return out;}
  unlockedW(id){return this.sandbox||!!this.save.wu[id]||this.C.start.includes(id);}
  passCount(){let n=0;for(const k in this.pass)if(this.pass[k]>0)n++;return n;}   /* number of different secondary upgrades */
  upgradePool(){
    const pool=[];
    for(const [id,w] of this.weapons)if(w.lv<WMAX)pool.push({type:'w',id,lv:w.lv});
    const slots=this.passCount();
    for(const id in PASS){const lv=this.pass[id]||0;if(lv<5&&(lv>0||slots<MAX_PASSIVES))pool.push({type:'p',id,lv});}
    return pool;
  }
  levelOptions(){
    const pool=this.upgradePool();
    if(this.weapons.size<MAX_WEAPONS)for(const id in WEAPONS)if(!this.weapons.has(id)&&this.unlockedW(id))pool.push({type:'w',id,lv:0});
    shuffle(pool);
    const sz=this.senzu<SENZU_MAX&&Math.random()<.09;
    /* a maxed weapon waiting for its evolution passive makes that passive show up more often */
    const need=this.neededPass().filter(id=>pool.some(o=>o.type==='p'&&o.id===id));
    if(need.length&&Math.random()<.55){const nid=pick(need),i=pool.findIndex(o=>o.type==='p'&&o.id===nid);if(i>2){const t=pool[i];pool.splice(i,1);pool.unshift(t);}}
    const out=pool.slice(0,3);
    while(out.length<3)out.push({type:'h'});
    if(sz&&!out.some(o=>o.type==='h'))out[2]={type:'h'};   /* a Senzu bean sometimes shows up among the level-up cards */
    return out;
  }
  applyOption(o){
    if(o.type==='w'){const w=this.addWeapon(o.id);if(o.lv>0)w.upgrade();}
    else if(o.type==='p'){const cur=this.pass[o.id]||0;if(cur<5&&(cur>0||this.passCount()<MAX_PASSIVES))this.pass[o.id]=cur+1;else this.heal(this.p.maxHp*.2);}
    else if(o.type==='h'){if(this.senzu<SENZU_MAX){this.senzu++;this.floatText(this.p.x,this.p.y-48,this.env.tr(T('Senzu in borsa ','Senzu bagged '))+this.senzu+'/'+SENZU_MAX,2);}else this.heal(this.p.maxHp*.4);}
    else if(o.type==='z')this.addZenny(o.v);
    this.recalc();
  }
  /* eat a Senzu bean from the bag (key H / on-screen button) */
  useSenzu(){
    if(this.ended||this.modal||this.senzu<=0||this.senzuCd>0||this.p.hp>=this.p.maxHp-.5)return false;
    this.senzu--;this.senzuCd=.8;this.heal(this.p.maxHp*.4);
    const p=this.p;this.floatText(p.x,p.y-56,this.env.tr(T('Senzu!','Senzu!')),2);this.pillar(p.x,p.y,'#8be07a',.9);this.ring(p.x,p.y,70,'#8be07a',.5);this.burst(p.x,p.y-20,16,'#bfffb0');
    this.audio.sfx('abHeal');this.emote('happy',1);return true;
  }
  upgradeWeapon(w){w.upgrade();this.recalc();}
  heal(v){this.p.hp=Math.min(this.p.maxHp,this.p.hp+v);}
  addZenny(v){this.run.coins+=v;}

  /* ---------- trinkets ---------- */
  addTrinket(id){
    if(this.trinkets.includes(id)||this.trinkets.length>=6)return false;
    const t=TRINKETS.find(x=>x.id===id);if(!t)return false;
    this.trinkets.push(id);this.save.trin[id]=1;if(t.r===3)this.run.legendary++;
    if(t.sp==='barrier'){this.barrierReady=true;}
    this.audio.sfx('trinket');this.recalc();return true;
  }
  rarityWeights(){
    const si=this.sd,L=this.S.luck;
    return[62,27*(1+.05*si+L*.4),9.5*(1+.1*si+L*.8),1.5*(1+.15*si+L*1.2)];
  }
  rollTrinket(excl){
    const w=this.rarityWeights();excl=excl||[];
    for(let tries=0;tries<14;tries++){
      let r=Math.random()*w.reduce((a,b)=>a+b,0),ri=0;
      for(let i=0;i<4;i++){r-=w[i];if(r<=0){ri=i;break;}}
      const c=TRINKETS.filter(t=>t.r===ri&&!this.trinkets.includes(t.id)&&!excl.includes(t.id));
      if(c.length)return pick(c).id;
    }
    const any=TRINKETS.filter(t=>!this.trinkets.includes(t.id)&&!excl.includes(t.id));return any.length?pick(any).id:null;
  }
  /* boss trinket choice: 4 options, up to 10 with Luck */
  pickCount(){return Math.min(10,4+Math.round(this.S.luck*6.7));}
  rollTrinketList(n){const out=[];for(let i=0;i<n;i++){const id=this.rollTrinket(out);if(!id)break;out.push(id);}return out;}
  /* one reward per chest (evolution has priority, otherwise one normal upgrade); Luck can add a trinket */
  chestRewards(isFinal,boss){
    const R=[],elig=[...this.weapons.values()].filter(w=>this.evoReady(w));
    if(elig.length)R.push({k:'evo',id:pick(elig).id});
    else{const pool=shuffle(this.upgradePool());if(pool.length)R.push({k:'up',o:pool.pop()});else R.push({k:'zenny',v:Math.round(40*(1+this.sd))});}
    if(boss){
      if(this.trinkets.length<6){const o=this.rollTrinketList(this.pickCount());if(o.length)R.push({k:'pick',opts:o});}
      else R.push({k:'zenny',v:Math.round(60*(1+this.sd))});
    }else{
      const bonus=Math.min(.4,this.S.luck*.9);
      if(Math.random()<bonus&&this.trinkets.length<6){const id=this.rollTrinket();if(id)R.push({k:'trinket',id});}
    }
    return R;
  }

  /* ---------- modal flow ---------- */
  resolveModal(i){
    const m=this.modal;if(!m)return;
    if(m.type==='level'){this.applyOption(m.options[i]||m.options[0]);}
    else if(m.type==='chest'){
      for(const r of m.rewards){
        if(r.k==='evo')this.evolveWeapon(r.id);
        else if(r.k==='up')this.applyOption(r.o);
        else if(r.k==='trinket')this.addTrinket(r.id);
        else if(r.k==='zenny')this.addZenny(r.v);
      }
      const pk=m.rewards.find(r=>r.k==='pick');
      if(pk){this.modal={type:'pick',opts:pk.opts};return;}
    }else if(m.type==='totem'){
      this.applyTotem((m.opts||['luck','risk'])[i]||'luck');
    }else if(m.type==='pick'){
      const id=m.opts[i];if(id)this.addTrinket(id);
    }else if(m.type==='trial'){this.endTrial();
    }else if(m.type==='wish'){
      const w=m.options[i]||m.options[0];
      this.run.wishes++;this.wishLog.push(w);
      if(w==='revive'){this.revives++;this.say(this.env.tr(T('Desiderio: una seconda vita!','Wish: a second life!')),'#8be07a',3);}
      else if(w==='power'){for(const x of this.weapons.values())if(x.lv<WMAX){x.upgrade();if(x.lv<WMAX)x.upgrade();}this.say(this.env.tr(T('Desiderio: potere!','Wish: power!')),'#ffd23f',3);}
      else{this.addZenny(300);const id=this.rollTrinket();if(id)this.addTrinket(id);this.say(this.env.tr(T('Desiderio: fortuna!','Wish: fortune!')),'#ffb13b',3);}
      this.heal(this.p.maxHp);this.balls=0;this.recalc();
    }
    this.modal=null;
  }

  /* ---------- character abilities ---------- */
  get abReady(){const a=this.abil;if(a.m==='kaioken')return this.kaiAvail;if(a.m==='berserk')return this.bersCd<=0&&this.bers<=0;return this.abCd<=0;}
  useAbility(){
    if(this.modal||this.ended||this.xform)return false;
    const a=this.abil;
    if(a.m==='berserk')return this.startBerserk();
    if(a.m==='kaioken')return this.kaiToggle();
    if(this.abCd>0)return false;
    const p=this.p,v=a.v,c=a.c,L=this.lvl,tr=o=>this.env.tr(o);
    const near=this.nearest(p.x,p.y,700);
    switch(a.m){
      case'beam':{
        const ang=near?Math.atan2(near.y-8-(p.y-18),near.x-p.x):(p.face>0?0:Math.PI),len=640,w=64,dmg=(30+L*3)*v,cs=Math.cos(ang),sn=Math.sin(ang);
        for(const e of this.en){if(e.dead)continue;const rx=e.x-p.x,ry=e.y-8-(p.y-18),t=rx*cs+ry*sn;if(t<-10||t>len)continue;if(Math.abs(-rx*sn+ry*cs)<w/2+e.r)this.hit(e,dmg,cs*220,sn*220);}
        this.fx.push({beam:true,x:p.x,y:p.y-18,a:ang,len,w,l:.75,m:.75,c});
        this.shake=Math.max(this.shake,.5);this.flash=.25;this.flashC=c;this.audio.sfx('abBeam');break;}
      case'nova':{
        const R=230*v;
        this.ring(p.x,p.y,R,c,.7);this.ring(p.x,p.y,R*.6,'#ffffff',.5);this.burst(p.x,p.y-14,34,c);this.bolt(p.x,p.y-14,R*.9,c,10);this.shake=Math.max(this.shake,.45);this.flash=.2;this.flashC=c;
        for(const e of this.en){if(e.dead)continue;const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy)||1;if(d<R+e.r){this.hit(e,(28+L*2.4)*v,0,0);e.stun=Math.max(e.stun,.4);if(!e.boss){e.kx+=dx/d*380;e.ky+=dy/d*380;}}}
        this.audio.sfx('abNova');break;}
      case'regen':this.regenT=6;this.regenRate=p.maxHp*.14*v/6;this.pillar(p.x,p.y,c,.9);this.ring(p.x,p.y,90,c,.6);this.audio.sfx('abHeal');break;
      case'blind':
        this.flash=.6;this.flashC='#ffffff';this.ring(p.x,p.y,380,c,.6);this.ring(p.x,p.y,200,'#ffffff',.4);
        for(const e of this.en){if(e.dead)continue;if(Math.hypot(e.x-p.x,e.y-p.y)<380+e.r)e.stun=Math.max(e.stun,e.boss?.7:1.7);}
        this.audio.sfx('flare');break;
      case'dash':{
        let dx=this.input.x,dy=this.input.y;const dl=Math.hypot(dx,dy);if(dl<.1){dx=p.face>0?1:-1;dy=0;}else{dx/=dl;dy/=dl;}
        this.bv={x:dx*1050,y:dy*1050,t:.2};this.dashT=.26;this.dashHit=new Set();p.inv=Math.max(p.inv,.5);this.dashV=v;
        this.ring(p.x,p.y,70,c,.4);this.burst(p.x,p.y-12,14,c);this.audio.sfx('abDash');break;}
      case'clones':
        this.clones=[0,1,2].map(i=>({a:i*TAU/3,sh:.3*i}));this.cloneT=10;this.ring(p.x,p.y,110,c,.5);this.burst(p.x,p.y-12,20,c);this.audio.sfx('abClone');break;
      case'crit':this.critT=8;this.recalc();this.pillar(p.x,p.y,c,.8);this.ring(p.x,p.y,100,c,.6);this.audio.sfx('abPower');break;
      case'barrier':p.inv=Math.max(p.inv,1.5);this.shieldT=1.5;this.ring(p.x,p.y,70,c,.5);this.audio.sfx('abBarrier');break;
      case'absorb':{
        let n=0;
        for(const e of this.en){if(e.dead||n>=8)continue;if(Math.hypot(e.x-p.x,e.y-p.y)<260+e.r){n++;this.hit(e,(10+L)*v,0,0);this.heal(p.maxHp*.015);this.fx.push({bolt:true,pts:[[e.x,e.y-8],[(e.x+p.x)/2+rnd(-12,12),(e.y+p.y)/2-10+rnd(-8,8)],[p.x,p.y-14]],l:.4,m:.4,c});}}
        this.ring(p.x,p.y,260,c,.6);this.audio.sfx('abAbsorb');break;}
      case'timestop':
        this.tsT=1.8;this.flash=.35;this.flashC='#c8d8ff';this.ring(p.x,p.y,this.viewR,'#ffffff',.9);this.ring(p.x,p.y,this.viewR*.6,c,.7);
        for(const e of this.en){if(e.dead)continue;if(Math.hypot(e.x-p.x,e.y-p.y)<this.viewR*1.1)e.stun=Math.max(e.stun,e.boss?.5:1.8);}
        this.eb=[];this.audio.sfx('abTime');break;
      case'erase':{
        const R=300;this.ring(p.x,p.y,R,c,.8);this.ring(p.x,p.y,R*.55,'#ffffff',.5);this.flash=.35;this.flashC=c;this.shake=Math.max(this.shake,.4);
        for(const e of this.en){if(e.dead)continue;if(Math.hypot(e.x-p.x,e.y-p.y)<R+e.r){this.damageEnemy(e,e.max*(e.boss?.012:.22)*v,0,0,false);this.burst(e.x,e.y-8,6,c);}}
        this.audio.sfx('abErase');break;}
      case'rewind':{
        const old=this.hpHist.length?this.hpHist[0].hp:p.hp,gain=Math.min(p.maxHp*.4,Math.max(p.maxHp*.05,old-p.hp));
        this.heal(gain);this.flash=.3;this.flashC='#cfe8ff';this.ring(p.x,p.y,200,c,.7);this.ring(p.x,p.y,120,'#ffffff',.5);this.audio.sfx('abTime');break;}
      case'jackpot':
        for(let i=0;i<12;i++)this.loot.push({k:'coin',x:p.x+rnd(-60,60),y:p.y+rnd(-40,40),v:Math.round(4*(1+this.t/500)),t:0});
        this.heal(p.maxHp*.06);this.luckT=Math.max(this.luckT,30);this.recalc();this.pillar(p.x,p.y,c,.8);this.burst(p.x,p.y-12,24,c);this.audio.sfx('coin');break;
      case'buff':this.abBuf=Object.assign({t:8},v);this.recalc();this.pillar(p.x,p.y,c,1);this.ring(p.x,p.y,130,c,.6);this.burst(p.x,p.y-14,28,c);this.audio.sfx('abPower');break;
    }
    this.abCd=a.cd;this.emote('smug',1.2);this.say(tr(a.n)+'!',c,1.8);
    return true;
  }
  updateAbility(dt){
    const p=this.p,a=this.abil,c=a.c;
    if(this.abCd>0)this.abCd-=dt;
    if(this.senzuCd>0)this.senzuCd-=dt;
    /* hp history for Rewind: one sample every half second, last 6 seconds */
    this.histT-=dt;if(this.histT<=0){this.histT=.5;this.hpHist.push({hp:p.hp});if(this.hpHist.length>12)this.hpHist.shift();}
    if(this.regenT>0){this.regenT-=dt;this.heal(this.regenRate*dt);if(this.fx.length<420&&Math.random()<dt*20)this.fx.push({x:p.x+rnd(-14,14),y:p.y-rnd(0,26),vx:rnd(-10,10),vy:-rnd(30,80),l:.6,m:.6,c,s:rnd(2,4)});}
    if(this.critT>0){this.critT-=dt;if(this.critT<=0)this.recalc();}
    if(this.abBuf){this.abBuf.t-=dt;if(this.fx.length<420&&Math.random()<dt*24)this.fx.push({x:p.x+rnd(-14,14),y:p.y-rnd(0,30),vx:rnd(-16,16),vy:-rnd(60,150),l:.5,m:.5,c,s:rnd(2,4)});if(this.abBuf.t<=0){this.abBuf=null;this.recalc();}}
    if(this.shieldT>0)this.shieldT-=dt;
    if(this.tsT>0)this.tsT-=dt;
    if(this.dashT>0){
      this.dashT-=dt;
      for(const e of this.en){if(e.dead||this.dashHit.has(e))continue;if(Math.hypot(e.x-p.x,e.y-8-p.y)<e.r+34){this.dashHit.add(e);this.hit(e,(20+this.lvl*2)*(this.dashV||1),0,0);e.stun=Math.max(e.stun,.3);this.burst(e.x,e.y-8,5,c);}}
      if(this.fx.length<440)this.fx.push({x:p.x,y:p.y-10,vx:0,vy:0,l:.35,m:.35,c,s:7});
    }
    if(this.clones){
      this.cloneT-=dt;if(this.cloneT<=0){this.clones=null;return;}
      for(const k of this.clones){
        k.a+=dt*2;k.x=p.x+Math.cos(k.a)*46;k.y=p.y+Math.sin(k.a)*22;k.sh-=dt;
        if(k.sh<=0){const t=this.nearest(k.x,k.y,520);if(t){k.sh=.8;const an=Math.atan2(t.y-8-(k.y-18),t.x-k.x);this.pr.push({x:k.x,y:k.y-18,vx:Math.cos(an)*400,vy:Math.sin(an)*400,r:6,dmg:6+this.lvl*.6,pi:0,life:1.4,hit:[],c});}else k.sh=.2;}
      }
    }
  }
  /* ---------- Totem: appears ONCE per run, choose 1 of 3 distinct (mild) powers ---------- */
  rollTotems(){const ids=TOTEMS.map(t=>t.id);const out=[];while(out.length<3&&ids.length){out.push(ids.splice(Math.floor(Math.random()*ids.length),1)[0]);}return out;}
  applyTotem(id){
    const p=this.p,tf=this.totemFx,tr=o=>this.env.tr(o),def=TOTEMS.find(t=>t.id===id)||TOTEMS[0];
    this.totemTag=def.n;
    if(id==='luck')this.totemLuck++;
    else if(id==='risk')this.riskT=150;
    else if(id==='vigor'){tf.hp=.15;tf.regen=.4;this.recalc();this.heal(p.maxHp*.3);}
    else if(id==='fury'){tf.might=.12;tf.cd=.08;}
    else if(id==='wealth'){tf.gold=.35;tf.magnet=.25;}
    else if(id==='guard'){tf.guard=1;this.barrierReady=true;}
    else if(id==='storm'){tf.storm=1;this.stormT=8;}
    else if(id==='spirit'){tf.spirit=1;this.pulseT=12;}
    this.say(tr(def.n)+'!',def.c,3.2);
    this.ring(p.x,p.y,170,def.c,.7);this.ring(p.x,p.y,90,'#ffffff',.5);this.pillar(p.x,p.y,def.c,1.1);this.burst(p.x,p.y-16,26,def.c);
    this.audio.sfx('shrine');this.recalc();
  }
  updateTotemFx(dt){
    const tf=this.totemFx,p=this.p;
    if(tf.storm){
      this.stormT-=dt;
      if(this.stormT<=0){
        this.stormT=22;
        const live=this.en.filter(e=>!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<480);
        for(let k=0;k<Math.min(4,live.length);k++){
          const e=live.splice(Math.floor(Math.random()*live.length),1)[0];
          this.bolt(e.x,e.y-170,170,'#cfe8ff',3);this.ring(e.x,e.y,70,'#9ad0ff',.4);this.pillar(e.x,e.y,'#cfe8ff',.5);this.hit(e,26+this.lvl*3.2,0,0);
        }
        if(live.length||this.en.length)this.audio.sfx('thunder');
      }
    }
    if(tf.spirit){
      this.pulseT-=dt;
      if(this.pulseT<=0){
        this.pulseT=35;this.heal(p.maxHp*.06);
        this.ring(p.x,p.y,260,'#9affc8',.7);this.ring(p.x,p.y,140,'#ffffff',.4);this.burst(p.x,p.y-12,22,'#9affc8');
        for(const e of this.en){if(e.dead)continue;if(Math.hypot(e.x-p.x,e.y-p.y)<260+e.r)e.stun=Math.max(e.stun,e.boss?.6:1.3);}
        this.audio.sfx('shrine');
      }
    }
  }
  /* ---------- progression ---------- */
  addXp(v){this.xp+=v*this.S.xp;}
  levelUp(){
    this.xp-=this.need;this.lvl++;this.need=xpNeed(this.lvl);this.audio.sfx('lvl');
    if(this.totemLuck>0)this.luckBonus=Math.min(.5,this.luckBonus+.01*this.totemLuck);
    this.emote('happy',1.1);
    this.ring(this.p.x,this.p.y,110,'#ffd23f',.5);this.pillar(this.p.x,this.p.y,'#ffe9a0',.55);this.burst(this.p.x,this.p.y-20,18,'#ffd23f');
    while(this.formsUnlocked<this.formMax&&this.lvl>=FORM_TIERS[this.formsUnlocked].lvl)this.unlockForm();
    this.recalc();
    const lm={type:'level',options:this.levelOptions()};
    if(this.xform)this.afterX=lm;else this.modal=lm;
  }
  unlockForm(){
    this.prevPc=this.pc;this.prevKey=this.pcKey;
    this.formsUnlocked++;this.formIdx=this.formsUnlocked-1;this.recalc();
    const e=this.formEntry,p=this.p,idx=this.formIdx;
    this.heal(p.maxHp*.35);
    this.say(this.env.tr(e.n).toUpperCase()+'!',e.aura,3.4);
    this.emote('smug',2.4);
    this.xform={t:0,dur:4.2,rel:1.7,col:e.aura,idx,released:false,old:{pc:this.prevPc,key:this.prevKey}};
    this.audio.sfx('xcharge');
  }
  /* the moment the new form bursts out: shockwave across the stage + aura explosion */
  releaseForm(x){
    const p=this.p,i=x.idx,col=x.col;x.released=true;
    const max=640+i*170;
    this.shocks.push({id:++this.shockId,x:p.x,y:p.y-14,max,t:0,dur:1.05+.05*i,dmg:18+7*(i+1)});
    this.fx.push({shock:true,x:p.x,y:p.y-14,max,l:1.05+.05*i,m:1.05+.05*i,c:col});
    this.fx.push({shock:true,x:p.x,y:p.y-14,max:max*.62,l:.75,m:.75,c:'#ffffff'});
    this.flash=.85;this.flashC=i>=4?'#ffffff':col;this.shake=1;
    this.ring(p.x,p.y,320+i*45,col,.9);this.ring(p.x,p.y,200,'#ffffff',.6);
    this.pillar(p.x,p.y,col,1.6);this.pillar(p.x,p.y,'#ffffff',.9);
    this.bolt(p.x,p.y-20,300+i*40,col,12+i*2);this.burst(p.x,p.y-20,60+i*8,col);this.burst(p.x,p.y-10,36,'#ffffff');
    for(let k=0;k<26&&this.fx.length<480;k++){const a=rnd(0,TAU),s=rnd(120,420);this.fx.push({x:p.x,y:p.y-8,vx:Math.cos(a)*s,vy:Math.sin(a)*s*.5-rnd(0,180),l:rnd(.5,1.1),m:1.1,c:k%3?col:'#ffffff',s:rnd(3,7)});}
    this.eb=[];
    this.audio.sfx(i>=4?'xburst2':'xburst');
  }
  updateXform(rdt){
    const x=this.xform,p=this.p;x.t+=rdt;p.inv=Math.max(p.inv,.35);
    if(!x.released){
      const c=x.t/x.rel;this.shake=Math.max(this.shake,.12+.4*c);
      for(let k=0;k<4&&this.fx.length<470;k++){
        const a=rnd(0,TAU),d=rnd(90,170)*(1-c*.4);
        this.fx.push({x:p.x+Math.cos(a)*d,y:p.y-14+Math.sin(a)*d*.7,vx:-Math.cos(a)*d*2.2,vy:-Math.sin(a)*d*1.5-30,l:.4,m:.4,c:k%2?x.col:'#ffffff',s:rnd(2,4)});
      }
      if(this.fx.length<470)this.fx.push({x:p.x+rnd(-12,12),y:p.y,vx:rnd(-14,14),vy:-rnd(120,260),l:rnd(.5,.9),m:.9,c:x.col,s:rnd(3,6)});
      if(x.t>=x.rel)this.releaseForm(x);
    }
    if(x.t>=x.dur){this.xform=null;if(this.afterX){this.modal=this.afterX;this.afterX=null;}}
  }
  updateShocks(dt){
    const p=this.p;
    for(const s of this.shocks){
      s.t+=dt;const k=Math.min(1,s.t/s.dur),R=s.max*(1-Math.pow(1-k,2.2));
      for(const e of this.en){
        if(e.dead||e.xs===s.id)continue;
        const dx=e.x-s.x,dy=e.y-s.y,d=Math.hypot(dx,dy)||1;
        if(d<=R+e.r){
          e.xs=s.id;e.stun=Math.max(e.stun,e.boss?.7:1.6);
          if(!e.boss){e.kx+=dx/d*620;e.ky+=dy/d*620;}
          if(!e.sparring)this.hit(e,s.dmg);
        }
      }
      for(const b of this.eb){const dx=b.x-s.x,dy=b.y-s.y;if(dx*dx+dy*dy<R*R)b.dead=true;}
    }
    this.shocks=this.shocks.filter(s=>s.t<s.dur);
  }

  /* ---------- fx helpers ---------- */
  burst(x,y,n,c){for(let i=0;i<n&&this.fx.length<500;i++){const a=rnd(0,TAU),s=rnd(40,200);this.fx.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:rnd(.25,.6),m:.6,c,s:rnd(2,5)});}}
  bolt(x,y,r,c,n){for(let i=0;i<n&&this.fx.length<460;i++){const a=rnd(0,TAU),L=r*rnd(.5,1),pts=[[x,y]];for(let k=1;k<=6;k++){const t=k/6;pts.push([x+Math.cos(a)*L*t+rnd(-10,10),y+Math.sin(a)*L*t+rnd(-10,10)]);}this.fx.push({bolt:true,pts,l:.35,m:.35,c});}}
  pillar(x,y,c,l){this.fx.push({pillar:true,x,y,l:l||.9,m:l||.9,c});}
  ring(x,y,r,c,l){this.fx.push({ring:true,x,y,r,l:l||.45,m:l||.45,c});}

  /* ---------- combat ---------- */
  nearest(x,y,md){let b=null,bd=md*md;for(const e of this.en){if(e.dead)continue;const dx=e.x-x,dy=e.y-y,d=dx*dx+dy*dy;if(d<bd){bd=d;b=e;}}return b;}
  hit(e,base,kx,ky){
    const S=this.S;let d=base*S.might*DMG_NERF;
    if(this.has('rage')&&this.p.hp<this.p.maxHp*.35)d*=1.2;
    let crit=false;if(Math.random()<S.crit){d*=S.critDmg;crit=true;}
    this.damageEnemy(e,d,kx,ky,crit);
  }
  damageEnemy(e,d,kx,ky,crit){
    if(e.dead)return;
    if(e.xf){if(this.showNums&&Math.random()<.2)this.floatText(e.x,e.y-e.r*1.7,'0',0);return;}
    if(e.armor)d=Math.max(d*.3,d-e.armor);
    e.hp-=d;e.fl=.07;
    if(!e.boss&&kx!==undefined){const k=e.ai==='tank'?.3:1;e.kx+=kx*k;e.ky+=ky*k;}
    if(this.showNums)this.floatText(e.x+rnd(-6,6),e.y-e.r*1.7,Math.round(d),crit?1:0);
    if(crit&&this.has('critboom')&&!this._boom){
      this._boom=true;
      for(const o of this.en){if(o.dead||o===e)continue;const dx=o.x-e.x,dy=o.y-e.y;if(dx*dx+dy*dy<75*75)this.damageEnemy(o,d*.4,dx*.5,dy*.5,false);}
      this.ring(e.x,e.y,75,'#c05aff',.3);this._boom=false;
    }
    if(e.hp<=0)this.killEnemy(e);else this.audio.sfx('hit');
  }
  killEnemy(e){
    if(e.sparring){e.dead=true;this.burst(e.x,e.y-8,30,'#aab4ff');this.audio.sfx('boom');if(this.trial)this.trial.killed=true;return;}
    e.dead=true;this.kills++;
    this.burst(e.x,e.y-8,e.boss?45:6,e.boss?e.bd.c:'#ffffff');this.audio.sfx(e.boss?'boom':'pop');
    if(e.boss){
      this.run.bossKills++;this.bossAlive--;
      const pay=Math.round(60*(this.sd+1)*(e.final?2:1));this.addZenny(pay);this.burst(e.x,e.y-10,26,'#ffd23f');this.audio.sfx('coin');this.floatText(e.x,e.y-e.r*2.4,'+Z '+pay,1);
      if(!this.bossHit)this.run.perfect++;
      this.chests.push({x:e.x,y:e.y,final:e.final,t:0,boss:true});
      for(let i=0;i<6;i++)this.dropGem(e.x+rnd(-60,60),e.y+rnd(-60,60),25*this.stage.xp*XP_MUL);
      this.shake=.7;this.emote('happy',1.6);this.say(this.env.tr(e.bd.n)+' '+this.env.tr(T('sconfitto!','defeated!')),'#ffb13b',2.6);
      if(e.final){this.cleared=true;this.finish(true);}
      return;
    }
    this.dropLoot(e);
    if(e.ai==='split'&&e.def.minion){for(let i=0;i<2;i++)this.en.push(this.mkEnemy(ENEMIES[e.def.minion],e.x+rnd(-14,14),e.y+rnd(-14,14)));}
    if(this.has('vamp'))this.heal(.4);
  }
  dropGem(x,y,v){if(this.gm.length>GEM_CAP*1.7){this.rgAdd(v,x,y);return;}this.gm.push({x,y,v,att:false});}
  /* distance from the player to the screen edge along an angle (just off screen = this + a small margin) */
  edgeDist(a){const hw=this.vw/2+30,hh=this.vh/2+30,c=Math.abs(Math.cos(a))||1e-6,s=Math.abs(Math.sin(a))||1e-6;return Math.min(hw/c,hh/s);}
  /* accumulate XP into the red gem (created just outside the screen, towards where the gems were) */
  rgAdd(v,x,y){
    const p=this.p;
    if(!this.rg){const a=Math.atan2(y-p.y,x-p.x),d=this.edgeDist(a);this.rg={x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d,v:0,att:false,t:0,n:0};}
    this.rg.v+=v;this.rg.n++;
  }
  mergeGems(){
    const p=this.p,list=this.gm.filter(g=>!g.att&&!g.dead).map(g=>({g,d:Math.hypot(g.x-p.x,g.y-p.y)})).sort((a,b)=>b.d-a.d);
    let n=this.gm.length-GEM_KEEP;
    for(const o of list){if(n<=0)break;o.g.dead=true;this.rgAdd(o.g.v,o.g.x,o.g.y);n--;}
  }
  updateRedGem(dt){
    const r=this.rg;if(!r)return;const p=this.p;r.t+=dt;
    const dx=p.x-r.x,dy=p.y-r.y,d=Math.hypot(dx,dy)||1,a=Math.atan2(r.y-p.y,r.x-p.x),ed=this.edgeDist(a);
    /* it always stays just beyond the screen edge: if you walk away it is pulled back along the same direction */
    if(!r.att&&d>ed+120){r.x=p.x+Math.cos(a)*(ed+10);r.y=p.y+Math.sin(a)*(ed+10);}
    if(d<this.S.magnet*.6)r.att=true;
    if(r.att){const sp=420+d;r.x+=dx/d*sp*dt;r.y+=dy/d*sp*dt;}
    if(d<18){
      this.addXp(r.v);this.audio.sfx('lvl');this.audio.sfx('gem');
      this.floatText(p.x,p.y-60,'+'+fmtN(r.v*this.S.xp)+' XP',2);this.ring(p.x,p.y,90,'#ff5a3d',.5);this.burst(p.x,p.y-16,24,'#ff5a3d');this.pillar(p.x,p.y,'#ff5a3d',.6);
      this.rg=null;
    }
  }
  dropLoot(e){
    const L=this.S.luck,S=this.stage;
    this.dropGem(e.x,e.y,e.def.xp*this.stageXp()*XP_MUL*this.earlyXp());
    const r=Math.random();
    if(r<.006*(1+L))this.spawnLoot('heal',e.x,e.y);
    else if(r<.006*(1+L)+.022)this.spawnLoot('coin',e.x,e.y);
    else if(r<.006*(1+L)+.022+.0015*(1+this.S.lootRate+L))this.spawnLoot(pick(['magnet','dmg','haste','xp']),e.x,e.y);
    if(this.has('lootdrop')&&Math.random()<.005)this.spawnLoot(pick(['coin','heal','magnet','dmg','haste']),e.x,e.y);
    if(Math.random()<.0007)this.spawnLoot('ball',e.x,e.y);
  }
  spawnLoot(k,x,y){
    const v=k==='coin'?Math.round(5*(1+this.t/600)):k==='xp'?Math.round(this.need*.3):0;
    this.loot.push({k,x,y,v,t:0});
  }
  collectLoot(l){
    const p=this.p;
    switch(l.k){
      case'coin':this.addZenny(l.v);this.audio.sfx('coin');break;
      case'heal':this.heal(p.maxHp*.3);this.audio.sfx('senzu');this.ring(p.x,p.y,40,'#8be07a',.4);break;
      case'magnet':for(const g of this.gm)g.att=true;if(this.rg)this.rg.att=true;this.audio.sfx('pickup');this.ring(p.x,p.y,200,'#ff5a5a',.5);this.floatText(p.x,p.y-50,this.env.tr(T('Magnete!','Magnet!')),2);break;
      case'dmg':this.buffs.dmg=12;this.recalc();this.audio.sfx('pickup');this.floatText(p.x,p.y-50,this.env.tr(T('Danni +15% (12s)','Damage +15% (12s)')),2);break;
      case'haste':this.buffs.haste=10;this.recalc();this.audio.sfx('pickup');this.floatText(p.x,p.y-50,this.env.tr(T('Fuoco rapido (10s)','Rapid fire (10s)')),2);break;
      case'xp':this.addXp(l.v*.7);this.audio.sfx('pickup');break;
      case'luck':this.luckBonus=Math.min(.4,this.luckBonus+.03);this.recalc();this.audio.sfx('pickup');this.burst(p.x,p.y-20,14,'#8be07a');this.floatText(p.x,p.y-50,this.env.tr(T('Fortuna +3%','Luck +3%')),2);break;
      case'capsule':{const id=this.rollTrinket();if(id&&this.addTrinket(id)){const t=TRINKETS.find(x=>x.id===id);this.say(this.env.tr(t.n),RARITY[t.r].c,2.4);}else this.addZenny(30);break;}
      case'ball':this.balls++;this.run.balls++;this.audio.sfx('ball');this.ring(p.x,p.y,60,'#ffb13b',.5);
        this.say(this.env.tr(T('Sfera del Drago ','Dragon Ball '))+this.balls+'/7','#ffb13b',2);
        if(this.balls>=7)this.modal={type:'wish',options:['revive','power','fortune']};break;
    }
  }
  hurt(d,src){
    const p=this.p;
    if(p.inv>0||this.sb.god)return;
    if(this.trial){const dd=Math.max(1,Math.round((d-this.S.armor)*this.S.taken));p.hp=Math.max(1,p.hp-dd);p.inv=.5;this.floatText(p.x,p.y-40,dd,4);this.audio.sfx('hurt');return;}
    if(this.barrierReady){this.barrierReady=false;this.barrierT=this.has('barrier')?15:25;this.floatText(p.x,p.y-50,this.env.tr(T('Bloccato!','Blocked!')),2);this.ring(p.x,p.y,50,'#8ad8ff',.4);p.inv=.4;return;}
    if(Math.random()<this.S.dodge){this.floatText(p.x,p.y-50,this.env.tr(T('Schivata!','Dodge!')),3);p.inv=.25;return;}
    d=Math.max(1,Math.round((d-this.S.armor)*this.S.taken));
    d=Math.min(d,Math.ceil(p.maxHp*(src&&src.trap?.16:src&&(src.boss||src.bs)?.4:.26)));
    this.emote(p.hp-d<p.maxHp*.3?'pain':'hurt',.8);
    p.hp-=d;p.inv=.5;this.shake=Math.max(this.shake,.18);this.audio.sfx('hurt');this.floatText(p.x,p.y-40,d,4);
    if(this.bossAlive>0)this.bossHit=true;
    if(p.hp<=0){
      if(this.has('revive')&&!this.haloUsed){this.haloUsed=true;this.revive();}
      else if(this.revives>0){this.revives--;this.revive();}
      else{p.hp=0;this.finish(false);}
    }
  }
  revive(){
    const p=this.p;p.hp=p.maxHp*.5;p.inv=2.5;this.flash=.8;this.flashC='#ffffff';this.ring(p.x,p.y,320,'#ffffff',.8);
    for(const e of this.en){if(e.dead)continue;const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy)||1;if(d<320){e.stun=Math.max(e.stun,2);if(!e.boss){e.kx+=dx/d*500;e.ky+=dy/d*500;}}}
    this.say(this.env.tr(T('RESURREZIONE!','REVIVED!')),'#ffffff',2.5);this.audio.sfx('transform');
  }
  finish(win){
    if(this.ended)return;this.ended=true;
    const res=this.progress.finishRun(this,win);
    this.env.onEnd(res,this);
  }
  continueAfterWin(){this.ended=false;this.say(this.env.tr(T('Modalità infinita!','Endless mode!')),'#ffd23f',2.4);}

  /* ---------- spawning ---------- */
  /* difficulty scales with progress through the stage; the stage multiplier eases in over the first 40% */
  get nt(){return this.t/this.TS;}
  stageXp(){const x=Math.sqrt(this.stage.xp);return 1+(x-1)*Math.min(1,this.prog()/.5);}
  earlyXp(){return 1+1.0*Math.max(0,1-this.prog()*2.6);}
  prog(){return Math.min(1.3,this.t/this.dur);}
  stageMul(v){return 1+(v-1)*Math.min(1,this.t/(this.dur*.4));}
  hpMul(){return ENEMY_HP_MUL*(1+Math.pow(this.prog(),2)*(G_HP_K*1.1+.45*this.sd))*this.stageMul(this.stage.hp)*this.D.hp*(this.x2?1.4:1);}
  dmgMul(){return ENEMY_DMG_MUL*(1.0+this.prog()*G_DMG_K)*this.stageMul(1+.15*this.sd)*this.D.dmg*(this.x2?1.25:1);}
  /* few enemies early, hordes late */
  get finalOn(){return this.finalSpawned&&this.bossAlive>0;}
  spawnCap(){const pr=Math.min(1,this.prog());return Math.round(24+4*this.sd+(250+30*this.sd)*Math.pow(pr,1.7));}
  spawnRate(){return(1+11*Math.pow(Math.min(1,this.prog()),1.35))*this.stageMul(this.stage.spawn)*this.D.spawn;}
  mkEnemy(def,x,y){
    const fb=this.finalOn,hp=def.hp*this.hpMul()*(fb?1.35:1);   /* final boss fight: tougher crowd that hits a bit softer */
    return{def,ai:def.ai,x,y,hp,max:hp,r:def.r,spd:def.spd*ENEMY_SPD_MUL,armor:((def.ai==='tank'||def.ai==='slam')?.8+this.sd*1.1:0)+(fb?.9+this.sd*.5:0),dmg:def.dmg*this.dmgMul()*(fb?.85:1),boss:false,kx:0,ky:0,fl:0,stun:0,slow:0,
      sh:rnd(1,def.shoot?def.shoot.cd:3),sp:0,ph:rnd(0,TAU),dead:false,face:1,st:0,stT:rnd(1,3),fuse:0,dx:0,dy:0};
  }
  rosterPick(){
    const t=this.nt,r=this.stage.roster,w=[];
    for(const [id,from,wt,until] of r){
      if(t<from||(until&&t>=until))continue;
      const boom=ENEMIES[id].ai==='explode';
      if(boom&&!this.bombOn)continue;            /* suicide bombers only come in short waves */
      const shoot=ENEMIES[id].ai==='ranged'||ENEMIES[id].ai==='hover';
      if(shoot&&!this.shootOn)continue;          /* ranged enemies only come as a 60-second wave */
      w.push([id,wt*(1+Math.min(1,(t-from)/300)*.3)*(boom?1.2:1)*(shoot?2.4:1)]);
    }
    if(!w.length)for(const [id,from,wt,until] of r){const a=ENEMIES[id].ai;if(a!=='explode'&&a!=='ranged'&&a!=='hover'&&t>=from)w.push([id,wt]);}
    if(!w.length)for(const [id,from,wt,until] of r){if(ENEMIES[id].ai!=='explode'&&t>=from)w.push([id,wt]);}
    // very early weak enemies fade a bit as time passes
    const item=wpick(w,x=>x[1]);return ENEMIES[item[0]];
  }
  spawnOne(){
    const p=this.p,a=rnd(0,TAU),d=this.viewR+rnd(10,110);
    this.en.push(this.mkEnemy(this.rosterPick(),p.x+Math.cos(a)*d,p.y+Math.sin(a)*d));
  }
  spawnRing(n,def,extra){
    const p=this.p,d=this.viewR+40;
    for(let i=0;i<n;i++){const a=i/n*TAU;const e=this.mkEnemy(def||this.rosterPick(),p.x+Math.cos(a)*d,p.y+Math.sin(a)*d);if(extra)extra(e);this.en.push(e);}
  }
  spawnHorde(){
    const pr=Math.min(1,this.prog()),n=Math.round(8+this.sd*3+pr*(40+this.sd*14));
    this.spawnRing(n,null,e=>{e.hp*=1.15;e.max=e.hp;});
    this.say(this.env.tr(T('ORDA IN ARRIVO!','HORDE INCOMING!')),'#ff5a3d',2.6);this.audio.sfx('boss');this.shake=.4;
  }
  spawnPack(){this.spawnRing(Math.round(5+this.sd+Math.min(1,this.prog())*(8+this.sd*2)),this.rosterPick());}
  spawnEnemyById(id,n){for(let i=0;i<(n||1);i++){const a=rnd(0,TAU),d=rnd(180,320);this.en.push(this.mkEnemy(ENEMIES[id],this.p.x+Math.cos(a)*d,this.p.y+Math.sin(a)*d));}}
  spawnBoss(id,final){
    const bd=BOSSES[id],p=this.p,a=rnd(0,TAU),d=this.viewR+60;
    const e=this.mkEnemy({n:bd.n,c:bd.c,xp:0,hp:bd.hp,r:bd.r,spd:bd.spd,dmg:bd.dmg,ai:'boss',sp:bd.sp},p.x+Math.cos(a)*d,p.y+Math.sin(a)*d);
    const hp=bd.hp*BOSS_HP_MUL*this.D.hp*(this.x2?1.4:1)*(final?1.3:1);
    Object.assign(e,{ai:'boss',boss:true,bd,final:!!final,armor:1.2+1.2*this.sd+(final?2.6:0),hp,max:hp,r:bd.r,spd:bd.spd,dmg:bd.dmg*this.dmgMul()*(final?.9:1),sh:bd.cd,phase:0,spin:0,dashT:0,tf:0,xf:null,tfT:final?105:85,zoff:0});
    this.en.push(e);this.bossAlive++;this.bossHit=false;
    this.say(this.env.tr(bd.n)+(final?' - '+this.env.tr(T('BOSS FINALE','FINAL BOSS')):''),'#ff5a3d',3);this.audio.sfx('boss');this.shake=.4;
    if(final){this.finalSpawned=true;this.progress.reachedFinal(this);}
  }
  bossAttack(e){
    const p=this.p,bd=e.bd,aim=Math.atan2(p.y-18-e.y,p.x-e.x),d=e.dmg;
    let pat=bd.pats[Math.min(e.phase,bd.pats.length-1)];
    if(e.sparring)pat=bd.pats[Math.floor(Math.random()*bd.pats.length)];
    const zd=e.sparring?Math.max(d*1.1,p.maxHp*(.2+.05*Math.min(2,this.trialN))):d*1.1;
    if(e.tf>=1&&Math.random()<.42){const ex=['slam','nova','lance','storm'];pat=ex[Math.floor(Math.random()*(e.tf>=2?4:2))];}
    if(!e.sparring&&!this.trial){const ext=this.bossExt(bd,e.final);if(Math.random()<(e.final?.3:.2)+.08*e.phase+.05*e.tf)pat=ext[Math.floor(Math.random()*ext.length)];}
    const sh=(a,s,r,c)=>this.eb.push({x:e.x,y:e.y-e.r,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:r||7,dmg:d,life:6,c:c||bd.c,bs:1});
    switch(pat){
      case'aim':sh(aim,230);break;
      case'tri':for(let i=-1;i<=1;i++)sh(aim+i*.22,240);break;
      case'ring':{const n=10,o=rnd(0,TAU);for(let i=0;i<n;i++)sh(o+i/n*TAU,150,8);break;}
      case'mix':{const n=12,o=rnd(0,TAU);for(let i=0;i<n;i++)sh(o+i/n*TAU,150);sh(aim,260,9);break;}
      case'spiral':e.spin+=.55;for(let i=0;i<3;i++)sh(e.spin+i*TAU/3,170,6);break;
      case'bigring':{const n=18,o=rnd(0,TAU);for(let i=0;i<n;i++)sh(o+i/n*TAU,140,9);break;}
      case'cross':e.spin+=.35;for(let i=0;i<4;i++){sh(e.spin+i*Math.PI/2,190,7);sh(e.spin+i*Math.PI/2+.18,160,6);}break;
      case'rage':for(let i=-2;i<=2;i++)sh(aim+i*.16,270,8);if(Math.random()<.5)e.dashT=.7;break;
      /* attacks learned after powering up */
      case'slam':{const n=3+e.tf;for(let i=0;i<n;i++){const a=rnd(0,TAU),r=i?rnd(50,150):0;this.bz.push({x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r,r:e.sparring?92:78,t:0,dur:1.05+i*.14,dmg:zd,c:bd.c});}this.audio.sfx('warn');break;}
      case'meteor':{for(let i=0;i<7;i++){const a=rnd(0,TAU),r=i?rnd(40,300):0;this.bz.push({x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r,r:84,t:0,dur:1.2+i*.11,dmg:zd,c:bd.c});}this.audio.sfx('warn');break;}
      case'burst':{this.bz.push({x:e.x,y:e.y,r:175,t:0,dur:.95,dmg:zd*1.1,c:bd.c});for(let i=0;i<12;i++)sh(i/12*TAU,170,7);this.audio.sfx('warn');break;}
      case'sweep':{const dx=Math.cos(aim),dy=Math.sin(aim);for(let i=1;i<=6;i++)this.bz.push({x:e.x+dx*i*105,y:e.y+dy*i*105,r:62,t:0,dur:.7+i*.13,dmg:zd,c:bd.c});this.audio.sfx('warn');break;}
      case'nova':{const n=24,o=rnd(0,TAU);for(let i=0;i<n;i++){if(i%8<2)continue;sh(o+i/n*TAU,175,8);}break;}
      case'lance':e.dashT=.9;for(let i=-3;i<=3;i++)sh(aim+i*.13,300,6);break;
      /* signature attacks of each boss (area / pattern attacks) */
      case'wall':{const px=-Math.sin(aim),py=Math.cos(aim),gap=Math.floor(rnd(-3,4));this.floatText(e.x,e.y-e.r*2.4,this.env.tr(T('Muro di ki!','Ki wall!')),1);
        for(let o=-5;o<=5;o++){if(Math.abs(o-gap)<=1)continue;this.eb.push({x:e.x+px*o*38,y:e.y-e.r+py*o*38,vx:Math.cos(aim)*150,vy:Math.sin(aim)*150,r:8,dmg:d,life:7,c:bd.c,bs:1});}break;}
      case'crossbeam':{const o=rnd(0,TAU);this.floatText(e.x,e.y-e.r*2.4,this.env.tr(T('Raggi incrociati!','Cross beams!')),1);
        for(let k=0;k<4;k++)for(let i=1;i<=6;i++)this.bz.push({x:e.x+Math.cos(o+k*Math.PI/2)*i*100,y:e.y+Math.sin(o+k*Math.PI/2)*i*100,r:54,t:0,dur:.85+i*.09,dmg:zd,c:bd.c});this.audio.sfx('warn');break;}
      case'rush':{this.floatText(e.x,e.y-e.r*2.4,this.env.tr(T('Lampo!','Flash step!')),1);this.ring(e.x,e.y,60,bd.c,.4);
        const a=rnd(0,TAU);e.x=p.x+Math.cos(a)*170;e.y=p.y+Math.sin(a)*170;this.ring(e.x,e.y,60,'#ffffff',.4);this.burst(e.x,e.y-e.r,16,bd.c);
        const a2=Math.atan2(p.y-18-e.y,p.x-e.x);for(let i=-2;i<=2;i++)sh(a2+i*.2,250,7);this.audio.sfx('leap');break;}
      case'homing':{this.floatText(e.x,e.y-e.r*2.4,this.env.tr(T('Sfere a ricerca!','Seeker orbs!')),1);
        for(let i=0;i<4;i++){const a=aim+(i-1.5)*.55;this.eb.push({x:e.x,y:e.y-e.r,vx:Math.cos(a)*150,vy:Math.sin(a)*150,r:9,dmg:d,life:5.5,c:'#ffffff',bs:1,hm:2.4});}break;}
      case'vortex':{this.floatText(e.x,e.y-e.r*2.4,this.env.tr(T('Vortice!','Vortex!')),1);this.vortex={x:e.x,y:e.y,t:0,dur:1.4,R:300,col:bd.c};this.bz.push({x:e.x,y:e.y,r:150,t:0,dur:1.4,dmg:zd*1.1,c:bd.c});this.audio.sfx('xcharge');break;}
      case'encircle':{this.floatText(e.x,e.y-e.r*2.4,this.env.tr(T('Cerchio mortale!','Death circle!')),1);
        for(let i=0;i<8;i++){const a=i/8*TAU+rnd(0,.3);this.bz.push({x:p.x+Math.cos(a)*135,y:p.y+Math.sin(a)*135,r:62,t:0,dur:1.15,dmg:zd,c:bd.c});}this.audio.sfx('warn');break;}
      case'storm':{e.spin+=.4;for(let i=0;i<5;i++)sh(e.spin+i*TAU/5,175,6);sh(aim,300,8);break;}
    }
  }
  bossExt(bd,final){
    const POOL=['wall','crossbeam','rush','homing','vortex','encircle'];
    if(final)return POOL;
    const i=Math.max(0,Object.keys(BOSSES).indexOf(bd.id));
    return[POOL[i%6],POOL[(i+2)%6],POOL[(i+4)%6]];
  }
  updateVortex(dt){
    const v=this.vortex;if(!v)return;v.t+=dt;const p=this.p,dx=v.x-p.x,dy=v.y-p.y,d=Math.hypot(dx,dy)||1;
    if(d<v.R){const f=(70+90*(v.t/v.dur))*dt;p.x+=dx/d*f;p.y+=dy/d*f;}
    for(let k=0;k<3&&this.fx.length<470;k++){const a=rnd(0,TAU),r=rnd(120,v.R);this.fx.push({x:v.x+Math.cos(a)*r,y:v.y+Math.sin(a)*r*.7,vx:-Math.cos(a)*r*1.6,vy:-Math.sin(a)*r*1.1,l:.5,m:.5,c:k%2?v.col:'#ffffff',s:rnd(2,4)});}
    this.shake=Math.max(this.shake,.08);
    if(v.t>=v.dur)this.vortex=null;
  }
  /* ---------- boss power-up when the fight drags on ---------- */
  startBossXform(e){
    e.xf={t:0,dur:3.0,rel:2.0,released:false};e.eb=0;
    this.say(this.env.tr(e.bd.n)+' '+this.env.tr(T('si sta potenziando!','is powering up!')),'#ff5a3d',2.6);
    this.audio.sfx('xcharge');this.ring(e.x,e.y,150,e.bd.c,.8);
  }
  updateBossXform(e,dt){
    const x=e.xf;x.t+=dt;const c=Math.min(1,x.t/x.rel),col=e.bd.c;
    if(!x.released){
      this.shake=Math.max(this.shake,.1+.35*c);
      for(let k=0;k<5&&this.fx.length<470;k++){const a=rnd(0,TAU),d=rnd(110,230)*(1-c*.45);this.fx.push({x:e.x+Math.cos(a)*d,y:e.y-e.r+Math.sin(a)*d*.7,vx:-Math.cos(a)*d*2.3,vy:-Math.sin(a)*d*1.6-30,l:.42,m:.42,c:k%2?col:'#ffffff',s:rnd(2,5)});}
      if(Math.random()<dt*3)this.ring(e.x,e.y,90+120*c,col,.5);
      if(x.t>=x.rel){
        x.released=true;e.tf++;
        const R=560+120*e.tf;
        this.fx.push({shock:true,x:e.x,y:e.y-e.r*.5,max:R,l:1.1,m:1.1,c:col});this.fx.push({shock:true,x:e.x,y:e.y-e.r*.5,max:R*.6,l:.8,m:.8,c:'#ffffff'});
        this.bshock={x:e.x,y:e.y,max:R,t:0,dur:1.1,dmg:e.dmg*.6,hit:false};
        this.flash=.9;this.flashC=col;this.shake=1;this.pillar(e.x,e.y,col,1.7);this.pillar(e.x,e.y,'#ffffff',.9);
        this.bolt(e.x,e.y-e.r,320,col,14);this.burst(e.x,e.y-e.r,70,col);this.burst(e.x,e.y-e.r,34,'#ffffff');this.ring(e.x,e.y,360,col,.9);this.ring(e.x,e.y,200,'#ffffff',.6);
        e.hp=Math.min(e.max,e.hp+e.max*(e.tf===1?.3:.22));
        e.dmg*=1.15;e.spd*=1.08;e.armor+=.6;e.bd=Object.assign({},e.bd,{cd:e.bd.cd*.85});e.sh=1.2;e.tfT=70;e.phase=0;
        this.eb=[];this.audio.sfx('xburst');
        this.say(this.env.tr(e.bd.n).toUpperCase()+' '+this.env.tr(T('POTENZIATO!','POWERED UP!'))+(e.tf>=2?' ★':''),col,3.2);
      }
    }
    if(x.t>=x.dur)e.xf=null;
  }
  updateBossShock(dt){
    const s=this.bshock;if(!s)return;
    s.t+=dt;const k=Math.min(1,s.t/s.dur),R=s.max*(1-Math.pow(1-k,2.2)),p=this.p;
    if(!s.hit){const dx=p.x-s.x,dy=p.y-s.y,d=Math.hypot(dx,dy)||1;if(d<=R+10){s.hit=true;this.hurt(s.dmg,{bs:1});p.x+=dx/d*70;p.y+=dy/d*70;}}
    if(s.t>=s.dur)this.bshock=null;
  }
  /* ground circles that explode after a short warning (boss slam, stomping enemies) */
  updateDanger(dt){
    const p=this.p;
    for(const z of this.bz){
      z.t+=dt;
      if(z.t>=z.dur){
        z.done=true;this.ring(z.x,z.y,z.r*1.2,z.c,.4);this.burst(z.x,z.y,14,z.c);this.burst(z.x,z.y,8,'#ffffff');this.audio.sfx('boom');this.shake=Math.max(this.shake,.3);
        if(Math.hypot(p.x-z.x,p.y-z.y)<z.r+8)this.hurt(z.dmg,{bs:1});
      }
    }
    this.bz=this.bz.filter(z=>!z.done);
  }
  /* boss phase 2: swap to the stronger form (new sprite, faster, harder) */
  bossTransform(e){
    const nb=BOSSES[e.bd.p2],old=e.bd;e.p2=true;
    e.bd=Object.assign({},nb,{id:old.id,hp:old.hp});
    e.r=nb.r;e.spd=nb.spd;e.dmg*=nb.dmg/old.dmg;e.sh=.8;e.phase=0;e.stun=1.2;
    e.hp=Math.min(e.max,e.hp+e.max*.1);e.armor+=1.5;
    this.ring(e.x,e.y,320,nb.c,.9);this.pillar(e.x,e.y,nb.c,1.4);this.bolt(e.x,e.y-20,300,nb.c,14);this.burst(e.x,e.y-20,50,'#ffffff');
    this.flash=.7;this.flashC=nb.c;this.shake=.8;this.audio.sfx('transform');this.eb=[];
    this.say(this.env.tr(nb.n).toUpperCase()+'!',nb.c,3.4);
  }
  explode(e){
    const p=this.p,rad=e.def.rad;
    e.dead=true;this.ring(e.x,e.y,rad,'#ff9d3a',.4);this.burst(e.x,e.y-6,26,'#ffb13b');this.burst(e.x,e.y-6,14,'#ffffff');
    this.audio.sfx('boom');this.shake=Math.max(this.shake,.25);
    if(Math.hypot(p.x-e.x,p.y-e.y)<rad+8)this.hurt(e.dmg,'explosion');
    this.dropGem(e.x,e.y,e.def.xp*this.stageXp()*XP_MUL*.5*this.earlyXp());
  }

  /* ---------- main update ---------- */
  update(dt){
    if(this.modal||this.ended)return;
    const rdt=dt;dt*=this.timeScale;
    if(this.xform&&!this.xform.released)dt*=.4;
    const p=this.p,S=this.S;
    const inTrial=!!this.trial;
    this.rt+=dt;if(!inTrial)this.t+=dt*this.CR;
    if(p.inv>0)p.inv-=dt;
    if(this.shake>0)this.shake-=dt;
    if(this.flash>0)this.flash-=dt;
    if(this.banner){this.banner.t+=dt;if(this.banner.t>this.banner.dur)this.banner=null;}
    if(this.tempBuffs.length){let ch=false;for(const b of this.tempBuffs){b.t-=dt;if(b.t<=0)ch=true;}if(ch){this.tempBuffs=this.tempBuffs.filter(b=>b.t>0);this.recalc();}}
    if(this.riskT>0){this.riskT-=dt;if(this.riskT<=0)this.recalc();}
    if(this.luckT>0){this.luckT-=dt;if(this.luckT<=0)this.recalc();}
    if(this.emoT>0){this.emoT-=dt;if(this.emoT<=0)this.emo=null;}
    if(this.buffs.dmg>0){this.buffs.dmg-=dt;if(this.buffs.dmg<=0)this.recalc();}
    if(this.buffs.haste>0){this.buffs.haste-=dt;if(this.buffs.haste<=0)this.recalc();}

    let ix=this.input.x,iy=this.input.y;if(this.bers>0){ix=-ix;iy=-iy;}const il=Math.hypot(ix,iy);if(il>1){ix/=il;iy/=il;}
    p.mv=il>.05;const sp=125*S.spd;p.x+=ix*sp*dt;p.y+=iy*sp*dt;
    if(this.bv&&this.bv.t>0){p.x+=this.bv.x*dt;p.y+=this.bv.y*dt;this.bv.t-=dt;}if(!inTrial)World.resolve(this.stage.theme,p,9);
    if(ix>.1)p.face=1;else if(ix<-.1)p.face=-1;
    p.hp=Math.min(p.maxHp,p.hp+S.regen*dt);
    if(!inTrial)this.updateZones(dt);
    if(this.kai>0)this.updateKaioken(dt);
    this.updateTotemFx(dt);this.updateDanger(dt);this.updateBossShock(dt);this.updateAbility(dt);
    if(this.bers>0)this.updateBerserk(dt);else if(this.bersCd>0)this.bersCd-=dt;
    this.updatePet(dt);
    if(this.xform)this.updateXform(rdt);
    if(this.vortex)this.updateVortex(dt);
    if(this.shocks.length)this.updateShocks(dt);

    /* director */
    if(!this.sb.nospawn&&!inTrial){
      /* boss fights: slightly fewer enemies; the final boss brings a bigger crowd instead */
      const fin=this.finalOn?1.5:this.bossAlive>0?.7:1;
      this.spAcc+=this.spawnRate()*fin*dt;
      const cap=Math.round(this.spawnCap()*(this.finalOn?1.3:this.bossAlive>0?.8:1));
      while(this.spAcc>=1){this.spAcc-=1;if(this.en.length<cap)this.spawnOne();}
      if(this.t>=this.hordeT){this.hordeT+=(110-12*this.sd)*this.TS;this.spawnHorde();}
      if(this.t>=this.packT){this.packT+=40;this.spawnPack();}
    }
    for(const b of this.bossQ)if(!inTrial&&!b.done&&this.t>=b.t){b.done=true;this.spawnBoss(b.id,b.final);}

    /* trinket specials */
    if(this.trinkets.length){
      if(this.has('shock')){this.shockCd-=dt;if(this.shockCd<=0){this.shockCd=8;this.ring(p.x,p.y,230,'#c05aff',.5);for(const e of this.en){if(e.dead)continue;const dx=e.x-p.x,dy=e.y-p.y;if(dx*dx+dy*dy<(230+e.r)**2)this.hit(e,12+this.lvl*1.4,dx*.5,dy*.5);}}}
      if(this.has('slowtime')){this.slowCd-=dt;if(this.slowCd<=0){this.slowCd=20;this.slowT=4;this.floatText(p.x,p.y-60,this.env.tr(T('Tempo rallentato','Time slowed')),2);}}
      if((this.has('barrier')||this.totemFx.guard)&&!this.barrierReady){this.barrierT-=dt;if(this.barrierT<=0)this.barrierReady=true;}
    }
    if(this.slowT>0)this.slowT-=dt;
    /* suicide-bomber waves: every few minutes, for 50-90 seconds */
    if(inTrial){}else if(!this.bombOn){this.bombT-=dt;if(this.bombT<=0&&this.stage.roster.some(r=>ENEMIES[r[0]].ai==='explode'&&this.t>=r[1])){this.bombOn=true;this.bombEnd=this.t+rnd(50,90);this.say(this.env.tr(T('ONDATA DI KAMIKAZE!','KAMIKAZE WAVE!')),'#ff7a3a',2.4);this.audio.sfx('boss');}else if(this.bombT<=0)this.bombT=20;}
    else if(this.t>=this.bombEnd){this.bombOn=false;this.bombT=rnd(150,240);for(const e of this.en)if(e.ai==='explode'&&!(e.fuse>0)){e.dead=true;this.burst(e.x,e.y-8,5,'#ffb13b');}}
    /* ranged-enemy wave: 60 seconds, then they leave */
    if(!inTrial){
      if(!this.shootOn){this.shootT-=dt;if(this.shootT<=0){if(this.stage.roster.some(r=>(ENEMIES[r[0]].ai==='ranged'||ENEMIES[r[0]].ai==='hover')&&this.t>=r[1])&&!this.bossAlive){this.shootOn=true;this.shootEnd=this.t+60;this.say(this.env.tr(T('ONDATA DI TIRATORI!','GUNNER WAVE!')),'#6ad0ff',2.6);this.audio.sfx('boss');}else this.shootT=20;}}
      else if(this.t>=this.shootEnd){this.shootOn=false;this.shootT=rnd(130,200);for(const e of this.en)if(!e.boss&&(e.ai==='ranged'||e.ai==='hover')){e.dead=true;this.burst(e.x,e.y-8,5,'#6ad0ff');}}
    }
    /* glossary: remember enemies the player has actually met */
    this.seenT-=dt;
    if(this.seenT<=0){
      this.seenT=.5;
      if(!this.sandbox){const vr=this.viewR*1.1,p0=this.p;for(const e of this.en){const id=e.boss?e.bd.id:e.def.id;if(id&&!this.save.seen[id]&&Math.hypot(e.x-p0.x,e.y-p0.y)<vr){this.save.seen[id]=1;this.newSeen=true;}}}
      if(this.newSeen){this.newSeen=false;this.progress.save.write();}
    }

    if(p.atk>0)p.atk-=dt;
    const pn=this.pr.length;
    for(const w of this.weapons.values())w.update(dt);
    if(this.pr.length>pn||this.cast)p.atk=.34;
    this.updateProjectiles(dt);
    this.updateEnemies(dt);
    this.updateBullets(dt);
    if(!inTrial){this.updatePickups(dt);this.map.update(dt);}

    /* aura particles */
    if(this.formIdx>=0&&this.fx.length<380){this.auraAcc+=dt*(14+this.formIdx*4);while(this.auraAcc>=1){this.auraAcc-=1;this.fx.push({x:p.x+rnd(-12,12),y:p.y-rnd(0,30),vx:rnd(-10,10),vy:-rnd(40,110),l:rnd(.4,.8),m:.8,c:this.formColor,s:rnd(2,4)});}}
    for(const f of this.fx){f.l-=dt;if(f.vx!==undefined){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.92;f.vy*=.92;}}
    this.fx=this.fx.filter(f=>f.l>0);
    for(const t of this.tx)t.t+=dt;
    this.tx=this.tx.filter(t=>t.t<.8);
    this.en=this.en.filter(e=>!e.dead);this.pr=this.pr.filter(b=>!b.dead);this.eb=this.eb.filter(b=>!b.dead);
    this.gm=this.gm.filter(g=>!g.dead);this.loot=this.loot.filter(l=>!l.dead);this.chests=this.chests.filter(c=>!c.dead);

    if(inTrial&&this.trial){
      const tr=this.trial,cl=o=>{const dx=o.x-tr.cx,dy=o.y-tr.cy,d=Math.hypot(dx,dy);if(d>tr.R){o.x=tr.cx+dx/d*tr.R;o.y=tr.cy+dy/d*tr.R;}};
      tr.t+=dt;cl(p);for(const e of this.en)cl(e);
      for(const o of [p,...this.en])for(const ob of tr.obs){const dx=o.x-ob.x,dy=o.y-ob.y,rr=ob.r+(o===p?9:o.r*.55),d2=dx*dx+dy*dy;if(d2<rr*rr){const d=Math.sqrt(d2)||.01;o.x=ob.x+dx/d*rr;o.y=ob.y+dy/d*rr;}}
      for(const b of tr.btn){
        if(b.cd>0)b.cd-=dt;
        else if(Math.hypot(p.x-b.x,p.y-b.y)<b.r+8){b.cd=14;const tp=tr.trp[b.trap];tp.armed=8;tp.tick=.5;this.audio.sfx('shrine');this.ring(b.x,b.y,70,'#ffb13b',.4);this.floatText(p.x,p.y-50,this.env.tr(T('Trappola attivata!','Trap armed!')),2);}
      }
      for(const tp of tr.trp){
        if(tp.fl>0)tp.fl-=dt;
        if(tp.armed>0){
          tp.armed-=dt;tp.tick-=dt;
          if(tp.tick<=0){
            tp.tick=1.3;tp.fl=.35;this.ring(tp.x,tp.y,tp.r,'#ff7a3a',.4);this.burst(tp.x,tp.y,16,'#ffb13b');this.audio.sfx('boom');this.shake=Math.max(this.shake,.15);
            const bs=tr.boss;
            if(!bs.dead&&Math.hypot(bs.x-tp.x,bs.y-tp.y)<tp.r+bs.r*.6){bs.stun=Math.max(bs.stun,.5);this.damageEnemy(bs,bs.max*.055);}
            if(Math.hypot(p.x-tp.x,p.y-tp.y)<tp.r)this.hurt(Math.max(6,p.maxHp*.06),{trap:true});
          }
        }
      }
      if(tr.phase==='train'&&(tr.t>=tr.dur||tr.boss.dead))this.finishTraining();
    }
    this.ck+=dt;if(this.ck>1){this.ck=0;this.progress.live(this);}
    if(this.xp>=this.need&&!this.modal&&!this.afterX)this.levelUp();
  }

  /* ---------- Kaioken x10 / x20: stats x2 / x4, drains 4 / 8 HP per second, cycle with one key ---------- */
  get abil(){return ABIL[this.C.id]||ABIL.goku;}
  get kaiAvail(){return this.abil.m==='kaioken'&&this.formsUnlocked>=1;}
  /* Broly: BERSERK, 10 seconds, cannot be cancelled. Controls are inverted and he lashes out at random enemies. */
  get berAvail(){return this.C.id==='broly';}
  startBerserk(){
    if(this.bers>0||this.bersCd>0||this.modal||this.ended||this.xform)return false;
    const p=this.p;this.bers=10;this.bersT=.15;this.recalc();
    this.flash=.6;this.flashC='#9aff4a';this.shake=Math.max(this.shake,.9);
    this.ring(p.x,p.y,320,'#8aff3a',.9);this.ring(p.x,p.y,180,'#ffffff',.6);this.pillar(p.x,p.y,'#8aff3a',1.4);this.bolt(p.x,p.y-20,260,'#c8ff6a',12);this.burst(p.x,p.y-18,50,'#8aff3a');
    this.say(this.env.tr(T('BERSERK!','BERSERK!')),'#8aff3a',2.6);this.audio.sfx('broly');this.emote('pain',2);
    for(const e of this.en){if(e.dead)continue;const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy)||1;if(d<300+e.r){e.stun=Math.max(e.stun,e.boss?.5:1);if(!e.boss){e.kx+=dx/d*400;e.ky+=dy/d*400;}}}
    return true;
  }
  updateBerserk(dt){
    const p=this.p;
    this.bers-=dt;
    this.bersT-=dt;
    if(this.bersT<=0){
      this.bersT=rnd(.3,.55);
      const near=this.en.filter(e=>!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<460);
      let tx,ty;
      if(near.length){const e=pick(near);tx=e.x;ty=e.y;}else{const a=rnd(0,TAU);tx=p.x+Math.cos(a)*170;ty=p.y+Math.sin(a)*170;}
      const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy)||1;
      this.bv={x:dx/d*560,y:dy/d*560,t:Math.min(.2,d/560)};
      this.explodeAt(tx,ty,115,34+this.lvl*3,'#9aff4a');this.audio.sfx('boom');this.shake=Math.max(this.shake,.25);
    }
    if(Math.random()<dt*6)this.bolt(p.x,p.y-24,120,'#c8ff6a',2);
    if(this.fx.length<420&&Math.random()<dt*50)this.fx.push({x:p.x+rnd(-16,16),y:p.y-rnd(0,36),vx:rnd(-24,24),vy:-rnd(80,200),l:rnd(.4,.8),m:.8,c:Math.random()<.35?'#eaffb0':'#6aff3a',s:rnd(2,5)});
    if(this.bers<=0){this.bers=0;this.bersCd=45;this.bv=null;this.recalc();this.say(this.env.tr(T('Il controllo è tornato.','Control regained.')),'#cfe8b0',2);this.ring(p.x,p.y,120,'#cfe8b0',.5);}
  }
  /* the single ability key: every character has its own ability (see ABIL in data.js) */
  toggleKaioken(){return this.useAbility();}
  kaiToggle(){
    if(!this.kaiAvail||this.modal||this.ended||this.xform)return false;
    if(this.kai===0&&this.p.hp<this.p.maxHp*.2){this.floatText(this.p.x,this.p.y-56,this.env.tr(T('Troppo debole!','Too weak!')),3);return false;}
    this.kai=(this.kai+1)%3;this.recalc();
    const p=this.p;
    if(this.kai>0){
      this.ring(p.x,p.y,this.kai===1?160:240,'#ff3b2f',.6);this.burst(p.x,p.y-18,this.kai===1?20:36,'#ff3b2f');this.pillar(p.x,p.y,'#ff3b2f',.6);this.shake=Math.max(this.shake,this.kai===1?.2:.4);
      this.say('KAIOKEN x'+(this.kai===1?10:20)+'!','#ff3b2f',1.8);this.audio.sfx(this.kai===1?'kaioken':'kaioken2');this.emote('smug',1.2);
    }else{this.say(this.env.tr(T('Kaioken disattivato','Kaioken off')),'#ffb0a0',1.4);this.audio.sfx('click');this.ring(p.x,p.y,90,'#ffb0a0',.4);}
    return true;
  }
  updateKaioken(dt){
    const p=this.p;
    p.hp-=(this.kai===1?4:8)*dt;
    if(this.fx.length<400&&Math.random()<dt*(this.kai===1?22:44))this.fx.push({x:p.x+rnd(-14,14),y:p.y-rnd(0,34),vx:rnd(-20,20),vy:-rnd(60,160),l:rnd(.3,.6),m:.6,c:Math.random()<.4?'#ffb0a0':'#ff3b2f',s:rnd(2,4)});
    if(p.hp<=p.maxHp*.1){this.kai=0;this.recalc();this.say(this.env.tr(T('Kaioken interrotto: vita troppo bassa!','Kaioken stopped: HP too low!')),'#ffb0a0',2);}
  }
  /* ---------- pet ---------- */
  initPet(id){
    const d=PETS.find(x=>x.id===id);
    if(!d||id==='none'){this.pet=null;return;}
    this.pet={d,x:this.p.x-34,y:this.p.y+4,cd:d.cd*.35,t:0,face:1,fl:0,act:0};
  }
  petReady(){return !!this.pet&&this.pet.cd<=0;}
  updatePet(dt){
    const q=this.pet;if(!q)return;
    const p=this.p;q.t+=dt;if(q.cd>0)q.cd-=dt;if(q.fl>0)q.fl-=dt;if(q.act>0)q.act-=dt;
    const tx=p.x-p.face*34+Math.sin(q.t*1.7)*8,ty=p.y+8+Math.cos(q.t*2.3)*5;
    const dx=tx-q.x,dy=ty-q.y,d=Math.hypot(dx,dy);
    if(d>420){q.x=tx;q.y=ty;}else{const k=Math.min(1,dt*(d>60?5:3));q.x+=dx*k;q.y+=dy*k;}
    if(Math.abs(dx)>3)q.face=dx>0?1:-1;
    if(this.trial)return;
    /* passive: the pet scoops up XP gems close to it */
    const r2=140*140;
    for(const g of this.gm){if(g.att)continue;const gx=q.x-g.x,gy=q.y-g.y;if(gx*gx+gy*gy<r2)g.att=true;}
  }
  usePet(){
    const q=this.pet;if(!q||q.cd>0||this.modal||this.ended)return false;
    const p=this.p,id=q.d.id,c=q.d.c;q.cd=q.d.cd;q.fl=.5;q.act=.6;
    this.ring(p.x,p.y,90,c,.5);this.burst(q.x,q.y-12,16,c);this.audio.sfx('shrine');
    const tr=o=>this.env.tr(o);
    if(id==='dende'){this.heal(p.maxHp*.07);this.floatText(p.x,p.y-56,tr(T('Guarigione!','Healed!')),2);this.pillar(p.x,p.y,'#8be07a',.6);}
    else if(id==='shenron'){for(const g of this.gm){if(Math.hypot(g.x-p.x,g.y-p.y)<300)g.att=true;}this.addXp(this.need*.03/Math.max(.2,this.S.xp));this.floatText(p.x,p.y-56,tr(T('Raccolta Magica!','Magic Gather!')),2);this.pillar(p.x,p.y,'#59d070',.8);this.ring(p.x,p.y,300,'#59d070',.6);}
    else if(id==='droid'){p.inv=Math.max(p.inv,.9);this.barrierT=Math.max(this.barrierT,0);this.floatText(p.x,p.y-56,tr(T('Scudo!','Shield!')),2);this.ring(p.x,p.y,60,'#8ad8ff',.8);}
    else if(id==='bubbles'){this.luckT=40;for(let i=0;i<2;i++)this.loot.push({k:'coin',x:p.x+rnd(-40,40),y:p.y+rnd(-30,30),v:Math.round(3*(1+this.t/600)),t:0});this.recalc();this.floatText(p.x,p.y-56,tr(T('Fortuna +3% (40s)','Luck +3% (40s)')),2);}
    else if(id==='buu'){
      this.ring(p.x,p.y,170,'#ff9ec7',.7);
      for(const e of this.en){if(e.dead)continue;const dx=e.x-p.x,dy=e.y-p.y;if(dx*dx+dy*dy<(170+e.r)**2)e.stun=Math.max(e.stun,e.boss?.2:.6);}
      this.floatText(p.x,p.y-56,tr(T('Raggio Caramella!','Candy Beam!')),2);
    }else if(id==='saibaman'){
      this.explodeAt(q.x,q.y-6,130,7+this.lvl*.55,'#ff7a3a');this.shake=Math.max(this.shake,.3);this.audio.sfx('boom');
      this.floatText(p.x,p.y-56,tr(T('Autodistruzione!','Self-Destruct!')),2);
    }
    return true;
  }
  emote(k,dur){if(this.emo==='pain'&&k==='hurt')return;this.emo=k;this.emoT=dur||1;}
  updateZones(dt){
    const p=this.p,th=this.stage.theme;this.inHeal=false;
    for(const z of World.zonesNear(th,p.x,p.y,520)){
      const dx=p.x-z.x,dy=p.y-z.y,d2=dx*dx+dy*dy;
      if(z.kind==='heal'){
        if(d2<z.r*z.r){
          this.inHeal=true;
          if(p.hp<p.maxHp){this.heal(Math.max(1.5,p.maxHp*.03)*dt);if(Math.random()<dt*5&&this.fx.length<380)this.fx.push({x:z.x+rnd(-z.r*.7,z.r*.7),y:z.y+rnd(-z.r*.3,z.r*.3),vx:0,vy:-rnd(30,60),l:.7,m:.7,c:'#8be07a',s:3});}
        }
      }else if(World.trapState(z,this.rt)===2){
        if(d2<(z.r+6)*(z.r+6))this.hurt(Math.max(6,p.maxHp*.07)+this.sd*1.5,{trap:true});
        for(const e of this.en){
          if(e.dead||e.boss||e.def.fly||e.ai==='hover'||e.trapT>0)continue;
          const ex=e.x-z.x,ey=e.y-z.y;
          if(ex*ex+ey*ey<(z.r+e.r)*(z.r+e.r)){e.trapT=.9;this.damageEnemy(e,14+this.lvl*1.5+this.sd*4);}
        }
      }
    }
    for(const e of this.en)if(e.trapT>0)e.trapT-=dt;
  }

  explodeAt(x,y,rad,dmg,c,skip){
    this.ring(x,y,rad,c,.4);this.burst(x,y,14,c);this.burst(x,y,8,'#ffffff');this.shake=Math.max(this.shake,.12);
    for(const o of this.en){if(o.dead||o===skip)continue;const dx=o.x-x,dy=o.y-8-y,rr=rad+o.r;if(dx*dx+dy*dy<rr*rr)this.hit(o,dmg,dx*.4,dy*.4);}
  }
  updateProjectiles(dt){
    for(const b of this.pr){
      if(b.home){
        const tg=this.nearest(b.x,b.y,520);
        if(tg){
          const ca=Math.atan2(b.vy,b.vx),da=angDiff(Math.atan2(tg.y-8-b.y,tg.x-b.x),ca);
          const na=ca+clamp(da,-6*dt,6*dt),s2=Math.min(Math.hypot(b.vx,b.vy)+400*dt,300);
          b.vx=Math.cos(na)*s2;b.vy=Math.sin(na)*s2;
        }
      }
      const tr=b.tr||(b.tr=[]);tr.push([b.x,b.y]);if(tr.length>8)tr.shift();
      if(b.hm>0){b.hm-=dt;const ca=Math.atan2(b.vy,b.vx),sp=Math.hypot(b.vx,b.vy);let da=Math.atan2(p.y-14-b.y,p.x-b.x)-ca;da=Math.atan2(Math.sin(da),Math.cos(da));const na=ca+clamp(da,-2.3*dt,2.3*dt);b.vx=Math.cos(na)*sp;b.vy=Math.sin(na)*sp;}
      b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
      if(b.life<=0){b.dead=true;continue;}
      for(const e of this.en){
        if(e.dead||b.hit.includes(e))continue;
        const dx=e.x-b.x,dy=e.y-8-b.y,rr=e.r+b.r;
        if(dx*dx+dy*dy<rr*rr){
          this.hit(e,b.dmg,b.vx*.18,b.vy*.18);b.hit.push(e);if(this.fx.length<380){this.burst(b.x,b.y,4,'#ffffff');this.burst(b.x,b.y,3,b.c);}
          if(b.expl)this.explodeAt(b.x,b.y,b.expl,b.dmg*(b.ex||.7),b.c,e);
          if(b.pi<=0){b.dead=true;break;}b.pi--;
        }
      }
    }
  }

  updateEnemies(dt){
    const p=this.p,grid=new Map();
    for(const e of this.en){
      if(e.dead)continue;
      const k=(Math.floor(e.x/40)+5000)*10000+(Math.floor(e.y/40)+5000);
      let c=grid.get(k);if(!c){c=[];grid.set(k,c);}c.push(e);
    }
    const vr=this.viewR*1.45,tslow=this.slowT>0;
    for(const e of this.en){
      if(e.atk>0)e.atk-=dt;
      if(e.dead)continue;
      if(e.fl>0)e.fl-=dt;
      const dx=p.x-e.x,dy=p.y-e.y,dist=Math.hypot(dx,dy)||1;
      if(!e.boss&&dist>vr){const a=rnd(0,TAU),d=this.viewR+20;e.x=p.x+Math.cos(a)*d;e.y=p.y+Math.sin(a)*d;continue;}
      const ux=dx/dist,uy=dy/dist;
      let mx=0,my=0,sp=e.spd*(e.slow>0?.6:1)*(tslow?(e.boss?.75:.55):1);
      if(e.slow>0)e.slow-=dt;
      if(e.stun>0){e.stun-=dt;}
      else switch(e.ai){
        case'ranged':case'hover':{
          if(e.ai==='hover'){const rad=200,corr=clamp((dist-rad)/rad,-1,1);mx=ux*corr-uy*.8;my=uy*corr+ux*.8;}
          else if(dist>250){mx=ux;my=uy;}else if(dist<190){mx=-ux;my=-uy;}else{mx=-uy*.6;my=ux*.6;}
          e.sh-=dt;
          if(e.sh<=0){
            const s=e.def.shoot;e.sh=s.cd+rnd(0,.8);e.atk=.36;
            const base=Math.atan2(dy,dx);
            if(s.ring){for(let i=0;i<s.n;i++){const a=i/s.n*TAU+e.ph;this.eb.push({x:e.x,y:e.y-14,vx:Math.cos(a)*s.spd,vy:Math.sin(a)*s.spd,r:6,dmg:e.dmg,life:5,c:'#c9a0ff'});}}
            else for(let i=0;i<s.n;i++){const a=base+(i-(s.n-1)/2)*s.sp;this.eb.push({x:e.x,y:e.y-14,vx:Math.cos(a)*s.spd,vy:Math.sin(a)*s.spd,r:6,dmg:e.dmg,life:5,c:'#6ad0ff'});}
          }
          break;}
        case'charge':
          if(e.st===0){mx=ux;my=uy;e.stT-=dt;if(e.stT<=0&&dist<300){e.st=1;e.stT=.5;}}
          else if(e.st===1){e.stT-=dt;if(e.stT<=0){e.st=2;e.stT=.55;e.dx=ux;e.dy=uy;}}
          else{e.stT-=dt;mx=e.dx;my=e.dy;sp*=4;if(e.stT<=0){e.st=0;e.stT=rnd(2,3.2);}}
          break;
        case'blink':
          mx=ux;my=uy;e.stT-=dt;
          if(e.stT<=0&&dist>130){const a=rnd(0,TAU),d=rnd(110,150);this.ring(e.x,e.y,30,'#7fe0a0',.3);e.x=p.x+Math.cos(a)*d;e.y=p.y+Math.sin(a)*d;this.ring(e.x,e.y,30,'#7fe0a0',.3);e.stun=.35;e.atk=.3;e.stT=rnd(3,4.5);}
          break;
        case'leap':{
          /* jumps forward: crouch (telegraph) -> arc through the air -> landing shockwave */
          if(e.st===0){mx=ux;my=uy;e.stT-=dt;if(e.stT<=0&&dist>110&&dist<340){e.st=1;e.stT=.5;}}
          else if(e.st===1){e.stT-=dt;e.sq=1;if(e.stT<=0){e.st=2;e.sq=0;const lead=Math.min(1,dist/340);e.jp={sx:e.x,sy:e.y,tx:p.x+(p.vx||0)*.25*lead,ty:p.y+(p.vy||0)*.25*lead,t:0,dur:.55};this.audio.sfx('leap');}}
          else{const j=e.jp;j.t+=dt;e.atk=Math.max(e.atk||0,.4);const k=Math.min(1,j.t/j.dur);e.x=j.sx+(j.tx-j.sx)*k;e.y=j.sy+(j.ty-j.sy)*k;e.zoff=Math.sin(k*Math.PI)*Math.min(90,40+dist*.25);
            if(k>=1){e.zoff=0;e.st=0;e.stT=rnd(2.2,3.6);e.stun=.35;this.ring(e.x,e.y,56,'#ffd9a0',.3);this.burst(e.x,e.y,6,'#d8c8a0');this.audio.sfx('land');
              if(Math.hypot(p.x-e.x,p.y-e.y)<e.r+44)this.hurt(e.dmg*.7,e);e.atk=.6;}}
          break;}
        case'slam':{
          /* stomps the ground: stops, red circle warns, then an area blast */
          if(e.st===0){mx=ux;my=uy;e.stT-=dt;if(e.stT<=0&&dist<190){e.st=1;e.stT=.9;e.sq=1;this.bz.push({x:e.x,y:e.y,r:e.r*3.3,t:0,dur:.9,dmg:e.dmg*.9,c:'#ff7a3a',own:e});}}
          else{e.stT-=dt;if(e.stT<=0){e.st=0;e.sq=0;e.stT=rnd(3,4.8);}}
          break;}
        case'weave':{
          /* evasive zig-zag approach */
          const lat=Math.sin(this.t*3.4+e.ph)*1.15;mx=ux-uy*lat;my=uy+ux*lat;const m=Math.hypot(mx,my)||1;mx/=m;my/=m;sp*=1.12;
          break;}
        case'explode':
          if(e.fuse>0){e.fuse-=dt;if(e.fuse<=0){this.explode(e);continue;}}
          else{mx=ux;my=uy;if(dist<e.r+34){e.fuse=e.def.fuse;this.audio.sfx('fuse');}}
          break;
        case'boss':{
          if(e.xf){this.updateBossXform(e,dt);break;}
          /* too slow? the boss powers up: heals, gets stronger and learns new attacks */
          if(e.tf<2&&e.hp>e.max*.1&&!this.trial){e.tfT-=dt;if(e.tfT<=0)this.startBossXform(e);}
          if(e.dashT>0){e.dashT-=dt;sp*=3;}
          if(dist>e.r+30){mx=ux;my=uy;}
          if(e.bd.p2&&!e.p2&&e.hp<=e.max*(e.bd.p2at||.5))this.bossTransform(e);
          const ratio=e.hp/e.max,ph=ratio<.33?2:ratio<.66?1:0;
          if(ph!==e.phase){e.phase=ph;this.ring(e.x,e.y,160,e.bd.c,.6);this.shake=.3;this.floatText(e.x,e.y-e.r*2,this.env.tr(T('FASE ','PHASE '))+(ph+1),1);}
          e.sh-=dt;if(e.sh<=0){e.sh=e.bd.cd*Math.pow(.88,ph);e.atk=.4;this.bossAttack(e);}
          break;}
        default:mx=ux;my=uy;
      }
      e.x+=mx*sp*dt;e.y+=my*sp*dt;
      if(Math.abs(mx)>.1)e.face=mx>0?1:-1;
      e.x+=e.kx*dt;e.y+=e.ky*dt;e.kx*=.88;e.ky*=.88;
      if(!e.boss&&!e.def.fly&&e.ai!=='hover'&&!this.trial)World.resolve(this.stage.theme,e,e.r*.55);
      if(!e.boss&&e.ai!=='hover'){
        const cx=Math.floor(e.x/40)+5000,cy=Math.floor(e.y/40)+5000;
        for(let gx=cx-1;gx<=cx+1;gx++)for(let gy=cy-1;gy<=cy+1;gy++){
          const c=grid.get(gx*10000+gy);if(!c)continue;
          for(const o of c){
            if(o===e||o.dead)continue;
            const ox=e.x-o.x,oy=e.y-o.y,rr=(e.r+o.r)*.75,d2=ox*ox+oy*oy;
            if(d2<rr*rr&&d2>.01){const d=Math.sqrt(d2),push=(rr-d)*.5*(o.boss?2:1);e.x+=ox/d*push;e.y+=oy/d*push;}
          }
        }
      }
      if(e.ai!=='explode'&&dist<e.r+8)this.hurt(e.dmg,e);
    }
  }
  updateBullets(dt){
    const p=this.p;
    for(const b of this.eb){
      b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
      if(b.life<=0){b.dead=true;continue;}
      const dx=b.x-p.x,dy=b.y-(p.y-14);
      if(dx*dx+dy*dy<(b.r+8)*(b.r+8)){this.hurt(b.dmg,b);b.dead=true;}
    }
  }
  updatePickups(dt){
    const p=this.p,S=this.S;
    if(this.gm.length>GEM_CAP)this.mergeGems();
    this.updateRedGem(dt);
    for(const g of this.gm){
      const dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy);
      if(d<S.magnet)g.att=true;
      if(g.att){const sp=380+d;g.x+=dx/d*sp*dt;g.y+=dy/d*sp*dt;}
      if(d<14){g.dead=true;this.addXp(g.v);this.audio.sfx('gem');}
    }
    for(const l of this.loot){
      l.t+=dt;
      const dx=p.x-l.x,dy=p.y-l.y,d=Math.hypot(dx,dy)||1;
      if(l.k==='ball'&&l.t>.8){l.x+=dx/d*300*dt;l.y+=dy/d*300*dt;}
      else if((l.k==='coin'||l.k==='heal')&&d<S.magnet*.7){l.x+=dx/d*260*dt;l.y+=dy/d*260*dt;}
      if(l.ttl&&l.t>l.ttl){l.dead=true;continue;}
      if(d<20){l.dead=true;this.collectLoot(l);}
    }
    for(const c of this.chests){
      c.t+=dt;
      const d=Math.hypot(p.x-c.x,p.y-c.y);
      if(d<28&&!this.modal){
        c.dead=true;this.run.chests++;this.audio.sfx('chest');this.emote('wow',1);
        this.modal={type:'chest',rewards:this.chestRewards(c.final,c.boss)};
      }
    }
  }

  /* ---------- Room of Spirit and Time: 20s training + upgrade shop ---------- */
  startTrial(){
    if(this.trial||this.ended)return;
    const p=this.p,idx=this.sd,C=this.C;
    const n=this.trialN++,big=1+.55*n;
    const sp={k:'human',u:(C.u||1.95)*big,cfg:Object.assign({},C.cfg,{skin:'#c8d0e8',outfit:'#262a46',legs:'#262a46',belt:'#6a7aff',under:'#3a4a8a',hair:'#e8eeff',eye:'#6a7aff',wrist:'#6a7aff',armor:null,emblem:0})};
    const hp=(300+45*this.lvl*(1+.4*idx))*(1+.9*n)*2.1,dmg=(7+4*idx)*(1+.1*idx)*(1+.35*n);
    const def={n:n?T('Maestro dello Spirito (Furia)','Spirit Master (Fury)'):T('Maestro dello Spirito','Spirit Master'),c:'#aab4ff',xp:0,hp,r:16*big,spd:60+14*n,dmg,ai:'boss',sp};
    const bd={id:'spar',n:def.n,c:'#aab4ff',hp,spd:60+14*n,r:16*big,u:(C.u||1.95)*big,dmg,pats:n?['tri','sweep','meteor','burst','ring','slam']:['aim','slam','tri','burst','meteor'],cd:n?1.9:2.4,sp};
    const e=this.mkEnemy(def,p.x+190,p.y);
    Object.assign(e,{ai:'boss',bd,hp,max:hp,dmg,armor:0,phase:0,spin:0,dashT:0,sparring:true,sh:bd.cd});
    const cx=p.x,cy=p.y,obs=[],btn=[],trp=[];
    for(let i=0;i<8;i++){const a=i/8*TAU+.3,rr=i%2?480:330;obs.push({x:cx+Math.cos(a)*rr,y:cy+Math.sin(a)*rr,r:26,v:i%3});}
    for(let i=0;i<3;i++){const a=i/3*TAU+1.0;btn.push({x:cx+Math.cos(a)*410,y:cy+Math.sin(a)*410,r:26,cd:0,trap:i});trp.push({x:cx+Math.cos(a+1.05)*235,y:cy+Math.sin(a+1.05)*235,r:84,armed:0,tick:0,fl:0});}
    this.trial={t:0,dur:60,cx,cy,R:640,phase:'train',boss:e,stash:this.en,ret:{x:p.x,y:p.y},killed:false,obs,btn,trp};
    this.en=[e];this.eb=[];this.pr=[];this.flash=.6;this.flashC='#ffffff';
    this.ring(p.x,p.y,260,'#ffffff',.7);this.audio.sfx('transform');
    this.say(this.env.tr(T('STANZA DELLO SPIRITO E DEL TEMPO','ROOM OF SPIRIT AND TIME')),'#cfd8ff',3);
  }
  finishTraining(){
    const tr=this.trial;if(!tr||tr.phase!=='train')return;
    tr.phase='shop';this.eb=[];
    this.addXp(this.need*(tr.killed?.5:.3)/this.S.xp);
    this.audio.sfx('lvl');
    this.modal={type:'trial',offers:this.makeOffers(),killed:tr.killed,freePick:!!tr.killed};
  }
  makeOffers(){
    const ps=(1+.6*this.sd)*(.45+.55*Math.min(1,this.t/this.dur)),offers=[];
    if(this.formsUnlocked<Math.min(6,this.formMax)&&this.lvl>=Math.round(FORM_TIERS[this.formsUnlocked].lvl*.7))offers.push({kind:'form',price:Math.round(170*ps*(1+.3*this.formsUnlocked))});
    const ws=[...this.weapons.values()].filter(w=>w.lv<WMAX);
    if(ws.length)offers.push({kind:'weapon',wid:pick(ws).id,price:Math.round(35*ps)});
    const st=shuffle(['might','spd','cd','hp']);
    for(let i=0;i<2;i++)offers.push({kind:'swap',a:st[i],b:st[(i+1+Math.floor(Math.random()*2))%4]===st[i]?st[(i+2)%4]:st[(i+1+Math.floor(Math.random()*2))%4],price:Math.round(25*ps)});
    return offers.map(o=>Object.assign(o,{sold:false}));
  }
  buyOffer(i){
    const m=this.modal;if(!m||m.type!=='trial')return false;
    const o=m.offers[i];if(!o||o.sold)return false;
    const free=!!m.freePick;if(!free&&this.run.coins<o.price)return false;
    if(free)m.freePick=false;else this.run.coins-=o.price;o.sold=true;
    if(o.kind==='form')this.unlockForm();
    else if(o.kind==='weapon'){const w=this.weapons.get(o.wid);if(w)w.upgrade();}
    else{const STEP={might:.10,spd:.10,cd:.08,hp:.12};this.swap[o.a]-=STEP[o.a];this.swap[o.b]+=STEP[o.b]*1.35;}
    this.recalc();this.audio.sfx('buy');return true;
  }
  endTrial(){
    const tr=this.trial;if(!tr)return;
    this.en=tr.stash;this.eb=[];this.pr=[];this.bz=[];this.trial=null;
    this.p.x=tr.ret.x;this.p.y=tr.ret.y;this.p.inv=1.5;this.flash=.4;this.flashC='#ffffff';
  }

  /* ---------- sandbox helpers ---------- */
  jumpTo(t){this.t=Math.max(0,t);for(const b of this.bossQ)b.done=b.done||b.t<t-1;this.hordeT=Math.ceil(this.t/120)*120+120*0;if(this.hordeT<=this.t)this.hordeT+=120;this.packT=this.t+45;}
  setLevel(l){while(this.lvl<l){this.xp=this.need;this.lvl++;this.need=xpNeed(this.lvl);while(this.formsUnlocked<this.formMax&&this.lvl>=FORM_TIERS[this.formsUnlocked].lvl)this.unlockForm();}this.xp=0;this.recalc();}
  spawnChestHere(final){this.chests.push({x:this.p.x+60,y:this.p.y,final:!!final,t:0});}
}

/* ====== Map events: loot points + helpful features, driven by time and player needs ====== */
class MapDirector{
  constructor(g){this.g=g;this.lootT=rnd(30,45);this.featT=rnd(70,100);this.chestT=200;this.totemT=rnd(120,170);
    const bq=g.bossQ;this.trials=[];
    if(bq.length){this.trials.push({t:Math.max(60,bq[0].t-50),done:false});const fin=bq[bq.length-1];if(fin.t-70>bq[0].t+60)this.trials.push({t:fin.t-70,done:false});}
  }
  update(dt){
    const g=this.g,p=g.p;
    for(const tr of this.trials)if(!tr.done&&g.t>=tr.t){tr.done=true;this.spawnChamber();}
    this.lootT-=dt;
    if(this.lootT<=0){this.lootT=rnd(45,75)/(1+g.S.lootRate+g.S.luck*1.5);this.spawnLootPoint();}
    this.chestT-=dt;
    if(this.chestT<=0){this.chestT=300;const[x,y]=this.pos(220,380);g.chests.push({x,y,final:false,t:0,supply:true});g.floatText(p.x,p.y-70,g.env.tr(T('Un forziere è apparso!','A chest appeared!')),5);}
    if(!this.totemDone)this.totemT-=dt;
    if(!this.totemDone&&this.totemT<=0&&!g.feat.some(f=>f.kind==='totem')){this.totemDone=true;const[x,y]=this.pos(230,400);g.feat.push({kind:'totem',x,y,t:0,ttl:900,used:false,dead:false});g.say(g.env.tr(T('Un Totem è apparso sulla mappa!','A Totem appeared on the map!')),'#8be07a',2.6);g.audio.sfx('shrine');}
    this.featT-=dt;
    if(this.featT<=0){this.featT=rnd(80,130);this.spawnFeature();}
    for(const f of g.feat){
      f.t+=dt;
      const d=Math.hypot(p.x-f.x,p.y-f.y);
      f.near=d<90;
      if(f.used)continue;
      if(f.t>f.ttl){f.dead=true;continue;}
      if(d<30){
        if(f.kind==='altar'||f.kind==='chamber'||f.kind==='totem'){if(g.input.interact)this.use(f);}
        else this.use(f);
      }
    }
    g.input.interact=false;
    g.feat=g.feat.filter(f=>!f.dead);
  }
  pos(rmin,rmax){const a=rnd(0,TAU),d=rnd(rmin,rmax);return[this.g.p.x+Math.cos(a)*d,this.g.p.y+Math.sin(a)*d];}
  spawnLootPoint(){
    const g=this.g,low=g.p.hp<g.p.maxHp*.5;
    const opts=[['coin',30],['heal',8+(low?22:0)],['magnet',6+(g.gm.length>60?12:0)],['dmg',7],['haste',7],['xp',7]];
    if(g.nt>=170)opts.push(['luck',4]);
    if(g.nt>120)opts.push(['capsule',2*(1+g.S.luck)]);
    const k=wpick(opts,o=>o[1])[0],[x,y]=this.pos(150,330);
    g.spawnLoot(k,x,y);g.loot[g.loot.length-1].ttl=60;
  }
  nextFormGap(){const g=this.g;if(g.formsUnlocked>=g.formMax)return 99;return FORM_TIERS[g.formsUnlocked].lvl-g.lvl;}
  spawnFeature(){
    const g=this.g;if(g.feat.filter(f=>!f.used).length>=2)return;
    const hpR=g.p.hp/g.p.maxHp,ws=[...g.weapons.values()],near=ws.some(w=>w.lv>=3&&w.lv<WMAX),gap=this.nextFormGap();
    const c=[];
    if(g.nt>=80&&g.tempBuffs.length<3)c.push(['shrine',2]);
    if(g.nt>=100&&hpR<.4)c.push(['spring',6]);
    if(g.nt>=170&&near&&hpR>.45)c.push(['altar',7]);
    if(g.nt>=100&&gap>0&&gap<=3)c.push(['font',8]);
    if(g.nt>=80)c.push(['cache',2]);
    if(!c.length)return;
    const kind=wpick(c,x=>x[1])[0],[x,y]=this.pos(260,460);
    g.feat.push({kind,x,y,t:0,ttl:100,used:false,dead:false});
    g.floatText(g.p.x,g.p.y-70,g.env.tr(T('Qualcosa è apparso sulla mappa','Something appeared on the map')),5);
  }
  spawnChamber(){
    const g=this.g,[x,y]=this.pos(200,280);
    g.feat.push({kind:'chamber',x,y,t:0,ttl:95,used:false,dead:false});
    g.say(g.env.tr(T('Una Stanza dello Spirito e del Tempo è apparsa!','A Room of Spirit and Time has appeared!')),'#cfd8ff',3);g.audio.sfx('shrine');
  }
  use(f){
    const g=this.g,p=g.p;
    if(f.kind==='chamber'){g.startTrial();f.used=true;f.dead=true;return;}
    if(f.kind==='totem'){g.modal={type:'totem',opts:g.rollTotems()};f.used=true;f.dead=true;return;}
    if(f.kind==='shrine'){
      const k=pick(['might','spd','cd','hp','regen','magnet']);
      const val={might:.05,spd:.04,cd:.04,hp:8,regen:.2,magnet:.08}[k];
      g.tempBuffs.push({k,v:val,t:30});g.recalc();
      const names={might:T('Danno','Damage'),spd:T('Velocità','Speed'),cd:T('Ricarica','Cooldown'),hp:T('Salute','Health'),regen:T('Rigenerazione','Regeneration'),magnet:T('Raccolta','Pickup')};
      g.say(g.env.tr(T('Altare del Potere (30s): ','Altar of Power (30s): '))+g.env.tr(names[k]),'#ffd23f',2.2);g.audio.sfx('shrine');g.ring(f.x,f.y,100,'#ffd23f',.5);
    }else if(f.kind==='spring'){g.heal(p.maxHp*.2);g.say(g.env.tr(T('Sorgente curativa','Healing spring')),'#8be07a',2);g.audio.sfx('senzu');g.ring(f.x,f.y,100,'#8be07a',.5);}
    else if(f.kind==='altar'){
      if(p.hp<=p.maxHp*.3){g.floatText(p.x,p.y-60,g.env.tr(T('Troppo debole!','Too weak!')),3);f.t=Math.max(0,f.t);g.input.interact=false;return;}
      const cand=[...g.weapons.values()].filter(w=>w.lv<WMAX).sort((a,b)=>b.lv-a.lv);
      if(!cand.length){f.dead=true;return;}
      p.hp=Math.max(1,Math.floor(p.hp*.5));g.upgradeWeapon(cand[0]);
      g.say(g.env.tr(T('Sacrificio: ','Sacrifice: '))+g.env.tr(cand[0].def.n)+' +1','#ff5a5a',2.4);g.audio.sfx('evolve');g.ring(f.x,f.y,120,'#ff5a5a',.5);
    }else if(f.kind==='font'){
      g.addXp(g.need*.4/g.S.xp);g.say(g.env.tr(T('Fonte dell\'esperienza','Experience font')),'#8ad8ff',2);g.audio.sfx('pickup');g.ring(f.x,f.y,100,'#8ad8ff',.5);
    }else if(f.kind==='cache'){
      for(let i=0;i<4;i++)g.loot.push({k:'coin',x:f.x+rnd(-30,30),y:f.y+rnd(-30,30),v:Math.round(5*(1+g.nt/450)),t:0});
      g.audio.sfx('coin');
    }
    f.used=true;f.dead=true;
  }
}
