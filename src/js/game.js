/* every ESC_EVERY seconds (600: Normal, Hard and Extreme; Easy keeps ESC_EVERY_EASY = 60) new enemies get a step of extra HP / damage (and drop more XP); Extreme also toughens their armor. Easy only gets 1%.
   In Endless the steps come every ENDLESS_MILE player levels instead (ENDLESS_W steps at a time). Extreme also raises its spawn rate 2% (the on-screen cap 1%) every 30 s */
/* kill streak: kills in a row, each within STREAK_WIN s of the previous one; the milestones pay a little XP and make a fuss */
const CK_EVERY=50,CK_COINS=50,CK_DRAIN=.02;   /* coin streak: every 50 kills in a row +50 coins; the hidden bar loses 1% every 0.5 s (2% per second) */
const STREAK_WIN=4,STREAK_MS=[25,50,100,200,350,500,750,1000,1500,2000],STREAK_COL=['#ffe24d','#ffb13b','#ff7b4a','#ff5a3d','#ff3b6b','#d86bff'];
const SUP_PICK_R=34,SUP_CHANCE=.55,BALL_PICK_R=11,DEATH_T=2.0,TRANS_K=1.2,TRANS_HEAL=.5,VIC_T=4.2,ESC_EVERY=600,ESC_EVERY_EASY=60,ESC_E={hp:.01,dmg:.01,arm:0,xp:.05},ESC_N={hp:.10,dmg:.02,arm:0,xp:.05},ESC_X={hp:.15,dmg:.05,arm:.15,xp:.08},X_SPAWN_STEP=30,X_SPAWN_K=.02,X_CAP_K=.01;
const BM_DODO_WARN=3,BM_GERO_DRAIN=[.05,.15,.25,.35],BM_RAIN_N=[50,55,60,70];   /* boss signature moves: Dodoria's warning, Gero's drain (easy / normal / hard / extreme), Super Buu's number of balls */
const GHOST_K=1.5,GHOST_KIND={ki:'shot',homing:'shot',javelin:'shot',dsunday:'shot',spiral:'shot',boomer:'shot',disc:'shot',barrage:'shot',kame:'beam',dbeam:'beam',sweep:'beam',chain:'chain'};   /* Gotenks' ghosts: how each weapon is copied (anything else = a blast on the target) */
/* enemy density: the spawn rate and the on-screen cap are lower than before (the first stage was chaos) */
const SPAWN_K=.85,CAP_K=.78;
/* enemy fire: a volley is smaller (x0.67), the shooters wait longer between volleys, and all of them share a "shot budget" that refills at a fixed rate,
   so a crowd of shooters can never drown the screen in bullets (Snake Way is the calmest: its shooters are the most numerous and the most dangerous) */
const SHOT_N_K=.67,SHOT_CD_K=1.8,SHOT_CD_SNAKE=2.6,SHOT_RATE=6,SHOT_RATE_SNAKE=3.4,SHOT_BANK=12,SHOT_BANK_SNAKE=8,EB_CAP=90;
const BERS_T=6,BERS_T2=8,BERS_AIM=.5;   /* Broly's Berserk: seconds (base / final form) and the random aim error of the weapons while it lasts (+-0.5 rad, about 29 degrees) */
const G_HP_K=2.4,G_DMG_K=1.0,BASE_POWER=1.6;
/* XP gems: when the ground gets crowded the farthest gems are merged into one big red gem parked just outside the screen */
const GEM_CAP=90,GEM_KEEP=55;
/* companion (v54): XP gems it can fetch (px from the player), carried at once, run speed; shockwave when surrounded: enemies needed / radius they count in / radius hit / damage / cooldown (s) */
const PET_SEEK=340,PET_CARRY=3,PET_SPD=250,PET_SW_N=5,PET_SW_NEAR=165,PET_SW_R=210,PET_SW_DMG=12,PET_SW_CD=5;
/* wave rhythm: a surge of WAVE_SURGE seconds, then a breather of WAVE_REST seconds with a shower of gems; elites and the guaranteed Dragon Ball are planned per run */
const WAVE_SURGE=15,WAVE_REST=12,WAVE_RATE=2.6,WAVE_CAP=1.5,WAVE_GAP=[110,160],WAVE_FIRST=[150,190],REST_RATE=.3,REST_CAP=.75,REST_GEM=1.5,ELITE_HP=9,ELITE_R=1.35;
/* enemy walking speed follows the stage difficulty: x0.80 on the first stage up to the old x1.1 from difficulty 4.4 on */
const stageSpd=sd=>Math.min(ENEMY_SPD_MUL,.8+.07*sd);
const TGT_NAMES=[T('Bersaglio: più vicino','Target: closest'),T('Bersaglio: più Salute','Target: most HP'),T('Bersaglio: meno Salute','Target: least HP'),T('Bersaglio: boss','Target: boss')];
const TOP_K=1.5;
const DMG_T=1.1;   /* seconds a damage number stays on screen (every other floating text: .8 s) */
const SPAR_COPY_MUL=.6,SPAR_COPY_P=.7;   /* Room of Spirit and Time: the Master copies your abilities and weapons 7 attacks in 10, with 40% less damage */
/* how the Master reproduces each weapon (v57): his copies look like yours (orbs, spears, the Kamehameha sprite beam, tinted zones); anything not listed here uses GHOST_KIND, else a blast on you */
const SPAR_KIND={spirit:'sphere',aura:'ring',flare:'flare',slash:'slash',javelin:'spear',breaker:'beam',hellzone:'grenade',chrono:'rewind',shock:'shock',hakai:'erase',meteor:'meteor',dyn:'kick'};
const TOTEM_CD=20,TOTEM_RISK_T=180,TRIAL_MALUS=.5,XP_MUL=.5,BOSS_HP_MUL=1.045,ENEMY_SPD_MUL=1.1,ENEMY_HP_MUL=1.21,ENEMY_DMG_MUL=1.2;
'use strict';
/* ====== Game core (no DOM access: UI/renderer observe it) ====== */
class Game{
  constructor(o,env){
    this.env=env;this.save=env.save.d;this.audio=env.audio;this.progress=env.progress;
    this.stageIdx=o.stage;this.stage=STAGES[o.stage];this.sd=this.stage.dif!==undefined?this.stage.dif:o.stage;this.spdK=stageSpd(this.sd);MAP.roll();World.setTheme(this.stage.theme);this.C=CHARS.find(c=>c.id===o.char);
    this.diffId=o.diff;this.D=DIFF[o.diff];this.x2=!!o.x2;this.sandbox=!!o.sandbox;
    this.t=0;this.kills=0;this.lvl=1;this.xp=0;this.need=xpNeed(1);
    this.p={x:0,y:this.stage.theme==='snake'?Snake.f(0):0,hp:1,maxHp:1,face:1,inv:0,mv:false};
    this.input={x:0,y:0,interact:false};
    this.en=[];this.pr=[];this.eb=[];this.gm=[];this.rg=null;this.loot=[];this.lootCd={};this.feat=[];this.chests=[];this.fx=[];this.tx=[];
    this.weapons=new Map();this.pass={};this.trinkets=[];this.tRar={};this.tPf={};this.tSrc={};this.tq=[];
    this.formsUnlocked=0;this.formIdx=-1;this.formColor=null;
    this.buffs={dmg:0,haste:0};this.tempBuffs=[];this.szStat={might:0,spd:0,cd:0,hp:0,regen:0,magnet:0};this.szN=0;this.tgt=(this.save.settings&&this.save.settings.tgt)|0;this.autoZ=false;this.lavaT=0;this.lavaF=0;this.luckBonus=0;this.wishLog=[];this.cast=null;this.pa=null;this.pfd=0;this.pfdUntil=0;this.ru={rr:Math.min(5,this.save.shop.rr||0),sk:Math.min(5,this.save.shop.sk||0),bn:Math.min(5,this.save.shop.bn||0)};this.ru0=Object.assign({},this.ru);this.banRun=new Set()   /* Reroll / Skip / Ban charges of this run (shop) */;
    this.endless=false;this.enMile=0;this.en0=null;this.xpAcc=0;this.xpRate=0;
    this.run={minC:Infinity,bossKills:0,evos:0,legendary:0,coins:0,chests:0,perfect:0,balls:0,wishes:0,zeno:0,zbuy:0,mythic:0,k20:0,streak:0,tk:{t1:0,t10:0,l10:0}};
    this.bank={kills:0,bossKills:0,chests:0,balls:0,wishes:0,perfect:0,coins:0,zeno:0,zbuy:0,evos:0,elites:0,t:0,counted:false,cleared:false,tk:{t1:0,t10:0,l10:0}};
    this.balls=0;this.ballSet=[];this.senzu=Math.min(SENZU_MAX,(this.C&&this.C.senzu)||0);this.senzuCd=0;this.dashCd=0;this.dashT=0;this.revives=0;this.totemLuck=0;this.totemFx={};this.totemTag=null;this.stormT=0;this.pulseT=0;this.abCd=0;this.regenT=0;this.regenRate=0;this.clones=null;this.cloneT=0;this.sbc=null;this.spheres=[];this.ghosts=null;this.ghostT=0;this.rain=[];this.held=null;this.critT=0;this.shieldT=0;this.tsT=0;this.abBuf=null;this.dashT=0;this.dashHit=null;this.hpHist=[];this.histT=0;this.bshock=null;this.riskT=0;this.kai=0;this.bers=0;this.bersCd=0;this.bersT=0;this.bv=null;this.xform=null;this.afterX=null;this.shocks=[];this.shockId=0;this.inHeal=false;this.emo=null;this.emoT=0;this.modal=null;this.banner=null;this.flash=0;this.flashC='#fff';this.shake=0;
    this.vw=960;this.vh=560;this.streak=0;this.streakT=0;this.streakPop=0;this.cstk=0;this.cstkT=0;
    this.TS=this.D.dur/this.stage.time;this.CR=this.x2?2:1;this.evK=this.x2?1.5:1;this.rt=0;this.dur=this.stage.time*this.TS;this.trialN=0;
    this.spAcc=0;this.hordeT=150*Math.sqrt(this.TS)*this.evK;this.packT=75*this.evK;{const all=bossPlan(this.stage,this.dur,this.diffId).map(b=>[b[0],b[1],b[2]]),mid=all.filter(b=>!b[2]),gap=mid.length?this.dur/(mid.length+1):999,step=this.stage.abs?1:Math.max(1,Math.ceil(42/gap));   /* short runs: thin out the boss list so fights are not back to back (the Android Ruins keep their 5-minute clock) */
      this.bossQ=all.filter(b=>b[2]||mid.indexOf(b)%step===step-1||step===1).map(b=>({id:b[0],t:b[1]*this.TS,final:!!b[2],done:false,k:(this.stage.abs&&ANDROID_K[b[0]])||1}));}
    /* when the hordes arrive (same schedule as hordeT below): shown as little skulls on the progress bar */
    this.hordePlan=[];{const h0=130*Math.sqrt(this.TS),st=(110-12*this.sd)*Math.sqrt(this.TS);for(let t=h0;t<this.dur-20;t+=st)this.hordePlan.push(t);}
    /* wave rhythm (calm -> surge -> rest), elite enemies and the guaranteed Dragon Ball: all follow the run length */
    this.wave={ph:'calm',until:rnd(WAVE_FIRST[0],WAVE_FIRST[1])*clamp(Math.sqrt(this.TS),.75,1.4)*this.evK,n:0};this.elitePlan=this.planElites();this.scanK=1+.05*(this.save.shop.scan||0);   /* shop "Scanner Sfere del Drago": +5% Dragon Ball spawn rate per level */
    this.ballEvery=clamp(this.dur*.28,100,270)/this.scanK;this.ballAt=this.ballEvery*.75;
    /* last stages: no normal Dragon Balls; a Super Dragon Ball may land once per run (a chance, never when all 3 are owned), later and farther away, and a Tamagami statue guards it */
    this.supPlan=this.stage.sup&&(this.sandbox||this.save.sball.length<SB_TOTAL)&&Math.random()<Math.min(1,SUP_CHANCE*this.scanK)?{at:this.dur*rnd(.28,.55),done:false}:null;
    this.bossHit=false;this.finalSpawned=false;this.cleared=false;this.ended=false;
    this.slowT=0;this.slowCd=12;this.shockCd=8;this.barrierT=0;this.barrierReady=false;this.auraAcc=0;this.ck=0;
    this.timeScale=1;this.sb={god:false,nospawn:false};this.showNums=this.save.settings.dmgNum;FXL.on=!!this.save.settings.reduceFx;
    this.bossAlive=0;this.trial=null;this.swap={might:0,spd:0,cd:0,hp:0};this.bombOn=false;this.ev=null;{const D=MAP_EVENTS[this.stage.theme];this.bombT=D?rnd(D.first[0],D.first[1])*this.evK:1e9;}this.bombEnd=0;this.shootOn=false;this.shootQ=0;this.shootQT=8;this.shootT=this.stage.no===1?1e9:rnd(170,230)*this.evK;this.shootEnd=0;this.bz=[];this.jbeams=[];this.dying=null;this.dmgBy={};this.curW=null;this.vortex=null;this.seenT=1;this.newSeen=false;
    this.map=new MapDirector(this);
    for(const id of this.C.start.slice(0,this.maxW))this.addWeapon(id);
    this.revives=(this.save.shop.revive||0);
    this.luckT=0;this.petLuckT=0;this.initPet(o.pet||this.save.pet||'dende');
    /* the trinket equipped from the bag starts the run in the trinket slot (it does not count as a pick, and it is never sold) */
    {const T0=[],R0={},P0={},S0={};   /* v57: up to 3 equipped trinkets (one per unlocked slot) */
      for(const eq of (this.save.equips||[this.save.equip]).slice(0,this.tcap)){const td=eq&&TRINKETS.find(x=>x.id===eq.id),be=td&&this.save.bag.find(b=>b.id===eq.id&&b.r===eq.r);
        if(!be||R0[eq.id]!==undefined)continue;T0.push(eq.id);R0[eq.id]=eq.r;P0[eq.id]=be.p!=null?be.p:PF_NOM;S0[eq.id]='bag';this.save.trin[eq.id]=1;if(td.sp==='barrier')this.barrierReady=true;}
      if(T0.length){this.trinkets=T0;this.tRar=R0;this.tPf=P0;this.tSrc=S0;}}
    this.recalc();this.p.hp=this.p.maxHp;
  }
  /* how many different weapons this run may hold (setting under the character screen, 1-5) */
  get maxW(){return this.sandbox?MAX_WEAPONS:clamp(Math.round(this.save.settings.weapons)||MAX_WEAPONS,1,MAX_WEAPONS);}
  get viewR(){return Math.hypot(this.vw,this.vh)/2+50;}
  get formMax(){return Math.min(FORM_TIERS.length,LINES[this.C.line||'saiyan'].length);}
  get form(){return this.formIdx>=0?Object.assign({idx:this.formIdx},FORM_TIERS[this.formIdx]):null;}
  get formEntry(){return this.formIdx>=0?LINES[this.C.line||'saiyan'][this.formIdx]:null;}
  has(sp){return this.trinkets.some(id=>{const t=TRINKETS.find(x=>x.id===id);return t&&t.sp===sp;});}
  say(txt,col,dur,sub){this.banner={txt,col:col||'#ffd23f',t:0,dur:dur||2.6,sub:sub||null};}   /* sub: an optional smaller second line */
  floatText(x,y,s,c){c=c||0;const dm=c===0||c===6;if(this.tx.length<(dm?46:70))this.tx.push({x,y,t:0,s,c,l:dm?DMG_T:.8});}   /* c: 0 damage on an enemy, 6 critical hit (both stay DMG_T s), 1 gold label, 2 buff, 3 cyan, 4 damage taken, 5 white label */

  /* ---------- stats ---------- */
  tMods(){
    const m={might:0,spd:0,cd:0,xp:0,gold:0,crit:0,armor:0,regen:0,dodge:0,area:0,magnet:0,hpPct:0,lootRate:0,proj:0};
    for(const id of this.trinkets){const t=TRINKETS.find(x=>x.id===id);if(t&&t.m){const tmx=trinMods(t,this.trR(id),this.trP(id));for(const k in tmx)m[k]+=tmx[k];}}
    return m;
  }
  recalc(){
    const C=this.C,P=this.pass,sl=id=>this.save.shop[id]||0,tm=this.tMods(),fm=this.form,sh={might:0,spd:0,cd:0,hp:0,regen:0,magnet:0};
    for(const b of this.tempBuffs)sh[b.k]+=b.v;
    for(const k in this.szStat)sh[k]+=this.szStat[k];   /* Senzu beans eaten this run */
    const S={};
    S.might=BASE_POWER*C.might*(1+.10*(P.might||0))*(1+(C.lvMight||0)*(this.lvl-1))*(1+.06*sl('might'))*(1+(fm?fm.might:0))*(1+tm.might+sh.might)*(this.buffs.dmg>0?1.15:1);
    S.spd=C.spd*(1+.06*(P.speed||0))*(1+.04*sl('speed'))*(1+(fm?fm.spd:0)+tm.spd+sh.spd);
    S.cd=Math.max(this.cdMin(.35),(C.cd||1)-.05*(P.haste||0)-.04*sl('cd')-(fm?fm.cd:0)-tm.cd-sh.cd-(this.buffs.haste>0?.12:0));
    S.magnet=100*(C.mag||1)*(1+.35*(P.magnet||0))*(1+.20*sl('magnet')+tm.magnet+sh.magnet);
    S.armor=(P.armor||0)+(C.armor||0)+2*sl('armor')+(fm?fm.armor:0)+tm.armor;
    S.regen=C.regen+.5*(P.regen||0)+.6*sl('regen')+(fm?fm.regen:0)+tm.regen+sh.regen;
    S.xp=C.xpm*(1+.08*(P.growth||0))*(1+.10*sl('exp')+tm.xp)*(this.x2?.18:1)/this.TS;   /* the run is stretched/shrunk to the difficulty's length: XP per kill follows, so level pace per % of the run stays as designed */
    S.gold=1+.18*sl('gold')+tm.gold;
    S.crit=.05+.04*sl('crit')+tm.crit;S.critDmg=1.75;
    S.dodge=Math.min(.75,(fm?fm.dodge:0)+tm.dodge);
    S.area=1+tm.area+(fm?fm.idx*.03:0);
    S.proj=(fm?(fm.idx>=6?2:fm.idx>=3?1:0):0)+sl('proj')+(tm.proj||0);   /* forms + shop "Quantità" + trinkets */
    S.luck=Math.min(.9,.09*sl('luck')+this.luckBonus+(this.luckT>0?.03:0)+(this.petLuckT>0?.05:0));S.lootRate=tm.lootRate;S.taken=1+(fm?fm.taken:0);
    if(this.riskT>0){S.xp*=2;S.taken*=1.5;}
    if(this.bers>0){S.might*=1.8;S.armor+=this.abTier>=2?8:5;S.taken*=.7;}   /* Berserk: +80% damage, +5 armor (+8 in the final form), -30% damage taken */
    if(this.critT>0){const f2=this.abTier>=2&&this.abil.m==='crit';S.crit+=f2?.6:.35;if(f2)S.critDmg=2.5;}
    if(this.abBuf){S.might*=1+(this.abBuf.m||0);S.spd*=1+(this.abBuf.s||0);S.taken*=1+(this.abBuf.tk||0);}
    if(this.kai>0){const f2=this.abTier>=2&&this.abil.m==='kaioken',km=f2?(this.kai===1?2.5:5):(this.kai===1?2:4);S.might*=km;S.spd*=1+.4*(km-1);S.cd=Math.max(.15,S.cd/km);}
    S.might*=1+this.swap.might;S.spd*=1+this.swap.spd;S.cd=Math.max(this.cdMin(.3),S.cd*(1-this.swap.cd));
    {const tf=this.totemFx;if(tf.might)S.might*=1+tf.might;if(tf.cd)S.cd=Math.max(this.cdMin(.3),S.cd*(1+tf.cd));if(tf.gold)S.gold+=tf.gold;if(tf.magnet)S.magnet*=1+tf.magnet;if(tf.regen)S.regen+=tf.regen;}
    this.abPassive(S);
    this.S=S;
    const mh=Math.round((C.hp+20*(P.vit||0)+15*sl('hp')+sh.hp)*(1+tm.hpPct+(this.totemFx.hp||0))*(1+this.swap.hp));
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
    for(const [id,w] of this.weapons){if(w.lv<WMAX)pool.push({type:'w',id,lv:w.lv});else if(w.canXl())pool.push({type:'w',id,lv:w.lv,xl:w.xl});}   /* Endless: a finished weapon keeps levelling (xl) */
    const slots=this.passCount();
    for(const id in PASS){const lv=this.pass[id]||0;if(lv<5&&(lv>0||slots<MAX_PASSIVES))pool.push({type:'p',id,lv});}
    return this.banRun&&this.banRun.size?pool.filter(o=>!this.banRun.has(this.optKey(o))):pool;
  }
  levelOptions(){
    const pool=this.upgradePool();
    if(this.weapons.size<this.maxW)for(const id in WEAPONS)if(!this.weapons.has(id)&&this.unlockedW(id)&&!this.save.banned.includes(id)&&!this.banRun.has('w:'+id))pool.push({type:'w',id,lv:0});   /* blacklisted weapons never come up */
    shuffle(pool);
    const sz=this.senzu<SENZU_MAX&&Math.random()<.09;
    /* a maxed weapon waiting for its evolution passive makes that passive show up more often */
    const need=this.neededPass().filter(id=>pool.some(o=>o.type==='p'&&o.id===id));
    if(need.length&&Math.random()<.55){const nid=pick(need),i=pool.findIndex(o=>o.type==='p'&&o.id===nid);if(i>2){const t=pool[i];pool.splice(i,1);pool.unshift(t);}}
    if(!pool.length){const c=this.coinValue();return[3,4.5,6].map(k=>({type:'z',v:Math.round(c*k),max:true}));}   /* nothing left to upgrade: pick a bag of zenny */
    const out=pool.slice(0,3);
    while(out.length<3)out.push({type:'h'});
    if(sz&&!out.some(o=>o.type==='h'))out[2]={type:'h'};   /* a Senzu bean sometimes shows up among the level-up cards */
    return out;
  }
  /* level-up advice: index of the card to mark with a star + why ('evo' passive that evolves an owned weapon, 'wevo' weapon about to evolve, 'hp' low health, 'armor' low armor) */
  recommend(opts){
    const hpLow=this.p.hp<this.p.maxHp*.5,arLow=this.S.armor<2&&this.nt>40,need=this.neededPass();
    let best=-1,bs=0,why=null;
    opts.forEach((o,i)=>{
      let sc=0,w2=null;
      if(o.type==='p'){
        const ws=[...this.weapons.values()].filter(w=>w.evo<this.maxEvo(w.id)&&evoPass(w.id,w.evo)===o.id);
        if(ws.length&&!(this.pass[o.id]>0)){sc=need.includes(o.id)?110:ws.some(w=>w.lv>=WMAX-2)?100:90;w2='evo';}
        else if(ws.length&&(this.pass[o.id]||0)<2){sc=62;w2='evo';}   /* the recipe only needs the passive at level 1 */
        if(hpLow&&(o.id==='vit'||o.id==='regen')&&sc<70){sc=o.id==='regen'?69:68;w2='hp';}
        if(arLow&&o.id==='armor'&&sc<60){sc=60;w2='armor';}
      }else if(o.type==='w'&&o.lv>0){
        const w=this.weapons.get(o.id);
        if(w&&w.evo<this.maxEvo(w.id)&&w.lv>=WMAX-2){const owned=this.pass[evoPass(w.id,w.evo)]>0;sc=owned?105:80;w2='wevo';}
      }else if(o.type==='h'&&hpLow){sc=70;w2='hp';}
      if(sc>bs){bs=sc;best=i;why=w2;}
    });
    return bs>=60?{i:best,why}:null;
  }
  applyOption(o){
    if(o.type==='w'){const w=this.addWeapon(o.id);if(o.lv>0)w.upgrade();}
    else if(o.type==='p'){const cur=this.pass[o.id]||0;if(cur<5&&(cur>0||this.passCount()<MAX_PASSIVES))this.pass[o.id]=cur+1;else this.heal(this.p.maxHp*.2);}
    else if(o.type==='h'){if(this.senzu<SENZU_MAX){this.senzu++;this.floatText(this.p.x,this.p.y-48,this.env.tr(T('Senzu in borsa ','Senzu bagged '))+this.senzu+'/'+SENZU_MAX,2);}else this.eatSenzu();}
    else if(o.type==='z')this.addZenny(o.v);
    this.recalc();
  }
  /* eat a Senzu bean from the bag (key H / on-screen button) */
  /* inside Zeno's Shop the abilities (character ability, Kaioken, Berserk, pet, Senzu) are switched off; the Room of Spirit and Time (training) lets you use them */
  abBlocked(){
    if(!this.trial||!this.trial.zeno)return false;
    if(!(this.abMsgT>this.rt))this.abMsgT=this.rt+1.2,this.floatText(this.p.x,this.p.y-50,this.env.tr(T('Abilità disattivate qui','Abilities are off here')),3);
    return true;
  }
  useSenzu(){
    if(this.abBlocked())return false;
    if(this.ended||this.modal||this.senzu<=0||this.senzuCd>0||this.p.hp>=this.p.maxHp-.5)return false;
    this.senzu--;this.senzuCd=.8;const sr=this.eatSenzu();
    const p=this.p;this.floatText(p.x,p.y-56,this.env.tr(T('Senzu! ','Senzu! '))+this.env.tr(sr[2]),2);this.pillar(p.x,p.y,'#8be07a',.9);this.ring(p.x,p.y,70,'#8be07a',.5);this.burst(p.x,p.y-20,16,'#bfffb0');
    this.audio.sfx('abHeal');this.emote('happy',1);return true;
  }
  /* a Senzu bean: restores 50% of the health and raises one random stat for the rest of the run */
  eatSenzu(){
    const pool=[['might',.03,T('Danno +3%','Damage +3%')],['spd',.02,T('Velocità +2%','Speed +2%')],['cd',.012,T('Ricarica −1,2%','Cooldown −1.2%')],['hp',8,T('Salute max +8','Max HP +8')],['regen',.12,T('Rigenerazione +0,12/s','Regen +0.12/s')],['magnet',.06,T('Raccolta +6%','Pickup +6%')]];
    const r=pick(pool);this.szStat[r[0]]+=r[1];this.szN++;this.recalc();this.heal(this.p.maxHp*.5);return r;
  }
  upgradeWeapon(w){w.upgrade();this.recalc();}
  heal(v){if(this.trial&&this.trial.zeno)return;this.p.hp=Math.min(this.p.maxHp,this.p.hp+v);}
  /* Endless: the coin income shrinks by 10% every 15 s (the +100 of a milestone is exempt, it goes straight to run.coins) */
  coinK(){return this.endless?Math.pow(ENDLESS_COIN_K,Math.floor(Math.max(0,this.t-this.en0.t)/ENDLESS_COIN_T)):1;}
  addZenny(v){this.run.coins+=this.endless?Math.round(v*this.coinK()):v;}
  /* money spent (Zeno's Shop, the trial shop): remembers the lowest balance since the last payout, so coins that were already paid are never paid twice */
  spendCoins(n){this.run.coins-=n;this.run.minC=Math.min(this.run.minC,this.run.coins);}
  cdMin(v){return this.endless?Math.min(v,ENDLESS_CD_MIN):v;}   /* Endless: cooldown multiplier floor 0.2 */

