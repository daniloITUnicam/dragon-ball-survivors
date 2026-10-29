'use strict';
/* ====== v120: co-op run. The host's Game simulates everything; every other trainer is a "mate": a second set of hero fields
   (position, weapons, upgrades, trinkets, cooldowns, run counters...) swapped into the Game while that hero acts (withHero), so all
   the single-player code works for them unchanged. Enemies chase the nearest standing hero; XP and levels are shared, loot goes
   to whoever picks it up; a hero who falls is down until a teammate stands next to them for 3 s; everybody down = the run is lost.
   The host sends each client a snapshot of what is around them (~11 per second) plus the effects and sounds; the client draws it
   with its own copy of the Game (never simulated) and sends back its stick, its buttons and its choices in the windows. ====== */
const COOP_PICK_T=6,COOP_SNAP=.09,COOP_IN=.05,COOP_R=1050,COOP_LEASH=620,COOP_REV=3,COOP_REV_R=46,COOP_REV_HP=.4,COOP_MAXPR=260,COOP_MAXGM=260;
/* fields of the Game that belong to the world (everything else is per hero) */
const COOP_WORLD=new Set(('env audio progress stageIdx stage sd spdK diffId D week pacts pk dmut dmutN x2 sandbox t kills lvl xp need en pr eb gm rg loot lootCd feat chests fx tx corpses '+
  'endless enMile en0 xpAcc xpRate balls ballSet summon hs zoomP rain vw vh streak streakT streakPop streakW cstk cstkT TS CR evK rt dur trialN spAcc hordeT packT bossQ hordePlan wave '+
  'elitePlan miniPlan scanK ballEvery ballAt supPlan bossHit finalSpawned cleared ended post timeScale sb showNums bossAlive trial tun bombOn ev bombT bombEnd shootOn shootQ shootQT shootT '+
  'shootEnd bz jbeams dying curW vortex seenT newSeen map banner bq modal flash flashC shake shocks shockId bshock evLog clash bcine kcNext mx sbx gold gsT recs cKeys cev bkills hintS _alT '+
  'ghost gtrail finisher vic ck gemCombo gemFxN gemFxT gemT ovkCd hsCd coop coopView unranked runId hordeBoost sbk ring burst bolt pillar floatText say coopE coopMd coopNames vicT').split(' '));
