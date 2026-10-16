'use strict';
/* ====== Persistent data + progression rules ====== */
class SaveData{
  constructor(storage){
    this.storage=storage||(typeof localStorage!=='undefined'?localStorage:null);
    this.d=this.load();
  }
  static get KEY(){return 'dragonball-survivors-v2';}
  defaults(){
    const nl=(typeof navigator!=='undefined'&&(navigator.language||'en').slice(0,2).toLowerCase())||'en',lang=['it','es','fr','de','pt'].includes(nl)?nl:'en';
    return{
      zenny:0,unlocked:['goku','vegeta','piccolo','krillin'],clears:new Array(11).fill(0),x2:new Array(11).fill(0),
      updated:0,cloud:{uid:''},patchSeen:'',
      diff:'normal',pet:'dende',lastChar:'goku',lastStage:5,best:{},ach:{},shop:{},testBuys:{},trin:{},wu:{ki:1},we:{},wc:{},evoRule:2,seen:{},maxForm:{},
      stats:{kills:0,bosses:0,runs:0,zenny:0,chests:0,balls:0,wishes:0,shopBuys:0,shopMax:0,perfect:0,hardClears:0,x2Clears:0,extremeClears:0,zeno:0,zbuys:0,rec:{},maxLevel:0,maxTime:0},
      settings:{lang,master:.8,music:.6,sfx:.8,res:'native',scale:1,shake:true,dmgNum:true,fps:false,ambient:true,weather:true,dayNight:true,dnDay:60,dnLen:'300',streamer:false,sandbox:false,fullscreen:false},
      binds:{
        kb:{up:['KeyW','ArrowUp'],down:['KeyS','ArrowDown'],left:['KeyA','ArrowLeft'],right:['KeyD','ArrowRight'],confirm:['Enter','Space'],cancel:['Escape','Backspace'],pause:['Escape','KeyP'],interact:['KeyE','KeyF'],pet:['KeyQ'],kaioken:['KeyR','KeyX'],senzu:['KeyH'],dash:['ShiftLeft','ShiftRight'],debug:['F2','Backquote']},
        pad:{up:[12],down:[13],left:[14],right:[15],confirm:[0],cancel:[1],pause:[9],interact:[0],pet:[2],kaioken:[3],senzu:[4],dash:[5],debug:[8]}
      }
    };
  }
  load(){
    try{const raw=this.storage&&this.storage.getItem(SaveData.KEY);if(raw)return this.normalize(JSON.parse(raw));}catch(e){}
    const d=this.defaults();
    if(typeof PATCHES!=='undefined'&&PATCHES.length)d.patchSeen=PATCHES[0].id;   /* a brand-new player has no patch notes to catch up on */
    return d;
  }
  /* merge a stored/cloud object over the defaults and repair old formats */
  normalize(obj){
    const d=deepMerge(this.defaults(),obj);
    /* saves from before the universal dash: Shift used to be a second key for the pet, it now belongs to the dash */
    if(!(obj&&obj.binds&&obj.binds.kb&&obj.binds.kb.dash)){d.binds.kb.pet=(d.binds.kb.pet||[]).filter(k=>k!=='ShiftLeft'&&k!=='ShiftRight');if(!d.binds.kb.pet.length)d.binds.kb.pet=['KeyQ'];}
    if(d.evoRule!==2){d.we={};d.wc={};d.evoRule=2;}
    if(d.shop.dash){let sum=0;for(let i=0;i<d.shop.dash;i++)sum+=Math.round(120*Math.pow(1.5,i));d.zenny+=sum;}   /* the dash upgrade left the shop: refund it */
    delete d.shop.dash;if(d.testBuys)delete d.testBuys.dash;
    for(const it of SHOP)if(d.shop[it.id]>it.max)d.shop[it.id]=it.max;
    for(const k of['clears','x2'])while(d[k].length<STAGES.length)d[k].push(0);
    return d;
  }
  write(){
    if(!this.silent)this.d.updated=Date.now();
    try{this.storage&&this.storage.setItem(SaveData.KEY,JSON.stringify(this.d));}catch(e){}
    if(!this.silent&&this.onWrite)try{this.onWrite();}catch(e){}
  }
  get shop(){return this.d.shop;}
  get settings(){return this.d.settings;}
  reset(){this.d=this.defaults();this.write();}
}