  /* ---------- trinkets ---------- */
  /* one trinket can be carried; the shop's "Trinket slot" upgrade adds up to two more. When every slot is taken a new one opens a comparison window (replace one / keep them) */
  get tcap(){return Math.min(3,1+(this.save.shop.tslot||0));}
  trP(id){const p=this.tPf[id];return p!=null?p:PF_NOM;}   /* perfection (0-100) of a carried trinket */
  get perfAura(){return this.trinkets.some(id=>hasPf(TRINKETS.find(x=>x.id===id))&&this.trP(id)>=100);}   /* a carried trinket at 100% perfection: Ultra Instinct aura */
  trR(id){const r=this.tRar[id];if(r!=null)return r;const t=TRINKETS.find(x=>x.id===id);return t?t.r:0;}
  rarOf(id){const t=TRINKETS.find(x=>x.id===id),rr=this.rrar&&this.rrar[id];if(this.rrar)delete this.rrar[id];return Math.random()<.01&&t&&t.m&&(!t.sp||t.x)?4:(rr!=null?rr:(t?t.r:0));}   /* rr: the rarity this trinket was rolled at (stat trinkets exist at every rarity) */    /* 1%: it turns out mythic (only trinkets with stats can: an effect alone has nothing to scale) */
  /* a trinket found during the run is not kept: it is sold for zenny when something replaces it and at the end of the run (the one from the bag is never sold) */
  sellTrinket(id,rar,why){
    const t=TRINKETS.find(x=>x.id===id);if(!t)return 0;
    const v=trinketSale(rar,this.sd);this.addZenny(v);this.run.tsold=(this.run.tsold||0)+1;
    if(why!=='end'){this.floatText(this.p.x,this.p.y-70,this.env.tr(why==='auto'?T('Rifiutato: ','Refused: '):T('Venduto: ','Sold: '))+this.env.tr(t.n)+'  +Z '+v,1);this.audio.sfx('coin');}
    return v;
  }
  sellHeld(){
    let v=0;
    for(const id of this.trinkets)if(this.tSrc[id]==='run'){this.tSrc[id]='sold';v+=this.sellTrinket(id,this.trR(id),'end');}
    return v;
  }
  /* takes a trinket out of its slot (a found one is sold; the one from the bag just goes back to the bag) */
  dropTrinket(id){
    const i=this.trinkets.indexOf(id);if(i<0)return -1;
    const t=TRINKETS.find(x=>x.id===id);
    if(this.tSrc[id]==='run')this.sellTrinket(id,this.trR(id));
    this.trinkets.splice(i,1);delete this.tRar[id];delete this.tPf[id];delete this.tSrc[id];
    if(t&&t.sp==='barrier'&&!this.has('barrier')&&!this.totemFx.guard)this.barrierReady=false;
    return i;
  }
  /* the slot of the weakest carried trinket (the one a full inventory gives up) */
  weakestTrinket(){let b=null,br=1e9;for(const id of this.trinkets){const r=this.trinScore(id,this.trR(id),this.trP(id));if(r<br){br=r;b=id;}}return b;}
  equipTrinket(id,rar,replaceId,pf){
    const t=TRINKETS.find(x=>x.id===id);if(!t)return false;
    let at=-1;
    if(replaceId&&this.trinkets.includes(replaceId))at=this.dropTrinket(replaceId);
    else if(this.trinkets.includes(id))at=this.dropTrinket(id);
    if(this.trinkets.length>=this.tcap)at=this.dropTrinket(this.weakestTrinket());
    if(at<0||at>this.trinkets.length)at=this.trinkets.length;
    this.trinkets.splice(at,0,id);this.tRar[id]=rar;this.tPf[id]=pf!=null?pf:rollPf(this.S.luck);this.tSrc[id]='run';
    this.save.trin[id]=1;this.run.tpicks=(this.run.tpicks||0)+1;if(rar>=3)this.run.legendary++;if(rar>=4)this.run.mythic=(this.run.mythic||0)+1;
    if(t.sp==='barrier'){this.barrierReady=true;}
    this.audio.sfx('trinket');this.recalc();return true;
  }
  /* setting "skip lower trinkets": with every slot taken, a trinket worse than everything you carry (lower rarity, or the same rarity with less perfection) is sold at once;
     the comparison window only opens for one that beats at least one of your trinkets */
  trinScore(id,rar,pf){const t=TRINKETS.find(x=>x.id===id);return rar*1000+(hasPf(t)?(pf!=null?pf:PF_NOM):PF_NOM);}
  autoRefuse(id,rar,pf,buy){
    if(buy||!this.save.settings.trinRefuse||this.trinkets.length<this.tcap)return false;
    return this.trinScore(id,rar,pf)<Math.min(...this.trinkets.map(x=>this.trinScore(x,this.trR(x),this.trP(x))));
  }
  addTrinket(id,rar,cb){
    if(!TRINKETS.find(x=>x.id===id))return false;
    if(rar==null)rar=this.rarOf(id);
    const pf=cb&&cb.pf!=null?cb.pf:rollPf(this.S.luck);
    const buy=!!(cb&&cb.buy),yes=()=>{if(cb&&cb.onYes)cb.onYes();},no=()=>{if(cb&&cb.onNo)cb.onNo();};
    if(this.trinkets.includes(id)){   /* already carried: a better copy (higher rarity, or the same rarity with more perfection) upgrades it in place, otherwise the new one is sold */
      if(rar>this.trR(id)||(rar===this.trR(id)&&hasPf(TRINKETS.find(x=>x.id===id))&&pf>this.trP(id))){const ok=this.equipTrinket(id,rar,id,pf);if(ok)yes();return ok;}
      if(!buy)this.sellTrinket(id,rar);
      no();return false;
    }
    if(this.trinkets.length<this.tcap){const ok=this.equipTrinket(id,rar,null,pf);if(ok)yes();return ok;}
    if(this.autoRefuse(id,rar,pf,buy)){this.sellTrinket(id,rar,'auto');this.run.trefused=(this.run.trefused||0)+1;no();return false;}
    this.tq.push({id,rar,pf,onYes:cb&&cb.onYes,onNo:cb&&cb.onNo,buy});this.drainTQ();return false;
  }
  drainTQ(){
    if(this.modal||!this.tq.length||this.ended)return;
    const n=this.tq.shift();
    if(this.trinkets.includes(n.id)||this.trinkets.length<this.tcap||this.autoRefuse(n.id,n.rar,n.pf,n.buy)){   /* the situation changed while it was waiting: decide again */
      this.addTrinket(n.id,n.rar,{pf:n.pf,onYes:n.onYes,onNo:n.onNo,buy:n.buy});return this.drainTQ();
    }
    this.modal={type:'tswap',curs:this.trinkets.map(id=>({id,rar:this.trR(id),pf:this.trP(id),src:this.tSrc[id]})),nw:{id:n.id,rar:n.rar,pf:n.pf},onYes:n.onYes,onNo:n.onNo,buy:n.buy};
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
      const c=pickTrinket(ri,t=>!this.trinkets.includes(t.id)&&!excl.includes(t.id));
      if(c){(this.rrar||(this.rrar={}))[c.id]=ri;return c.id;}
    }
    const any=TRINKETS.filter(t=>!this.trinkets.includes(t.id)&&!excl.includes(t.id));return any.length?pick(any).id:null;
  }
  /* boss chest trinket choice: always TRIN_PICK (4) options; Luck improves their rarity instead (rarityWeights) */
  pickCount(){return TRIN_PICK;}
  rollTrinketList(n){const out=[];for(let i=0;i<n;i++){const id=this.rollTrinket(out);if(!id)break;out.push(id);}return out;}
  /* one reward per chest (evolution has priority, otherwise one normal upgrade); Luck can add a trinket */
  chestRewards(isFinal,boss,elite){
    const R=[],elig=[...this.weapons.values()].filter(w=>this.evoReady(w));
    if(elig.length)R.push({k:'evo',id:pick(elig).id});
    else{const pool=shuffle(this.upgradePool());if(pool.length)R.push({k:'up',o:pool.pop()});else R.push({k:'zenny',v:Math.round(40*ZMUL*(1+this.sd))});}
    if(boss){
      {const o=this.rollTrinketList(this.pickCount());if(o.length)R.push({k:'pick',opts:o,rars:o.map(id=>this.rarOf(id)),pfs:o.map(()=>rollPf(this.S.luck))});else R.push({k:'zenny',v:Math.round(60*ZMUL*(1+this.sd))});}
    }else{
      const bonus=Math.min(.4,this.S.luck*.9);
      if(elite||Math.random()<bonus){const id=this.rollTrinket();if(id)R.push({k:'trinket',id,rar:this.rarOf(id),pf:rollPf(this.S.luck)});else if(elite)R.push({k:'zenny',v:Math.round(40*ZMUL*(1+this.sd))});}
    }
    return R;
  }

  /* ---------- modal flow ---------- */
  /* shop helpers on the level-up window: redraw the 3 cards, skip the choice, ban a weapon / upgrade for the rest of the run */
  levelRedraw(m){m.options=this.levelOptions();m.rec=undefined;m.recWhy=undefined;const rc=this.recommend(m.options);if(rc){m.rec=rc.i;m.recWhy=rc.why;}}
  rerollLevel(){const m=this.modal;if(!m||m.type!=='level'||!(this.ru.rr>0))return false;this.ru.rr--;m.banMode=false;this.levelRedraw(m);return true;}
  skipLevel(){const m=this.modal;if(!m||m.type!=='level'||!(this.ru.sk>0))return false;this.ru.sk--;return true;}   /* the caller then closes the window with resolveModal(-1): nothing is taken */
  banLevel(i){const m=this.modal;if(!m||m.type!=='level'||!(this.ru.bn>0))return false;const k=this.optKey(m.options[i]||{});if(!k)return false;
    this.ru.bn--;this.banRun.add(k);m.banMode=false;this.levelRedraw(m);return true;}
  resolveModal(i){
    const m=this.modal;if(!m)return;
    if(m.type==='level'){if(i>=0)this.applyOption(m.options[i]||m.options[0]);}
    else if(m.type==='chest'){
      for(const r of m.rewards){
        if(r.k==='evo')this.evolveWeapon(r.id);
        else if(r.k==='up')this.applyOption(r.o);
        else if(r.k==='trinket')this.addTrinket(r.id,r.rar,{pf:r.pf});
        else if(r.k==='zenny')this.addZenny(r.v);
      }
      const pk=m.rewards.find(r=>r.k==='pick');
      if(pk){this.modal={type:'pick',opts:pk.opts,rars:pk.rars,pfs:pk.pfs};return;}
    }else if(m.type==='totem'){
      this.applyTotem((m.opts||['luck','risk'])[i]||'luck');
    }else if(m.type==='pick'){
      const id=m.opts[i];if(id)this.addTrinket(id,(m.rars||[])[i],{pf:(m.pfs||[])[i]});
    }else if(m.type==='tswap'){
      const rep=m.curs[i];   /* one of the carried trinkets is replaced; the last button keeps them all */
      if(rep){this.equipTrinket(m.nw.id,m.nw.rar,rep.id,m.nw.pf);if(m.onYes)m.onYes();}
      else{if(!m.buy)this.sellTrinket(m.nw.id,m.nw.rar);if(m.onNo)m.onNo();}   /* kept the old ones: a found trinket is sold, an offer in Zeno-sama's shop is simply not bought */
    }else if(m.type==='trial'){this.endTrial();
    }else if(m.type==='wish'){
      const w=m.options[i]||m.options[0];
      this.run.wishes++;this.wishLog.push(w);
      if(w==='revive'){this.revives++;this.say(this.env.tr(T('Desiderio: una seconda vita!','Wish: a second life!')),'#8be07a',3);}
      else if(w==='power'){for(const x of this.weapons.values())if(x.lv<WMAX){x.upgrade();if(x.lv<WMAX)x.upgrade();}this.say(this.env.tr(T('Desiderio: potere!','Wish: power!')),'#ffd23f',3);}
      else if(w==='tickets'){this.addTicket('t10',1);this.say(this.env.tr(T('Desiderio: 10 ticket!','Wish: 10 tickets!')),'#ffd23f',3);}
      else{this.addZenny(Math.round(300*ZMUL));const id=this.rollTrinket();if(id)this.addTrinket(id);this.say(this.env.tr(T('Desiderio: fortuna!','Wish: fortune!')),'#ffb13b',3);}
      this.heal(this.p.maxHp);this.balls=0;this.ballSet=[];this.recalc();
    }
    this.modal=null;this.drainTQ();
  }

  /* ---------- universal dash (Shift): every character, damages what it crosses, brief invulnerability ---------- */
  get dashCdMax(){return Math.max(1.2,4*(this.has('windboots')?.65:1)*(this.abTier>=1&&this.abil.m==='dash'?.8:1));}
  startDash(dx,dy,dmg,inv,col){
    const p=this.p;
    if(this.held){const e=this.held.e;this.held=null;if(e.bm)this.endBossMove(e);e.stun=Math.max(e.stun||0,.5);this.floatText(p.x,p.y-60,this.env.tr(T('Liberato!','Freed!')),3);}   /* a dash breaks Dr. Gero's hold */
    this.bv={x:dx*1050,y:dy*1050,t:.2};this.dashT=.26;this.dashHit=new Set();p.inv=Math.max(p.inv,inv);this.dashV=dmg;this.dashC=col;
    this.ring(p.x,p.y,70,col,.4);this.burst(p.x,p.y-12,14,col);
  }
  dash(){
    if(this.modal||this.ended||this.xform||this.dashCd>0||this.dashT>0||this.bers>0)return false;
    const p=this.p;let dx=this.input.x,dy=this.input.y;const dl=Math.hypot(dx,dy);if(dl<.1){dx=p.face>0?1:-1;dy=0;}else{dx/=dl;dy/=dl;}
    const dmg=.9*(this.has('windboots')?1.3:1);  /* hit() applies the might multiplier */
    this.startDash(dx,dy,dmg,.65,this.formColor||'#9ad8ff');this.dashCd=this.dashCdMax;
    this.audio.sfx('abDash');return true;
  }
  /* ---------- character abilities ---------- */
  get abReady(){const a=this.abil;if(a.m==='kaioken')return this.kaiAvail;if(a.m==='berserk')return this.bersCd<=0&&this.bers<=0;return this.abCd<=0;}
  useAbility(){
    if(this.abBlocked())return false;
    if(this.modal||this.ended||this.xform)return false;
    const a=this.abil;
    if(a.m==='berserk')return this.startBerserk();
    if(a.m==='kaioken')return this.kaiToggle();
    if(this.abCd>0)return false;
    const p=this.p,v=a.v,c=a.c,L=this.lvl,tr=o=>this.env.tr(o),tier=this.abTier,f2=tier>=2;   /* f2: final transformation -> empowered ability */
    const near=this.nearest(p.x,p.y,700);
    switch(a.m){
      case'beam':{
        const ang=near?Math.atan2(near.y-8-(p.y-18),near.x-p.x):(p.face>0?0:Math.PI);
        const fire=(a2,dm,len,w)=>{const cs=Math.cos(a2),sn=Math.sin(a2);
          for(const e of this.en){if(e.dead)continue;const rx=e.x-p.x,ry=e.y-8-(p.y-18),t=rx*cs+ry*sn;if(t<-10||t>len)continue;if(Math.abs(-rx*sn+ry*cs)<w/2+e.r)this.hit(e,dm,cs*220,sn*220);}
          this.fx.push({beam:true,x:p.x,y:p.y-18,a:a2,len,w,l:.75,m:.75,c});};
        const dmg=(30+L*3)*v;
        if(f2){fire(ang,dmg*1.7,1020,168);fire(ang+Math.PI,dmg*1.0,720,120);}   /* final form: a huge beam, and another one behind you */
        else fire(ang,dmg,640,64);
        this.shake=Math.max(this.shake,f2?.9:.5);this.flash=.25;this.flashC=c;this.audio.sfx('abBeam');break;}
      case'nova':{
        const R=230*v*(f2?1.85:1),nd=(28+L*2.4)*v*(f2?1.7:1);   /* final form: the small wave becomes huge */
        this.ring(p.x,p.y,R,c,.7);this.ring(p.x,p.y,R*.6,'#ffffff',.5);if(f2){this.ring(p.x,p.y,R*.8,c,.9);this.ring(p.x,p.y,R*.35,'#ffffff',.6);}this.burst(p.x,p.y-14,f2?60:34,c);this.bolt(p.x,p.y-14,R*.9,c,f2?18:10);this.shake=Math.max(this.shake,f2?.9:.45);this.flash=.2;this.flashC=c;
        for(const e of this.en){if(e.dead)continue;const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy)||1;if(d<R+e.r){this.hit(e,nd,0,0);e.stun=Math.max(e.stun,f2?1.2:.4);if(!e.boss){e.kx+=dx/d*(f2?500:380);e.ky+=dy/d*(f2?500:380);}}}
        this.audio.sfx('abNova');break;}
      case'regen':this.regenT=6;this.regenRate=p.maxHp*.14*v*(f2?1.7:1)/6;if(f2)p.inv=Math.max(p.inv,2);this.pillar(p.x,p.y,c,f2?1.4:.9);this.ring(p.x,p.y,f2?160:90,c,.6);this.audio.sfx('abHeal');break;
      case'blind':{
        const R=f2?this.viewR*1.2:380;   /* final form: the flash covers the whole screen */
        this.flash=.6;this.flashC='#ffffff';this.ring(p.x,p.y,R,c,.6);this.ring(p.x,p.y,R*.52,'#ffffff',.4);
        for(const e of this.en){if(e.dead)continue;if(Math.hypot(e.x-p.x,e.y-p.y)<R+e.r)e.stun=Math.max(e.stun,e.boss?(f2?1.2:.7):(f2?3:1.7));}
        this.audio.sfx('flare');break;}
      case'dash':{
        let dx=this.input.x,dy=this.input.y;const dl=Math.hypot(dx,dy);if(dl<.1){dx=p.face>0?1:-1;dy=0;}else{dx/=dl;dy/=dl;}
        this.startDash(dx,dy,v*(f2?2:1),f2?.8:.5,c);
        if(f2){this.bv.t=.32;this.dashT=.4;this.dashWave=true;}   /* final form: longer dash, double damage, shockwave on arrival */
        this.audio.sfx('abDash');break;}
      case'clones':{
        const n=f2?6:3;
        this.clones=Array.from({length:n},(_,i)=>({a:i*TAU/n,sh:.3*(i%3)}));this.cloneT=f2?14:10;this.ring(p.x,p.y,f2?170:110,c,.5);this.burst(p.x,p.y-12,f2?36:20,c);this.audio.sfx('abClone');break;}
      case'sbc':{   /* Special Beam Cannon (Piccolo): ~1 s of charge with two fingers on the forehead, then a thin spiral beam that pierces the whole line */
        const ang=near?Math.atan2(near.y-8-(p.y-24),near.x-p.x):(p.face>0?0:Math.PI);
        this.sbc={t:0,dur:f2?.95:1.15,ang,left:f2?2:1,shots:0,nx:f2?.95:1.15,f2,v};
        this.armAct('face',ang,{w:.05,h:this.sbc.dur+.25,r:.25,col:c});this.ring(p.x,p.y-30,70,c,.6);this.audio.sfx('abPower');break;}
      case'sphere':{   /* Sphere of Justice (Toppo): a dark sphere thrown at the nearest enemy; it grows, pulls everything in and explodes */
        const tx=near?near.x:p.x+(p.face>0?1:-1)*260,ty=near?near.y-8:p.y-14;
        this.spheres.push({x:p.x+(p.face>0?10:-10),y:p.y-26,tx,ty,ph:0,t:0,tk:0,rr:12,f2,R:170*v*(f2?1.6:1)*Math.min(2,this.S.area||1),dmg:(46+L*3.4)*v*(f2?1.7:1),hold:f2?1.8:1.5});
        this.armAct('shoot',Math.atan2(ty-(p.y-18),tx-p.x),{h:.3,r:.22,col:c});this.ring(p.x,p.y-24,60,c,.5);this.audio.sfx('spirit');break;}
      case'ghosts':{   /* Super Ghost Kamikaze (Gotenks): ghosts that fly at the nearest enemy and copy the active weapons (updateGhosts) */
        const n=f2?5:3;
        this.ghosts=Array.from({length:n},(_,i)=>({x:p.x+Math.cos(i*TAU/n)*40,y:p.y-30+Math.sin(i*TAU/n)*20,a:i*TAU/n,t:.7+i*.45,atk:0,fl:1,ph:rnd(0,TAU),boom:0,dead:false}));
        this.ghostT=f2?40:26;this.ring(p.x,p.y,f2?170:110,c,.5);this.burst(p.x,p.y-12,f2?36:20,c);this.audio.sfx('abClone');break;}
      case'crit':this.critT=f2?12:8;this.recalc();this.pillar(p.x,p.y,c,.8);this.ring(p.x,p.y,100,c,.6);this.audio.sfx('abPower');break;
      case'barrier':{
        const bt=f2?3.5:1.5;p.inv=Math.max(p.inv,bt);this.shieldT=bt;this.ring(p.x,p.y,70,c,.5);
        if(f2){   /* final form: the barrier explodes into a stunning wave and heals */
          this.ring(p.x,p.y,260,c,.8);this.ring(p.x,p.y,150,'#ffffff',.5);this.heal(p.maxHp*.08);
          for(const e of this.en){if(e.dead)continue;const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy)||1;if(d<260+e.r){e.stun=Math.max(e.stun,e.boss?.6:1.5);if(!e.boss){e.kx+=dx/d*320;e.ky+=dy/d*320;}}}
        }
        this.audio.sfx('abBarrier');break;}
      case'absorb':{
        let n=0;const R=260*(f2?1.8:1),cap=f2?20:8,k=f2?2:1;
        for(const e of this.en){if(e.dead||n>=cap)continue;if(Math.hypot(e.x-p.x,e.y-p.y)<R+e.r){n++;this.hit(e,(10+L)*v*k,0,0);this.heal(p.maxHp*.015*k);this.fx.push({bolt:true,pts:[[e.x,e.y-8],[(e.x+p.x)/2+rnd(-12,12),(e.y+p.y)/2-10+rnd(-8,8)],[p.x,p.y-14]],l:.4,m:.4,c});}}
        this.ring(p.x,p.y,R,c,.6);this.audio.sfx('abAbsorb');break;}
      case'timestop':{
        const ts=f2?3.6:1.8,rr=f2?this.viewR*1.4:this.viewR*1.1;
        this.tsT=ts;this.flash=.35;this.flashC='#c8d8ff';this.ring(p.x,p.y,this.viewR,'#ffffff',.9);this.ring(p.x,p.y,this.viewR*.6,c,.7);
        for(const e of this.en){if(e.dead)continue;if(Math.hypot(e.x-p.x,e.y-p.y)<rr)e.stun=Math.max(e.stun,e.boss?(f2?1.2:.5):ts);}
        this.eb=[];this.audio.sfx('abTime');break;}
      case'erase':{
        const R=f2?560:300,fr=f2?.35:.22,fb=f2?.03:.012;this.ring(p.x,p.y,R,c,.8);this.ring(p.x,p.y,R*.55,'#ffffff',.5);this.flash=.35;this.flashC=c;this.shake=Math.max(this.shake,.4);
        for(const e of this.en){if(e.dead)continue;if(Math.hypot(e.x-p.x,e.y-p.y)<R+e.r){this.damageEnemy(e,e.max*(e.boss?fb:fr)*v,0,0,false);this.burst(e.x,e.y-8,6,c);}}
        this.audio.sfx('abErase');break;}
      case'rewind':{
        const old=this.hpHist.length?this.hpHist[0].hp:p.hp,gain=Math.min(p.maxHp*(f2?.6:.4),Math.max(p.maxHp*.05,old-p.hp));
        this.heal(gain);this.flash=.3;this.flashC='#cfe8ff';this.ring(p.x,p.y,200,c,.7);this.ring(p.x,p.y,120,'#ffffff',.5);
        if(f2){this.eb=[];for(const e of this.en){if(e.dead)continue;if(Math.hypot(e.x-p.x,e.y-p.y)<this.viewR)e.stun=Math.max(e.stun,e.boss?.6:1.5);}this.ring(p.x,p.y,this.viewR,c,.8);}   /* final form: wipes enemy bullets and stuns */
        this.audio.sfx('abTime');break;}
      case'jackpot':
        for(let i=0,n=Math.round(12*(+v||1)*(f2?3:1));i<n;i++)this.loot.push({k:'coin',x:p.x+rnd(-60,60),y:p.y+rnd(-40,40),v:Math.round(4*(1+this.t/500)),t:0});
        this.heal(p.maxHp*(f2?.15:.06));this.luckT=Math.max(this.luckT,f2?60:30);this.recalc();this.pillar(p.x,p.y,c,.8);this.burst(p.x,p.y-12,24,c);this.audio.sfx('coin');break;
      case'buff':{
        const vv=f2?{m:(v.m||0)*1.4,s:(v.s||0)*1.4}:v;   /* final form: stronger and without the drawback */
        this.abBuf=Object.assign({t:f2?14:8},vv);this.recalc();this.pillar(p.x,p.y,c,1);this.ring(p.x,p.y,130,c,.6);this.burst(p.x,p.y-14,28,c);this.audio.sfx('abPower');break;}
    }
    if(f2){this.pillar(p.x,p.y,c,1.2);this.flash=Math.max(this.flash,.3);this.flashC=c;this.shake=Math.max(this.shake,.5);}
    this.abCd=this.abCdMax;this.emote('smug',1.2);this.say(tr(a.n)+(f2?' ★':tier>=1?' +':'')+'!',c,1.8);
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
    if(this.dashCd>0)this.dashCd=Math.max(0,this.dashCd-dt);
    /* middle-form passive of the "nova" characters: an automatic little shockwave every 14 s */
    if(a.m==='nova'&&this.abTier>=1&&!this.trial&&!this.xform){
      this.novaT=(this.novaT===undefined?14:this.novaT)-dt;
      if(this.novaT<=0){this.novaT=14;const R=150;this.ring(p.x,p.y,R,c,.5);this.burst(p.x,p.y-12,14,c);
        for(const e of this.en){if(e.dead)continue;const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy)||1;if(d<R+e.r){this.hit(e,12+this.lvl*1.2,0,0);if(!e.boss){e.kx+=dx/d*300;e.ky+=dy/d*300;}}}}
    }
    if(this.dashT>0){
      this.dashT-=dt;const dc=this.dashC||c;
      if(this.dashT<=0&&this.dashWave){this.dashWave=false;this.ring(p.x,p.y,150,dc,.6);this.ring(p.x,p.y,80,'#ffffff',.5);this.burst(p.x,p.y-12,24,dc);this.shake=Math.max(this.shake,.5);
        for(const e of this.en){if(e.dead)continue;const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy)||1;if(d<150+e.r){this.hit(e,40+this.lvl*3,0,0);e.stun=Math.max(e.stun,.5);if(!e.boss){e.kx+=dx/d*320;e.ky+=dy/d*320;}}}}
      for(const e of this.en){if(e.dead||this.dashHit.has(e))continue;if(Math.hypot(e.x-p.x,e.y-8-p.y)<e.r+34){this.dashHit.add(e);this.hit(e,(20+this.lvl*2)*(this.dashV||1),0,0);e.stun=Math.max(e.stun,.3);this.burst(e.x,e.y-8,5,dc);}}
      if(this.fx.length<440)this.fx.push({x:p.x,y:p.y-10,vx:0,vy:0,l:.35,m:.35,c:dc,s:7});
    }
    if(this.clones){
      this.cloneT-=dt;if(this.cloneT<=0){this.clones=null;return;}
      for(const k of this.clones){
        k.a+=dt*2;k.x=p.x+Math.cos(k.a)*46;k.y=p.y+Math.sin(k.a)*22;k.sh-=dt;
        if(k.sh<=0){const t=this.nearest(k.x,k.y,520);if(t){k.sh=this.abTier>=2?.4:.8;const an=Math.atan2(t.y-8-(k.y-18),t.x-k.x);this.pr.push({x:k.x,y:k.y-18,vx:Math.cos(an)*400,vy:Math.sin(an)*400,r:6,dmg:6+this.lvl*.6,pi:0,life:1.4,hit:[],c});}else k.sh=.2;}
      }
    }
    if(this.sbc)this.updateSbc(dt);
    if(this.spheres.length)this.updateSpheres(dt);
    if(this.ghosts)this.updateGhosts(dt);
  }
  /* ---------- Special Beam Cannon (Piccolo): charge, then one (two in the final form) piercing spiral beam ---------- */
  updateSbc(dt){
    const p=this.p,c=this.abil.c,s=this.sbc,aim=()=>{const tg=this.nearest(p.x,p.y,780);if(tg)s.ang=Math.atan2(tg.y-8-(p.y-24),tg.x-p.x);};
    s.t+=dt;
    if(s.t<s.dur){
      if(s.t<s.dur-.2&&s.shots===0)aim();   /* the aim follows the nearest enemy and locks 0.2 s before the shot */
      if(this.fx.length<400&&Math.random()<dt*70){const a=rnd(0,TAU),R=rnd(26,52),hx=p.x+(p.face>0?5:-5),hy=p.y-34,l=rnd(.25,.4);this.fx.push({x:hx+Math.cos(a)*R,y:hy+Math.sin(a)*R*.8,vx:-Math.cos(a)*R/l,vy:-Math.sin(a)*R*.8/l,l,m:l,c:Math.random()<.5?c:'#b46bff',s:rnd(2,3.4)});}
    }else if(s.left>0&&s.t>=s.nx){
      if(s.shots>0)aim();
      this.fireSbc(s.ang);s.left--;s.shots++;s.nx=s.t+.34;
      this.armAct('shoot',s.ang,{h:.3,r:.25,col:c});
    }else if(s.left<=0&&s.t>=s.nx)this.sbc=null;
  }
  fireSbc(ang){
    const p=this.p,c=this.abil.c,s=this.sbc,f2=s.f2,cs=Math.cos(ang),sn=Math.sin(ang),len=f2?1180:880,w=f2?46:32,dm=(60+this.lvl*5)*s.v*(f2?1.4:1),ox=p.x+cs*8,oy=p.y-24;
    for(const e of this.en){
      if(e.dead)continue;
      const rx=e.x-ox,ry=e.y-8-oy,t=rx*cs+ry*sn;if(t<-10||t>len)continue;
      if(Math.abs(-rx*sn+ry*cs)<w/2+e.r){this.hit(e,dm,cs*240,sn*240);e.stun=Math.max(e.stun,e.boss?.15:.5);this.burst(e.x,e.y-8,8,c);}
    }
    this.eb=this.eb.filter(b=>{const rx=b.x-ox,ry=b.y-oy,t=rx*cs+ry*sn;return !(t>-10&&t<len&&Math.abs(-rx*sn+ry*cs)<w/2+b.r);});   /* the beam also erases the bullets it crosses */
    this.fx.push({beam:true,sbc:true,x:ox,y:oy,a:ang,len,w:f2?26:18,l:.75,m:.75,c});   /* (thinner to look at than it is to hit) */
    this.ring(ox,oy,50,c,.3);this.burst(ox,oy,14,'#ffffff');this.shake=Math.max(this.shake,.5);this.flash=.2;this.flashC=c;this.audio.sfx('abBeam');
  }
  /* ---------- Sphere of Justice (Toppo): thrown, grows while it pulls the enemies in, then explodes ---------- */
  updateSpheres(dt){
    const c=this.abil.c;
    for(const s of this.spheres){
      s.t+=dt;
      if(s.ph===0){
        const dx=s.tx-s.x,dy=s.ty-s.y,d=Math.hypot(dx,dy),st=500*dt;
        if(d<=st+4){s.x=s.tx;s.y=s.ty;s.ph=1;s.t=0;this.ring(s.x,s.y,60,c,.45);this.audio.sfx('flare');}
        else{s.x+=dx/d*st;s.y+=dy/d*st;}
        if(this.fx.length<400&&Math.random()<dt*60)this.fx.push({x:s.x+rnd(-6,6),y:s.y+rnd(-6,6),vx:rnd(-20,20),vy:rnd(-20,20),l:.35,m:.35,c:Math.random()<.5?c:'#ff4fd8',s:rnd(2,4)});
      }else{
        const k=Math.min(1,s.t/s.hold);s.rr=12+(s.R*.38-12)*k;
        const pull=(s.f2?230:160)*dt;
        for(const e of this.en){
          if(e.dead)continue;
          const dx=s.x-e.x,dy=s.y-(e.y-8),d=Math.hypot(dx,dy);
          if(d<s.R*1.3+e.r&&!e.boss&&d>16){e.x+=dx/d*pull;e.y+=dy/d*pull;}
        }
        s.tk-=dt;
        if(s.tk<=0){s.tk=.3;for(const e of this.en){if(e.dead)continue;if(Math.hypot(e.x-s.x,e.y-8-s.y)<s.rr+e.r)this.hit(e,s.dmg*.07,0,0);}}
        if(this.eb.length)this.cutC(s.x,s.y,s.rr);
        if(this.fx.length<400&&Math.random()<dt*50){const a=rnd(0,TAU),R=s.R*rnd(.7,1.2);this.fx.push({x:s.x+Math.cos(a)*R,y:s.y+Math.sin(a)*R*.85,vx:-Math.cos(a)*R*2.4,vy:-Math.sin(a)*R*2.0,l:.42,m:.42,c:Math.random()<.5?c:'#ff4fd8',s:rnd(2,3.6)});}
        if(s.t>=s.hold)this.boomSphere(s);
      }
    }
    this.spheres=this.spheres.filter(s=>!s.done);
  }
  boomSphere(s){
    s.done=true;const c=this.abil.c,R=s.R;
    this.ring(s.x,s.y,R,c,.8);this.ring(s.x,s.y,R*.62,'#ffffff',.55);this.ring(s.x,s.y,R*1.25,'#ff4fd8',.9);this.burst(s.x,s.y,44,c);this.burst(s.x,s.y,22,'#ffffff');this.bolt(s.x,s.y,R*.95,c,s.f2?18:12);
    this.shake=Math.max(this.shake,s.f2?1:.7);this.flash=.3;this.flashC=c;this.audio.sfx('abNova');this.cutC(s.x,s.y,R);
    for(const e of this.en){
      if(e.dead)continue;
      const dx=e.x-s.x,dy=e.y-8-s.y,d=Math.hypot(dx,dy)||1,rr=R+e.r;
      if(d<rr){this.hit(e,s.dmg*(1-.35*d/rr),dx/d*240,dy/d*240);e.stun=Math.max(e.stun,e.boss?.3:.9);if(!e.boss){e.kx+=dx/d*260;e.ky+=dy/d*260;}}
    }
  }
  /* ---------- Super Ghost Kamikaze (Gotenks): ghosts that fly at the nearest enemy, copy the active weapons, attack every 10 s (down to 4 s with the level) and explode at the end ---------- */
  get ghostIv(){return Math.max(4,10-.2*(this.lvl-1));}
  updateGhosts(dt){
    const p=this.p,c=this.abil.c,f2=this.abTier>=2,iv=this.ghostIv,dying=this.ghostT<=0;
    this.ghostT-=dt;
    for(const k of this.ghosts){
      if(k.dead)continue;
      k.ph+=dt*3;k.atk=Math.max(0,k.atk-dt);
      const tg=this.nearest(k.x,k.y,780);
      let gx,gy,sp=300;
      if(tg){const a=k.a+k.ph*.3;gx=tg.x+Math.cos(a)*(tg.r*.6+34);gy=tg.y-24+Math.sin(a)*(tg.r*.4+18);if(dying)sp=520;k.fl=tg.x>=k.x?1:-1;}
      else{gx=p.x+Math.cos(k.a+this.t)*70;gy=p.y-30+Math.sin(k.a+this.t)*30;sp=240;}
      const dx=gx-k.x,dy=gy-k.y,d=Math.hypot(dx,dy)||1,v=Math.min(sp,d*4.5);
      k.x+=dx/d*v*dt;k.y+=dy/d*v*dt;
      if(dying){   /* kamikaze: it throws itself at the closest enemy and explodes */
        k.boom+=dt;
        if((tg&&Math.hypot(tg.x-k.x,tg.y-8-k.y)<tg.r+26)||k.boom>1.6||(!tg&&k.boom>.4)){k.dead=true;const R=(80+this.lvl*.6)*(f2?1.35:1);this.explodeAt(k.x,k.y,R,(34+this.lvl*3)*(f2?1.5:1),c);this.burst(k.x,k.y,16,'#ffffff');this.audio.sfx('boom');}
        continue;
      }
      k.t-=dt;
      if(k.t<=0){
        if(tg&&Math.hypot(tg.x-k.x,tg.y-k.y)<190){k.t=iv;this.ghostStrike(k,tg,f2);}
        else k.t=.3;
      }
    }
    this.ghosts=this.ghosts.filter(k=>!k.dead);
    if(!this.ghosts.length)this.ghosts=null;
  }
  /* what a ghost does with each weapon you own: the same attack, in that weapon's colour and with its damage (shots / piercing beam / lightning / blast on the target) */
  ghostStrike(k,tg,f2){
    const K=GHOST_K*(f2?1.5:1);
    k.atk=.4;this.ring(k.x,k.y-8,34,'#ffffff',.25);this.audio.sfx('shot');
    const ang=Math.atan2(tg.y-8-k.y,tg.x-k.x),cs=Math.cos(ang),sn=Math.sin(ang);
    for(const w of this.weapons.values()){
      const st=w.st||{},L=w.L,base=((st.dmg&&st.dmg[L])||10)*w.dm*K,col=w.color,kind=GHOST_KIND[w.id]||'blast';
      if(kind==='shot'){
        const n=Math.min(4,Math.max(1,(st.n&&st.n[L])||1));
        for(let i=0;i<n;i++){const a=ang+(i-(n-1)/2)*.16;this.pr.push({x:k.x,y:k.y,vx:Math.cos(a)*480,vy:Math.sin(a)*480,r:7,dmg:base,pi:1,life:1.3,hit:[],c:col,home:w.id==='homing'});}
      }else if(kind==='beam'){
        const len=520,wd=36;
        for(const e of this.en){if(e.dead)continue;const rx=e.x-k.x,ry=e.y-8-k.y,t=rx*cs+ry*sn;if(t<-10||t>len)continue;if(Math.abs(-rx*sn+ry*cs)<wd/2+e.r)this.hit(e,base*1.1,cs*160,sn*160);}
        if(this.fx.length<420)this.fx.push({beam:true,x:k.x,y:k.y,a:ang,len,w:wd,l:.45,m:.45,c:col});
      }else if(kind==='chain'){
        const seen=new Set([tg]);let cur=tg;this.hit(tg,base,0,0);
        for(let j=0;j<4;j++){
          let nx=null,bd=220*220;for(const e of this.en){if(e.dead||seen.has(e))continue;const d=(e.x-cur.x)**2+(e.y-cur.y)**2;if(d<bd){bd=d;nx=e;}}
          if(!nx)break;seen.add(nx);
          if(this.fx.length<420)this.fx.push({bolt:true,pts:[[cur.x,cur.y-8],[(cur.x+nx.x)/2+rnd(-8,8),(cur.y+nx.y)/2-12],[nx.x,nx.y-8]],l:.3,m:.3,c:col});
          this.hit(nx,base,0,0);cur=nx;
        }
      }else{
        const R=Math.max(60,Math.min(190,((st.rad&&st.rad[L])||80)*Math.min(1.8,this.S.area||1)*.9));
        this.explodeAt(tg.x,tg.y,R,base*1.15,col);
        if(w.id==='flare'||w.id==='chrono')for(const e of this.en){if(!e.dead&&Math.hypot(e.x-tg.x,e.y-tg.y)<R+e.r)e.stun=Math.max(e.stun,e.boss?.3:.9);}
      }
    }
  }
  /* ---------- Totem: appears ONCE per run, choose 1 of 3 distinct (mild) powers ---------- */
  rollTotems(){const ids=TOTEMS.map(t=>t.id);const out=[];while(out.length<3&&ids.length){out.push(ids.splice(Math.floor(Math.random()*ids.length),1)[0]);}return out;}
  applyTotem(id){
    const p=this.p,tf=this.totemFx,tr=o=>this.env.tr(o),def=TOTEMS.find(t=>t.id===id)||TOTEMS[0];
    this.totemTag=def.n;
    if(id==='luck')this.totemLuck++;
    else if(id==='risk')this.riskT=TOTEM_RISK_T;
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
  /* Storm and Spirit totems: 20 s, and every transformation shortens it by 20%; the Spirit pulse heals 6%, +1.5% per transformation up to 12% */
  totemCd(){return TOTEM_CD*Math.pow(.8,Math.max(0,this.formIdx+1));}
  totemHeal(){return Math.min(.12,.06+.015*Math.max(0,this.formIdx+1));}
  updateTotemFx(dt){
    const tf=this.totemFx,p=this.p;
    if(tf.storm){
      this.stormT-=dt;
      if(this.stormT<=0){
        this.stormT=this.totemCd();
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
        this.pulseT=this.totemCd();this.heal(p.maxHp*this.totemHeal());
        this.ring(p.x,p.y,260,'#9affc8',.7);this.ring(p.x,p.y,140,'#ffffff',.4);this.burst(p.x,p.y-12,22,'#9affc8');
        for(const e of this.en){if(e.dead)continue;if(Math.hypot(e.x-p.x,e.y-p.y)<260+e.r)e.stun=Math.max(e.stun,e.boss?.6:1.3);}
        this.audio.sfx('shrine');
      }
    }
  }
  /* ---------- progression ---------- */
  addXp(v){const a=v*this.S.xp;this.xp+=a;this.xpAcc+=a;}
  levelUp(){
    this.xp-=this.need;this.lvl++;this.need=this.needFor(this.lvl);this.audio.sfx('lvl');
    if(this.totemLuck>0)this.luckBonus=Math.min(.5,this.luckBonus+.01*this.totemLuck);
    this.emote('happy',1.1);
    this.ring(this.p.x,this.p.y,110,'#ffd23f',.5);this.pillar(this.p.x,this.p.y,'#ffe9a0',.55);this.burst(this.p.x,this.p.y-20,18,'#ffd23f');
    while(this.formsUnlocked<this.formMax&&this.lvl>=FORM_TIERS[this.formsUnlocked].lvl)this.unlockForm();
    this.recalc();
    if(this.endless)this.checkMilestone();
    const lm={type:'level',options:this.levelOptions()};{const rc=this.recommend(lm.options);if(rc){lm.rec=rc.i;lm.recWhy=rc.why;}}
    const allZ=lm.options.every(o=>o.type==='z');
    if(!allZ)this.autoZ=false;   /* a real choice came back: the automatic bag pick stops */
    if(allZ){lm.maxed=true;if(this.autoZ||this.save.settings.zAuto){this.autoLevel(lm);return;}}
    if(this.save.settings.lvAuto){this.autoLevel(lm);return;}   /* "auto level-up" (every mode): the card is chosen by the priority list, no menu */
    if(this.xform)this.afterX=lm;else this.modal=lm;
  }
  /* XP needed for the next level: the normal curve, or in Endless a gentle curve calibrated on the XP income the player had when Endless began
     (about ENDLESS_T0 s per level at first, ENDLESS_TK s longer for every level after that), so that 50 levels take roughly ten minutes */
  needFor(l){return this.endless?this.endlessNeed(l):xpNeed(l);}
  endlessNeed(l){return Math.max(40,Math.round(this.en0.rate*(ENDLESS_T0+ENDLESS_TK*Math.max(0,l-this.en0.lvl))));}
  /* every ENDLESS_MILE player levels: +ENDLESS_BONUS coins (no decay) and enemies get ENDLESS_W of the old steps at once */
  checkMilestone(){
    const m=Math.floor(this.lvl/ENDLESS_MILE);
    while(this.enMile<m){
      this.enMile++;this.run.coins+=ENDLESS_BONUS;
      const F=this.escF,W=ENDLESS_W,pc=x=>Math.round(x*100)+'%',n=this.enMile*ENDLESS_MILE;
      this.say(this.env.tr('endMileT',{n}),'#ffd23f',5.2,this.env.tr('endMileS',{c:ENDLESS_BONUS,hp:pc(F.hp*W),dm:pc(F.dmg*W)})+(F.arm?this.env.tr('endMileA',{ar:pc(F.arm*W)}):''));
      this.audio.sfx('wish');this.flash=Math.max(this.flash||0,.35);this.flashC='#ffd23f';this.shake=Math.max(this.shake,.35);
      this.ring(this.p.x,this.p.y,260,'#ffd23f',.8);this.pillar(this.p.x,this.p.y,'#ffe9a0',1.1);this.burst(this.p.x,this.p.y-20,40,'#ffd23f');
    }
  }
  /* the owned weapons and upgrades in priority order (max 10: 5 weapons + 5 upgrades); the order is a setting (settings.lvPrio) that outlives the run */
  enPrio(){
    const own=[...this.weapons.keys()].map(i=>'w:'+i).concat(Object.keys(this.pass).filter(k=>this.pass[k]>0).map(i=>'p:'+i));
    const out=(this.save.settings.lvPrio||[]).filter(k=>own.includes(k));
    for(const k of own)if(!out.includes(k))out.push(k);
    return out.slice(0,MAX_WEAPONS+MAX_PASSIVES);
  }
  setPrio(list){this.save.settings.lvPrio=list.slice(0,MAX_WEAPONS+MAX_PASSIVES);this.env.save.write();}
  optKey(o){return o.type==='w'?'w:'+o.id:o.type==='p'?'p:'+o.id:null;}
  /* the card to take when nobody is choosing: the best-ranked owned item; then owned weapons/upgrades; a needed evolution passive before the rest; a Senzu when hurt */
  autoPick(opts){
    const pr=this.enPrio(),need=this.neededPass(),hpLow=this.p.hp<this.p.maxHp*.45;
    let best=0,bs=1e9;
    opts.forEach((o,i)=>{
      const k=this.optKey(o);let s;
      if(k&&pr.includes(k))s=pr.indexOf(k);
      else if(o.type==='p'&&need.includes(o.id))s=15;
      else if(o.type==='w'||o.type==='p')s=o.lv>0?20:25;
      else if(o.type==='h')s=hpLow?-1:60;else if(o.type==='z')s=50-(o.v||0)/1000;else s=70;
      if(s<bs){bs=s;best=i;}
    });
    return best;
  }
  optName(o){
    if(o.type==='w'){const w=this.weapons.get(o.id),lv=w?w.lvShow+1:1;return this.env.tr(WEAPONS[o.id].n)+' Lv '+lv;}
    if(o.type==='p')return this.env.tr(PASS[o.id].n)+' Lv '+((this.pass[o.id]||0)+1);
    if(o.type==='z')return '+'+o.v+' zenny';
    return this.env.tr(T('Senzu','Senzu'));
  }
  autoLevel(lm){
    const o=lm.options[this.autoPick(lm.options)]||lm.options[0];
    this.applyOption(o);this.floatText(this.p.x,this.p.y-72,'▲ '+this.optName(o),2);
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
  burst(x,y,n,c){if(FXL.on)n=Math.ceil(n*.4);for(let i=0;i<n&&this.fx.length<(FXL.on?200:500);i++){const a=rnd(0,TAU),s=rnd(40,200);this.fx.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:rnd(.25,.6),m:.6,c,s:rnd(2,5)});}}
  bolt(x,y,r,c,n){if(FXL.on)n=Math.ceil(n*.5);for(let i=0;i<n&&this.fx.length<(FXL.on?200:460);i++){const a=rnd(0,TAU),L=r*rnd(.5,1),pts=[[x,y]];for(let k=1;k<=6;k++){const t=k/6;pts.push([x+Math.cos(a)*L*t+rnd(-10,10),y+Math.sin(a)*L*t+rnd(-10,10)]);}this.fx.push({bolt:true,pts,l:.35,m:.35,c});}}
  pillar(x,y,c,l){if(FXL.on)return;this.fx.push({pillar:true,x,y,l:l||.9,m:l||.9,c});}
  ring(x,y,r,c,l){this.fx.push({ring:true,x,y,r,l:l||.45,m:l||.45,c});}

  /* ---------- combat ---------- */
  /* weapon target (TAB): 0 closest, 1 most HP, 2 least HP, 3 boss first. It only applies to what is aimed from the player; projectiles keep picking the closest */
  pickTarget(md,m){
    const p=this.p,r2=md*md;let b=null,bs=0,near=null,nd=r2;
    for(const e of this.en){
      if(e.dead)continue;const dx=e.x-p.x,dy=e.y-p.y,d=dx*dx+dy*dy;if(d>=r2)continue;
      if(d<nd){nd=d;near=e;}
      if(m===3){if(e.boss&&(!b||d<bs)){b=e;bs=d;}}
      else{const s=m===1?e.hp:-e.hp;if(!b||s>bs){b=e;bs=s;}}
    }
    return b||near;
  }
  cycleTarget(){
    if(this.modal||this.ended||this.dying)return;
    this.tgt=(this.tgt+1)%4;this.save.settings.tgt=this.tgt;this.env.save.write();
    this.floatText(this.p.x,this.p.y-64,this.env.tr(TGT_NAMES[this.tgt]),2);this.audio.sfx('uiMove');
  }
  nearest(x,y,md){
    if(this.tgt&&x===this.p.x&&y===this.p.y)return this.pickTarget(md,this.tgt);
    let b=null,bd=md*md;for(const e of this.en){if(e.dead)continue;const dx=e.x-x,dy=e.y-y,d=dx*dx+dy*dy;if(d<bd){bd=d;b=e;}}return b;}
  hit(e,base,kx,ky){
    const S=this.S;let d=base*S.might*DMG_NERF;
    if(this.has('rage')&&this.p.hp<this.p.maxHp*.35)d*=1.2;
    let crit=false;if(Math.random()<S.crit){d*=S.critDmg;crit=true;}
    this.damageEnemy(e,d,kx,ky,crit);
  }
  damageEnemy(e,d,kx,ky,crit){
    if(e.dead)return;
    if(e.xf){if(this.showNums&&Math.random()<.2)this.floatText(e.x,e.y-e.r*1.7,'0',0);return;}
    if(e.under)return;
    if(e.armor)d=Math.max(d*.3,d-e.armor);
    if(e.bar>0){d*=.12;if(Math.random()<.35)this.ring(e.x,e.y-e.r,e.r*1.6,'#8ad8ff',.2);}   /* boss barrier */
    {const dd=Math.min(d,Math.max(0,e.hp)),k=this.curW||'other';this.dmgBy[k]=(this.dmgBy[k]||0)+dd;}
    e.hp-=d;e.fl=.07;
    if(!e.boss&&kx!==undefined){const k=e.elite?.2:e.ai==='tank'?.3:1;e.kx+=kx*k;e.ky+=ky*k;}
    if(this.showNums)this.floatText(e.x+rnd(-6,6),e.y-e.r*1.7,Math.round(d),crit?6:0);
    if(crit&&this.has('critboom')&&!this._boom){
      this._boom=true;
      for(const o of this.en){if(o.dead||o===e)continue;const dx=o.x-e.x,dy=o.y-e.y;if(dx*dx+dy*dy<75*75)this.damageEnemy(o,d*.4,dx*.5,dy*.5,false);}
      this.ring(e.x,e.y,75,'#c05aff',.3);this._boom=false;
    }
    if(e.hp<=0)this.killEnemy(e);else this.audio.sfx('hit');
  }
  killEnemy(e){
    if(e.sparring){e.dead=true;this.burst(e.x,e.y-8,30,'#aab4ff');this.audio.sfx('boom');if(this.trial)this.trial.killed=true;return;}
    e.dead=true;this.kills++;this.bumpStreak();
    if(e.bd&&e.bd.sig==='rain')this.rain=[];
    this.burst(e.x,e.y-8,e.boss?45:6,e.boss?e.bd.c:'#ffffff');this.audio.sfx(e.boss?'boom':'pop');
    if(e.boss){
      this.run.bossKills++;this.bossAlive--;
      if(e.tama){e.tama.lock=false;e.tama.beaten=true;this.ring(e.tama.x,e.tama.y-30,140,'#ffd23f',.8);this.say(this.env.tr(T('Il Tamagami cede la Super Sfera: prendila!','The Tamagami yields the Super Dragon Ball: take it!')),'#ffd23f',3.2);}
      const pay=Math.round(60*ZMUL*(this.sd+1)*(e.final?2:1));this.addZenny(pay);this.burst(e.x,e.y-10,26,'#ffd23f');this.audio.sfx('coin');this.floatText(e.x,e.y-e.r*2.4,'+Z '+pay,1);
      if(!this.bossHit)this.run.perfect++;
      if(Math.random()<GACHA.bossChance)this.addTicket('t10',1,e);   /* 100%: a 10x ticket */
      this.chests.push({x:e.x,y:e.y,final:e.final,t:0,boss:true});
      for(let i=0;i<6;i++)this.dropGem(e.x+rnd(-60,60),e.y+rnd(-60,60),25*this.stage.xp*XP_MUL);
      this.shake=.7;this.emote('happy',1.6);this.say(this.env.tr((BOSSES[e.bid]||e.bd).n)+' '+this.env.tr(T('sconfitto!','defeated!')),'#ffb13b',2.6);
      if(e.final){this.startVictory(e);}
      return;
    }
    if(e.elite)this.eliteDown(e);
    if(!e.sum)this.dropLoot(e);
    if(e.ai==='split'&&e.def.minion){for(let i=0;i<2;i++)this.en.push(this.mkEnemy(ENEMIES[e.def.minion],e.x+rnd(-14,14),e.y+rnd(-14,14)));}
    if(this.has('vamp'))this.heal(.4);
    if(this.abTier>=1&&this.abil.m==='absorb')this.heal(this.p.maxHp*.004);   /* Cell / C-21 passive: every kill feeds you */
  }
  /* every kill within STREAK_WIN s of the last one grows the streak (HUD counter, top right); reaching a milestone pays a little XP (a few % of a level) */
  bumpStreak(){
    const n=++this.streak;this.streakT=STREAK_WIN;this.streakPop=.28;if(n>(this.run.streak||0))this.run.streak=n;
    /* coin streak: a hidden bar refilled by every kill and drained 1% every 0.5 s; every CK_EVERY kills in a row pay CK_COINS coins */
    this.cstk++;this.cstkT=1;if(this.cstk%CK_EVERY===0){this.addZenny(CK_COINS);this.run.cstkPaid=(this.run.cstkPaid||0)+CK_COINS;this.audio.sfx('coin');this.floatText(this.p.x,this.p.y-46,'+Z '+CK_COINS,1);}
    const ix=STREAK_MS.indexOf(n);if(ix<0&&!(n>2000&&n%500===0))return;
    const p=this.p,t=ix<0?5:ix,col=STREAK_COL[Math.min(5,Math.floor(t*.6+.4))],xp=this.need*(.03+.008*Math.min(8,t));
    this.addXp(xp);this.audio.sfx('pkxp');
    this.say(this.env.tr(T('SERIE x','STREAK x'))+n+'!',col,1.5);
    this.ring(p.x,p.y,70+Math.min(110,t*14),col,.5);this.burst(p.x,p.y-16,10+t*3,col);
    if(t>=3){this.flash=Math.max(this.flash||0,.14);this.flashC=col;}
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
    const p=this.p,list=this.gm.filter(g=>!g.att&&!g.dead&&!g.held).map(g=>({g,d:Math.hypot(g.x-p.x,g.y-p.y)})).sort((a,b)=>b.d-a.d);
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
    this.dropGem(e.x,e.y,e.def.xp*(e.xpm||1)*this.stageXp()*XP_MUL*this.earlyXp()*(this.wave.ph==='rest'?REST_GEM:1));
    const r=Math.random();
    if(r<.022)this.spawnLoot('coin',e.x,e.y);
    else if(r<.022+.0075*(1+L+this.S.lootRate*.5)){const k=this.pickLoot();if(k)this.spawnLoot(k,e.x,e.y);}
    if(this.has('lootdrop')&&Math.random()<.005)this.spawnLoot(pick(['coin','heal','magnet','dmg','haste']),e.x,e.y);
    if(!this.stage.sup&&Math.random()<.0007*this.scanK)this.spawnLoot('ball',e.x,e.y);
  }
  /* ---- loot director: item rarity, cooldowns and "scripted" help when the player needs something ---- */
  lootWeights(){
    const hr=this.p.hp/this.p.maxHp,gems=this.gm.length,busy=this.bossAlive>0||this.en.length>70,cd=this.lootCd;
    const w={heal:30*(hr<.35?5:hr<.6?2.5:hr>.92?.25:1),xp:20*(gems<10?1.3:.7),haste:11*(busy?1.8:1),dmg:11*(busy?1.8:1),
      magnet:7*(gems>45?4:gems>25?2:.3),luck:this.nt>=170?5:0};
    for(const k in w)if(cd[k]>0&&!(k==='heal'&&hr<.3&&cd[k]<8))w[k]=0;        /* a kind that appeared recently stays away for a while */
    return w;
  }
  pickLoot(){const w=this.lootWeights(),o=Object.keys(w).filter(k=>w[k]>0);return o.length?wpick(o,k=>w[k]):null;}
  lootOnField(k){return this.loot.some(l=>l.k===k&&!l.dead);}
  /* zenny bag: its value follows the moment it appears, 1000 at minute 30 (a straight line, in steps of 5, at least 25); the coin buffs (S.gold) apply on top when the run pays out */
  coinValue(t){return clamp(Math.round(ZMUL*(5+35*(t===undefined?this.t:t)/1800)),4,32);}   /* a loose coin: 4 zenny at the start, 32 at minute 30 and never more (it was 5 -> 40, then -20% on every zenny) */
  bagValue(t){return clamp(Math.round(ZMUL*1000*(t===undefined?this.t:t)/1800/5)*5,20,1040);}
  spawnLoot(k,x,y){
    const v=k==='coin'?this.coinValue():k==='bag'?this.bagValue():k==='xp'?Math.round(this.need*.3):0;
    this.loot.push({k,x,y,v,t:0,star:k==='ball'?this.nextBallStar():k==='sball'?this.nextSuperStar():0,tama:k==='sball'?1:0});if(LOOT_CD[k])this.lootCd[k]=LOOT_CD[k];
  }
  /* the Tamagami statue cracks open: a boss of that star number appears on the spot, with health scaled to the minute of the run; the ball stays locked until it falls */
  wakeTamagami(l){
    const id='tama'+clamp(l.star||1,1,3),k=clamp(.7+1.2*this.prog(),.7,1.6);
    l.lock=true;l.woke=true;
    this.ring(l.x,l.y-30,160,'#ffd23f',.8);this.ring(l.x,l.y-30,80,'#ffffff',.5);this.burst(l.x,l.y-30,40,'#b8bcc8');this.pillar(l.x,l.y,'#ffd23f',1);this.flash=Math.max(this.flash||0,.3);this.flashC='#ffe9a8';
    this.spawnBoss(id,false,{x:l.x,y:l.y+4,k,tama:l});
  }
  /* Dragon Balls carry a number of stars (1-7): the ones owned this run (ballSet, or the lowest numbers when the counter was set by hand in the sandbox) */
  ballOwned(){if(this.stage.sup)return new Set(this.save.sball);const s=new Set(this.ballSet);for(let n=1;s.size<Math.min(7,this.balls)&&n<=7;n++)s.add(n);return s;}
  /* a star number you do not have yet and that is not lying on the ground already (when that is impossible: any you do not have) */
  nextBallStar(){
    const have=this.ballOwned(),field=new Set(this.loot.filter(l=>l.k==='ball'&&!l.dead).map(l=>l.star)),all=[1,2,3,4,5,6,7];
    let pool=all.filter(n=>!have.has(n)&&!field.has(n));if(!pool.length)pool=all.filter(n=>!have.has(n));
    return pick(pool.length?pool:all);
  }
  /* the Super Dragon Ball that lands on the map carries a star number you do not own yet */
  nextSuperStar(){const all=Array.from({length:SB_TOTAL},(_,i)=>i+1),have=new Set(this.save.sball),pool=all.filter(n=>!have.has(n));return pick(pool.length?pool:all);}
  collectLoot(l){
    const p=this.p,pc=({sball:'#ffd23f',coin:'#ffd23f',bag:'#ffd23f',heal:'#8be07a',magnet:'#ff5a5a',dmg:'#ff5a3d',haste:'#ffe24d',xp:'#5ad0ff',capsule:'#ffffff',luck:'#8be07a',ball:'#ffaa28'})[l.k]||'#fff';
    this.burst(l.x,l.y-8,l.k==='coin'?4:l.k==='bag'?22:9,pc);if(l.k!=='coin')this.ring(l.x,l.y-6,l.k==='sball'?90:l.k==='ball'?46:26,pc,.35);   /* pick-up sparkle */
    switch(l.k){
      case'coin':this.addZenny(l.v);this.audio.sfx('coin');break;
      case'bag':this.addZenny(l.v);this.audio.sfx('coin');this.audio.sfx('pkxp');this.run.bags=(this.run.bags||0)+1;this.floatText(l.x,l.y-34,'+Z '+l.v,1);this.ring(l.x,l.y-6,60,'#ffd23f',.45);this.shake=Math.max(this.shake,.08);break;
      case'heal':this.heal(p.maxHp*.3);this.audio.sfx('pkheal');this.ring(p.x,p.y,40,'#8be07a',.4);break;
      case'magnet':for(const g of this.gm)g.att=true;if(this.rg)this.rg.att=true;for(const q of this.loot)if((q.k==='bag'||q.k==='coin')&&!q.isle)q.att=true;this.audio.sfx('pkmagnet');this.ring(p.x,p.y,200,'#ff5a5a',.5);this.floatText(p.x,p.y-50,this.env.tr(T('Magnete!','Magnet!')),2);break;
      case'dmg':this.buffs.dmg=12;this.recalc();this.audio.sfx('pkdmg');this.floatText(p.x,p.y-50,this.env.tr(T('Danni +15% (12s)','Damage +15% (12s)')),2);break;
      case'haste':this.buffs.haste=10;this.recalc();this.audio.sfx('pkhaste');this.floatText(p.x,p.y-50,this.env.tr(T('Fuoco rapido (10s)','Rapid fire (10s)')),2);break;
      case'xp':this.addXp(l.v*.7);this.audio.sfx('pkxp');break;
      case'luck':this.luckBonus=Math.min(.4,this.luckBonus+.03);this.recalc();this.audio.sfx('pkluck');this.burst(p.x,p.y-20,14,'#8be07a');this.floatText(p.x,p.y-50,this.env.tr(T('Fortuna +3%','Luck +3%')),2);break;
      case'capsule':{this.audio.sfx('pkcapsule');const id=this.rollTrinket();if(id){const rr=this.rarOf(id),t=TRINKETS.find(x=>x.id===id);this.addTrinket(id,rr);this.say(this.env.tr(t.n),RARITY[rr].c,2.4);}else this.addZenny(30);break;}
      case'sball':{
        const got=this.sandbox?0:this.progress.addSuperBall(l.star),n=this.sandbox?1:this.save.sball.length;this.run.sballs=(this.run.sballs||0)+(got?1:0);
        this.audio.sfx('sphere');this.audio.sfx('ticket');
        this.ring(p.x,p.y,90,'#ffd23f',.6);this.ring(p.x,p.y,200,'#fff3b0',.9);this.ring(p.x,p.y,340,'#ffd23f',1.1);this.pillar(p.x,p.y,'#ffd23f',1.6);
        this.burst(l.x,l.y-30,40,'#ffe066');this.burst(l.x,l.y-30,20,'#ffffff');this.flash=Math.max(this.flash||0,.45);this.flashC='#ffe9a8';this.shake=Math.max(this.shake,.4);
        this.say(this.env.tr(T('SUPER SFERA DEL DRAGO ','SUPER DRAGON BALL '))+l.star+'★  ('+n+'/'+SB_TOTAL+')','#ffd23f',3.2);
        if(n>=SB_TOTAL)this.say(this.env.tr(T('HAI TUTTE E '+SB_TOTAL+'! Esprimi il desiderio nel menu degli scenari','ALL '+SB_TOTAL+'! Make your wish in the stage menu')),'#ffe066',4);
        break;}
      case'ball':this.balls++;this.run.balls++;if(l.star&&!this.ballSet.includes(l.star))this.ballSet.push(l.star);
        this.audio.sfx('sphere');                                                 /* assets/sphere_sound.mp3 */
        this.ring(p.x,p.y,70,'#ffb13b',.55);this.ring(p.x,p.y,140,'#ffe9a8',.85);this.pillar(p.x,p.y,'#ffb13b',1.2);
        this.burst(l.x,l.y-12,24,'#ffd27a');this.burst(l.x,l.y-12,12,'#ffffff');this.flash=Math.max(this.flash||0,.2);this.flashC='#ffd27a';
        this.say(this.env.tr(T('Sfera del Drago ','Dragon Ball '))+(l.star?l.star+'★  ':'')+'('+this.balls+'/7)','#ffb13b',2);
        if(this.balls>=7)this.modal={type:'wish',options:['revive','power','fortune','tickets']};break;
    }
  }
  /* ---- water and lava (Sea): lakes and the sea are not walkable (you slide along the shore); lava can be crossed but burns 10% of the maximum HP per second ---- */
  waterAt(x,y){const th=this.stage.theme;return Sea.has(th)&&Sea.wet(th,x,y)>.012;}
  lavaMap(){const th=this.stage.theme;return Sea.has(th)&&!!Sea.PAL[th].lava;}
  blockWater(p,ox,oy){
    if(this.lavaMap()||!this.waterAt(p.x,p.y)||this.waterAt(ox,oy))return;   /* lava is not a wall; when already in the water (teleport, revive) nothing blocks */
    if(!this.waterAt(p.x,oy))p.y=oy;else if(!this.waterAt(ox,p.y))p.x=ox;else{p.x=ox;p.y=oy;}
  }
  updateLava(dt){
    if(this.dying||this.ended||!this.lavaMap()||this.sb.god){return;}
    const p=this.p;
    if(!this.waterAt(p.x,p.y)){this.lavaT=0;return;}
    if(p.inv>0)return;
    this.lavaT+=dt;this.lavaF-=dt;
    p.hp-=p.maxHp*.10*dt;
    if(this.lavaF<=0){this.lavaF=.5;this.floatText(p.x,p.y-40,Math.max(1,Math.round(p.maxHp*.05)),4);this.burst(p.x,p.y-6,6,'#ff7a2a');this.audio.sfx('hurt');}
    if(p.hp<=0)this.lethal();
  }
  /* the player's HP reached zero: Halo revive, a Dragon Ball wish revive or death */
  lethal(){
    const p=this.p;
    if(this.has('revive')&&!this.haloUsed){this.haloUsed=true;this.revive();}
    else if(this.revives>0){this.revives--;this.revive();}
    else{p.hp=0;this.startDeath();}
  }
  hurt(d,src){
    const p=this.p;
    if(p.inv>0||this.sb.god)return;
    if(this.trial){const dd=Math.max(1,Math.round((d-this.S.armor)*this.S.taken));p.hp=Math.max(1,p.hp-dd);p.inv=.5;this.floatText(p.x,p.y-40,dd,4);this.audio.sfx('hurt');return;}
    if(this.barrierReady){this.barrierReady=false;this.barrierT=this.has('barrier')?15:25;this.floatText(p.x,p.y-50,this.env.tr(T('Bloccato!','Blocked!')),2);this.ring(p.x,p.y,50,'#8ad8ff',.4);p.inv=.4;return;}
    if(Math.random()<this.S.dodge){this.floatText(p.x,p.y-50,this.env.tr(T('Schivata!','Dodge!')),3);p.inv=.25;return;}
    d=Math.max(1,Math.round((src&&src.pct?d:d-this.S.armor)*this.S.taken));   /* a percentage hit (Super Buu's rain) ignores armor */
    d=Math.min(d,Math.ceil(p.maxHp*(src&&src.trap?.16:src&&(src.boss||src.bs)?.4:.26)));
    this.emote(p.hp-d<p.maxHp*.3?'pain':'hurt',.8);
    p.hp-=d;p.inv=.5;this.shake=Math.max(this.shake,.18);this.audio.sfx('hurt');this.floatText(p.x,p.y-40,d,4);
    if(this.bossAlive>0)this.bossHit=true;
    if(p.hp<=0)this.lethal();
  }
  revive(){
    const p=this.p;p.hp=p.maxHp*.5;p.inv=2.5;this.flash=.8;this.flashC='#ffffff';this.ring(p.x,p.y,320,'#ffffff',.8);
    for(const e of this.en){if(e.dead)continue;const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy)||1;if(d<320){e.stun=Math.max(e.stun,2);if(!e.boss){e.kx+=dx/d*500;e.ky+=dy/d*500;}}}
    this.say(this.env.tr(T('RESURREZIONE!','REVIVED!')),'#ffffff',2.5);this.audio.sfx('transform');
  }
  finish(win,opts){
    if(this.ended)return;this.ended=true;
    this.sellHeld();
    const res=this.progress.finishRun(this,win,opts);
    this.env.onEnd(res,this);
  }
  /* death: slow motion, the music drags, the hero falls; the end menu opens after DEATH_T seconds */
  startDeath(){
    if(this.dying||this.ended)return;
    const p=this.p;this.dying={t:0,dur:DEATH_T,ts:this.timeScale||1};p.inv=999;p.hp=0;
    this.eb=[];this.bz=[];this.jbeams=[];this.rain=[];this.held=null;this.vortex=null;this.xform=null;this.kai=0;
    this.flash=.5;this.flashC='#ffffff';this.shake=.6;this.audio.sfx('death');if(this.audio.slowMusic)this.audio.slowMusic(.45);
    this.ring(p.x,p.y,120,'#ffffff',.9);this.burst(p.x,p.y-20,30,'#ffffff');this.burst(p.x,p.y-20,20,'#ff5a3d');
    this.say(this.env.tr(T('SCONFITTA...','DEFEATED...')),'#ff5a3d',DEATH_T);
  }
  updateDying(rdt){
    const d=this.dying,p=this.p;d.t+=rdt;p.hp=0;
    const k=Math.min(1,d.t/.45);this.timeScale=1-.9*k;
    if(d.t>.5&&this.fx.length<440&&Math.random()<rdt*40*(FXL.on?.3:1))this.fx.push({x:p.x+rnd(-10,10),y:p.y-rnd(10,30),vx:rnd(-12,12),vy:-rnd(50,120),l:.9,m:.9,c:Math.random()<.5?'#ffe86a':'#ffffff',s:rnd(2,4)});
    if(d.t>=d.dur){this.timeScale=d.ts;this.dying=null;if(this.audio.slowMusic)this.audio.slowMusic(1);this.finish(false);return true;}
    return false;
  }
  /* the final boss falls (v55): before the stage-complete menu a short cinematic plays - the board is cleared, time slows, the boss flashes and cracks with light,
     then a big blast takes it away; the menu opens after VIC_T seconds */
  startVictory(e){
    if(this.vic||this.ended)return;
    const p=this.p;this.cleared=true;p.inv=999;
    this.vic={t:0,dur:VIC_T,x:e.x,y:e.y,r:e.r,boom:false,bt:0,nx:0,e:Object.assign({},e,{dead:false,fl:0,atk:0,stun:0,xf:null,tel:null,telK:0,fuse:0,bm:null,vis:null,sq:0})};
    this.eb=[];this.bz=[];this.jbeams=[];this.rain=[];this.held=null;this.vortex=null;this.xform=null;this.kai=0;this.sb.nospawn=true;
    for(const o of this.en)if(o!==e&&!o.dead){o.dead=true;this.burst(o.x,o.y-6,6,'#ffffff');}
    this.ring(e.x,e.y,160,e.bd.c,.8);this.audio.sfx('boom');if(this.audio.slowMusic)this.audio.slowMusic(.55);
  }
  updateVictory(rdt){
    const v=this.vic,dt=rdt*.4;v.t+=rdt;this.rt+=dt;this.t+=dt*this.CR;
    if(this.shake>0)this.shake-=rdt;if(this.flash>0)this.flash-=rdt;
    const k=Math.min(1,v.t/2.6),e=v.e;
    if(!v.boom){
      this.shake=Math.max(this.shake,.18+.5*k);
      v.nx-=rdt;if(v.nx<=0){v.nx=Math.max(.07,.3-.22*k);const x=v.x+rnd(-v.r,v.r)*1.1,y=v.y-rnd(0,v.r*2.2),c=[e.bd.c,'#ffffff','#ffd23f'][(Math.random()*3)|0];
        this.burst(x,y,6+(k*10|0),c);this.ring(x,y,22+rnd(0,26)+30*k,c,.35);if(Math.random()<.5)this.bolt(v.x,v.y-v.r,60+120*k,'#ffffff',2);this.audio.sfx(Math.random()<.4?'boom':'pop');}
      if(v.t>=2.6){   /* the blast */
        v.boom=true;v.bt=v.t;this.flash=1;this.flashC='#ffffff';this.shake=.95;
        this.ring(v.x,v.y-v.r,380,'#ffffff',1.1);this.ring(v.x,v.y-v.r,240,e.bd.c,.9);this.ring(v.x,v.y-v.r,520,'#ffd23f',1.4);
        this.burst(v.x,v.y-v.r,70,'#ffffff');this.burst(v.x,v.y-v.r,50,e.bd.c);this.bolt(v.x,v.y-v.r,420,'#ffffff',18);this.pillar(v.x,v.y,'#ffffff',1.6);
        this.audio.sfx('boom');this.audio.sfx('transform');
        this.say(this.env.tr(T('VITTORIA!','VICTORY!')),'#ffd23f',VIC_T-2.6);
      }
    }
    for(const f of this.fx){f.l-=dt;if(f.vx!==undefined){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.92;f.vy*=.92;}}this.fx=this.fx.filter(f=>f.l>0);
    for(const t of this.tx)t.t+=dt;this.tx=this.tx.filter(t=>t.t<t.l);
    if(this.banner){this.banner.t+=dt;if(this.banner.t>this.banner.dur)this.banner=null;}
    if(v.t>=v.dur){this.vic=null;this.sb.nospawn=false;if(this.audio.slowMusic)this.audio.slowMusic(1);this.finish(true);}
  }
  /* tickets for the Gacha shop: kept in the run and added to the save when the run ends (like the zenny) */
  addTicket(kind,n,at){
    n=n||1;this.run.tk[kind]+=n;const p=at||this.p,c=kind==='l10'?'#ff9ad0':kind==='t10'?'#ffd23f':'#9ad8ff';
    this.audio.sfx('ticket');this.ring(p.x,p.y,90,c,.6);this.burst(p.x,p.y-14,22,c);this.pillar(p.x,p.y,c,.9);this.flash=Math.max(this.flash||0,.15);this.flashC=c;
    this.progress.notify({type:'tfound',kind,n});   /* the message is a notification with the ticket icon (top right) */
  }
  /* Endless: from here on the enemies grow every ENDLESS_MILE levels (not every minute), coins dry up, weapons can reach Lv 100, Zeno's Shop opens every 5 minutes */
  continueAfterWin(){
    this.ended=false;this.endless=true;
    this.en0={t:this.t,lvl:this.lvl,steps:Math.floor(this.t/this.escEvery),mile:Math.floor(this.lvl/ENDLESS_MILE),rate:Math.max(this.xpRate,xpNeed(this.lvl)/45)};
    this.enMile=this.en0.mile;
    this.need=this.needFor(this.lvl);
    this.map.zenoNext=this.t+ENDLESS_ZENO;
    if(this.stage.abs){   /* Android Ruins: one android every 5 minutes, then 19 and 21, then the list starts over a little stronger */
      const m0=Math.floor(this.t/ANDROID_STEP)+1;
      for(let m=m0;m<m0+36;m++){const id=ANDROID_SEQ[(m-1)%ANDROID_SEQ.length],lap=Math.floor((m-1)/ANDROID_SEQ.length);this.bossQ.push({id,t:m*ANDROID_STEP,final:false,done:false,k:(ANDROID_K[id]||1)*(1+.35*lap)});}
    }
    this.recalc();
    this.say(this.env.tr('endIntroT'),'#ffd23f',5,this.env.tr('endIntroS',{n:ENDLESS_MILE}));this.audio.sfx('wish');
  }

  /* ---------- spawning ---------- */
  /* difficulty scales with progress through the stage; the stage multiplier eases in over the first 40% */
  get nt(){return this.t/this.TS;}
  stageXp(){const x=Math.sqrt(this.stage.xp);return 1+(x-1)*Math.min(1,this.prog()/.5);}
  earlyXp(){return 1+1.0*Math.max(0,1-this.prog()*2.6);}
  prog(){return Math.min(1.3,this.t/this.dur);}
  stageMul(v){return 1+(v-1)*Math.min(1,this.t/(this.dur*.4));}
  /* per-step escalation factors (see ESC_N / ESC_X): Extreme grows faster and also gets armor */
  get escEvery(){return this.diffId==='easy'?ESC_EVERY_EASY:ESC_EVERY;}
  get escF(){return this.diffId==='extreme'?ESC_X:this.diffId==='easy'?ESC_E:ESC_N;}
  escSteps(){return this.endless?this.en0.steps+(this.enMile-this.en0.mile)*ENDLESS_W:Math.floor(this.t/this.escEvery);}
  /* Extreme: 2% more enemies every 30 s (60 steps at most) */
  xSteps(){return this.diffId==='extreme'?Math.min(60,Math.floor(this.t/X_SPAWN_STEP)):0;}
  hpMul(){return ENEMY_HP_MUL*(1+Math.pow(this.prog(),2)*(G_HP_K*1.1+.45*this.sd))*this.stageMul(this.stage.hp)*this.D.hp*(this.x2?1.4:1);}
  dmgMul(){return ENEMY_DMG_MUL*(1.0+this.prog()*G_DMG_K)*this.stageMul(1+.15*this.sd)*this.D.dmg*(this.x2?1.25:1);}
  /* few enemies early, hordes late */
  get finalOn(){return this.finalSpawned&&this.bossAlive>0;}
  spawnCap(){const xk=1+X_CAP_K*this.xSteps();if(this.stage.capT)return Math.round(this.stage.capT[this.snakeTier()]*(1+.06*this.sd)*CAP_K*xk);const pr=Math.min(1,this.prog());return Math.round((24+4*this.sd+(250+30*this.sd)*Math.pow(pr,1.7))*CAP_K*xk);}
  spawnRate(){return(1+9*Math.pow(Math.min(1,this.prog()),1.35))*SPAWN_K*(this.x2?.85:1)*this.stageMul(this.stage.spawn)*this.D.spawn*(1+X_SPAWN_K*this.xSteps())*(1+.05*(this.save.shop.broly||0));}   /* shop "Urlo di Broly!": +5% enemies per level */
  mkEnemy(def,x,y){
    const e=this.mkEnemy0(def,x,y);if(def.sk)this.skillInit(e);return e;
  }
  mkEnemy0(def,x,y){
    const fb=this.finalOn,esc=this.escSteps(),F=this.escF,hp=def.hp*this.hpMul()*(fb?1.35:1)*(1+F.hp*esc);   /* final boss fight: tougher crowd that hits a bit softer */
    const arm0=((def.ai==='tank'||def.ai==='slam')?.8+this.sd*1.1:0)+(fb?.9+this.sd*.5:0)+(this.diffId==='extreme'?.5:0);   /* Extreme: everyone has a little armor, which then grows 15% per step */
    return{def,ai:def.ai,x,y,hp,max:hp,r:def.r,spd:def.spd*this.spdK,armor:arm0*(1+F.arm*esc),xpm:1+F.xp*esc,dmg:def.dmg*this.dmgMul()*(fb?.85:1)*(1+F.dmg*esc),boss:false,kx:0,ky:0,fl:0,stun:0,slow:0,
      sh:rnd(1,def.shoot?def.shoot.cd:3),sp:0,ph:rnd(0,TAU),dead:false,face:1,st:0,stT:rnd(1,3),fuse:0,dx:0,dy:0,age:0,mvs:0};
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
  /* first stage only: shooters are rationed (at most SHOOT4 new ones per 8 seconds, at most SHOOTMAX alive at once); returns the enemy to spawn or null */
  limitShooter(def){
    if(!def||this.stage.no!==1||!(def.ai==='ranged'||def.ai==='hover'))return def;
    for(let k=0;k<6&&def&&(def.ai==='ranged'||def.ai==='hover');k++){
      let alive=0;for(const e of this.en)if(!e.dead&&!e.boss&&(e.ai==='ranged'||e.ai==='hover'))alive++;
      if(this.shootQ>0&&alive<7){this.shootQ--;return def;}
      def=this.rosterPick();
    }
    return def&&(def.ai==='ranged'||def.ai==='hover')?null:def;
  }
  /* a point at distance d from the player: any direction, or on the snake's body on Snake Way (i spreads group members along it) */
  spawnSpot(a,d,i){
    const p=this.p;
    if(this.stage.theme==='snake')return Snake.spot(p.x,d+((i||0)%9)*34,Math.cos(a)>=0?1:-1);
    const dy=Math.sin(a)*d;
    return[p.x+Math.cos(a)*d,p.y+(dy<0?dy*TOP_K:dy)];   /* above the player: 50% farther away */
  }
  snakeTier(){return this.stage.capT?Math.min(this.stage.capT.length-1,(this.nt/150)|0):0;}
  spawnOne(){
    const a=rnd(0,TAU),d=this.viewR+rnd(10,110),def=this.limitShooter(this.rosterPick());
    if(def){const[x,y]=this.spawnSpot(a,d,0);this.en.push(this.mkEnemy(def,x,y));}
  }
  spawnRing(n,def,extra){
    const d=this.viewR+40;
    if(this.stage.ringT)n=Math.min(n,this.stage.ringT[this.snakeTier()]);
    for(let i=0;i<n;i++){const a=i/n*TAU,df=this.limitShooter(def||this.rosterPick());if(!df)continue;const[x,y]=this.spawnSpot(a,d,i),e=this.mkEnemy(df,x,y);if(extra)extra(e);this.en.push(e);}
  }
  /* ---- wave rhythm: calm -> SURGE (15 s, many more enemies) -> REST (12 s, few enemies + a shower of gems) -> calm ... ---- */
  waveMul(){const ph=this.wave.ph;return ph==='surge'?{rate:WAVE_RATE,cap:WAVE_CAP}:ph==='rest'?{rate:REST_RATE,cap:REST_CAP}:{rate:1,cap:1};}
  updateWave(){
    const w=this.wave,t=this.t;
    if(this.bossAlive>0||this.finalSpawned){if(w.ph!=='calm'){w.ph='calm';w.until=t+30;}return;}   /* boss fights set their own pace */
    if(w.ph==='calm'){
      if(t<w.until)return;
      /* never on top of a horde, a special wave, a boss about to arrive or the last seconds of the run */
      if(this.bombOn||this.shootOn||this.hordeT-t<22||this.prog()>.92||this.bossQ.some(b=>!b.done&&b.t-t<25&&b.t-t>-5)){w.until=t+6;return;}
      w.ph='surge';w.until=t+WAVE_SURGE;w.n++;
      this.say(this.env.tr(T('ONDATA! RESISTI 15 SECONDI','SURGE! HOLD ON FOR 15 SECONDS')),'#ff5a3d',2.2);this.audio.sfx('warn');this.shake=Math.max(this.shake,.25);
    }else if(w.ph==='surge'){
      if(t>=w.until){w.ph='rest';w.until=t+WAVE_REST;this.waveRest();}
    }else if(t>=w.until){w.ph='calm';w.until=t+rnd(WAVE_GAP[0],WAVE_GAP[1])*clamp(Math.sqrt(this.TS),.75,1.4)*this.evK;}
  }
  /* the breather: a ring of gems around the player (about 9% of a level in total), to be picked up in peace */
  waveRest(){
    const p=this.p,n=10+Math.min(6,this.sd*2+((this.lvl/12)|0)),v=this.need*.09/n;
    for(let i=0;i<n;i++){const a=i/n*TAU+rnd(-.2,.2),[x,y]=this.spawnSpot(a,rnd(55,230),i);this.dropGem(x,y,v);}
    this.audio.sfx('pkxp');
    this.ring(p.x,p.y,230,'#5ad0ff',.6);this.burst(p.x,p.y-16,14,'#5ad0ff');
  }
  /* ---- elite enemies: a few per run, spread between the bosses; each one is a big, tough version of a regular enemy and always drops a chest ---- */
  planElites(){
    const dur=this.dur,n=clamp(Math.round(dur/210),2,6),out=[],fin=this.bossQ.find(b=>b.final),lim=fin?fin.t-32:dur-60;
    for(let i=0;i<n;i++){
      let t=dur*(.14+.66*(i+.5)/n);
      for(let k=0;k<3;k++){const b=this.bossQ.find(b=>Math.abs(b.t-t)<28);if(!b)break;t=b.t+32;}   /* step aside from a boss (a fight in progress also holds the elite back) */
      if(t>lim||this.bossQ.some(b=>Math.abs(b.t-t)<28)||(out.length&&t-out[out.length-1].t<60))continue;
      out.push({t,i:out.length,done:false});
    }
    return out;
  }
  updateElites(){
    if(this.bossAlive>0||this.finalSpawned||this.wave.ph==='surge')return;
    for(const e of this.elitePlan)if(!e.done&&this.t>=e.t){e.done=true;this.spawnElite(e.i);break;}
  }
  spawnElite(n){
    const t=this.nt,ok=[];
    for(const [id,from,wt,until] of this.stage.roster){if(t<from||(until&&t>=until))continue;const d=ENEMIES[id];if(d.ai==='explode'||d.ai==='ranged'||d.ai==='hover')continue;ok.push(d);}
    if(!ok.length)return null;
    ok.sort((a,b)=>b.hp-a.hp);
    const def=pick(ok.slice(0,Math.min(3,ok.length))),[x,y]=this.spawnSpot(rnd(0,TAU),this.viewR+rnd(40,90),0),e=this.mkEnemy(def,x,y),k=1+.3*n;
    Object.assign(e,{elite:true,hp:e.hp*ELITE_HP*k,r:def.r*ELITE_R,dmg:e.dmg*1.45,armor:(e.armor||0)+1+.6*this.sd,spd:e.spd*.9,xpm:(e.xpm||1)*6});e.max=e.hp;
    this.en.push(e);
    this.say(this.env.tr(T('NEMICO ÉLITE!','ELITE ENEMY!')),'#ffd23f',2.4);this.audio.sfx('boss');this.shake=Math.max(this.shake,.3);
    return e;
  }
  /* an elite fell: guaranteed chest (a normal upgrade plus a sure trinket), zenny and a handful of gems */
  eliteDown(e){
    this.run.elites=(this.run.elites||0)+1;this.addTicket('t1',1,e);   /* every Elite drops a 1x ticket */
    this.chests.push({x:e.x,y:e.y,final:false,t:0,elite:true});
    const pay=Math.round(25*ZMUL*(this.sd+1));this.addZenny(pay);this.floatText(e.x,e.y-e.r*2.4,'+Z '+pay,1);
    for(let i=0;i<4;i++)this.dropGem(e.x+rnd(-40,40),e.y+rnd(-40,40),12*this.stage.xp*XP_MUL);
    this.ring(e.x,e.y,110,'#ffd23f',.5);this.burst(e.x,e.y-e.r,24,'#ffd23f');this.pillar(e.x,e.y,'#ffd23f',.8);this.audio.sfx('coin');this.shake=Math.max(this.shake,.35);
    this.say(this.env.tr(T('ÉLITE SCONFITTO! Apri il forziere','ELITE DEFEATED! Open the chest')),'#ffd23f',2.4);
  }
  /* ---- the guaranteed Dragon Ball: one lands on the map every few minutes (never two at once, never during a boss fight); the arrow at the screen edge shows where ---- */
  updateSuperPlan(){
    const sp=this.supPlan;if(!sp||sp.done||this.t<sp.at||this.bossAlive>0||this.finalSpawned)return;
    sp.done=true;const [x,y]=this.spawnSpot(rnd(0,TAU),rnd(520,700),0);
    this.spawnLoot('sball',x,y);
    this.say(this.env.tr(T('UNA SUPER SFERA DEL DRAGO È APPARSA! UN TAMAGAMI LA CUSTODISCE: SEGUI LA FRECCIA DORATA','A SUPER DRAGON BALL HAS APPEARED! A TAMAGAMI GUARDS IT: FOLLOW THE GOLDEN ARROW')),'#ffd23f',3.4);this.audio.sfx('shrine');
  }
  updateBallPlan(){
    if(this.stage.sup)return;
    if(this.t<this.ballAt||this.bossAlive>0||this.finalSpawned)return;
    if(this.lootOnField('ball')){this.ballAt=this.t+20;return;}
    if(this.dur-this.t<60){this.ballAt=1e9;return;}
    this.ballAt=this.t+this.ballEvery;
    const [x,y]=this.spawnSpot(rnd(0,TAU),rnd(280,420),0);
    this.spawnLoot('ball',x,y);const l=this.loot[this.loot.length-1];l.ttl=150;l.guar=true;
    this.say(this.env.tr(T('UNA SFERA DEL DRAGO È APPARSA! SEGUI LA FRECCIA','A DRAGON BALL HAS APPEARED! FOLLOW THE ARROW')),'#ffaa28',3);this.audio.sfx('shrine');
  }
  spawnHorde(){
    const pr=Math.min(1,this.prog()),n=Math.round(8+this.sd*3+pr*(40+this.sd*14));
    this.spawnRing(n,null,e=>{e.hp*=1.15;e.max=e.hp;});
    this.say(this.env.tr(T('ORDA IN ARRIVO!','HORDE INCOMING!')),'#ff5a3d',2.6);this.audio.sfx('boss');this.shake=.4;
  }
  spawnPack(){this.spawnRing(Math.round(5+this.sd+Math.min(1,this.prog())*(8+this.sd*2)),this.rosterPick());}
  spawnEnemyById(id,n){for(let i=0;i<(n||1);i++){const a=rnd(0,TAU),d=rnd(180,320),[x,y]=this.spawnSpot(a,d,i);this.en.push(this.mkEnemy(ENEMIES[id],x,y));}}
  spawnBoss(id,final,at,hk){   /* at: {x,y,k,tama} puts the boss on a given spot (Tamagami statue) with a health factor k */
    const bd=BOSSES[id],p=this.p,a=rnd(0,TAU),d=this.viewR+60,[bx,by]=at?[at.x,at.y]:this.spawnSpot(a,d,0);
    const e=this.mkEnemy({n:bd.n,c:bd.c,xp:0,hp:bd.hp,r:bd.r,spd:bd.spd,dmg:bd.dmg,ai:'boss',sp:bd.sp},bx,by);
    const hp=bd.hp*BOSS_HP_MUL*this.D.hp*(this.x2?1.4:1)*(final?1.3:1)*((at&&at.k)||1)*(hk||1);
    Object.assign(e,{ai:'boss',boss:true,bid:id,bd,final:!!final,armor:1.2+1.2*this.sd+(final?2.6:0),hp,max:hp,r:bd.r,spd:bd.spd,dmg:bd.dmg*this.dmgMul()*(final?.9:1),sh:bd.cd,phase:0,spin:0,dashT:0,tf:0,xf:null,tfT:final?105:85,zoff:0});
    if(at&&at.tama)e.tama=at.tama;
    this.en.push(e);this.bossAlive++;this.bossHit=false;
    this.say(this.env.tr(bd.n)+(final?' - '+this.env.tr(T('BOSS FINALE','FINAL BOSS')):at&&at.tama?' - '+this.env.tr(T('GUARDIANO DELLA SUPER SFERA','SUPER DRAGON BALL GUARDIAN')):''),'#ff5a3d',3);this.audio.sfx('boss');this.shake=.4;
    if(final){this.finalSpawned=true;this.progress.reachedFinal(this);}
  }
  bossAttack(e){
    const p=this.p,bd=e.bd,aim=Math.atan2(p.y-18-e.y,p.x-e.x),d=e.dmg;
    let pat=bd.pats[Math.min(e.phase,bd.pats.length-1)];
    if(e.sparring)pat=bd.pats[Math.floor(Math.random()*bd.pats.length)];
    if(bd.rnd&&!e.sparring)pat=bd.pats[Math.floor(Math.random()*bd.pats.length)];
    if(bd.mix&&!e.sparring){const dd=Math.hypot(p.x-e.x,p.y-e.y);pat=dd<200?(Math.random()<.72?'jsword':'jbeam'):(Math.random()<.6?'jbeam':'jsword');}
    const zd=e.sparring?Math.max(d*1.1,p.maxHp*(.2+.05*Math.min(2,this.trialN))):d*1.1;
    if(e.sparring&&Math.random()<SPAR_COPY_P&&this.sparCopy(e,zd,aim))return;   /* the Master imitates you */
    if(e.tf>=1&&Math.random()<.42){const ex=['slam','nova','lance','storm'];pat=ex[Math.floor(Math.random()*(e.tf>=2?4:2))];}
    if(!e.sparring&&!this.trial){const ext=this.bossExt(bd,e.final);if(Math.random()<(e.final?.3:.2)+.08*e.phase+.05*e.tf)pat=ext[Math.floor(Math.random()*ext.length)];}
    e.lp=pat;       /* last pattern: the renderer picks the strike / special frame of the Tamagami art from it */
    const sh=(a,s,r,c)=>this.eb.push({x:e.x,y:e.y-e.r,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:r||7,dmg:d,life:6,c:c||bd.c,bs:1});
    /* move name above the boss (a boss can rename a move with bd.lb) and a charged beam */
    const lab=(it,en)=>this.floatText(e.x,e.y-e.r*2.4,this.env.tr((bd.lb&&bd.lb[pat])||T(it,en)),1);
    const jb=(ch,fi,w,len,mul,col)=>{this.jbeams.push({x:e.x,y:e.y-e.r*.6,a:aim,t:0,charge:ch,fire:fi,w,len,col:col||bd.c,dmg:zd*mul,e,hcd:0});e.stun=ch+fi+.15;this.audio.sfx('xcharge');this.ring(e.x,e.y,60+w,col||bd.c,.5);};
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
      case'wall':{const px=-Math.sin(aim),py=Math.cos(aim),gap=Math.floor(rnd(-3,4));lab('Muro di ki!','Ki wall!');
        for(let o=-5;o<=5;o++){if(Math.abs(o-gap)<=1)continue;this.eb.push({x:e.x+px*o*38,y:e.y-e.r+py*o*38,vx:Math.cos(aim)*150,vy:Math.sin(aim)*150,r:8,dmg:d,life:7,c:bd.c,bs:1});}break;}
      case'crossbeam':{const o=rnd(0,TAU);lab('Raggi incrociati!','Cross beams!');
        for(let k=0;k<4;k++)for(let i=1;i<=6;i++)this.bz.push({x:e.x+Math.cos(o+k*Math.PI/2)*i*100,y:e.y+Math.sin(o+k*Math.PI/2)*i*100,r:54,t:0,dur:.85+i*.09,dmg:zd,c:bd.c});this.audio.sfx('warn');break;}
      case'rush':{lab('Lampo!','Flash step!');this.ring(e.x,e.y,60,bd.c,.4);
        const a=rnd(0,TAU);e.x=p.x+Math.cos(a)*170;e.y=p.y+Math.sin(a)*170;this.ring(e.x,e.y,60,'#ffffff',.4);this.burst(e.x,e.y-e.r,16,bd.c);
        const a2=Math.atan2(p.y-18-e.y,p.x-e.x);for(let i=-2;i<=2;i++)sh(a2+i*.2,250,7);this.audio.sfx('leap');break;}
      case'homing':{lab('Sfere a ricerca!','Seeker orbs!');
        for(let i=0;i<4;i++){const a=aim+(i-1.5)*.55;this.eb.push({x:e.x,y:e.y-e.r,vx:Math.cos(a)*150,vy:Math.sin(a)*150,r:9,dmg:d,life:5.5,c:'#ffffff',bs:1,hm:2.4});}break;}
      case'vortex':{lab('Vortice!','Vortex!');this.vortex={x:e.x,y:e.y,t:0,dur:1.4,R:300,col:bd.c};this.bz.push({x:e.x,y:e.y,r:150,t:0,dur:1.4,dmg:zd*1.1,c:bd.c});this.audio.sfx('xcharge');break;}
      case'encircle':{lab('Cerchio mortale!','Death circle!');
        for(let i=0;i<8;i++){const a=i/8*TAU+rnd(0,.3);this.bz.push({x:p.x+Math.cos(a)*135,y:p.y+Math.sin(a)*135,r:62,t:0,dur:1.15,dmg:zd,c:bd.c});}this.audio.sfx('warn');break;}
      case'jsword':{lab('Fendente!','Slash!');
        const c=Math.cos(aim),s2=Math.sin(aim);
        for(let k=0;k<3;k++){const off=e.r+30+k*58;this.bz.push({x:e.x+c*off,y:e.y+s2*off,r:60+k*8,t:0,dur:.36+k*.15,dmg:zd*1.2,c:bd.c});}
        e.dashT=.4;this.slashFx(e,aim);this.audio.sfx('leap');break;}
      case'jbeam':{lab('Raggio di Janemba!','Janemba beam!');
        this.jbeams.push({x:e.x,y:e.y-e.r*.6,a:aim,t:0,charge:1.0,fire:.7,w:30,len:1300,col:bd.c,dmg:zd*1.25,e,hcd:0});
        e.stun=1.0+.7+.15;this.audio.sfx('xcharge');this.ring(e.x,e.y,90,bd.c,.5);break;}
      case'psy':{lab('Psicocinesi!','Psychokinesis!');const n=14,o=rnd(0,TAU);for(let i=0;i<n;i++)sh(o+i/n*TAU,105,8,'#ff7ad0');sh(aim,200,9,'#ff7ad0');break;}
      case'kienz':{lab('Disco Distruttore!','Death Saucers!');for(let i=-2;i<=2;i++)this.eb.push({x:e.x,y:e.y-e.r,vx:Math.cos(aim+i*.3)*230,vy:Math.sin(aim+i*.3)*230,r:9,dmg:d,life:5,c:'#ffffff',bs:1,hm:1.6});break;}
      case'fbeam':{lab('Raggio mortale!','Death Beam!');
        this.jbeams.push({x:e.x,y:e.y-e.r*.6,a:aim,t:0,charge:.7,fire:.3,w:11,len:1000,col:bd.c,dmg:zd*1.2,e,hcd:0});e.stun=1.25;this.audio.sfx('xcharge');this.ring(e.x,e.y,70,bd.c,.4);break;}
      case'dball':{lab('Sfera della Morte!','Death Ball!');
        this.bz.push({x:p.x,y:p.y,r:190,t:0,dur:1.9,dmg:zd*1.4,c:bd.c});this.bz.push({x:p.x+rnd(-130,130),y:p.y+rnd(-100,100),r:96,t:0,dur:1.5,dmg:zd,c:bd.c});this.audio.sfx('warn');break;}
      case'fnova':{lab('Supernova!','Supernova!');
        this.bz.push({x:e.x,y:e.y,r:320,t:0,dur:1.7,dmg:zd*1.3,c:bd.c});for(let i=0;i<20;i++)sh(i/20*TAU,150,8);this.audio.sfx('warn');this.shake=Math.max(this.shake,.2);break;}
      case'ckame':{lab('Kamehameha di Cell!','Cell Kamehameha!');
        this.jbeams.push({x:e.x,y:e.y-e.r*.6,a:aim,t:0,charge:1.25,fire:.6,w:38,len:1200,col:bd.c,dmg:zd*1.35,e,hcd:0});e.stun=1.25+.6+.15;this.audio.sfx('xcharge');this.ring(e.x,e.y,90,bd.c,.5);break;}
      case'cjr':{lab('Cell Jr.!','Cell Jrs.!');let k=0;for(const o of this.en)if(o.par===e&&!o.dead)k++;
        for(let i=0;i<3&&k+i<6;i++){const a=rnd(0,TAU),m=this.mkEnemy(ENEMIES.cellbomb,e.x+Math.cos(a)*(e.r+24),e.y+Math.sin(a)*(e.r+16));m.par=e;m.sum=1;m.age=0;this.en.push(m);this.ring(m.x,m.y,24,bd.c,.35);}this.audio.sfx('shrine');break;}
      case'ctail':{lab('Colpo di coda!','Tail whip!');const c=Math.cos(aim),s2=Math.sin(aim);
        for(let k=0;k<4;k++){const off=e.r+16+k*46;this.bz.push({x:e.x+c*off,y:e.y+s2*off,r:54,t:0,dur:.3+k*.1,dmg:zd*1.1,c:bd.c});}e.dashT=.35;this.slashFx(e,aim);this.audio.sfx('leap');break;}
      case'cregen':{lab('Rigenerazione!','Regeneration!');e.hp=Math.min(e.max,e.hp+e.max*.025);this.ring(e.x,e.y,120,'#8be07a',.6);this.burst(e.x,e.y-e.r,16,'#8be07a');{const n=12,o=rnd(0,TAU);for(let i=0;i<n;i++)sh(o+i/n*TAU,140,7);}break;}
      case'solar':{lab('Taiyoken!','Solar Flare!');this.flash=.55;this.flashC='#ffffff';
        for(let i=0;i<5;i++){const a=rnd(0,TAU),r=i?rnd(60,200):0;this.bz.push({x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r,r:70,t:0,dur:1.1+i*.1,dmg:zd,c:bd.c});}this.audio.sfx('warn');break;}
      /* Tamagami: hammer slam (No. 3), crimson palm blasts (No. 3), sword wave (No. 2), bullet storm (No. 2) */
      case'hammer':{lab('Martello!','Hammer!');
        this.bz.push({x:p.x,y:p.y,r:125,t:0,dur:1.4,dmg:zd*1.3,c:bd.c});this.bz.push({x:p.x+Math.cos(aim)*-110,y:p.y+Math.sin(aim)*-110,r:90,t:0,dur:1.7,dmg:zd,c:bd.c});this.audio.sfx('warn');break;}
      case'palm':{lab('Onde cremisi!','Crimson blasts!');for(let k=-1;k<=1;k+=2)for(let i=0;i<3;i++)sh(aim+k*.14+(i-1)*.06,250+i*30,7,'#ff4a4a');break;}
      case'swordwave':{lab('Onda di spada!','Sword wave!');const px=-Math.sin(aim),py=Math.cos(aim);
        for(let o=-5;o<=5;o++)this.eb.push({x:e.x+px*o*34,y:e.y-e.r+py*o*34,vx:Math.cos(aim)*(215-Math.abs(o)*6),vy:Math.sin(aim)*(215-Math.abs(o)*6),r:8,dmg:d,life:6,c:'#d8c8ff',bs:1});this.slashFx(e,aim);this.audio.sfx('leap');break;}
      case'bulletstorm':{lab('Raffica di energia!','Energy barrage!');for(let i=0;i<9;i++)sh(aim+rnd(-.5,.5),rnd(250,340),6,'#c8a8ff');break;}
      case'storm':{e.spin+=.4;for(let i=0;i<5;i++)sh(e.spin+i*TAU/5,175,6);sh(aim,300,8);break;}
      /* canonical moves of the androids, the Kaioshin, Champa and Zeno-sama */
      case'dbomber':{lab('Bomba Mortale!','Deadly Bomber!');this.eb.push({x:e.x,y:e.y-e.r,vx:Math.cos(aim)*150,vy:Math.sin(aim)*150,r:15,dmg:d*1.4,life:6.5,c:'#ff3b3b',bs:1,hm:2.2});this.audio.sfx('xcharge');break;}
      case'sdh':{lab('Martello Mortale!','Deadly Hammer!');this.bz.push({x:p.x,y:p.y,r:112,t:0,dur:1.3,dmg:zd*1.35,c:bd.c});this.bz.push({x:p.x+Math.cos(aim)*-120,y:p.y+Math.sin(aim)*-120,r:84,t:0,dur:1.55,dmg:zd,c:bd.c});this.audio.sfx('warn');break;}
      case'slice':{lab('Attacco a Fendente!','Slicing Attack!');const c=Math.cos(aim),s2=Math.sin(aim);
        for(let k=0;k<5;k++){const off=e.r+14+k*50;this.bz.push({x:e.x+c*off,y:e.y+s2*off,r:46+k*3,t:0,dur:.32+k*.1,dmg:zd*1.1,c:bd.c});}
        e.dashT=.4;this.slashFx(e,aim);this.audio.sfx('leap');break;}
      case'achg':{lab('Carica Androide!','Android Charge!');e.dashT=1;for(let i=-2;i<=2;i++)sh(aim+i*.1,310,7);this.audio.sfx('leap');break;}
      case'squall':{lab('Tempesta di Energia!','Energy Squall!');for(let i=0;i<10;i++)sh(aim+rnd(-.45,.45),rnd(230,340),6,'#ffd27a');break;}
      case'mkb':{lab('Colpo di Ki Multiplo!','Multi-step Ki Blast!');for(let st=0;st<3;st++)for(let i=-2;i<=2;i++)sh(aim+i*.17+(st-1)*.05,190+st*55,6);break;}
      case'ffspark':{lab('Cannone Scintilla FF!','F.F. Spark Cannon!');jb(.95,.45,24,1000,1.25,'#8ad8ff');break;}
      case'barrier':{   /* the boss shields himself: most of the damage he takes is absorbed for a moment */
        if((e.barCd||0)>0){sh(aim,260,8);sh(aim+.2,260,8);sh(aim-.2,260,8);break;}
        lab('Barriera!','Barrier!');e.bar=2.4;e.barCd=11;this.ring(e.x,e.y-e.r,e.r*2.2,'#8ad8ff',.5);this.audio.sfx('abBarrier');break;}
      case'rpunch':{lab('Pugno Razzo!','Rocket Punch!');e.dashT=.3;this.eb.push({x:e.x,y:e.y-e.r,vx:Math.cos(aim)*380,vy:Math.sin(aim)*380,r:17,dmg:d*1.5,life:3.2,c:'#cfd8e0',bs:1});for(let i=-1;i<=1;i+=2)sh(aim+i*.2,300,7);this.audio.sfx('leap');break;}
      case'hflash':{lab('Lampo Infernale!','Hell\'s Flash!');jb(1.3,.6,44,1200,1.4);break;}
      case'eyebeam':{lab('Raggio Oculare!','Eye Beam!');jb(.6,.3,10,1000,1.15,'#ff4a4a');break;}
      case'invis':{lab('Raggio Invisibile!','Invisible Eye Blast!');jb(.5,.25,14,900,1.1,'#e8d8ff');break;}
      case'selfd':{   /* only when badly hurt, then not again for a while */
        if(e.hp>e.max*.45||(e.sdCd||0)>0){sh(aim,300,8);sh(aim+.25,300,8);sh(aim-.25,300,8);break;}
        e.sdCd=40;e.stun=Math.max(e.stun||0,3.5);this.say(this.env.tr(T('AUTODISTRUZIONE!','SELF-DESTRUCT!')),'#ffb13b',2,this.env.tr(T('Allontanati dal robot!','Get away from the robot!')));
        this.bz.push({x:e.x,y:e.y,r:340,t:0,dur:3.4,dmg:zd*1.7,c:'#ffb13b'});this.audio.sfx('warn');break;}
      case'kiai':{lab('Kiai!','Kiai!');this.bz.push({x:e.x,y:e.y,r:190,t:0,dur:.8,dmg:zd*1.2,c:bd.c});{const n=16,o=rnd(0,TAU);for(let i=0;i<n;i++)sh(o+i/n*TAU,190,7,'#ffffff');}this.ring(e.x,e.y,150,'#ffffff',.5);this.audio.sfx('warn');break;}
    }
  }
  /* ---------- Room of Spirit and Time: the Master imitates your character ability and your weapons (damage x SPAR_COPY_MUL = 40% less) ---------- */
  sparCopy(e,zd,aim){
    const p=this.p,dm=zd*SPAR_COPY_MUL,ab=ABIL[this.C.id],ws=[...this.weapons.values()];
    if(!ab&&!ws.length)return false;
    const useAb=ab&&(!ws.length||Math.random()<.3);
    let w=null;
    if(!useAb){   /* every weapon you own takes its turn (a shuffled queue), so you see all of them copied */
      if(!e.cpq||!e.cpq.length||e.cpq.some(x=>!this.weapons.has(x.id))){e.cpq=ws.slice();for(let i=e.cpq.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[e.cpq[i],e.cpq[j]]=[e.cpq[j],e.cpq[i]];}}
      w=e.cpq.shift();
    }
    const col=useAb?ab.c:(w.color||'#ffffff'),nm=useAb?ab.n:((WEAPONS[w.id]&&WEAPONS[w.id].n)||T(w.id,w.id));
    this.floatText(e.x,e.y-e.r*2.4,this.env.tr(nm)+'!',1);this.ring(e.x,e.y-e.r,e.r*2.4,col,.45);
    const sh=(a,s,r,ox,oy)=>{const b={x:e.x+(ox||0),y:e.y-e.r+(oy||0),vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:r||7,dmg:dm,life:6,c:col,bs:1,cp:1};this.eb.push(b);return b;};   /* cp: drawn like your own shots */
    const zone=(x,y,r,dur,m)=>this.bz.push({x,y,r,t:0,dur,dmg:dm*(m||1),c:col,cp:1});
    const beam=(ch,fi,wd,len)=>{this.jbeams.push({x:e.x,y:e.y-e.r*.6,a:aim,t:0,charge:ch,fire:fi,w:wd,len,col,dmg:dm*1.2,e,hcd:0,cp:1});e.stun=ch+fi+.15;this.audio.sfx('xcharge');this.ring(e.x,e.y,60+wd,col,.5);};
    const ring=(n,sp)=>{const o=rnd(0,TAU);for(let i=0;i<n;i++)sh(o+i/n*TAU,sp||170,7);};
    const around=(n,rmin,rmax,r,d0,dd,m)=>{for(let i=0;i<n;i++){const a=rnd(0,TAU),rr=i?rnd(rmin,rmax):0;zone(p.x+Math.cos(a)*rr,p.y+Math.sin(a)*rr,r,d0+i*dd,m);}};
    if(useAb){
      switch(ab.m){
        case'beam':case'sbc':beam(1.0,.5,34,1100);break;
        case'nova':ring(20,175);zone(e.x,e.y,200,.9,1.1);break;
        case'sphere':zone(p.x,p.y,170,1.8,1.3);break;
        case'erase':zone(p.x,p.y,150,1.6,1.4);break;
        case'blind':around(4,60,190,70,1.1,.1);this.flash=.35;this.flashC='#ffffff';break;
        case'timestop':around(5,50,220,76,1.0,.18);break;
        case'barrier':if((e.barCd||0)>0){sh(aim,260,8);break;}e.bar=2.2;e.barCd=10;this.ring(e.x,e.y-e.r,e.r*2.2,col,.5);this.audio.sfx('abBarrier');break;
        case'regen':case'absorb':e.hp=Math.min(e.max,e.hp+e.max*.03);this.ring(e.x,e.y,120,col,.6);this.burst(e.x,e.y-e.r,14,col);break;
        case'clones':case'ghosts':for(const o of[-90,90])for(let i=-1;i<=1;i++)sh(aim+i*.14,260,6,o,0);this.ring(e.x-90,e.y,30,col,.3);this.ring(e.x+90,e.y,30,col,.3);break;
        case'dash':e.dashT=1;for(let i=-2;i<=2;i++)sh(aim+i*.1,300,7);this.audio.sfx('leap');break;
        case'crit':case'jackpot':sh(aim,360,11);sh(aim+.12,320,7);sh(aim-.12,320,7);break;
        case'rewind':{const a=rnd(0,TAU);e.x=p.x+Math.cos(a)*190;e.y=p.y+Math.sin(a)*190;this.ring(e.x,e.y,60,col,.4);const a2=Math.atan2(p.y-18-e.y,p.x-e.x);for(let i=-2;i<=2;i++)sh(a2+i*.2,250,7);break;}
        default:{e.dashT=.8;for(let i=-2;i<=2;i++)sh(aim+i*.16,270,8);}   /* kaioken, berserk, buff: he powers up and rushes in */
      }
    }else{
      const kind=SPAR_KIND[w.id]||GHOST_KIND[w.id]||'blast';
      switch(kind){
        case'shot':{const n=Math.min(5,Math.max(2,Math.round(((w.st&&w.st.n&&w.st.n[w.L])||2))));for(let i=0;i<n;i++)sh(aim+(i-(n-1)/2)*.16,280,7);break;}
        case'spear':for(let i=-1;i<=1;i++){const a=aim+i*.14,b=sh(a,430,7);b.spear=a;}break;
        case'beam':beam(.8,.4,30,950);break;
        case'chain':{const c=Math.cos(aim),s2=Math.sin(aim);for(let k=0;k<5;k++)zone(p.x+c*-40*k+rnd(-18,18),p.y+s2*-40*k+rnd(-18,18),52,.55+k*.14);break;}
        case'sphere':zone(p.x,p.y,170,1.9,1.3);break;
        case'ring':ring(14,150);zone(e.x,e.y,130,.8,1.1);break;
        case'flare':around(3,50,150,74,.9,.12);this.flash=.25;this.flashC=col;break;
        case'slash':for(let i=-2;i<=2;i++)sh(aim+i*.18,430,6);this.slashFx(e,aim);break;
        case'grenade':around(3,40,150,62,.9,.25);break;
        case'rewind':{const a=rnd(0,TAU);e.x=p.x+Math.cos(a)*190;e.y=p.y+Math.sin(a)*190;this.ring(e.x,e.y,60,col,.4);const a2=Math.atan2(p.y-18-e.y,p.x-e.x);for(let i=-2;i<=2;i++)sh(a2+i*.2,250,7);break;}
        case'shock':zone(e.x,e.y,175,.9,1.1);ring(16,160);break;
        case'erase':zone(p.x,p.y,140,1.5,1.4);break;
        case'meteor':around(4,50,170,80,1.1,.22);break;
        case'kick':e.dashT=.9;for(let i=-1;i<=1;i++)sh(aim+i*.16,300,8);break;
        default:zone(p.x,p.y,100,1.1,1.1);
      }
    }
    return true;
  }
  /* ---------- signature moves of the bosses (BOSSES[id].sig): every one is announced, telegraphed and has its own animation ----------
     dtoss: Dodoria hurls his whole body at you (3 s of warning, the path is drawn with the width of his body)
     grab:  Dr. Gero lunges, grabs you and drains your life for 3 s (stun him, hit him hard or dash to break free)
     rain:  Super Buu raises a hand and fires a rain of ki upward that falls around you 3 s later */
  startBossMove(e){
    const k=e.bd.sig,p=this.p,tr=o=>this.env.tr(o),nm=tr((BOSSES[e.bid]||e.bd).n),a=Math.atan2(p.y-e.y,p.x-e.x);
    e.sgT=e.bd.sigCd||12;e.vis=null;
    if(k==='dtoss'){e.bm={k,t:0,st:0,a,L:560,ox:e.x,oy:e.y,hit:false,lock:2,warn:BM_DODO_WARN};this.say(nm.toUpperCase()+'!',e.bd.c,2,tr(T('Si prepara a lanciarsi su di te: esci dalla traiettoria!','He is about to hurl himself at you: leave the path!')));}
    else if(k==='grab'){e.bm={k,t:0,st:0,a,L:330,ox:e.x,oy:e.y,hit:false,lock:.7,warn:1.15};this.say(nm.toUpperCase()+'!',e.bd.c,1.8,tr(T('Sta per afferrarti: scatta via!','He is about to grab you: dash away!')));}
    else if(k==='rain'){e.bm={k,t:0,st:0,n:BM_RAIN_N[Math.max(0,['easy','normal','hard','extreme'].indexOf(this.diffId))]||55,fired:0,nx:0};this.say(nm.toUpperCase()+'!',e.bd.c,2,tr(T('Pioggia di ki: tieniti in movimento!','Rain of ki: keep moving!')));}
    else return;
    e.sq=k==='dtoss'?1:0;this.audio.sfx('warn');this.floatText(e.x,e.y-e.r*2.6,'!',1);
  }
  endBossMove(e){e.bm=null;e.vis=null;e.sq=0;}
  updateBossMove(e,dt){
    const m=e.bm,p=this.p;m.t+=dt;
    if(m.k==='dtoss'||m.k==='grab'){
      const tel=m.k==='dtoss',R=tel?e.r*2.6+30:0;
      if(m.st===0){   /* warning: stands still, the aim follows you and then locks */
        e.vis={ox:Math.sin(m.t*(34+m.t*10))*(.6+m.t*(tel?.8:.3)),oy:0,flash:m.t>m.warn*.4,rot:0,sx:1,sy:1};if(tel)e.sq=1;
        if(m.t<m.lock){m.a+=clamp(angDiff(Math.atan2(p.y-e.y,p.x-e.x),m.a),-dt*5,dt*5);m.L=tel?clamp(Math.hypot(p.x-e.x,p.y-e.y)+300,560,900):330;}
        if(!m.b1&&m.t>=m.lock){m.b1=true;this.audio.sfx('warn');this.floatText(e.x,e.y-e.r*2.6,'!!',1);}
        if(this.fx.length<420&&Math.random()<dt*40){const a=rnd(0,TAU),d=e.r*rnd(1.2,2.2),l=.3;this.fx.push({x:e.x+Math.cos(a)*d,y:e.y-e.r+Math.sin(a)*d*.7,vx:-Math.cos(a)*d/l,vy:-Math.sin(a)*d*.7/l,l,m:l,c:tel?'#ff4a4a':'#9cff7a',s:3});}
        if(m.t>=m.warn){m.st=1;m.t=0;m.ox=e.x;m.oy=e.y;e.sq=0;this.audio.sfx('leap');if(tel){this.ring(e.x,e.y,e.r*2,'#ff4a4a',.4);this.shake=Math.max(this.shake,.2);}}
      }else if(m.st===1){   /* the rush */
        const sp=tel?1250:1100,c=Math.cos(m.a),s=Math.sin(m.a),d=Math.min(m.L,m.t*sp),cx=e.x,cy=e.y-e.r*.5;
        e.face=c>=0?1:-1;
        const hr=e.r+(tel?18:22);
        if(!m.hit&&Math.hypot(p.x-cx,p.y-18-cy)<hr+8&&(tel||p.inv<=0)){
          m.hit=true;
          if(tel){this.hurt(e.dmg*2.2,e);this.bv={x:c*620,y:s*620,t:.25};this.shake=Math.max(this.shake,.5);this.burst(p.x,p.y-14,16,'#ff4a4a');}
          else if(!this.dashT&&p.inv<=0&&!this.sb.god){this.held={e,t:0,hp0:e.hp,ticks:0};this.say(this.env.tr(T('PRESO!','GRABBED!')),'#9cff7a',2.4,this.env.tr(T('Stordiscilo, colpiscilo forte o scatta per liberarti','Stun him, hit him hard or dash to break free')));this.audio.sfx('abAbsorb');m.st=2;m.t=0;this.floatText(p.x,p.y-60,'!',3);}
        }
        e.x=m.ox+c*d;e.y=m.oy+s*d;
        e.vis={ox:0,oy:0,flash:false,rot:tel?m.t*20*e.face:0,sx:tel?1:1.12,sy:tel?1:.9};
        if(this.fx.length<440){const col=tel?'#ff8fb8':'#cfd8e0';this.fx.push({x:e.x+rnd(-e.r*.4,e.r*.4),y:e.y-e.r+rnd(-e.r*.5,e.r*.5),vx:rnd(-30,30),vy:rnd(-30,30),l:.3,m:.3,c:col,s:e.r*.22});this.fx.push({x:e.x,y:e.y-e.r*.5,vx:-c*80,vy:-s*80,l:.25,m:.25,c:'#ffffff',s:4});}
        if(d>=m.L&&m.st===1){
          e.vis=null;e.stun=Math.max(e.stun||0,tel?1.5:1.1);this.endBossMove(e);
          if(tel){   /* body slam at the end of the path */
            this.ring(e.x,e.y,R,'#ff8fb8',.55);this.ring(e.x,e.y,R*.6,'#ffffff',.4);this.burst(e.x,e.y-6,26,'#ff8fb8');this.shake=Math.max(this.shake,.7);this.audio.sfx('boom');
            if(!m.hit&&Math.hypot(p.x-e.x,p.y-e.y)<R)this.hurt(e.dmg*1.2,e);
          }else this.floatText(e.x,e.y-e.r*2.4,this.env.tr(T('Mancato!','Missed!')),1);
        }
      }else{ /* grab: the hold itself is run by updateHeld */
        if(!this.held||this.held.e!==e)this.endBossMove(e);else{e.vis={ox:0,oy:0,flash:false,rot:0,sx:1,sy:1};}
      }
      return;
    }
    if(m.k==='rain'){
      const hx=e.x+e.face*e.r*1.5,hy=e.y-e.r*2.9;   /* (the raised hand, see Renderer.drawBuuHand) */
      if(m.st===0){   /* the hand goes up and gathers energy */
        e.vis={ox:Math.sin(m.t*50)*.8,oy:0,flash:false,rot:0,sx:1,sy:1};
        if(this.fx.length<420&&Math.random()<dt*50)this.fx.push({x:hx+rnd(-30,30),y:hy+rnd(-26,26),vx:0,vy:0,l:.3,m:.3,c:'#ff7ac0',s:3});
        if(m.t>=.9){m.st=1;m.t=0;this.audio.sfx('xcharge');this.ring(hx,hy,60,'#ff7ac0',.5);}
      }else if(m.st===1){   /* every 0.1 s one ball of ki shoots up from the hand */
        e.vis={ox:0,oy:0,flash:false,rot:0,sx:1,sy:1};
        m.nx-=dt;
        while(m.nx<=0&&m.fired<m.n){m.nx+=.1;m.fired++;this.rain.push({t:0,hx:hx+rnd(-8,8),hy,mk:false,done:false});if(m.fired%3===1)this.audio.sfx('shot');}
        if(m.fired>=m.n){m.st=2;m.t=0;}
      }else{if(m.t>.6)this.endBossMove(e);}
    }
  }
  /* Super Buu's rain: each ball flies up, and 3 s after it was fired it comes down near the player (the spot is marked 1 s before) */
  updateRain(dt){
    const p=this.p;this.rainSfx=Math.max(0,(this.rainSfx||0)-dt);
    for(const r of this.rain){
      r.t+=dt;
      if(!r.mk&&r.t>=2){const a=rnd(0,TAU),d=Math.sqrt(Math.random())*240;r.lx=p.x+Math.cos(a)*d;r.ly=p.y+Math.sin(a)*d*.85;r.mk=true;}
      if(r.t>=3&&!r.done){
        r.done=true;const R=38;
        this.ring(r.lx,r.ly,R*1.2,'#ff7ac0',.3);this.burst(r.lx,r.ly-4,5,'#ffffff');this.burst(r.lx,r.ly-4,4,'#ff7ac0');
        if(this.rainSfx<=0){this.rainSfx=.12;this.audio.sfx('boom');}
        if(Math.hypot(p.x-r.lx,(p.y-r.ly)/.85)<R+10)this.hurt(p.maxHp*.02,{boss:1,pct:1});
        if(this.eb.length)this.cutC(r.lx,r.ly,R);
      }
    }
    if(this.rain.length)this.rain=this.rain.filter(r=>!r.done);
  }
  /* Dr. Gero's hold: 3 s, the life drain comes in 6 ticks (5% / 15% / 25% / 35% of your maximum health by difficulty) and he heals from it */
  updateHeld(dt){
    const h=this.held,p=this.p,e=h.e;
    const free=(why)=>{this.held=null;if(e.bm)this.endBossMove(e);p.inv=Math.max(p.inv,.8);this.floatText(p.x,p.y-60,this.env.tr(why),3);this.bv={x:(p.x>=e.x?1:-1)*420,y:0,t:.2};};
    if(e.dead||this.ended){this.held=null;return;}
    if(e.stun>0)return free(T('Liberato!','Freed!'));
    if(e.hp<h.hp0-e.max*.06)return free(T('Liberato!','Freed!'));
    h.t+=dt;
    p.x=e.x+e.face*(e.r+12);p.y=e.y+2;
    const pct=BM_GERO_DRAIN[Math.max(0,['easy','normal','hard','extreme'].indexOf(this.diffId))]||.15,N=6;
    while(h.ticks<N&&h.t>=(h.ticks+1)*(3/N)){
      h.ticks++;
      if(p.inv<=0&&!this.sb.god){const d=p.maxHp*pct/N;p.hp-=d;this.floatText(p.x,p.y-44,Math.round(d),4);e.hp=Math.min(e.max,e.hp+e.max*.004);this.emote('pain',.6);if(p.hp<=0){this.held=null;this.endBossMove(e);this.lethal();return;}}
      this.audio.sfx('abAbsorb');this.shake=Math.max(this.shake,.15);
      this.fx.push({bolt:true,pts:[[p.x,p.y-14],[(p.x+e.x)/2+rnd(-10,10),(p.y+e.y)/2-18+rnd(-8,8)],[e.x,e.y-e.r]],l:.4,m:.4,c:'#9cff7a'});
      for(let i=0;i<4&&this.fx.length<440;i++)this.fx.push({x:p.x+rnd(-8,8),y:p.y-rnd(0,24),vx:(e.x-p.x)*2.4,vy:(e.y-e.r-p.y)*2.4,l:.4,m:.4,c:'#9cff7a',s:3});
    }
    if(h.t>=3)free(T('Libero!','Released!'));
  }
  bossExt(bd,final){
    if(bd.ext)return bd.ext;   /* a boss with its own list of special moves (the androids, the Kaioshin ...) */
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
  /* boss that changes into its true form (Janemba): the same long charge-up as a power-up, then the form swap */
  startBossMorph(e){
    {const R=e.bd.xr||3.4;e.xf={t:0,dur:R+.8,rel:R,released:false,morph:true};}e.eb=0;this.eb=[];this.bz=[];this.jbeams=[];
    this.say(this.env.tr(e.bd.n)+' '+this.env.tr(T('si sta trasformando!','is transforming!')),e.bd.c,3.2);
    this.audio.sfx('xcharge');this.ring(e.x,e.y,180,e.bd.c,1);this.pillar(e.x,e.y,e.bd.c,1.2);
  }
  slashFx(e,aim){
    for(let i=-7;i<=7;i++){if(this.fx.length>460)break;const a=aim+i*.15,d=e.r+46+Math.abs(i)*1.5;
      this.fx.push({x:e.x+Math.cos(a)*d,y:e.y-e.r*.5+Math.sin(a)*d*.8,vx:Math.cos(a)*60,vy:Math.sin(a)*40,l:.3,m:.3,c:i%2?'#ffffff':e.bd.c,s:5});}
  }
  updateBeams(dt){
    if(!this.jbeams.length)return;
    const p=this.p;
    for(const b of this.jbeams){
      b.t+=dt;const e=b.e;
      if(!e||e.dead||e.xf){b.t=b.charge+b.fire+1;continue;}
      b.x=e.x;b.y=e.y-e.r*.6;
      if(b.t<b.charge){const ta=Math.atan2(p.y-14-b.y,p.x-b.x);let d=ta-b.a;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;b.a+=d*Math.min(1,dt*3);}
      else{
        if(!b.shot){b.shot=true;this.shake=Math.max(this.shake,.5);this.flash=.25;this.flashC=b.col;this.audio.sfx('boom');this.burst(b.x+Math.cos(b.a)*30,b.y+Math.sin(b.a)*30,18,b.col);}
        b.hcd=(b.hcd||0)-dt;
        const dx=p.x-b.x,dy=p.y-14-b.y,c=Math.cos(b.a),s2=Math.sin(b.a),al=dx*c+dy*s2,pe=Math.abs(-dx*s2+dy*c);
        if(al>0&&al<b.len&&pe<b.w+8&&b.hcd<=0){b.hcd=.3;this.hurt(b.dmg,{bs:1});}
      }
    }
    this.jbeams=this.jbeams.filter(b=>b.t<b.charge+b.fire);
  }
  updateBossXform(e,dt){
    const x=e.xf;x.t+=dt;const c=Math.min(1,x.t/x.rel),col=e.bd.c;
    if(x.morph&&!x.released&&x.t>=x.rel){x.released=true;this.bossTransform(e);e.xf=null;return;}
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
  /* a boss changes form (v55): it recovers 50% of its health and every stat grows by 20% (health, damage, speed, armor); the Freezer and Cell lines
     gain only 2.5% speed (`spdK` in their definitions). The new form brings the look, the attack patterns and the name; the numbers come from the rule. */
  bossTransform(e){
    const nb=BOSSES[e.bd.p2],old=e.bd,K=TRANS_K;e.p2=!nb.p2;e.pf=(e.pf||0)+1;
    e.bd=Object.assign({},nb,{id:old.id,hp:old.hp});
    e.r=nb.r;e.spd*=(nb.spdK||old.spdK||K);e.dmg*=K;e.armor*=K;e.sh=.8;e.phase=0;e.stun=1.2;e.esid=undefined;e.pwUntil=this.t+1.2;     /* new sheet (Fury) and a power-up pose while it changes */
    e.max*=K;e.hp=Math.min(e.max,e.hp*K+e.max*TRANS_HEAL);
    this.ring(e.x,e.y,320,nb.c,.9);this.pillar(e.x,e.y,nb.c,1.4);this.bolt(e.x,e.y-20,300,nb.c,14);this.burst(e.x,e.y-20,50,'#ffffff');
    this.flash=.7;this.flashC=nb.c;this.shake=.8;this.audio.sfx('transform');this.eb=[];
    this.say(this.env.tr(nb.n).toUpperCase()+'!',nb.c,3.4,this.env.tr(T('Recupera il 50% della vita, statistiche +20%','Recovers 50% health, stats +20%')));
    this.floatText(e.x,e.y-e.r*2.4,'+50% HP',1);
  }
  explode(e){
    const p=this.p,rad=e.def.rad;
    e.dead=true;this.ring(e.x,e.y,rad,'#ff9d3a',.4);this.burst(e.x,e.y-6,26,'#ffb13b');this.burst(e.x,e.y-6,14,'#ffffff');
    this.audio.sfx('boom');this.shake=Math.max(this.shake,.25);
    if(Math.hypot(p.x-e.x,p.y-e.y)<rad+8)this.hurt(e.dmg,'explosion');
    this.dropGem(e.x,e.y,e.def.xp*(e.xpm||1)*this.stageXp()*XP_MUL*.5*this.earlyXp());
  }

  /* ---------- main update ---------- */
  update(dt){
    if(this.modal||this.ended)return;
    const rdt=dt;if(this.dying&&this.updateDying(rdt))return;if(this.vic){this.updateVictory(rdt);return;}dt*=this.timeScale;
    if(this.xform&&!this.xform.released)dt*=.4;
    const p=this.p,S=this.S;
    const inTrial=!!this.trial;
    this.rt+=dt;if(!inTrial){const e0=Math.floor(this.t/this.escEvery);this.t+=dt*this.CR;if(!this.endless&&Math.floor(this.t/this.escEvery)>e0){const F=this.escF,pc=x=>Math.round(x*100)+'%';this.say(this.env.tr(T('I nemici si rafforzano! (+'+pc(F.hp)+' vita, +'+pc(F.dmg)+' danni'+(F.arm?', +'+pc(F.arm)+' armatura':'')+' · +'+pc(F.xp)+' EXP)','Enemies grow stronger! (+'+pc(F.hp)+' HP, +'+pc(F.dmg)+' damage'+(F.arm?', +'+pc(F.arm)+' armor':'')+' · +'+pc(F.xp)+' XP)')),'#ffb13b',2.4);}}
    if(dt>0)this.xpRate+=(this.xpAcc/dt-this.xpRate)*(1-Math.exp(-dt/45));this.xpAcc=0;   /* XP income per second, smoothed over ~45 s (calibrates the Endless level curve) */
    if(p.inv>0)p.inv-=dt;
    if(this.shake>0)this.shake-=dt;
    if(this.flash>0)this.flash-=dt;
    if(this.banner){this.banner.t+=dt;if(this.banner.t>this.banner.dur)this.banner=null;}
    if(this.tempBuffs.length){let ch=false;for(const b of this.tempBuffs){b.t-=dt;if(b.t<=0)ch=true;}if(ch){this.tempBuffs=this.tempBuffs.filter(b=>b.t>0);this.recalc();}}
    if(this.riskT>0){this.riskT-=dt;if(this.riskT<=0)this.recalc();}
    if(this.luckT>0){this.luckT-=dt;if(this.luckT<=0)this.recalc();}
    if(this.petLuckT>0){this.petLuckT-=dt;if(this.petLuckT<=0)this.recalc();}
    if(this.emoT>0){this.emoT-=dt;if(this.emoT<=0)this.emo=null;}
    if(this.buffs.dmg>0){this.buffs.dmg-=dt;if(this.buffs.dmg<=0)this.recalc();}
    if(this.buffs.haste>0){this.buffs.haste-=dt;if(this.buffs.haste<=0)this.recalc();}

    let ix=this.input.x,iy=this.input.y;if(this.bers>0){ix=-ix;iy=-iy;}if(this.dying||this.held){ix=0;iy=0;}const il=Math.hypot(ix,iy);if(il>1){ix/=il;iy/=il;}
    const ox0=p.x,oy0=p.y;p.mv=il>.05;const sp=125*S.spd;p.x+=ix*sp*dt;p.y+=iy*sp*dt;
    if(this.bv&&this.bv.t>0){p.x+=this.bv.x*dt;p.y+=this.bv.y*dt;this.bv.t-=dt;}if(!inTrial){World.resolve(this.stage.theme,p,9);this.blockWater(p,ox0,oy0);this.updateLava(dt);}
    if(ix>.1)p.face=1;else if(ix<-.1)p.face=-1;
    if(!(this.trial&&this.trial.zeno))p.hp=Math.min(p.maxHp,p.hp+S.regen*dt);   /* no passive regeneration inside Zeno's Shop */
    if(!inTrial)this.updateZones(dt);
    if(this.kai>0)this.updateKaioken(dt);
    if(this.rain.length)this.updateRain(dt);if(this.held)this.updateHeld(dt);
    this.updateTotemFx(dt);this.updateDanger(dt);this.updateBeams(dt);this.updateBossShock(dt);this.updateAbility(dt);
    if(this.bers>0)this.updateBerserk(dt);else if(this.bersCd>0)this.bersCd-=dt;
    this.updatePet(dt);
    if(this.xform)this.updateXform(rdt);
    if(this.vortex)this.updateVortex(dt);
    if(this.shocks.length)this.updateShocks(dt);

    /* director */
    if(!this.sb.nospawn&&!inTrial){
      /* boss fights: slightly fewer enemies; the final boss brings a bigger crowd instead */
      const fin=this.finalOn?1.5:this.bossAlive>0?.7:1;
      this.updateWave();this.updateElites();this.updateBallPlan();this.updateSuperPlan();
      const wv=this.waveMul();
      this.spAcc+=this.spawnRate()*fin*wv.rate*dt;
      const cap=Math.round(this.spawnCap()*(this.finalOn?1.3:this.bossAlive>0?.8:1)*wv.cap);
      while(this.spAcc>=1){this.spAcc-=1;if(this.en.length<cap)this.spawnOne();}
      if(this.t>=this.hordeT){this.hordeT+=(110-12*this.sd)*1.35*Math.sqrt(this.TS)*this.evK;this.spawnHorde();}
      if(this.t>=this.packT){this.packT+=65*this.evK;this.spawnPack();}
    }
    for(const b of this.bossQ)if(!inTrial&&!b.done&&this.t>=b.t){b.done=true;this.spawnBoss(b.id,b.final,undefined,b.k);}

    /* trinket specials */
    if(this.trinkets.length){
      if(this.has('shock')){this.shockCd-=dt;if(this.shockCd<=0){this.shockCd=8;this.ring(p.x,p.y,230,'#c05aff',.5);for(const e of this.en){if(e.dead)continue;const dx=e.x-p.x,dy=e.y-p.y;if(dx*dx+dy*dy<(230+e.r)**2)this.hit(e,12+this.lvl*1.4,dx*.5,dy*.5);}}}
      if(this.has('slowtime')){this.slowCd-=dt;if(this.slowCd<=0){this.slowCd=20;this.slowT=4;this.floatText(p.x,p.y-60,this.env.tr(T('Tempo rallentato','Time slowed')),2);}}
      if((this.has('barrier')||this.totemFx.guard)&&!this.barrierReady){this.barrierT-=dt;if(this.barrierT<=0)this.barrierReady=true;}
    }
    if(this.slowT>0)this.slowT-=dt;
    for(const k in this.lootCd)if(this.lootCd[k]>0)this.lootCd[k]-=dt;
    if(this.streak>0){this.streakT-=dt;if(this.streakT<=0)this.streak=0;}if(this.streakPop>0)this.streakPop-=dt;
    if(this.cstk>0){this.cstkT-=dt*CK_DRAIN;if(this.cstkT<=0){this.cstk=0;this.cstkT=0;}}
    /* the stage's own Dragon Ball event (see events.js): every few minutes, 30-45 seconds */
    if(!inTrial)this.evUpdate(dt);
    /* ranged-enemy wave: 60 seconds (first stage: 30), then they leave */
    if(!inTrial){
      if(this.shootOn){this.shootQT-=dt;if(this.shootQT<=0){this.shootQT+=8;this.shootQ=4;}}   /* 4 shooters per 8 s (first stage) */
      if(!this.shootOn){this.shootT-=dt;if(this.shootT<=0){if(this.stage.roster.some(r=>(ENEMIES[r[0]].ai==='ranged'||ENEMIES[r[0]].ai==='hover')&&this.t>=r[1])&&!this.bossAlive){this.shootOn=true;this.shootEnd=this.t+(this.stage.no===1?30:60);this.shootQ=4;this.shootQT=8;}else this.shootT=20;}}
      else if(this.t>=this.shootEnd){this.shootOn=false;this.shootT=rnd(240,340)*this.evK;for(const e of this.en)if(!e.boss&&(e.ai==='ranged'||e.ai==='hover')){e.dead=true;this.burst(e.x,e.y-8,5,'#6ad0ff');}}
    }
    /* glossary: remember enemies the player has actually met */
    this.seenT-=dt;
    if(this.seenT<=0){
      this.seenT=.5;
      if(!this.sandbox){const vr=this.viewR*1.1,p0=this.p;for(const e of this.en){const id=e.boss?e.bd.id:e.def.id;if(id&&!this.save.seen[id]&&Math.hypot(e.x-p0.x,e.y-p0.y)<vr){this.save.seen[id]=1;this.newSeen=true;}}}
      if(this.newSeen){this.newSeen=false;this.progress.save.write();}
    }

    if(p.atk>0)p.atk-=dt;
    if(this.fireT>0)this.fireT-=dt;
    const pn=this.pr.length;
    if(!this.dying)for(const w of this.weapons.values()){const n0=this.pr.length,cd0=w.cd;this.curW=w.id;w.update(dt);for(let i=n0;i<this.pr.length;i++)if(!this.pr[i].wid)this.pr[i].wid=w.id;if(w.cd>cd0+.02&&w.cd>.6&&ARM_FIRE[w.id])this.armFire(w);}
    this.curW=null;
    if(this.pr.length>pn||this.cast)p.atk=.34;
    this.updateProjectiles(dt);
    this.updateEnemies(dt);
    this.updateBullets(dt);
    if(!inTrial){this.updatePickups(dt);this.map.update(dt);}

    /* aura particles */
    if(this.formIdx>=0&&this.fx.length<380){this.auraAcc+=dt*(14+this.formIdx*4)*(FXL.on?.3:1);while(this.auraAcc>=1){this.auraAcc-=1;this.fx.push({x:p.x+rnd(-12,12),y:p.y-rnd(0,30),vx:rnd(-10,10),vy:-rnd(40,110),l:rnd(.4,.8),m:.8,c:this.formColor,s:rnd(2,4)});}}
    for(const f of this.fx){f.l-=dt;if(f.vx!==undefined){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.92;f.vy*=.92;}}
    this.fx=this.fx.filter(f=>f.l>0);
    for(const t of this.tx)t.t+=dt;
    this.tx=this.tx.filter(t=>t.t<t.l);
    this.en=this.en.filter(e=>!e.dead);this.pr=this.pr.filter(b=>!b.dead);this.eb=this.eb.filter(b=>!b.dead);
    this.gm=this.gm.filter(g=>!g.dead);this.loot=this.loot.filter(l=>!l.dead);this.chests=this.chests.filter(c=>!c.dead);

    if(inTrial&&this.trial){
      const tr=this.trial,cl=o=>{const dx=o.x-tr.cx,dy=o.y-tr.cy,d=Math.hypot(dx,dy);if(d>tr.R){o.x=tr.cx+dx/d*tr.R;o.y=tr.cy+dy/d*tr.R;}};
      tr.t+=dt;cl(p);for(const e of this.en)cl(e);
      if(tr.zeno)this.updateZeno(dt,tr);
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
  /* ability cooldown: base x0.455 (-35% in v53), then -0.2 s per level up to -10 s in total (never below half of the base) */
  cdFor(base){const b=base*ABIL_CD_K,r=Math.min(10,Math.max(0,this.lvl-1)*.2);return Math.round(Math.max(b*.5,b-r)*10)/10;}
  get abCdMax(){const a=this.abil;return a&&a.cd?this.cdFor(a.cd):0;}
  /* the ability grows with the transformation line: 0 = base, 1 = middle form (new passive), 2 = final form (empowered ability) */
  get abTier(){const n=(LINES[this.C.line||'saiyan']||[]).length,i=this.formIdx;if(i<0||!n)return 0;return i>=n-1?2:i>=Math.floor((n-1)/2)?1:0;}
  /* the middle-form passive of the character ability: x1.5 at the start, +5% of the base per level, up to Lv 100 (x6.45) */
  passK(){return 1.5+.05*(Math.min(100,this.lvl)-1);}
  abPassive(S){
    if(this.abTier<1)return;
    const k=this.passK();
    switch(this.abil.m){
      case'beam':S.area*=1+.12*k;break;
      case'regen':S.regen+=.6*k;break;
      case'blind':S.dodge=Math.min(.75,S.dodge+.1*k);break;
      case'dash':S.spd*=1+.08*k;break;
      case'clones':case'ghosts':S.might*=1+.08*k;S.spd*=1+.06*k;break;
      case'sbc':S.might*=1+.07*k;S.crit+=.04*k;break;
      case'sphere':S.might*=1+.06*k;S.area*=1+.08*k;break;
      case'crit':S.crit+=.06*k;break;
      case'barrier':S.taken*=Math.max(.4,1-.15*k);break;
      case'timestop':S.cd=Math.max(this.cdMin(.3),S.cd*Math.max(.5,1-.08*k));break;
      case'erase':S.might*=1+.1*k;break;
      case'rewind':S.dodge=Math.min(.75,S.dodge+.08*k);S.regen+=.4*k;break;
      case'jackpot':S.gold+=.15*k;S.luck=Math.min(.9,S.luck+.04*k);break;
      case'buff':S.might*=1+.08*k;break;
      case'berserk':S.might*=1+.12*k;break;
    }
  }
  get kaiAvail(){return this.abil.m==='kaioken'&&this.formsUnlocked>=1;}
  /* Broly: BERSERK, 6 seconds (8 in the final form), cannot be cancelled. Controls are inverted, he lashes out at random enemies and the aim of every weapon is off (aimJit). */
  /* weapon animations (pose.js): armAct starts a pose of the arms toward angle a; armFire plays the pose of a weapon that has just fired toward the nearest enemy */
  armAct(st,a,o){this.pa=Object.assign({st,a,t0:this.rt,w:0,h:.16,r:.16,col:this.formColor||'#ffd24a',alt:0,ball:0},o||{});}
  armFire(w){
    const f=ARM_FIRE[w.id],p=this.p,t=this.nearest(p.x,p.y,700),a=t?Math.atan2(t.y-8-(p.y-18),t.x-p.x):(p.face>0?0:Math.PI);
    this.armAct(f.st,a,{w:f.w||0,h:f.h,r:f.r,col:w.color,ball:f.ball|0,alt:f.alt?(w.alt=!w.alt)|0:0});
  }
  aimJit(){return this.bers>0?rnd(-BERS_AIM,BERS_AIM):0;}
  get berAvail(){return this.C.id==='broly';}
  get bersCdMax(){return this.cdFor(45);}
  startBerserk(){
    if(this.abBlocked())return false;
    if(this.bers>0||this.bersCd>0||this.modal||this.ended||this.xform)return false;
    const p=this.p,f2=this.abTier>=2;this.bersMax=f2?BERS_T2:BERS_T;this.bers=this.bersMax;this.bersT=.15;if(f2)p.inv=Math.max(p.inv,1.5);this.recalc();
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
      const bk=this.abTier>=2?1.5:1;this.explodeAt(tx,ty,115*bk,(34+this.lvl*3)*bk,'#9aff4a');this.audio.sfx('boom');this.shake=Math.max(this.shake,.25);
    }
    if(Math.random()<dt*6)this.bolt(p.x,p.y-24,120,'#c8ff6a',2);
    if(this.fx.length<420&&Math.random()<dt*50*(FXL.on?.3:1))this.fx.push({x:p.x+rnd(-16,16),y:p.y-rnd(0,36),vx:rnd(-24,24),vy:-rnd(80,200),l:rnd(.4,.8),m:.8,c:Math.random()<.35?'#eaffb0':'#6aff3a',s:rnd(2,5)});
    if(this.bers<=0){this.bers=0;this.bersCd=this.bersCdMax;this.bv=null;this.recalc();this.say(this.env.tr(T('Il controllo è tornato.','Control regained.')),'#cfe8b0',2);this.ring(p.x,p.y,120,'#cfe8b0',.5);}
  }
  /* the single ability key: every character has its own ability (see ABIL in data.js) */
  toggleKaioken(){return this.useAbility();}
  kaiToggle(){
    if(!this.kaiAvail||this.modal||this.ended||this.xform)return false;
    if(this.kai===0&&this.p.hp<this.p.maxHp*.2){this.floatText(this.p.x,this.p.y-56,this.env.tr(T('Troppo debole!','Too weak!')),3);return false;}
    this.kai=(this.kai+1)%3;if(this.kai===2)this.run.k20=(this.run.k20||0)+1;this.recalc();
    const p=this.p;
    if(this.kai>0){
      this.ring(p.x,p.y,this.kai===1?160:240,'#ff3b2f',.6);this.burst(p.x,p.y-18,this.kai===1?20:36,'#ff3b2f');this.pillar(p.x,p.y,'#ff3b2f',.6);this.shake=Math.max(this.shake,this.kai===1?.2:.4);
      this.say('KAIOKEN x'+(this.kai===1?10:20)+'!','#ff3b2f',1.8);this.audio.sfx(this.kai===1?'kaioken':'kaioken2');this.emote('smug',1.2);
    }else{this.say(this.env.tr(T('Kaioken disattivato','Kaioken off')),'#ffb0a0',1.4);this.audio.sfx('click');this.ring(p.x,p.y,90,'#ffb0a0',.4);}
    return true;
  }
  /* HP lost per second: 4 (x10) / 8 (x20); middle form -30%, final form -55% */
  get kaiDrain(){const kt=this.abil.m==='kaioken'?this.abTier:0;return(this.kai===1?4:8)*(kt>=2?.45:kt>=1?.7:1);}
  updateKaioken(dt){
    const p=this.p;
    p.hp-=this.kaiDrain*dt;
    if(this.fx.length<400&&Math.random()<dt*(this.kai===1?22:44)*(FXL.on?.3:1))this.fx.push({x:p.x+rnd(-14,14),y:p.y-rnd(0,34),vx:rnd(-20,20),vy:-rnd(60,160),l:rnd(.3,.6),m:.6,c:Math.random()<.4?'#ffb0a0':'#ff3b2f',s:rnd(2,4)});
    if(p.hp<=p.maxHp*.1){this.kai=0;this.recalc();this.say(this.env.tr(T('Kaioken interrotto: vita troppo bassa!','Kaioken stopped: HP too low!')),'#ffb0a0',2);}
  }
  /* ---------- pet ---------- */
  initPet(id){
    const d=PETS.find(x=>x.id===id);
    if(!d||id==='none'){this.pet=null;return;}
    this.pet={d,x:this.p.x-34,y:this.p.y+4,cd:d.cd*.35,t:0,face:1,fl:0,act:0};
  }
  /* the companion goes for XP gems the player cannot reach, carries up to PET_CARRY of them above its head and hands them over (they fly the last bit to you);
     and when five or more enemies close in from three sides it releases a shockwave (every 5 s) */
  petFindGem(q){
    const p=this.p;let b=null,bd=1e9;
    for(const g of this.gm){
      if(g.dead||g.att||g.held)continue;
      const dp=Math.hypot(g.x-p.x,g.y-p.y);if(dp<=this.S.magnet+8||dp>PET_SEEK)continue;   /* inside your own pick-up range it is yours anyway */
      const d=Math.hypot(g.x-q.x,g.y-q.y);if(d<bd){bd=d;b=g;}
    }
    return b;
  }
  petRelease(q){for(const g of q.hold){g.held=false;g.att=true;}q.hold.length=0;q.tg=null;}
  updatePet(dt){
    const q=this.pet;if(!q)return;
    const p=this.p;q.t+=dt;if(q.cd>0)q.cd-=dt;if(q.fl>0)q.fl-=dt;if(q.act>0)q.act-=dt;if(q.sw>0)q.sw-=dt;if(q.seekT>0)q.seekT-=dt;
    q.hold=(q.hold||[]).filter(g=>!g.dead);
    if(this.trial){if(q.hold.length)this.petRelease(q);}
    const tx=p.x-p.face*34+Math.sin(q.t*1.7)*8,ty=p.y+8+Math.cos(q.t*2.3)*5;
    const dx=tx-q.x,dy=ty-q.y,d=Math.hypot(dx,dy);
    let chase=null;
    if(!this.trial&&q.hold.length<PET_CARRY&&!(q.seekT>0)){
      if(!q.tg||q.tg.dead||q.tg.att||q.tg.held||Math.hypot(q.tg.x-p.x,q.tg.y-p.y)>PET_SEEK+30)q.tg=this.petFindGem(q);
      chase=q.tg;
      if(chase&&d>PET_SEEK+160){q.tg=null;chase=null;q.seekT=1.5;}   /* too far from you: give up for a moment */
    }
    if(chase){
      const gx=chase.x-q.x,gy=chase.y-q.y,gd=Math.hypot(gx,gy)||1,st=Math.min(gd,PET_SPD*dt);
      q.x+=gx/gd*st;q.y+=gy/gd*st;if(Math.abs(gx)>3)q.face=gx>0?1:-1;
      if(gd<14){chase.held=true;q.hold.push(chase);q.tg=null;if(this.fx.length<380)this.fx.push({x:q.x,y:q.y-14,vx:0,vy:-30,l:.35,m:.35,c:'#9adfff',s:3});}
    }else{
      if(d>420){q.x=tx;q.y=ty;}else{const k=Math.min(1,dt*(d>60?5:3));q.x+=dx*k;q.y+=dy*k;}
      if(Math.abs(dx)>3)q.face=dx>0?1:-1;
      /* back at your side: hand the gems over */
      if(q.hold.length&&Math.hypot(p.x-q.x,p.y-q.y)<58)this.petRelease(q);
    }
    q.hold.forEach((g,i)=>{g.x=q.x;g.y=q.y-24-i*7;});
    if(this.trial)return;
    /* surrounded: five or more enemies close to you, spread over at least three sides */
    if(!(q.sw>0)){
      let n=0,qm=0;
      for(const e of this.en){if(e.dead)continue;const ex=e.x-p.x,ey=e.y-p.y;if(ex*ex+ey*ey<(PET_SW_NEAR+e.r)**2){n++;qm|=1<<((ex>=0?1:0)+(ey>=0?2:0));}}
      const quad=(qm&1)+((qm>>1)&1)+((qm>>2)&1)+((qm>>3)&1);
      if(n>=PET_SW_N&&quad>=3){
        q.sw=PET_SW_CD;q.act=.5;q.fl=.4;const c=q.d.c,R=PET_SW_R;
        this.ring(p.x,p.y,R,c,.55);this.ring(p.x,p.y,R*.6,'#ffffff',.35);this.burst(q.x,q.y-12,12,c);this.audio.sfx('shrine');this.shake=Math.max(this.shake,.18);
        for(const e of this.en){if(e.dead)continue;const ex=e.x-p.x,ey=e.y-p.y;if(ex*ex+ey*ey<(R+e.r)**2){this.hit(e,PET_SW_DMG+this.lvl*1.1,ex*.6,ey*.6);e.stun=Math.max(e.stun||0,e.boss?.25:.6);}}
        this.floatText(p.x,p.y-56,this.env.tr(T('Onda d\'urto!','Shockwave!')),1);
      }
    }
  }
  usePet(){
    if(this.abBlocked())return false;
    const q=this.pet;if(!q||q.cd>0||this.modal||this.ended)return false;
    const p=this.p,id=q.d.id,c=q.d.c;q.cd=q.d.cd;q.fl=.5;q.act=.6;
    this.ring(p.x,p.y,90,c,.5);this.burst(q.x,q.y-12,16,c);this.audio.sfx('shrine');
    const tr=o=>this.env.tr(o);
    if(id==='dende'){this.heal(p.maxHp*.30);this.floatText(p.x,p.y-56,tr(T('Guarigione!','Healed!')),2);this.pillar(p.x,p.y,'#8be07a',.6);}
    else if(id==='shenron'){for(const g of this.gm){if(Math.hypot(g.x-p.x,g.y-p.y)<400)g.att=true;}this.addXp(this.need*.05/Math.max(.2,this.S.xp));this.floatText(p.x,p.y-56,tr(T('Raccolta Magica!','Magic Gather!')),2);this.pillar(p.x,p.y,'#59d070',.8);this.ring(p.x,p.y,400,'#59d070',.6);}
    else if(id==='droid'){p.inv=Math.max(p.inv,1.5);this.barrierT=Math.max(this.barrierT,0);this.floatText(p.x,p.y-56,tr(T('Scudo!','Shield!')),2);this.ring(p.x,p.y,60,'#8ad8ff',.8);}
    else if(id==='bubbles'){this.petLuckT=50;for(let i=0;i<3;i++)this.loot.push({k:'coin',x:p.x+rnd(-40,40),y:p.y+rnd(-30,30),v:this.coinValue(),t:0});this.recalc();this.floatText(p.x,p.y-56,tr(T('Fortuna +5% (50s)','Luck +5% (50s)')),2);}
    else if(id==='buu'){
      this.ring(p.x,p.y,210,'#ff9ec7',.7);
      for(const e of this.en){if(e.dead)continue;const dx=e.x-p.x,dy=e.y-p.y;if(dx*dx+dy*dy<(210+e.r)**2)e.stun=Math.max(e.stun,e.boss?.4:1);}
      this.floatText(p.x,p.y-56,tr(T('Raggio Caramella!','Candy Beam!')),2);
    }else if(id==='saibaman'){
      this.explodeAt(q.x,q.y-6,160,12+this.lvl*.8,'#ff7a3a');this.shake=Math.max(this.shake,.3);this.audio.sfx('boom');
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
    this.ring(x,y,rad,c,.4);this.burst(x,y,14,c);this.burst(x,y,8,'#ffffff');this.shake=Math.max(this.shake,.12);this.cutC(x,y,rad);
    for(const o of this.en){if(o.dead||o===skip)continue;const dx=o.x-x,dy=o.y-8-y,rr=rad+o.r;if(dx*dx+dy*dy<rr*rr)this.hit(o,dmg,dx*.4,dy*.4);}
  }
  updateProjectiles(dt){
    for(const b of this.pr){
      this.curW=b.wid||null;
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
      if(this.eb.length)this.cutC(b.x,b.y,b.r);   /* a ki shot cancels the enemy bullet it meets (and keeps flying) */
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
    const p=this.p,grid=new Map();this.shotRefill(dt);
    for(const e of this.en){
      if(e.dead)continue;
      const k=(Math.floor(e.x/40)+5000)*10000+(Math.floor(e.y/40)+5000);
      let c=grid.get(k);if(!c){c=[];grid.set(k,c);}c.push(e);
    }
    const vr=this.viewR*1.3,tslow=this.slowT>0;
    for(const e of this.en){
      if(e.atk>0)e.atk-=dt;
      if(e.dead)continue;
      if(e.fl>0)e.fl-=dt;
      const dx=p.x-e.x,dy=p.y-e.y,dist=Math.hypot(dx,dy)||1;
      if(!e.boss&&Math.hypot(dx,dy>0?dy/TOP_K:dy)>vr){   /* it fell off the screen: it does not vanish, it comes back in front of the player (the side they are heading to) */
        const ix=this.input.x,iy=this.input.y,mv=Math.hypot(ix,iy)>.15,a=(mv?Math.atan2(iy,ix):rnd(0,TAU))+rnd(-.9,.9),d=this.viewR+20,[nx,ny]=this.spawnSpot(a,d,0);e.x=nx;e.y=ny;continue;}
      const ux=dx/dist,uy=dy/dist;
      let mx=0,my=0,sp=e.spd*(e.slow>0?.6:1)*(tslow?(e.boss?.75:.55):1);
      if(e.slow>0)e.slow-=dt;
      e.age+=dt;
      if(e.buff>0){e.buff-=dt;sp*=1.3;}
      let sk=null;
      if(!e.boss&&e.sk){if(e.stun>0){if(e.sk.cur&&e.sk.ph===1)this.skEnd(e,true);}else sk=this.skillTick(e,dt,dist,ux,uy);}
      if(e.stun>0){e.stun-=dt;}
      else if(sk&&sk.hold){}
      else if(sk&&sk.mv){mx=sk.mv[0];my=sk.mv[1];sp*=sk.mv[2];}
      else switch(e.ai){
        case'ranged':case'hover':{
          if(e.ai==='hover'){const rad=200,corr=clamp((dist-rad)/rad,-1,1);mx=ux*corr-uy*.8;my=uy*corr+ux*.8;}
          else if(dist>250){mx=ux;my=uy;}else if(dist<190){mx=-ux;my=-uy;}else{mx=-uy*.6;my=ux*.6;}
          e.sh-=dt;
          if(e.sh<=0){
            const s=e.def.shoot,n=this.shotN(s.n);
            if(!this.shotOK(n)||this.eb.length>=EB_CAP)e.sh=.4+rnd(0,.6);   /* the shared budget is empty: try again in a moment */
            else{
              e.sh=s.cd*this.shotCdK()+rnd(0,.8);e.atk=.36;
              const base=Math.atan2(dy,dx);
              if(s.ring){for(let i=0;i<n;i++){const a=i/n*TAU+e.ph;this.eb.push({x:e.x,y:e.y-14,vx:Math.cos(a)*s.spd,vy:Math.sin(a)*s.spd,r:6,dmg:e.dmg,life:5,c:'#c9a0ff'});}}
              else for(let i=0;i<n;i++){const a=base+(i-(n-1)/2)*s.sp;this.eb.push({x:e.x,y:e.y-14,vx:Math.cos(a)*s.spd,vy:Math.sin(a)*s.spd,r:6,dmg:e.dmg,life:5,c:'#6ad0ff'});}
            }
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
          if(e.st===0){mx=ux;my=uy;e.stT-=dt;if(e.stT<=0&&dist>100&&dist<230){e.st=1;e.stT=.55;}}
          else if(e.st===1){e.stT-=dt;e.sq=1;if(e.stT<=0){e.st=2;e.sq=0;const lead=Math.min(1,dist/340),LJ=150,tx0=p.x+(p.vx||0)*.15*lead,ty0=p.y+(p.vy||0)*.15*lead,dd=Math.hypot(tx0-e.x,ty0-e.y)||1,kj=Math.min(1,LJ/dd);   /* a short hop: at most LJ units */
            e.jp={sx:e.x,sy:e.y,tx:e.x+(tx0-e.x)*kj,ty:e.y+(ty0-e.y)*kj,t:0,dur:.42};this.audio.sfx('leap');}}
          else{const j=e.jp;j.t+=dt;e.atk=Math.max(e.atk||0,.4);const k=Math.min(1,j.t/j.dur);e.x=j.sx+(j.tx-j.sx)*k;e.y=j.sy+(j.ty-j.sy)*k;e.zoff=Math.sin(k*Math.PI)*Math.min(34,14+dist*.1);
            if(k>=1){e.zoff=0;e.st=0;e.stT=rnd(3.2,4.6);e.stun=.45;this.ring(e.x,e.y,40,'#ffd9a0',.3);this.burst(e.x,e.y,4,'#d8c8a0');this.audio.sfx('land');
              if(Math.hypot(p.x-e.x,p.y-e.y)<e.r+30)this.hurt(e.dmg*.6,e);e.atk=.6;}}
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
          if(e.bar>0)e.bar-=dt;if(e.barCd>0)e.barCd-=dt;if(e.sdCd>0)e.sdCd-=dt;
          if(e.bd.sig&&!this.trial&&!e.sparring){   /* signature move: wait, warn, do it (see startBossMove) */
            if(e.sgT===undefined)e.sgT=rnd(3.5,6);
            e.sgT-=dt;
            if(e.bm){this.updateBossMove(e,dt);break;}
            if(e.sgT<=0&&dist<640){this.startBossMove(e);break;}
          }
          /* too slow? the boss powers up: heals, gets stronger and learns new attacks */
          if(e.tf<2&&e.hp>e.max*.1&&!this.trial){e.tfT-=dt;if(e.tfT<=0)this.startBossXform(e);}
          if(e.dashT>0){e.dashT-=dt;sp*=3;}
          if(dist>e.r+30){mx=ux;my=uy;}
          if(e.bd.p2&&!e.p2&&e.hp<=e.max*(e.bd.p2at||.5)){if(e.bd.morph){this.startBossMorph(e);break;}this.bossTransform(e);}
          const ratio=e.hp/e.max,ph=ratio<.33?2:ratio<.66?1:0;
          if(ph!==e.phase){e.phase=ph;this.ring(e.x,e.y,160,e.bd.c,.6);this.shake=.3;this.floatText(e.x,e.y-e.r*2,this.env.tr(T('FASE ','PHASE '))+(ph+1),1);}
          e.sh-=dt;if(e.sh<=0){e.sh=e.bd.cd*Math.pow(.88,ph);e.atk=.4;this.bossAttack(e);}
          break;}
        default:mx=ux;my=uy;
      }
      e.x+=mx*sp*dt;e.y+=my*sp*dt;e.mvs=(mx||my)&&!(e.stun>0)?1:0;
      if(Math.abs(mx)>.1)e.face=mx>0?1:-1;
      e.x+=e.kx*dt;e.y+=e.ky*dt;e.kx*=.88;e.ky*=.88;
      if(!e.boss&&!e.def.fly&&e.ai!=='hover'&&!this.trial)World.resolve(this.stage.theme,e,e.r*.55);
      else if(e.boss&&this.stage.theme==='snake')Snake.clamp(e,e.r*.3);
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
      if(e.ai!=='explode'&&!e.under&&dist<e.r+8)this.hurt(e.dmg,e);
    }
  }
  /* ---- enemy fire budget (see SHOT_* above) ---- */
  shotN(n){return Math.max(1,Math.round(n*SHOT_N_K));}
  shotCdK(){return this.stage.theme==='snake'?SHOT_CD_SNAKE:SHOT_CD_K;}
  shotOK(n){
    if(this.sbk==null)this.sbk=this.stage.theme==='snake'?SHOT_BANK_SNAKE:SHOT_BANK;
    if(this.sbk<n)return false;
    this.sbk-=n;return true;
  }
  shotRefill(dt){
    const sn=this.stage.theme==='snake',bank=sn?SHOT_BANK_SNAKE:SHOT_BANK;
    this.sbk=Math.min(bank,(this.sbk==null?bank:this.sbk)+(sn?SHOT_RATE_SNAKE:SHOT_RATE)*dt);
  }
  /* ---- the player's attacks cancel enemy bullets: every weapon reports the area it covers ---- */
  cutOne(b){
    if(b.dead)return;
    b.dead=true;
    if(this.fx.length<(FXL.on?160:380)){this.burst(b.x,b.y,2,b.c);this.fx.push({x:b.x,y:b.y,vx:0,vy:0,l:.16,m:.16,c:'#ffffff',s:b.r*.9});}
  }
  cutC(x,y,r){
    const E=this.eb;if(!E.length)return;
    for(const b of E){if(b.dead)continue;const dx=b.x-x,dy=b.y-y,rr=r+b.r;if(dx*dx+dy*dy<rr*rr)this.cutOne(b);}
  }
  /* a beam: from (ox,oy) along (cs,sn), len long and wid wide */
  cutBeam(ox,oy,cs,sn,len,wid){
    const E=this.eb;if(!E.length)return;
    for(const b of E){if(b.dead)continue;const dx=b.x-ox,dy=b.y-oy,al=dx*cs+dy*sn,pe=-dx*sn+dy*cs;if(al>-10&&al<len&&Math.abs(pe)<wid/2+b.r)this.cutOne(b);}
  }
  /* a cone: radius rad around (x,y), centred on angle ang, half-width half */
  cutArc(x,y,rad,ang,half){
    const E=this.eb;if(!E.length)return;
    for(const b of E){if(b.dead)continue;const dx=b.x-x,dy=b.y-y,d=Math.hypot(dx,dy);if(d>rad+b.r)continue;if(d<24||Math.abs(angDiff(Math.atan2(dy,dx),ang))<=half)this.cutOne(b);}
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
  /* an experience gem is collected: a little burst, a ring and a star that rise from it, and a chime that climbs the more gems you collect in a row */
  gemPick(g){
    const c=g.v<2.2?'#5ad0ff':g.v<11?'#ffb13b':'#ff5a3d',now=this.rt;
    this.gemCombo=now-(this.gemT||-9)<.75?Math.min(14,(this.gemCombo||0)+1):0;this.gemT=now;
    if(this.gemFxT!==now){this.gemFxT=now;this.gemFxN=0;}
    if(this.gemFxN++<3&&this.fx.length<(FXL.on?160:420)){
      this.burst(g.x,g.y-6,g.v>=11?9:5,c);this.ring(g.x,g.y-4,g.v>=11?30:20,c,.28);
      this.fx.push({x:g.x,y:g.y-8,vx:rnd(-12,12),vy:-rnd(70,110),l:.5,m:.5,c:'#ffffff',s:g.v>=11?4:3});   /* a bright star floating up */
    }
    if(g.v>=11)this.floatText(g.x,g.y-22,'+'+Math.round(g.v)+' XP',2);
    this.audio.pitchK=this.gemCombo;this.audio.sfx('gem');
  }
  updatePickups(dt){
    const p=this.p,S=this.S;
    if(this.gm.length>GEM_CAP)this.mergeGems();
    this.updateRedGem(dt);
    for(const g of this.gm){
      if(g.held)continue;   /* carried by the companion */
      const dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy);
      if(d<S.magnet)g.att=true;
      if(g.att){const sp=380+d;g.x+=dx/d*sp*dt;g.y+=dy/d*sp*dt;}
      if(d<14){g.dead=true;this.addXp(g.v);this.gemPick(g);}
    }
    for(const l of this.loot){
      if(l.dead)continue;
      l.t+=dt;
      const dx=p.x-l.x,dy=p.y-l.y,d=Math.hypot(dx,dy)||1;
      /* Dragon Balls are not attracted: you have to walk over them (tiny pick-up radius); the screen-edge arrows show where they are */
      if((l.k==='coin'||l.k==='bag'||l.k==='heal'||l.k==='dmg')&&d<S.magnet*.7){l.x+=dx/d*260*dt;l.y+=dy/d*260*dt;}
      if(l.att&&(l.k==='bag'||l.k==='coin')){const sp=380+d;l.x+=dx/d*sp*dt;l.y+=dy/d*sp*dt;}   /* the Magnet pick-up drags zenny bags and coins too */
      if(l.ttl&&l.t>l.ttl){l.dead=true;continue;}
      if(l.k==='sball'&&!l.guard&&d<340){   /* the guardian: the Tamagami statue wakes up when you get near (without a statue: a ring of tougher enemies) */
        l.guard=true;
        if(l.tama&&BOSSES['tama'+clamp(l.star||1,1,3)])this.wakeTamagami(l);
        else{this.spawnRing(16+Math.round(this.sd*3),null,e=>{e.hp*=1.3;e.max=e.hp;});
          this.say(this.env.tr(T('I GUARDIANI DELLA SUPER SFERA!','THE SUPER BALL GUARDIANS!')),'#ff5a3d',2.6);this.audio.sfx('boss');this.shake=Math.max(this.shake,.4);}
      }
      if(d<(l.k==='sball'?SUP_PICK_R:l.k==='ball'?BALL_PICK_R:20)&&!l.lock){l.dead=true;this.collectLoot(l);}
    }
    for(const c of this.chests){
      c.t+=dt;
      const d=Math.hypot(p.x-c.x,p.y-c.y);
      if(d<28&&!this.modal){
        c.dead=true;this.run.chests++;this.audio.sfx('chest');this.emote('wow',1);
        this.modal={type:'chest',rewards:this.chestRewards(c.final,c.boss,c.elite)};
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
  /* ---------- Zeno's Shop: a one-minute chill dimension where trinkets lie on the ground in front of Zeno-sama ---------- */
  startZeno(){
    if(this.trial||this.ended||this.dying)return;
    this.run.zeno=(this.run.zeno||0)+1;
    const p=this.p,cx=p.x,cy=p.y,pk=ZENO_PRICE,items=[],used=[];
    /* rarity follows Luck (higher luck -> better odds up to legendary); 1% of the items are mythic */
    const L=this.S.luck,si=this.sd,W=[62/(1+L*.6),27*(1+.05*si+L*.8),9.5*(1+.1*si+L*1.6),1.5*(1+.15*si+L*2.4)],WT=W.reduce((a,b)=>a+b,0);   /* Luck pushes the stock towards higher rarities */
    for(let i=0;i<4;i++){
      let r=4;if(Math.random()>=.01){let q=Math.random()*WT;r=0;for(let k=0;k<4;k++){q-=W[k];if(q<=0){r=k;break;}}}
      /* trinkets with stats can appear at any rarity; special-effect ones only at their own */
      const c=pickTrinket(r,t=>!this.trinkets.includes(t.id)&&!used.includes(t.id));if(!c)continue;
      used.push(c.id);items.push({id:c.id,rar:r,pf:rollPf(L),x:0,y:-30,price:Math.round(pk[r]*(1+.3*this.sd)),sold:false});
    }
    items.forEach((it,i)=>{it.x=(i-(items.length-1)/2)*112;if(it.rar>=2){it.price=Math.round(it.price*.7);it.disc=true;}});   /* Epic and above: -30% */
    if(items.length)pick(items).free=true;   /* one random item is always free */
    for(const it of items)if(it.free)it.price=0;
    this.trial={zeno:true,phase:'zeno',t:0,dur:60,cx,cy,R:300,boss:null,stash:this.en,ret:{x:cx,y:cy},killed:false,obs:[],btn:[],trp:[],items,zx:cx,zy:cy-112,exit:{x:cx,y:cy+215},hold:0,near:null,zj:0,lock:null};
    this.en=[];this.eb=[];this.pr=[];this.bz=[];this.jbeams=[];p.x=cx;p.y=cy+95;p.inv=1;this.banner=null;
    this.flash=.7;this.flashC='#ffffff';this.ring(cx,cy+95,260,'#e0b8ff',.8);this.audio.sfx('transform');
    this.floatText(cx,cy-60,this.env.tr(T('Benvenuto! Resta sopra un oggetto per comprarlo.','Welcome! Stand on an item to buy it.')),1);
  }
  updateZeno(dt,tr){
    const p=this.p;let near=null;
    if(tr.zj>0)tr.zj-=dt;
    /* the info bubble shows from a medium distance (look); buying needs you right on top of the item (near), so it can't happen by accident */
    let look=null,best=130;
    for(const it of tr.items){if(it.sold)continue;const d=Math.hypot(p.x-(tr.cx+it.x),p.y-(tr.cy+it.y));if(d<22)near=it;if(d<best){best=d;look=it;}}
    tr.look=look;
    if(tr.lock&&tr.lock!==near)tr.lock=null;      /* declined: step off the item before it asks again */
    if(near!==tr.near){tr.near=near;tr.hold=0;}
    if(near&&near!==tr.lock){
      if(this.run.coins>=near.price){tr.hold+=dt;if(tr.hold>=.7)this.zenoBuy(near);}
      else tr.hold=0;
    }
    if(tr.t>=tr.dur||Math.hypot(p.x-tr.exit.x,p.y-tr.exit.y)<44)this.endZeno();
  }
  /* buying: free slot -> equip; otherwise a comparison window asks which carried trinket to replace */
  zenoBuy(it){
    const tr=this.trial,t=TRINKETS.find(x=>x.id===it.id);
    if(!tr||!t)return;tr.hold=0;
    const done=()=>{
      this.spendCoins(it.price);it.sold=true;tr.zj=.7;this.run.zbuy=(this.run.zbuy||0)+1;
      this.burst(tr.cx+it.x,tr.cy+it.y-10,22,RARITY[it.rar].c);this.ring(tr.cx+it.x,tr.cy+it.y,60,RARITY[it.rar].c,.5);this.audio.sfx('buy');
      this.say(this.env.tr(t.n),RARITY[it.rar].c,2.2);this.floatText(tr.zx,tr.zy-70,this.env.tr(T('Grazie! Hihi!','Thank you! Hehe!')),1);
    };
    tr.lock=it;
    this.addTrinket(it.id,it.rar,{pf:it.pf,onYes:done,onNo:()=>{},buy:true});
  }
  endZeno(){
    if(!this.trial||!this.trial.zeno)return;
    this.endTrial();
    this.say(this.env.tr(T('Il portale si richiude...','The portal closes...')),'#e0b8ff',2);
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
    if(this.formsUnlocked<Math.min(6,this.formMax)&&FORM_TIERS[this.formsUnlocked].lvl-this.lvl<=10)offers.push({kind:'form',price:Math.round(170*ps*(1+.3*this.formsUnlocked))});
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
    if(free)m.freePick=false;else this.spendCoins(o.price);o.sold=true;
    if(o.kind==='form')this.unlockForm();
    else if(o.kind==='weapon'){const w=this.weapons.get(o.wid);if(w)w.upgrade();}
    else{const STEP={might:.10,spd:.10,cd:.08,hp:.12};this.swap[o.a]-=STEP[o.a]*TRIAL_MALUS;this.swap[o.b]+=STEP[o.b]*1.35;}
    if(o.kind==='form'||o.kind==='weapon')for(const x of m.offers)if(x!==o&&(x.kind==='form'||x.kind==='weapon'))x.sold=true;   /* transformation OR weapon, not both */
    this.recalc();this.audio.sfx('buy');return true;
  }
  endTrial(){
    const tr=this.trial;if(!tr)return;
    this.en=tr.stash;this.eb=[];this.pr=[];this.bz=[];this.trial=null;
    this.p.x=tr.ret.x;this.p.y=tr.ret.y;this.p.inv=1.5;this.flash=.4;this.flashC='#ffffff';
  }

  /* ---------- sandbox helpers ---------- */
  jumpTo(t){this.t=Math.max(0,t);for(const b of this.bossQ)b.done=b.done||b.t<t-1;this.hordeT=Math.ceil(this.t/120)*120+120*0;if(this.hordeT<=this.t)this.hordeT+=120;this.packT=this.t+45;this.wave={ph:'calm',until:this.t+20,n:0};for(const e of this.elitePlan)e.done=e.done||e.t<this.t-1;this.ballAt=Math.max(this.ballAt,this.t+30);}
  setLevel(l){while(this.lvl<l){this.xp=this.need;this.lvl++;this.need=this.needFor(this.lvl);if(this.endless)this.checkMilestone();while(this.formsUnlocked<this.formMax&&this.lvl>=FORM_TIERS[this.formsUnlocked].lvl)this.unlockForm();}this.xp=0;this.recalc();}
  spawnChestHere(final){this.chests.push({x:this.p.x+60,y:this.p.y,final:!!final,t:0});}
}

/* ====== Map events: loot points + helpful features, driven by time and player needs ====== */
class MapDirector{
  constructor(g){this.g=g;this.secretAt=rnd(60,Math.max(75,g.dur-25));this.secretDone=false;this.helpT={heal:0,magnet:60};this.needT=12;this.lootT=rnd(45,70);this.featT=rnd(120,170);this.chestT=200;this.totemT=rnd(120,170);
    const bq=g.bossQ;this.trials=[];
    if(bq.length){this.trials.push({t:Math.max(60,bq[0].t-50),done:false});const fin=bq[bq.length-1];if(fin.t-70>bq[0].t+60)this.trials.push({t:fin.t-70,done:false});}
  }
  update(dt){
    const g=this.g,p=g.p;
    for(const tr of this.trials)if(!tr.done&&g.t>=tr.t){tr.done=true;this.spawnChamber();}
    if(!this.secretDone&&g.t>=this.secretAt&&!g.cleared){this.secretDone=true;this.spawnSecret();}
    /* Endless: the red button (and so Zeno's Shop) comes back every 5 minutes, for 4 minutes */
    if(g.endless&&g.t>=this.zenoNext&&!g.trial){this.zenoNext=g.t+ENDLESS_ZENO;if(!g.feat.some(f=>!f.dead&&(f.kind==='secret'||f.kind==='zenoportal')))this.spawnSecret(240);}
    this.islands(dt);
    this.lootT-=dt;this.helpT.heal-=dt;this.helpT.magnet-=dt;this.needT-=dt;if(this.needT<=0){this.needT=12;this.needHelp();}
    if(this.lootT<=0){this.lootT=rnd(65,105)/(1+g.S.lootRate+g.S.luck*1.5);this.spawnLootPoint();}
    this.chestT-=dt;
    if(this.chestT<=0){this.chestT=300;const[x,y]=this.pos(220,380);g.chests.push({x,y,final:false,t:0,supply:true});g.floatText(p.x,p.y-70,g.env.tr(T('Un forziere è apparso!','A chest appeared!')),5);}
    if(!this.totemDone)this.totemT-=dt;
    if(!this.totemDone&&this.totemT<=0&&!g.feat.some(f=>f.kind==='totem')){this.totemDone=true;const[x,y]=this.pos(230,400);g.feat.push({kind:'totem',x,y,t:0,ttl:900,used:false,dead:false});g.say(g.env.tr(T('Un Totem è apparso sulla mappa!','A Totem appeared on the map!')),'#8be07a',2.6);g.audio.sfx('shrine');}
    this.featT-=dt;
    if(this.featT<=0){this.featT=rnd(130,200);this.spawnFeature();}
    for(const f of g.feat){
      f.t+=dt;
      const d=Math.hypot(p.x-f.x,p.y-f.y);
      f.near=d<90;
      if(f.used)continue;
      if(f.t>f.ttl){f.dead=true;continue;}
      if(f.kind==='altar'||f.kind==='chamber'||f.kind==='totem'||f.kind==='secret'){if(f.near&&g.input.interact)this.use(f);}   /* same radius as the [E] prompt */
      else if(f.kind==='zenoportal'){if(d<38)this.use(f);}
      else if(d<30)this.use(f);
    }
    g.input.interact=false;
    g.feat=g.feat.filter(f=>!f.dead);
  }
  pos(rmin,rmax){const a=rnd(0,TAU),d=rnd(rmin,rmax);return this.g.spawnSpot(a,d,0);}
  /* Snake Way: every island beside the body holds three power-ups, laid on it the first time you come within ~1000 px (once per island, no cooldowns), and its name is announced */
  islands(dt){
    const g=this.g,p=g.p;if(g.stage.theme!=='snake'||g.trial)return;
    this.isT=(this.isT||0)-dt;if(this.isT>0)return;
    this.isT=.5;const seen=this.isSeen||(this.isSeen=new Set());
    for(const I of Snake.islandsIn(p.x-1100,p.x+1100)){
      if(seen.has(I.id)||Math.hypot(I.x-p.x,I.y-p.y)>1000)continue;
      seen.add(I.id);
      const ks=SnakeArt.loot[I.kind],a0=I.side>0?-Math.PI/2:Math.PI/2;   /* the items sit on the side facing the body, away from the landmark */
      ks.forEach((k,i)=>{
        const a=a0+(i-1)*.95,d=I.r*(i===1?.3:.4);
        g.loot.push({k,x:I.x+Math.cos(a)*d,y:I.y+Math.sin(a)*d*.8,v:k==='xp'?Math.round(g.need*.3):k==='bag'?g.bagValue():0,t:0,star:0,isle:I.id});
      });
      g.say(g.env.tr(SnakeArt.names[I.kind]),'#ffe9a0',2.4);
    }
  }
  spawnLootPoint(){
    /* a regular drop around the player: coins are common, everything else is picked by the loot director (rarity + what the player needs) */
    const g=this.g,k=Math.random()<.36?'bag':(g.pickLoot()||'bag'),[x,y]=this.pos(150,330);
    g.spawnLoot(k,x,y);g.loot[g.loot.length-1].ttl=k==='bag'?90:60;
    if(k==='bag')g.floatText(g.p.x,g.p.y-70,g.env.tr(T('Una borsa di zenny è apparsa!','A zenny bag appeared!')),5);
  }
  /* "scripted" help: every ~12 s check what the player lacks; at most one help item on the field per kind, with long pauses in between */
  needHelp(){
    const g=this.g;if(g.nt<25||g.bossAlive>0&&Math.random()<.5)return;
    const hr=g.p.hp/g.p.maxHp,gems=g.gm.length;let k=null;
    if(hr<.4&&!g.lootOnField('heal')&&!(g.lootCd.heal>0)&&this.helpT.heal<=0){k='heal';this.helpT.heal=45;}
    else if(gems>50&&!g.lootOnField('magnet')&&!(g.lootCd.magnet>0)&&this.helpT.magnet<=0){k='magnet';this.helpT.magnet=120;}
    if(!k)return;
    const[x,y]=this.pos(110,200);g.spawnLoot(k,x,y);g.loot[g.loot.length-1].ttl=45;
    g.floatText(x,y-30,g.env.tr(k==='heal'?T('Salute!','Health!'):T('Magnete!','Magnet!')),1.8);
  }
  nextFormGap(){const g=this.g;if(g.formsUnlocked>=g.formMax)return 99;return FORM_TIERS[g.formsUnlocked].lvl-g.lvl;}
  spawnFeature(){
    const g=this.g;if(g.feat.filter(f=>!f.used&&f.kind!=='secret'&&f.kind!=='zenoportal').length>=2)return;
    const hpR=g.p.hp/g.p.maxHp,ws=[...g.weapons.values()],near=ws.some(w=>w.lv>=3&&w.lv<WMAX),gap=this.nextFormGap();
    const c=[];
    if(g.nt>=80&&g.tempBuffs.length<3)c.push(['shrine',2]);
    if(g.nt>=100&&hpR<.4)c.push(['spring',6]);
    if(g.nt>=170&&near&&hpR>.45)c.push(['altar',7]);
    if(g.nt>=100&&gap>0&&gap<=3)c.push(['font',8]);
    if(!c.length)return;
    const kind=wpick(c,x=>x[1])[0],[x,y]=this.pos(260,460);
    g.feat.push({kind,x,y,t:0,ttl:100,used:false,dead:false});
    g.floatText(g.p.x,g.p.y-70,g.env.tr(T('Qualcosa è apparso sulla mappa','Something appeared on the map')),5);
  }
  /* the level's secret: a portal to Zeno's Shop somewhere on the map, shown by an arrow with the distance */
  spawnSecret(ttl){
    const g=this.g,[x,y]=this.pos(650,950);
    g.feat.push({kind:'secret',x,y,t:0,ttl:ttl||1e9,used:false,dead:false});
    g.say(g.env.tr(T('Un bottone rosso misterioso è apparso! Segui la freccia.','A mysterious red button has appeared! Follow the arrow.')),'#ff8a8a',3.4);g.audio.sfx('shrine');
  }
  spawnChamber(){
    const g=this.g,[x,y]=this.pos(200,280);
    g.feat.push({kind:'chamber',x,y,t:0,ttl:95,used:false,dead:false});
    g.say(g.env.tr(T('Una Stanza dello Spirito e del Tempo è apparsa!','A Room of Spirit and Time has appeared!')),'#cfd8ff',3);g.audio.sfx('shrine');
  }
  use(f){
    const g=this.g,p=g.p;
    if(f.kind==='chamber'){g.startTrial();f.used=true;f.dead=true;return;}
    if(f.kind==='secret'){          /* the mysterious red button opens the portal to Zeno's Shop */
      f.used=true;f.pressed=true;g.feat.push({kind:'zenoportal',x:f.x+95,y:f.y+14,t:0,ttl:1e9,used:false,dead:false});
      g.ring(f.x,f.y,120,'#ff3b3b',.6);g.ring(f.x+95,f.y+14,90,'#c080ff',.8);g.flash=Math.max(g.flash,.25);g.flashC='#e0b8ff';g.shake=Math.max(g.shake,.3);g.audio.sfx('transform');
      g.say(g.env.tr(T('Si è aperto un portale misterioso...','A mysterious portal has opened...')),'#e0b8ff',3);return;}
    if(f.kind==='zenoportal'){g.startZeno();f.used=true;f.dead=true;return;}
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
    }
    f.used=true;f.dead=true;
  }
}