Object.assign(Game.prototype,{
  /* ---------- host ---------- */
  coopInit(o){
    this.coop={me:o.me,code:o.code,mates:[],mq:[],mqId:0,hostQ:[],ev:[],paused:false,over:false,names:[o.me]};
    this.p.nick=o.me;
    const rec=this.coop.ev,self=this;
    for(const k of['ring','burst','bolt','pillar']){const f=Game.prototype[k];this[k]=function(...a){f.apply(self,a);rec.push([k,...a]);};}
    {const f=Game.prototype.floatText;this.floatText=function(x,y,s,c){f.call(self,x,y,s,c);if(c&&c!==6&&c!==0)rec.push(['ft',x,y,String(s),c]);};}
    {const f=Game.prototype.say;this.say=function(txt,col,dur,sub){f.call(self,txt,col,dur,sub);rec.push(['say',txt,col,dur,sub||null]);};}
    const A=this.audio;this.audio=new Proxy(A,{get:(t,k)=>k==='sfx'?(n,...r)=>{t.sfx(n,...r);rec.push(['sfx',n]);}:typeof t[k]==='function'?t[k].bind(t):t[k]});
  },
  heroKeys(){return Object.keys(this).filter(k=>!COOP_WORLD.has(k));},
  /* swap the hero fields of the Game with the mate's (symmetric: call it again to swap back) */
  swapHero(m){const keys=new Set([...this.heroKeys(),...Object.keys(m.h)]);for(const k of keys){if(COOP_WORLD.has(k))continue;const v=this[k];this[k]=m.h[k];m.h[k]=v;}m.in=!m.in;},
  withHero(m,fn){if(!m)return fn();this.swapHero(m);try{return fn();}finally{this.swapHero(m);}},
  /* a new hero: the hero fields are stashed, the constructor's hero part runs again with the mate's character and loadout, the result becomes the mate */
  coopAddMate(nick,ch,lo){
    const C=CHARS.find(c=>c.id===ch)||CHARS[0],stash={};for(const k of this.heroKeys()){stash[k]=this[k];delete this[k];}
    const save=Object.assign({},stash.save,lo||{},{settings:Object.assign({},stash.save.settings,(lo&&lo.settings)||{})});
    try{this.coopHeroInit(C,save);}catch(e){console.error('mate init',e);}
    const h={};for(const k of this.heroKeys()){h[k]=this[k];delete this[k];}
    Object.assign(this,stash);
    const m={nick,ch:C.id,h,in:false,last:performance.now(),lost:0};h.p.nick=nick;
    /* next to the host */
    h.p.x=this.p.x+(this.coop.mates.length%2?-40:40)*(1+(this.coop.mates.length>>1));h.p.y=this.p.y+20;
    this.coop.mates.push(m);this.coop.names.push(nick);return m;},
  /* the hero part of the constructor (keep in step with Game's constructor) */
  coopHeroInit(C,save){
    this.save=save;this.C=C;
    {const ml=Mastery.lv(save,C.id);this.mastLv=ml;this.mastP=ml>=MAST_PASS_LV?Mastery.passive(C.id):null;this.skin=Mastery.skinOf(save,C.id);}
    this.p={x:0,y:0,hp:1,maxHp:1,face:1,inv:0,mv:false};this.input={x:0,y:0,interact:false};
    this.weapons=new Map();this.pass={};this.trinkets=[];this.tRar={};this.tPf={};this.tSrc={};this.tq=[];
    this.formsUnlocked=0;this.formIdx=-1;this.formColor=null;
    this.buffs={dmg:0,haste:0};this.tempBuffs=[];this.szStat={might:0,spd:0,cd:0,hp:0,regen:0,magnet:0};this.szN=0;this.tgt=(save.settings&&save.settings.tgt)|0;this.autoZ=false;this.lavaT=0;this.lavaF=0;this.luckBonus=0;this.wishLog=[];this.cast=null;this.pa=null;this.pfd=0;this.pfdUntil=0;
    this.ru={rr:Math.min(5,this.shopLv('rr')),sk:Math.min(5,this.shopLv('sk')),bn:Math.min(5,this.shopLv('bn'))};this.ru0=Object.assign({},this.ru);this.banRun=new Set();
    this.run={minC:Infinity,bossKills:0,evos:0,legendary:0,coins:0,chests:0,perfect:0,balls:0,wishes:0,zeno:0,zbuy:0,mythic:0,k20:0,streak:0,tk:{t1:0,t10:0,l10:0}};
    this.bank={kills:0,bossKills:0,chests:0,balls:0,wishes:0,perfect:0,coins:0,zeno:0,zbuy:0,evos:0,elites:0,t:0,counted:false,cleared:false,tk:{t1:0,t10:0,l10:0}};
    this.senzu=this.pk.nosenzu?0:Math.min(SENZU_MAX,C.senzu||0);this.senzuCd=0;this.dashCd=0;this.dashT=0;this.revives=0;this.totemLuck=0;this.totemFx={};this.totemTag=null;this.stormT=0;this.pulseT=0;this.abCd=0;this.regenT=0;this.regenRate=0;
    this.clones=null;this.cloneT=0;this.sbc=null;this.immT=0;this.spheres=[];this.ghosts=null;this.ghostT=0;this.held=null;this.critT=0;this.shieldT=0;this.tsT=0;this.abBuf=null;this.dashHit=null;this.hpHist=[];this.histT=0;
    this.riskT=0;this.kai=0;this.bers=0;this.bersCd=0;this.bersT=0;this.bv=null;this.xform=null;this.afterX=null;this.inHeal=false;this.emo=null;this.emoT=0;
    this.swap={might:0,spd:0,cd:0,hp:0};this.dmgBy={};this.takenBy={};this.slowT=0;this.slowCd=TR_SLOW_CD*.6;this.shockCd=TR_SHOCK_CD;this.barrierT=0;this.barrierReady=false;this.auraAcc=0;
    this.fz=null;for(const id of C.start.slice(0,this.maxW))this.addWeapon(id);
    this.revives=this.shopLv('revive');this.luckT=0;this.petLuckT=0;this.initPet(save.pet||'dende');
    {const T0=[],R0={},P0={},S0={};for(const eq of (save.equips||[save.equip]).slice(0,this.tcap)){const td=eq&&TRINKETS.find(x=>x.id===eq.id),be=td&&(save.bag||[]).find(b=>b.id===eq.id&&b.r===eq.r);
        if(!be||R0[eq.id]!==undefined)continue;T0.push(eq.id);R0[eq.id]=eq.r;P0[eq.id]=be.p!=null?be.p:PF_NOM;S0[eq.id]='bag';if(td.sp==='barrier')this.barrierReady=true;}
      if(T0.length){this.trinkets=T0;this.tRar=R0;this.tPf=P0;this.tSrc=S0;}}
    this.recalc();this.p.hp=this.p.maxHp;{const vp=EXTRAS.poseOf(save,C.id);this.vpose=vp?vp.id:null;}
  },
  coopMate(nick){return this.coop&&this.coop.mates.find(m=>m.nick===nick);},
  coopMateOfP(p){return this.coop&&this.coop.mates.find(m=>(m.in?this.p:m.h.p)===p);},
  /* every standing hero's position object (the host's first) */
  coopHeroes(){const L=[this.p];for(const m of this.coop.mates)L.push(m.h.p);return L;},
  coopTgt(e){if((e.tgT=(e.tgT||0)-1)>0&&e.tgp&&!e.tgp.down)return e.tgp;e.tgT=8;let b=this.p,bd=this.p.down?1e12:(this.p.x-e.x)**2+(this.p.y-e.y)**2;
    for(const m of this.coop.mates){const q=m.h.p;if(q.down)continue;const d=(q.x-e.x)**2+(q.y-e.y)**2;if(d<bd){bd=d;b=q;}}e.tgp=b;return b;},
  /* hurt the hero that owns position p */
  hurtP(p,d,src){if(!this.coop||p===this.p)return this.hurt(d,src);const m=this.coopMateOfP(p);if(m)this.withHero(m,()=>this.hurt(d,src));},
  /* hit every hero for which test(p) holds; true if somebody was hit */
  hitHeroes(test,d,src){let hit=false;if(!this.p.down&&test(this.p)){this.hurt(d,src);hit=true;}
    if(this.coop)for(const m of this.coop.mates){if(m.h.p.down)continue;if(test(m.h.p)){this.withHero(m,()=>this.hurt(d,src));hit=true;}}return hit;},
  /* a hero falls: down (not dead) while somebody else stands */
  coopLethal(){const p=this.p;
    if(this.has('revive')&&!this.haloUsed){this.haloUsed=true;this.revive();return;}
    if(this.revives>0){this.revives--;this.revive();return;}
    p.hp=0;p.down=true;p.rev=0;p.inv=999;this.kai=0;this.held=null;
    Game.prototype.say.call(this,(p.nick||'?')+' '+this.env.tr(T6('è a terra!','is down!','¡está en el suelo!','est à terre !','ist am Boden!','está caído!')),'#ff5a3d',2.4,this.env.tr(T6('Stagli vicino 3 secondi per rialzarlo','Stand next to them for 3 seconds to get them up','Quédate a su lado 3 segundos para levantarlo','Reste près de lui 3 secondes pour le relever','Bleib 3 Sekunden bei ihm, um ihn aufzurichten','Fique ao lado por 3 segundos para levantá-lo')));
    this.coop.ev.push(['say',(p.nick||'?')+' ⬇','#ff5a3d',2,null]);
    if(this.coopHeroes().every(q=>q.down))this.coop.over=true;},
  /* level-up: the host's window as usual, one for every mate at the same time (the world waits for all of them) */
  coopLevel(){for(const m of this.coop.mates)this.withHero(m,()=>{
      while(this.formsUnlocked<this.formMax&&this.lvl>=FORM_TIERS[this.formsUnlocked].lvl)this.unlockForm();this.recalc();
      const lm={type:'level',options:this.levelOptions()};const rc=this.recommend(lm.options);if(rc){lm.rec=rc.i;lm.recWhy=rc.why;}
      if(lm.options.every(o=>o.type==='z')){lm.maxed=true;}
      this.coopQueue(m,lm);});},
  /* a mate's windows wait in line: one is shown at a time, and it has COOP_PICK_T seconds before a card is taken for them */
  coopQueue(m,modal,first){const id=++this.coop.mqId,q={id,nick:m.nick,modal,sent:false,left:COOP_PICK_T};if(first)this.coop.mq.unshift(q);else this.coop.mq.push(q);this.coopNext(m);},
  coopNext(m){if(this.coop.mq.some(x=>x.nick===m.nick&&x.sent))return;const q=this.coop.mq.find(x=>x.nick===m.nick);if(!q)return;q.sent=true;q.left=COOP_PICK_T;this.coopSendModal(m,q);},
  coopSendModal(m,q){const H=m.in?this:m.h;COOPG.send(m.nick,{t:'modal',id:q.id,m:q.modal,lv:this.lvl,ru:H.ru,ru0:H.ru0,left:q.left});},
  /* somebody is choosing: the hero of that nick (the host included) */
  coopChoosing(nick){return nick===this.coop.me?!!(this.coopOwn||this.modal):this.coop.mq.some(x=>x.nick===nick&&x.sent);},
  /* the level window's tools (reroll / skip / ban), used by a mate: applied to their hero, the window goes back redrawn */
  coopLvTool(nick,id,k,i){const q=this.coop.mq.find(x=>x.id===id&&x.nick===nick),m=this.coopMate(nick);if(!q||!m||q.modal.type!=='level')return;
    this.withHero(m,()=>{const keep=this.modal;this.modal=q.modal;try{if(k==='rr')this.rerollLevel();else if(k==='sk')this.skipLevel();else if(k==='bn')this.banLevel(i|0);}finally{this.modal=keep;}});
    if(k!=='sk')this.coopSendModal(m,q);},
  /* a mate chose in a window */
  coopAnswer(nick,id,i){const q=this.coop.mq.find(x=>x.id===id&&x.nick===nick),m=this.coopMate(nick);if(!q||!m)return;
    this.coop.mq=this.coop.mq.filter(x=>x!==q);let follow=null;
    this.withHero(m,()=>{const keep=this.modal;this.modal=q.modal;try{this.resolveModal(i);}catch(e){console.error(e);}follow=this.modal;this.modal=keep;});
    if(follow)this.coopQueue(m,follow,true);else this.coopNext(m);},
  /* a chest opened by a mate: its rewards are rolled for them */
  coopChest(c,nick){const m=this.coopMate(nick);if(!m)return false;c.dead=true;
    this.withHero(m,()=>{this.run.chests++;const md={type:'chest',rar:c.rar||0,rewards:this.chestRewards(c.final,c.boss,c.elite,c.rar)};this.coopQueue(m,md);});return true;},
  coopPaused(){return this.coop.paused;},
  /* the part of update() that belongs to one hero (movement, regeneration, ability, weapons, pick-ups) */
  coopHeroUpdate(dt){
    const p=this.p,S=this.S;
    if(p.down){p.inv=999;return;}
    if(p.inv>0)p.inv-=dt;
    if(this.tempBuffs.length){let ch=false;for(const b of this.tempBuffs){b.t-=dt;if(b.t<=0)ch=true;}if(ch){this.tempBuffs=this.tempBuffs.filter(b=>b.t>0);this.recalc();}}
    for(const k of['riskT','luckT','petLuckT']){if(this[k]>0){this[k]-=dt;if(this[k]<=0)this.recalc();}}
    if(this.emoT>0){this.emoT-=dt;if(this.emoT<=0)this.emo=null;}if(this.immT>0)this.immT-=dt;
    for(const k of['dmg','haste'])if(this.buffs[k]>0){this.buffs[k]-=dt;if(this.buffs[k]<=0)this.recalc();}
    const busy=this.coopChoosing(p.nick);if(busy)p.inv=Math.max(p.inv,.15);   /* choosing a card: standing still, untouchable */
    let ix=busy?0:this.input.x,iy=busy?0:this.input.y;if(this.bers>0){ix=-ix;iy=-iy;}if(this.held){ix=0;iy=0;}const il=Math.hypot(ix,iy);if(il>1){ix/=il;iy/=il;}
    const ox0=p.x,oy0=p.y;p.mv=il>.05;p.ivx=ix;p.ivy=iy;const sp=125*S.spd;p.x+=ix*sp*dt;p.y+=iy*sp*dt;
    if(this.bv&&this.bv.t>0){p.x+=this.bv.x*dt;p.y+=this.bv.y*dt;this.bv.t-=dt;}
    if(!this.trial&&!this.tun){World.resolve(this.stage.theme,p,9);this.blockWater(p,ox0,oy0);}
    /* the leash: mates stay around the host (the world is built around the host) */
    const H=this.coop.hostP,lx=p.x-H.x,ly=p.y-H.y,ld=Math.hypot(lx,ly);if(ld>COOP_LEASH){p.x=H.x+lx/ld*COOP_LEASH;p.y=H.y+ly/ld*COOP_LEASH;}
    if(ix>.1)p.face=1;else if(ix<-.1)p.face=-1;
    p.hp=Math.min(p.maxHp,p.hp+S.regen*dt);
    if(this.kai>0)this.updateKaioken(dt);if(this.held)this.updateHeld(dt);
    this.updateTotemFx(dt);this.updateAbility(dt);
    if(this.bers>0)this.updateBerserk(dt);else if(this.bersCd>0)this.bersCd-=dt;
    this.updatePet(dt);if(this.xform)this.updateXform(dt);
    if(this.trinkets.length){
      if(this.has('shock')){this.shockCd-=dt;if(this.shockCd<=0){this.shockCd=TR_SHOCK_CD;this.ring(p.x,p.y,230,'#c05aff',.5);for(const e of this.en){if(e.dead)continue;const dx=e.x-p.x,dy=e.y-p.y;if(dx*dx+dy*dy<(230+e.r)**2)this.damageEnemy(e,40*this.S.might,dx*.3,dy*.3);}}}
      if((this.has('barrier')||this.totemFx.guard)&&!this.barrierReady){this.barrierT-=dt;if(this.barrierT<=0)this.barrierReady=true;}
    }
    if(p.atk>0)p.atk-=dt;if(this.fireT>0)this.fireT-=dt;
    const pn=this.pr.length;
    for(const w of this.weapons.values()){const n0=this.pr.length;this.curW=w.id;w.update(dt);for(let i=n0;i<this.pr.length;i++)if(!this.pr[i].wid)this.pr[i].wid=w.id;}
    this.curW=null;if(this.pr.length>pn||this.cast)p.atk=.34;
    this.coopPickups(dt);
    if(this.formIdx>=0&&this.fx.length<380){this.auraAcc+=dt*(14+this.formIdx*4)*(FXL.on?.3:1);while(this.auraAcc>=1){this.auraAcc-=1;this.fx.push({x:p.x+rnd(-12,12),y:p.y-rnd(0,30),vx:rnd(-10,10),vy:-rnd(40,110),l:rnd(.4,.8),m:.8,c:this.formColor||'#ffd23f',s:rnd(2,3.5)});}}
  },
  /* a mate's pick-ups: gems (shared experience), the loot on the ground (theirs), chests (opened for them) */
  coopPickups(dt){const p=this.p,S=this.S;
    for(const g of this.gm){if(g.dead||g.held)continue;const dx=p.x-g.x,dy=p.y-g.y,d=Math.hypot(dx,dy);if(d<S.magnet)g.att=true;if(d<S.magnet){const sp=380+d;g.x+=dx/d*sp*dt*.5;g.y+=dy/d*sp*dt*.5;}if(d<14){g.dead=true;this.addXp(g.v);this.gemPick(g);}}
    for(const l of this.loot){if(l.dead)continue;const dx=p.x-l.x,dy=p.y-l.y,d=Math.hypot(dx,dy)||1;
      if(l.k!=='ball'&&l.k!=='sball'&&d<S.magnet){const sp=380+d;l.x+=dx/d*sp*dt*.5;l.y+=dy/d*sp*dt*.5;}
      if(d<(l.k==='sball'?SUP_PICK_R:l.k==='ball'?(l.alt?ALT_PICK_R:BALL_PICK_R):20)&&!l.lock){l.dead=true;this.collectLoot(l);}}
    for(const c of this.chests){if(c.dead)continue;if(c.op===undefined&&Math.hypot(p.x-c.x,p.y-c.y)<28){c.op=0;c.own=p.nick;this.audio.sfx('chest');}}
  },
  /* after the host's own update: the mates act, the fallen get up, the run may be over */
  coopAfterUpdate(dt){const C=this.coop;C.hostP=this.p;
    /* time is up for a window: a random card (or the default answer) is taken, the client's window closes */
    for(const q of C.mq.slice()){if(!q.sent)continue;q.left-=dt;if(q.left<=0){COOPG.send(q.nick,{t:'close',id:q.id});this.coopAnswer(q.nick,q.id,coopRandPick(q.modal));}}
    for(const m of C.mates)this.withHero(m,()=>{const md=this.modal;this.coopHeroUpdate(dt);if(this.modal&&this.modal!==md){const nm=this.modal;this.modal=md;this.coopQueue(m,nm);}});
    /* reviving: a standing hero next to a fallen one */
    const H=this.coopHeroes();for(const q of H){if(!q.down)continue;const near=H.some(o=>!o.down&&Math.hypot(o.x-q.x,o.y-q.y)<COOP_REV_R);
      q.rev=near?(q.rev||0)+dt:Math.max(0,(q.rev||0)-dt*.5);
      if(q.rev>=COOP_REV){q.down=false;q.rev=0;q.hp=q.maxHp*COOP_REV_HP;q.inv=2;this.ring(q.x,q.y,140,'#8be07a',.7);this.burst(q.x,q.y-20,30,'#8be07a');this.audio.sfx('transform');
        this.say((q.nick||'?')+' '+this.env.tr(T6('è di nuovo in piedi!','is back up!','¡vuelve a estar en pie!','est de nouveau debout !','ist wieder auf den Beinen!','está de pé de novo!')),'#8be07a',2);}}
    if(C.over&&!this.dying&&!this.ended){C.over=false;this.p.down=false;this.startDeath();}
  },
  /* ---------- snapshots (host -> one client) ---------- */
  coopSnap(nick){
    const m=this.coopMate(nick);if(!m)return null;const me=m.h.p,R2=COOP_R*COOP_R,near=o=>(o.x-me.x)**2+(o.y-me.y)**2<R2,rd=v=>Math.round(v*10)/10;
    const E=[];for(const e of this.en){if(e.dead||!near(e))continue;if(!e.uid)e.uid=(this.coop.uid=(this.coop.uid||0)+1);
      const row=[e.uid,e.boss?(e.bdk||e.bid):e.def.id,e.boss?1:0,rd(e.x),rd(e.y),Math.round(100*e.hp/(e.max||1))/100,e.face|0,e.fl>0?1:0,rd(e.stun||0),rd(e.atk||0),e.st|0,rd(e.sq||0),rd(e.ph||0),rd(e.fuse||0),e.under?1:0,e.enr?1:0,e.elite?1:0,rd(e.mvs||0),Math.round(e.age||0),e.goldS?1:0];
      if(e.boss)row.push(this.coopPlain(e,['tf','pf','lp','bar','telK','pwUntil','mini','final','r','max','hp','zoff','oa','rc','surprise','bid']),e.xf?this.coopPlain(e.xf):0,e.gd?this.coopPlain(e.gd):0,e.tel?this.coopPlain(e.tel):0);
      E.push(row);}
    const P=[];for(const b of this.pr){if(b.dead||!near(b))continue;P.push(this.coopPlain(b,null,['dmg','hit','wid','t0']));if(P.length>=COOP_MAXPR)break;}
    const EB=[];for(const b of this.eb){if(b.dead||!near(b))continue;EB.push([rd(b.x),rd(b.y),rd(b.r),b.c,b.cp?1:0]);}
    const GM=[];for(const g of this.gm){if(g.dead||!near(g))continue;GM.push([Math.round(g.x),Math.round(g.y),rd(g.v)]);if(GM.length>=COOP_MAXGM)break;}
    const LO=[];for(const l of this.loot){if(l.dead||!near(l))continue;LO.push([l.k,rd(l.x),rd(l.y),l.star|0,l.tama|0,l.lock?1:0,l.alt?1:0,rd(l.t||0)]);}
    const CH=[];for(const c of this.chests){if(c.dead)continue;CH.push([rd(c.x),rd(c.y),c.rar|0,c.final?1:0,c.elite?1:0,c.boss?1:0,c.op==null?-1:rd(c.op)]);}
    const heroes=[this.coopHeroSnap(null,nick)];for(const o of this.coop.mates)heroes.push(this.coopHeroSnap(o,nick));
    const b=this.banner;
    return{t:'s',T:rd(this.t),k:this.kills,l:this.lvl,xp:Math.round(this.xp),nd:this.need,ba:this.bossAlive,sh:rd(this.shake||0),fl:rd(this.flash||0),fc:this.flashC,st:this.streak,
      bn:b?[b.txt,b.col,rd(b.t),rd(b.dur),b.sub||null]:null,h:heroes,e:E,pr:P,eb:EB,gm:GM,lo:LO,ch:CH,
      bz:this.bz.filter(near).map(z=>this.coopPlain(z,null,['o'])),jb:this.jbeams.map(j=>Object.assign(this.coopPlain(j,null,['e']),{ex:rd(j.e?j.e.x:j.x),ey:rd(j.e?j.e.y:j.y)})),
      md:this.coop.names.filter(n=>this.coopChoosing(n)),dy:this.dying?rd(this.dying.t):null,vic:this.vic?rd(this.vic.t):null,post:rd(this.post||0)};
  },
  /* one hero: where, how, what it holds; the full HUD only for the client's own hero */
  coopHeroSnap(m,to){const read=()=>{const p=this.p,mine=p.nick===to,rd=v=>Math.round(v*10)/10;
      const o={n:p.nick,cz:this.coopChoosing(p.nick)?1:0,ch:this.C.id,x:rd(p.x),y:rd(p.y),f:p.face|0,mv:p.mv?1:0,hp:Math.round(p.hp),mh:Math.round(p.maxHp),inv:rd(p.inv||0),dn:p.down?1:0,rv:rd(p.rev||0),atk:rd(p.atk||0),
        fi:this.formIdx,pt:this.pet?[this.pet.d.id,rd(this.pet.x),rd(this.pet.y),this.pet.face|0,rd(this.pet.cd||0)]:null,fu:this.formsUnlocked,dsh:rd(this.dashT||0),sk:this.skin|0,ca:this.cast?this.coopPlain(this.cast):null,fT:rd(this.fireT||0),
        w:[...this.weapons.values()].map(w=>[w.id,w.lv,w.evo|0,w.fz||0,w.xl|0,this.coopWState(w)])};
      if(mine)Object.assign(o,{pa:this.pass,tr:this.trinkets.map(id=>[id,this.tRar[id]|0]),co:Math.round(this.run.coins),tk:this.run.tk,sz:this.senzu,ab:rd(this.abCd||0),dc:rd(this.dashCd||0),kai:this.kai|0,bers:rd(this.bers||0),rvs:this.revives|0,sp:rd(this.S.spd)});
      return o;};
    return m?this.withHero(m,read):read();},
  /* the drawing state of a weapon: its numbers and its lists of plain objects (beams, orbs...) */
  coopWState(w){const o={};for(const k in w){if(k==='g'||k==='def'||k==='q')continue;const v=w[k];if(typeof v==='number')o[k]=Math.round(v*100)/100;else if(typeof v==='boolean'||typeof v==='string')o[k]=v;
      else if(Array.isArray(v)&&v.length<80&&v.every(x=>x&&typeof x==='object'&&!Array.isArray(x)))o[k]=v.map(x=>this.coopPlain(x,null,['e','tg','hit']));}return o;},
  coopPlain(o,only,skip){const r={};const ks=only||Object.keys(o);for(const k of ks){if(skip&&skip.includes(k))continue;const v=o[k];if(typeof v==='number')r[k]=Math.round(v*100)/100;else if(typeof v==='string'||typeof v==='boolean')r[k]=v;else if(v==null)continue;}return r;}
});
/* the host's own Game: the original lethal / levelUp / update get a co-op branch */
{const L=Game.prototype.lethal;Game.prototype.lethal=function(){return this.coop?this.coopLethal():L.call(this);};}
{const U=Game.prototype.levelUp;Game.prototype.levelUp=function(){const r=U.call(this);if(this.coop)this.coopLevel();return r;};}
/* co-op: nobody's window stops the world. While the host chooses, its window is set aside for the update (the host stands still and cannot be hit),
   windows that open meanwhile wait in hostQ; after COOP_PICK_T seconds a card is taken for them. The mates move only when the world did (rt: the world's own clock) */
{const U=Game.prototype.update;Game.prototype.update=function(dt){
  if(!this.coop)return U.call(this,dt);if(this.coopPaused())return;
  if(!this.modal&&this.coop.hostQ.length&&!this.dying&&!this.ended){this.modal=this.coop.hostQ.shift();this.modal.coopLeft=COOP_PICK_T;}
  const own=this.dying||this.ended?null:this.modal;
  if(own){if(own.coopLeft==null)own.coopLeft=COOP_PICK_T;own.coopLeft-=dt;if(own.coopLeft<=0){COOPG.autoPick(this);return;}
    this.coopOwn=own;this.modal=null;this.input.x=0;this.input.y=0;this.p.inv=Math.max(this.p.inv,.15);}
  const r0=this.rt;try{U.call(this,dt);}finally{if(own){if(this.modal&&this.modal!==own)this.coop.hostQ.push(this.modal);this.modal=own;this.coopOwn=null;}}
  if(!this.ended&&!this.dying&&this.rt>r0)this.coopAfterUpdate(this.rt-r0);};}
{const B=Game.prototype.bossTransform;Game.prototype.bossTransform=function(e){const k=e.bd&&e.bd.p2;B.call(this,e);if(k)e.bdk=k;};}