class Progress{
  constructor(save,notify){this.save=save;this.notify=notify||(()=>{});}
  get d(){return this.save.d;}
  runCtx(g,win){
    const s=this.d.stats;
    return{t:g.t,lvl:g.lvl,kills:g.kills,bossKills:g.run.bossKills,win:!!win,diff:g.diffId,stage:g.stageIdx<5?g.stageIdx:-1,pos:STAGES[g.stageIdx].pos,sid:g.stageIdx,x2:g.x2,forms:g.formsUnlocked,evos:g.run.evos,
      totKills:s.kills+(g.kills-g.bank.kills),totBosses:s.bosses+(g.run.bossKills-g.bank.bossKills)};
  }
  statsView(g){
    const s=this.d.stats,b=g?g.bank:null,r=g?g.run:null,bk=k=>(b&&b[k])||0,rk=k=>(r&&r[k])||0;
    const run=g?{kills:g.kills,t:g.t,lvl:g.lvl,form:g.formsUnlocked,evos:r.evos,trinkets:r.tpicks||0,legendary:r.legendary,bosses:r.bossKills,coins:r.coins,mythic:rk('mythic'),k20:rk('k20'),streak:rk('streak')}
           :{kills:0,t:0,lvl:0,form:0,evos:0,trinkets:0,legendary:0,bosses:0,coins:0,mythic:0,k20:0,streak:0};
    /* personal records (all-time best of a single run), used for the progress bars of the "in one run" achievements */
    const sr=s.rec||{},mx=o=>Math.max(0,...Object.values(o||{}).map(v=>+(v&&v.kills!==undefined?v.kills:v)||0));
    const rec={kills:Math.max(mx(this.d.best),run.kills),t:Math.max(s.maxTime||0,run.t),lvl:Math.max(s.maxLevel||0,run.lvl),form:Math.max(mx(this.d.maxForm),run.form)};
    for(const k of ['evos','trinkets','legendary','bosses','coins','mythic','k20','streak'])rec[k]=Math.max(sr[k]||0,run[k]);
    return{
      kills:s.kills+(g?g.kills-b.kills:0),bosses:s.bosses+(g?g.run.bossKills-b.bossKills:0),clears:this.d.clears,
      chests:s.chests+(g?g.run.chests-b.chests:0),balls:s.balls+(g?g.run.balls-b.balls:0),wishes:s.wishes+(g?g.run.wishes-b.wishes:0),
      shopBuys:s.shopBuys,shopMax:s.shopMax,zenny:s.zenny,perfect:s.perfect+(g?g.run.perfect-b.perfect:0),
      hardClears:s.hardClears,x2Clears:s.x2Clears,extremeClears:s.extremeClears||0,runs:s.runs,
      zeno:(s.zeno||0)+rk('zeno')-bk('zeno'),zbuys:(s.zbuys||0)+rk('zbuy')-bk('zbuy'),
      unlocked:this.d.unlocked.length,wu:this.d.wu,we:this.d.we,wc:this.d.wc||{},rec,run
    };
  }
  /* Test mode (settings) and sandbox runs never give zenny, progress unlocks or achievements */
  blocked(g){return !!(g&&g.sandbox)||!!this.d.settings.sandbox;}
  live(g){
    if(this.blocked(g))return;
    const mf=this.d.maxForm;if(g.formsUnlocked>(mf[g.C.id]||0)){mf[g.C.id]=g.formsUnlocked;this.save.write();}
    this.checkUnlocks(this.runCtx(g,false));
    this.checkAch(g);
  }
  checkUnlocks(r){
    const out=[];
    for(const c of CHARS){
      if(c.ul&&!this.d.unlocked.includes(c.id)&&c.ul(r)){this.d.unlocked.push(c.id);out.push(c.id);this.notify({type:'unlock',c});}
    }
    if(out.length)this.save.write();
    return out;
  }
  checkAch(g){
    if(this.blocked(g))return[];
    const v=this.statsView(g),out=[];
    for(const a of ACHIEVEMENTS){
      if(!this.d.ach[a.id]&&a.test(v)){this.d.ach[a.id]=Date.now();this.d.zenny+=a.reward;out.push(a.id);this.notify({type:'ach',a});}
    }
    if(out.length)this.save.write();
    return out;
  }
  reachedFinal(g){
    if(this.blocked(g))return;
    if(!this.d.x2[g.stageIdx]){this.d.x2[g.stageIdx]=1;this.save.write();this.notify({type:'x2',stage:g.stageIdx});}
  }
  /* zenny: (coins + kills + time + bosses + clear) * stage mult * shop/trinket gold * x2 * (win?1:.75) */
  rewardLines(g,win,firstWin){
    const idx=g.stageIdx,b=g.bank;
    return[
      {k:'coins',v:g.run.coins-b.coins},
      {k:'clear',v:firstWin?200*(idx+1):0}
    ];
  }
  /* opts.keep: the run was ended by the game itself (a new release is being installed) - no 25% penalty for not winning */
  finishRun(g,win,opts){
    if(this.blocked(g))return{sandbox:true,win,t:g.t,kills:g.kills,lvl:g.lvl,bossKills:g.run.bossKills,lines:[],total:0,unlocked:[],ach:[],dmg:Object.assign({},g.dmgBy),coins:g.run.coins};
    const d=this.d,st=d.stats,idx=g.stageIdx,stg=STAGES[idx],b=g.bank;
    if(g.formsUnlocked>(d.maxForm[g.C.id]||0))d.maxForm[g.C.id]=g.formsUnlocked;
    const firstWin=!!win&&!b.cleared;
    const lines=this.rewardLines(g,win,firstWin);
    const raw=lines.reduce((s,l)=>s+l.v,0);
    const mult=stg.zenny*g.S.gold*g.D.zenny*(g.x2?2:1)*(win||(opts&&opts.keep)?1:.75);
    const total=Math.floor(raw*mult);
    const first=!b.counted;
    st.kills+=g.kills-b.kills;st.bosses+=g.run.bossKills-b.bossKills;st.chests+=g.run.chests-b.chests;
    st.balls+=g.run.balls-b.balls;st.wishes+=g.run.wishes-b.wishes;st.perfect+=g.run.perfect-b.perfect;
    if(first)st.runs++;
    st.zeno=(st.zeno||0)+(g.run.zeno||0)-(b.zeno||0);st.zbuys=(st.zbuys||0)+(g.run.zbuy||0)-(b.zbuy||0);
    {const rc=st.rec||(st.rec={});for(const [k,v] of Object.entries({evos:g.run.evos,trinkets:g.run.tpicks||0,legendary:g.run.legendary,bosses:g.run.bossKills,coins:g.run.coins,mythic:g.run.mythic||0,k20:g.run.k20||0,streak:g.run.streak||0}))rc[k]=Math.max(rc[k]||0,v||0);}
    st.zenny+=total;d.zenny+=total;
    st.maxLevel=Math.max(st.maxLevel,g.lvl);st.maxTime=Math.max(st.maxTime,Math.floor(g.t));
    if(firstWin){d.clears[idx]++;if(g.diffId==='hard'||g.diffId==='extreme')st.hardClears++;if(g.diffId==='extreme')st.extremeClears=(st.extremeClears||0)+1;if(g.x2)st.x2Clears++;}
    const bk=String(idx),bb=d.best[bk];
    if(!bb||g.kills>bb.kills)d.best[bk]={kills:g.kills,t:Math.floor(g.t),diff:g.diffId};
    g.bank={kills:g.kills,bossKills:g.run.bossKills,chests:g.run.chests,balls:g.run.balls,wishes:g.run.wishes,perfect:g.run.perfect,coins:g.run.coins,zeno:g.run.zeno||0,zbuy:g.run.zbuy||0,t:g.t,counted:true,cleared:b.cleared||!!win};
    if(g.diffId!=='easy')for(const id of g.C.start){
      if((win||g.lvl>=50)&&!d.wu[id]){d.wu[id]=1;this.notify({type:'weapon',id,evo2:false});}
    }
    /* second evolution: clear every stage (Normal or Hard) with the weapon in your build */
    if(win&&g.diffId!=='easy')for(const id of g.weapons.keys()){
      const a=d.wc[id]||(d.wc[id]=[]);if(!a.includes(idx))a.push(idx);
      if(!d.we[id]&&STAGES.every((_,i)=>a.includes(i))){d.we[id]=1;this.notify({type:'weapon',id,evo2:true});}
    }
    const unlocked=this.checkUnlocks(this.runCtx(g,win));
    const ach=this.checkAch(g);
    this.save.write();
    return{win,t:g.t,kills:g.kills,lvl:g.lvl,bossKills:g.run.bossKills,lines,mult,total,unlocked,ach,stage:idx,x2:g.x2,dmg:Object.assign({},g.dmgBy),coins:g.run.coins};
  }
  buyChar(id){
    const c=CHARS.find(x=>x.id===id);
    if(!c||!c.price||this.d.unlocked.includes(id)||this.d.zenny<c.price)return false;
    this.d.zenny-=c.price;this.d.unlocked.push(id);this.checkAch(null);this.save.write();return true;
  }
  buy(id){
    const it=SHOP.find(s=>s.id===id),lv=this.d.shop[id]||0;
    if(!it||lv>=it.max)return false;
    if(this.d.settings.sandbox){   /* Test mode: free purchase, remembered so that turning Test off can undo it */
      this.d.shop[id]=lv+1;this.d.testBuys=this.d.testBuys||{};this.d.testBuys[id]=(this.d.testBuys[id]||0)+1;this.save.write();return true;
    }
    const c=shopCost(it,lv);
    if(this.d.zenny<c)return false;
    this.d.zenny-=c;this.d.shop[id]=lv+1;this.d.stats.shopBuys++;
    if(lv+1>=it.max)this.d.stats.shopMax++;
    this.checkAch(null);this.save.write();
    return true;
  }
  /* turning Test off: undo every shop level bought for free while it was on; returns how many */
  revertTest(){
    let n=0;const tb=this.d.testBuys||{};
    for(const id of Object.keys(tb)){const k=Math.min(tb[id],this.d.shop[id]||0);n+=k;const v=(this.d.shop[id]||0)-k;if(v>0)this.d.shop[id]=v;else delete this.d.shop[id];}
    this.d.testBuys={};this.save.write();return n;
  }
  refundAll(){
    let sum=0;
    const tb=this.d.testBuys||{};for(const it of SHOP){const lv=(this.d.shop[it.id]||0)-(tb[it.id]||0);for(let i=0;i<lv;i++)sum+=shopCost(it,i);}
    this.d.zenny+=Math.floor(sum*.9);this.d.shop={};this.d.testBuys={};this.save.write();
    return Math.floor(sum*.9);
  }
}