/* ====== the session: host and client sides, messages, the client's view ====== */
const COOPG={
  net:null,app:null,role:null,me:null,host:null,code:null,view:null,others:new Map(),snapT:0,inT:0,act:[],lastSnap:0,peersWanted:0,
  send(nick,m,u){if(this.net)this.net.send(nick,m,u);},
  /* the room says the run is starting: host and clients open the connections */
  begin(app,st){if(this.net)return;this.app=app;this.code=st.code;this.me=app.cloud.nick;this.host=st.host;this.role=this.me===this.host?'host':'client';this.st=st;
    this.peersWanted=(st.members||[]).length-1;this.ready=new Map();this.started=false;this.t0=performance.now();
    this.net=new CoopNet({me:this.me,host:this.host,code:st.code,cloud:app.cloud,onMsg:(n,m)=>this.onMsg(n,m),onPeer:(n,on)=>this.onPeer(n,on)});
    this.net.start();app.ui.coopConnecting(this);},
  loadout(){const d=this.app.save.d;return{shop:d.shop,shopOff:d.shopOff,wu:d.wu,we:d.we,banned:d.banned,mastery:d.mastery,equips:d.equips,equip:d.equip,bag:(d.bag||[]).filter(b=>(d.equips||[]).some(e=>e&&e.id===b.id&&e.r===b.r)),pet:d.pet,
    settings:{weapons:d.settings.weapons,tgt:d.settings.tgt,lvPrio:d.settings.lvPrio}};},
  myChar(){const m=(this.st.members||[]).find(x=>x.nick===this.me);return m?m.ch:this.app.save.d.lastChar||'goku';},
  onPeer(nick,on){if(this.role==='client'&&on)this.send(this.host,{t:'hello',ch:this.myChar(),lo:this.loadout()});
    if(this.role==='client'&&!on&&this.started)this.hostLost();
    if(this.role==='host'&&!on&&this.started)this.dropMate(nick);
    this.app.ui.coopConnecting(this);},
  onMsg(nick,m){const g=this.app.game;
    if(this.role==='host'){
      if(m.t==='hello'){this.ready.set(nick,m);this.app.ui.coopConnecting(this);if(this.started&&g&&!g.coopMate(nick)){g.coopAddMate(nick,m.ch,m.lo);this.send(nick,this.startMsg(nick));}return;}
      const mt=g&&g.coopMate(nick);if(!mt)return;mt.last=performance.now();
      if(m.t==='in'){mt.h.input.x=clamp(+m.x||0,-1,1);mt.h.input.y=clamp(+m.y||0,-1,1);}
      else if(m.t==='act'&&!g.modal&&!g.coopPaused())g.withHero(mt,()=>{if(m.a==='dash'){const i=this.app.game.input;g.dash();}else if(m.a==='ab')g.useAbility();else if(m.a==='senzu')g.useSenzu();else if(m.a==='pet')g.usePet();});
      else if(m.t==='pick')g.coopAnswer(nick,m.id,m.i|0);
      else if(m.t==='lvt')g.coopLvTool(nick,m.id,m.k,m.i);
      else if(m.t==='bye')this.dropMate(nick);
      return;}
    /* client */
    if(m.t==='start')this.clientStart(m);
    else if(m.t==='s'){this.snap=m;this.lastSnap=performance.now();if(this.view)COOPV.apply(this.view,m,this.me);}
    else if(m.t==='fx'&&this.view)COOPV.events(this.view,m.ev);
    else if(m.t==='modal'&&this.view){const v=this.view;v.lvl=Math.max(v.lvl,m.lv|0);if(m.ru){v.ru=m.ru;v.ru0=m.ru0||v.ru0;}v.modal=Object.assign({coopId:m.id,coopLeft:m.left||COOP_PICK_T},m.m);this.app.ui.openModal(v.modal,v);this.app.state='modal';}
    else if(m.t==='close'&&this.view){const v=this.view;if(v.modal&&v.modal.coopId===m.id){v.modal=null;this.app.ui.closeModal();this.app.state='play';}}
    else if(m.t==='end')this.clientEnd(m);
  },
  /* ---- host ---- */
  /* a mate who left (or lost the connection): out of the run; the rest go on, and the run is lost if nobody left stands */
  dropMate(nick){const g=this.app.game;if(!g||!g.coop)return;const i=g.coop.mates.findIndex(x=>x.nick===nick);if(i<0)return;g.coop.mates.splice(i,1);g.coop.mq=g.coop.mq.filter(q=>q.nick!==nick);
    g.say(nick+' ✕','#9aa4b8',2);if(g.coopHeroes().every(q=>q.down))g.coop.over=true;},
  hostStart(){const app=this.app,st=this.st;if(this.started)return;this.started=true;
    const g=app.coopHostGame(st);for(const [nick,h] of this.ready)g.coopAddMate(nick,h.ch,h.lo);
    for(const nick of this.ready.keys())this.send(nick,this.startMsg(nick));
    app.cloud.rpc('room_playing',{p_code:st.code,p_on:true}).catch(()=>{});},
  startMsg(nick){const st=this.st,g=this.app.game,m=g.coopMate(nick);return{t:'start',stage:st.stage,diff:st.diff,mode:st.mode,seed:st.seed,ch:m?m.ch:'goku',host:this.host,names:g.coop.names};},
  /* ---- client ---- */
  clientStart(m){if(this.started)return;this.started=true;const v=this.view=this.app.coopViewGame(m,this.me);
    /* the level window's tools ask the host; the redrawn window comes back as a new "modal" message */
    const tool=(k,i)=>{if(v.modal)this.send(this.host,{t:'lvt',id:v.modal.coopId,k,i});};
    v.rerollLevel=()=>{tool('rr');return null;};v.banLevel=i=>{tool('bn',i);return null;};v.skipLevel=()=>{if(!(v.ru.sk>0))return false;tool('sk');return true;};},
  hostLost(){if(!this.view||this.view.ended)return;this.app.ui.toast({type:'info',msg:this.app.ui.tr(T6('L\'host si è disconnesso: partita finita.','The host disconnected: the run is over.','El anfitrión se desconectó: partida terminada.','L\'hôte s\'est déconnecté : partie terminée.','Der Host ist weg: Runde beendet.','O anfitrião desconectou: partida encerrada.'))});this.clientEnd({res:null,win:false});},
  clientEnd(m){const v=this.view;if(!v||v.ended)return;v.ended=true;COOPV.finish(this.app,v,m);this.stop();},
  /* every frame (app loop) */
  tick(dt){if(!this.net)return;this.net.tick(dt);const g=this.app.game;
    if(this.role==='host'){
      if(!this.started){const open=this.net.openPeers.length,hello=this.ready.size;if((hello>=this.peersWanted&&this.peersWanted>0)||performance.now()-this.t0>20000)this.hostStart();return;}
      if(!g||!g.coop)return;
      this.timer(g.modal,dt);
      this.snapT-=dt;if(this.snapT<=0){this.snapT=COOP_SNAP;
        const ev=g.coop.ev.splice(0);
        for(const m of g.coop.mates){const s=g.coopSnap(m.nick);if(s)this.send(m.nick,s,true);
          const q=m.h.p,mine=ev.filter(e=>e[0]==='sfx'||e[0]==='say'||typeof e[1]!=='number'||Math.hypot(e[1]-q.x,e[2]-q.y)<COOP_R);if(mine.length)this.send(m.nick,{t:'fx',ev:mine});}}
      if(g.ended&&!this.endSent){this.endSent=true;for(const m of g.coop.mates)this.send(m.nick,{t:'end',win:!!g.cleared,res:g.withHero(m,()=>COOPV.summary(g))});
        app_post(this.app,g);setTimeout(()=>this.stop(),1500);}
      return;}
    /* client: stick at 20 Hz, local movement until the next snapshot */
    if(this.view&&!this.view.ended){this.timer(this.view.modal,dt);COOPV.local(this.view,dt,this.app);this.inT-=dt;if(this.inT<=0){this.inT=COOP_IN;const I=this.app.state==='play'?this.view.input:{x:0,y:0};this.send(this.host,{t:'in',x:Math.round(I.x*100)/100,y:Math.round(I.y*100)/100},true);}
      if(this.started&&performance.now()-this.lastSnap>8000&&this.lastSnap)this.hostLost();}
  },
  autoPick(g){this.app.resolveModal(coopRandPick(g.modal));},
  /* the 6-second bar inside an open co-op window */
  timer(m,dt){const el=this.app.ui.modalEl;if(!el||!m||m.coopLeft==null)return;if(this.role==='client')m.coopLeft=Math.max(0,m.coopLeft-dt);
    let b=el.querySelector('.ctimer');if(!b){b=h('div',{class:'ctimer'},h('i'),h('span'));el.prepend(b);}
    const k=clamp(m.coopLeft/COOP_PICK_T,0,1);b.firstChild.style.width=(k*100)+'%';b.lastChild.textContent='⏳ '+Math.ceil(m.coopLeft)+' s';b.classList.toggle('low',m.coopLeft<2.5);},
  action(a){if(this.role==='client')this.send(this.host,{t:'act',a});},
  answer(i){const v=this.view;if(!v||!v.modal)return;this.send(this.host,{t:'pick',id:v.modal.coopId,i});v.modal=null;this.app.ui.closeModal();},
  stop(){if(this.net){if(this.role==='client')this.send(this.host,{t:'bye'});this.net.close();}this.net=null;this.view=null;this.started=false;this.endSent=false;
    if(this.role==='host'&&this.code&&this.app)this.app.cloud.rpc('room_playing',{p_code:this.code,p_on:false}).catch(()=>{});this.role=null;}
};
/* the answer taken when the time is up: a random card / trinket / offer; a swap keeps what you carry, a chest is simply opened */
function coopRandPick(m){if(!m)return 0;if(m.type==='tswap')return (m.curs||[]).length;const L=m.options||m.opts;return L&&L.length?(Math.random()*L.length)|0:0;}
function app_post(app,g){try{const chs=[g.C.id].concat(g.coop.mates.map(m=>m.ch));app.cloud.rpc('coop_post',{p_code:COOPG.code,p_kills:g.kills,p_t:Math.round(g.t*10)/10,p_win:!!g.cleared,p_chs:chs}).catch(()=>{});}catch(e){}}

/* ====== the client's view: a Game that is drawn but never simulated ====== */
const COOPV={
  apply(v,s,me){
    v.t=s.T;v.kills=s.k;v.lvl=s.l;v.xp=s.xp;v.need=s.nd;v.bossAlive=s.ba;v.shake=Math.max(v.shake||0,s.sh);if(s.fl>(v.flash||0)){v.flash=s.fl;v.flashC=s.fc;}v.streak=s.st;
    v.banner=s.bn?{txt:s.bn[0],col:s.bn[1],t:s.bn[2],dur:s.bn[3],sub:s.bn[4]}:null;v.coopMd=s.md;v.post=s.post;
    /* enemies: kept by id, moved smoothly towards the host's position */
    const E=v.coopE||(v.coopE=new Map()),seen=new Set(),out=[];
    for(const r of s.e){const[uid,id,boss,x,y,hpk,face,fl,stun,atk,st,sq,ph,fuse,under,enr,elite,mvs,age,gold]=r;seen.add(uid);let e=E.get(uid);
      if(!e){if(boss){const bd=BOSSES[id]||BOSSES[Object.keys(BOSSES)[0]],x0=r[20]||{};e=v.mkEnemy({n:bd.n,c:bd.c,xp:0,hp:bd.hp,r:bd.r,spd:bd.spd,dmg:bd.dmg,ai:'boss',sp:bd.sp},x,y);
          Object.assign(e,{ai:'boss',boss:true,bid:x0.bid||id,bd:Object.assign({},bd,{id:x0.bid||id}),final:!!x0.final,mini:!!x0.mini});}
        else{const d=ENEMIES[id];if(!d)continue;e=v.mkEnemy(d,x,y);}e.uid=uid;E.set(uid,e);e.tx=x;e.ty=y;}
      if(boss){const B=BOSSES[id];if(B&&e.bdk!==id){e.bdk=id;e.bd=Object.assign({},B,{id:e.bid});e.esid=undefined;}Object.assign(e,r[20]||{});e.xf=r[21]||null;e.gd=r[22]||null;e.tel=r[23]||null;}
      e.tx=x;e.ty=y;e.hp=hpk*(e.max||1);e.face=face;e.fl=fl?.07:0;e.stun=stun;e.atk=atk;e.st=st;e.sq=sq;e.ph=ph;e.fuse=fuse;e.under=!!under;e.enr=!!enr;e.elite=!!elite;e.mvs=mvs;e.age=age;e.goldS=!!gold;e.dead=false;out.push(e);}
    for(const [uid,e] of E)if(!seen.has(uid)){E.delete(uid);if(e.hp>0)v.addCorpse&&v.addCorpse(e);}
    v.en=out;
    v.pr=s.pr;v.eb=s.eb.map(b=>({x:b[0],y:b[1],r:b[2],c:b[3],cp:!!b[4]}));v.gm=s.gm.map(g=>({x:g[0],y:g[1],v:g[2]}));
    v.loot=s.lo.map(l=>({k:l[0],x:l[1],y:l[2],star:l[3],tama:l[4],lock:!!l[5],alt:!!l[6],t:l[7]}));v.chests=s.ch.map(c=>({x:c[0],y:c[1],rar:c[2],final:!!c[3],elite:!!c[4],boss:!!c[5],op:c[6]<0?undefined:c[6],t:9}));
    v.bz=s.bz;v.jbeams=s.jb.map(j=>Object.assign(j,{e:{x:j.ex,y:j.ey,r:0,dead:false}}));
    /* heroes: mine into the view's own hero fields, the others as puppets */
    for(const h of s.h){if(h.n===me)this.hero(v,v,h,true);else{let P=COOPG.others.get(h.n);if(!P){P=this.puppet(v,h);COOPG.others.set(h.n,P);}this.hero(v,P.h,h,false);P.seen=performance.now();}}
    for(const [n,P] of COOPG.others)if(!s.h.some(h=>h.n===n))COOPG.others.delete(n);
    if(s.dy!=null&&!v.dying)v.dying={t:s.dy,dur:DEATH_T,ts:1};v.vicT=s.vic;
  },
  /* fields of one hero (into the view itself, or into a puppet's hero dict) */
  hero(v,H,h,mine){const p=H.p;if(mine){p.tx=h.x;p.ty=h.y;if(p.x==null||Math.hypot(p.x-h.x,p.y-h.y)>160){p.x=h.x;p.y=h.y;}}else{p.tx=h.x;p.ty=h.y;if(p.x==null){p.x=h.x;p.y=h.y;}}
    p.face=h.f||1;p.cz=!!h.cz;if(!mine)p.mv=!!h.mv;p.hp=h.hp;p.maxHp=h.mh;p.inv=h.inv;p.down=!!h.dn;p.rev=h.rv;p.atk=h.atk;p.nick=h.n;
    if(H.formIdx!==h.fi||H.C.id!==h.ch){H.C=CHARS.find(c=>c.id===h.ch)||H.C;H.formIdx=h.fi;const e=H.formIdx>=0?LINES[H.C.line||'saiyan'][H.formIdx]:null;H.formColor=e?e.aura:null;H.pc=(e&&e.cfg)||H.C.cfg;H.pcKey=H.C.id+':'+H.formIdx;}
    if(h.pt){let q=H.pet;if(!q||q.d.id!==h.pt[0]){const d=PETS.find(x=>x.id===h.pt[0]);q=H.pet=d?{d,x:h.pt[1],y:h.pt[2],cd:0,t:0,face:1,fl:0,act:0}:null;}if(q){q.tx=h.pt[1];q.ty=h.pt[2];q.face=h.pt[3]||1;q.cd=h.pt[4];}}else H.pet=null;
    H.formsUnlocked=h.fu;H.dashT=h.dsh;H.skin=h.sk;H.cast=h.ca;H.fireT=h.fT;
    const W=H.weapons;const keep=new Set();for(const [id,lv,evo,fz,xl,stt] of h.w){keep.add(id);let w=W.get(id);if(!w){w=Weapon.create(v,id);W.set(id,w);}w.lv=lv;w.evo=evo;w.fz=fz||undefined;w.xl=xl;if(stt)Object.assign(w,stt);}
    for(const id of[...W.keys()])if(!keep.has(id))W.delete(id);
    if(mine&&h.pa){H.pass=h.pa;H.trinkets=h.tr.map(x=>x[0]);H.tRar={};for(const [id,r] of h.tr)H.tRar[id]=r;H.run.coins=h.co;H.run.tk=h.tk;H.senzu=h.sz;H.abCd=h.ab;H.dashCd=h.dc;H.kai=h.kai;H.bers=h.bers;H.revives=h.rvs;H.coopSpd=h.sp;}},
  /* a puppet: the view's hero fields copied once (then refreshed by the snapshots) */
  puppet(v,h){const H={};for(const k of v.heroKeys())H[k]=v[k];H.p={x:h.x,y:h.y,hp:h.hp,maxHp:h.mh,face:1,inv:0,mv:false};H.weapons=new Map();H.C=CHARS.find(c=>c.id===h.ch)||v.C;H.formIdx=-99;H.cast=null;H.pet=null;
    return{nick:h.n,h:H,in:false};},
  /* the client's frame: its hero moves at once (the host corrects it), everything else slides to where the host said; effects age */
  local(v,dt,app){const p=v.p,I=v.input,spd=125*(v.coopSpd||1);
    if(!p.down&&!v.modal){const il=Math.hypot(I.x,I.y),ix=il>1?I.x/il:I.x,iy=il>1?I.y/il:I.y;p.x+=ix*spd*dt;p.y+=iy*spd*dt;p.mv=il>.05;p.ivx=ix;if(ix>.1)p.face=1;else if(ix<-.1)p.face=-1;}else p.mv=false;
    if(p.tx!=null){const k=Math.min(1,dt*6);p.x+=(p.tx-p.x)*k;p.y+=(p.ty-p.y)*k;}
    const sm=Math.min(1,dt*14);for(const e of v.en){if(e.tx==null)continue;e.x+=(e.tx-e.x)*sm;e.y+=(e.ty-e.y)*sm;}
    const slide=q=>{if(q&&q.tx!=null){q.x+=(q.tx-q.x)*sm;q.y+=(q.ty-q.y)*sm;}};slide(v.pet);for(const P of COOPG.others.values()){slide(P.h.p);slide(P.h.pet);}
    for(const f of v.fx){f.l-=dt;if(f.vx!==undefined){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=.92;f.vy*=.92;}}v.fx=v.fx.filter(f=>f.l>0);
    for(const t of v.tx)t.t+=dt;v.tx=v.tx.filter(t=>t.t<t.l);
    if(v.shake>0)v.shake-=dt;if(v.flash>0)v.flash-=dt;if(v.updateCorpses)v.updateCorpses(dt);v.rt+=dt;
    if(p.inv>0)p.inv-=dt;if(p.atk>0)p.atk-=dt;},
  events(v,L){for(const e of L){const[k,...a]=e;try{if(k==='sfx')v.audio.sfx(a[0]);else if(k==='say')Game.prototype.say.call(v,a[0],a[1],a[2],a[3]);else if(k==='ft')Game.prototype.floatText.call(v,a[0],a[1],a[2],a[3]);else if(v[k])v[k](...a);}catch(x){}}},
  /* what a mate's client needs to bank the run in its own save */
  summary(g){return{t:g.t,kills:g.kills,lvl:g.lvl,run:g.run,bank:g.bank,trinkets:g.trinkets,tRar:g.tRar,tPf:g.tPf,dmgBy:g.dmgBy,takenBy:g.takenBy,formsUnlocked:g.formsUnlocked,wkills:g.wkills||{},bkills:g.bkills||{}};},
  finish(app,v,m){const r=m.res;if(r){Object.assign(v,{t:r.t,kills:r.kills,lvl:r.lvl,run:r.run,bank:r.bank,trinkets:r.trinkets,tRar:r.tRar,tPf:r.tPf,dmgBy:r.dmgBy,takenBy:r.takenBy,formsUnlocked:r.formsUnlocked,wkills:r.wkills,bkills:r.bkills});}
    v.ended=false;v.finish(!!m.win);}
};
Object.assign(COOPG,{
  /* the other heroes (world space, after the own hero): their weapons, their body, a name; fallen heroes get a revive ring */
  drawOthers(R,g,t){const ctx=R.ctx,L=g.coop?g.coop.mates:[...this.others.values()];
    for(const m of L)g.withHero(m,()=>{if(FXL.a>0)for(const w of g.weapons.values()){try{if(w.drawGround)w.drawGround(ctx);if(w.draw)w.draw(ctx);}catch(e){}}
      try{if(g.pet)R.drawPet(g.pet,t,g);}catch(e){}
      try{if(g.p.down){ctx.save();ctx.globalAlpha=.45;R.drawPlayer(g,t);ctx.restore();}else R.drawPlayer(g,t);}catch(e){}});
    const tag=p=>{if(!p||p.x==null)return;ctx.save();ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.fillStyle=p===g.p?'#ffd23f':'#cfeaff';
      const s=(p.cz?'⏳ ':'')+(p.nick||'')+(p.down?' ⬇':'');ctx.strokeText(s,p.x,p.y-74);ctx.fillText(s,p.x,p.y-74);
      if(p.down){const k=clamp((p.rev||0)/COOP_REV,0,1);ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x,p.y-20,COOP_REV_R*.6,0,TAU);ctx.stroke();
        ctx.strokeStyle='#8be07a';ctx.beginPath();ctx.arc(p.x,p.y-20,COOP_REV_R*.6,-Math.PI/2,-Math.PI/2+TAU*k);ctx.stroke();}
      ctx.restore();};
    if(g.coop){g.p.cz=g.coopChoosing(g.coop.me);for(const m of L)m.h.p.cz=g.coopChoosing(m.nick);}
    tag(g.p);for(const m of L)tag(m.in?g.p:m.h.p);},
  /* screen space: "X is choosing" while the world waits for somebody else's window */
  hud(R,g){const me=g.coop?g.coop.me:g.p.nick,L=(g.coop?g.coop.names.filter(n=>g.coopChoosing(n)):(g.coopMd||[])).filter(n=>n!==me),who=L.length?L.join(', '):null;
    if(g.coop&&g.coop.mates.length){const c=R.ctx,U=R.U;c.save();c.font='700 '+Math.round(12*U)+'px "Rajdhani",sans-serif';c.textAlign='left';c.fillStyle='#cfeaff';let y=R.H-120*U;
      for(const m of g.coop.mates){const q=m.h.p;c.fillText((q.down?'⬇ ':'● ')+m.nick+'  '+Math.max(0,Math.round(q.hp))+'/'+Math.round(q.maxHp),12*U,y);y+=15*U;}c.restore();}
    if(!who)return;const c=R.ctx,U=R.U;c.save();c.textAlign='center';c.font='800 '+Math.round(14*U)+'px "Rajdhani",sans-serif';c.lineWidth=3*U;c.strokeStyle='rgba(0,0,0,.7)';c.fillStyle='#ffe08a';
    const s='⏳ '+who+' · '+R.tr(T6('sceglie una carta (invulnerabile)','choosing a card (invulnerable)','elige una carta (invulnerable)','choisit une carte (invulnérable)','wählt eine Karte (unverwundbar)','escolhendo uma carta (invulnerável)'));c.strokeText(s,R.W/2,96*U);c.fillText(s,R.W/2,96*U);c.restore();}
});
