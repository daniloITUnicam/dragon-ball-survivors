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
      zenny:0,unlocked:['goku','vegeta','piccolo','krillin'],clears:new Array(10).fill(0),x2:new Array(10).fill(0),
      diff:'normal',pet:'dende',lastChar:'goku',lastStage:0,best:{},ach:{},shop:{},trin:{},wu:{ki:1},we:{},wc:{},evoRule:2,seen:{},maxForm:{},
      stats:{kills:0,bosses:0,runs:0,zenny:0,chests:0,balls:0,wishes:0,shopBuys:0,shopMax:0,perfect:0,hardClears:0,x2Clears:0,maxLevel:0,maxTime:0},
      settings:{lang,master:.8,music:.6,sfx:.8,res:'native',scale:1,shake:true,dmgNum:true,fps:false,sandbox:false,fullscreen:false},
      binds:{
        kb:{up:['KeyW','ArrowUp'],down:['KeyS','ArrowDown'],left:['KeyA','ArrowLeft'],right:['KeyD','ArrowRight'],confirm:['Enter','Space'],cancel:['Escape','Backspace'],pause:['Escape','KeyP'],interact:['KeyE','KeyF'],pet:['KeyQ','ShiftLeft'],kaioken:['KeyR','KeyX'],senzu:['KeyH'],debug:['F2','Backquote']},
        pad:{up:[12],down:[13],left:[14],right:[15],confirm:[0],cancel:[1],pause:[9],interact:[0],pet:[2],kaioken:[3],senzu:[4],debug:[8]}
      }
    };
  }
  load(){
    try{const raw=this.storage&&this.storage.getItem(SaveData.KEY);if(raw){const d=deepMerge(this.defaults(),JSON.parse(raw));if(d.evoRule!==2){d.we={};d.wc={};d.evoRule=2;}for(const it of SHOP)if(d.shop[it.id]>it.max)d.shop[it.id]=it.max;for(const k of['clears','x2'])while(d[k].length<10)d[k].push(0);return d;}}catch(e){}
    return this.defaults();
  }
  write(){try{this.storage&&this.storage.setItem(SaveData.KEY,JSON.stringify(this.d));}catch(e){}}
  get shop(){return this.d.shop;}
  get settings(){return this.d.settings;}
  reset(){this.d=this.defaults();this.write();}
}

class Progress{
  constructor(save,notify){this.save=save;this.notify=notify||(()=>{});}
  get d(){return this.save.d;}
  runCtx(g,win){
    const s=this.d.stats;
    return{t:g.t,lvl:g.lvl,kills:g.kills,bossKills:g.run.bossKills,win:!!win,diff:g.diffId,stage:g.stageIdx<5?g.stageIdx:-1,sid:g.stageIdx,x2:g.x2,
      totKills:s.kills+(g.kills-g.bank.kills),totBosses:s.bosses+(g.run.bossKills-g.bank.bossKills)};
  }
  statsView(g){
    const s=this.d.stats,b=g?g.bank:null;
    return{
      kills:s.kills+(g?g.kills-b.kills:0),bosses:s.bosses+(g?g.run.bossKills-b.bossKills:0),clears:this.d.clears,
      chests:s.chests+(g?g.run.chests-b.chests:0),balls:s.balls+(g?g.run.balls-b.balls:0),wishes:s.wishes+(g?g.run.wishes-b.wishes:0),
      shopBuys:s.shopBuys,shopMax:s.shopMax,zenny:s.zenny,perfect:s.perfect+(g?g.run.perfect-b.perfect:0),
      hardClears:s.hardClears,x2Clears:s.x2Clears,unlocked:this.d.unlocked.length,wu:this.d.wu,we:this.d.we,
      run:g?{kills:g.kills,t:g.t,lvl:g.lvl,form:g.formsUnlocked,evos:g.run.evos,trinkets:g.trinkets.length,legendary:g.run.legendary}
           :{kills:0,t:0,lvl:0,form:0,evos:0,trinkets:0,legendary:0}
    };
  }
  live(g){
    if(g.sandbox)return;
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
    const v=this.statsView(g),out=[];
    for(const a of ACHIEVEMENTS){
      if(!this.d.ach[a.id]&&a.test(v)){this.d.ach[a.id]=Date.now();this.d.zenny+=a.reward;out.push(a.id);this.notify({type:'ach',a});}
    }
    if(out.length)this.save.write();
    return out;
  }
  reachedFinal(g){
    if(g.sandbox)return;
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
  finishRun(g,win){
    if(g.sandbox)return{sandbox:true,win,t:g.t,kills:g.kills,lvl:g.lvl,bossKills:g.run.bossKills,lines:[],total:0,unlocked:[],ach:[]};
    const d=this.d,st=d.stats,idx=g.stageIdx,stg=STAGES[idx],b=g.bank;
    if(g.formsUnlocked>(d.maxForm[g.C.id]||0))d.maxForm[g.C.id]=g.formsUnlocked;
    const firstWin=!!win&&!b.cleared;
    const lines=this.rewardLines(g,win,firstWin);
    const raw=lines.reduce((s,l)=>s+l.v,0);
    const mult=stg.zenny*g.S.gold*g.D.zenny*(g.x2?2:1)*(win?1:.75);
    const total=Math.floor(raw*mult);
    const first=!b.counted;
    st.kills+=g.kills-b.kills;st.bosses+=g.run.bossKills-b.bossKills;st.chests+=g.run.chests-b.chests;
    st.balls+=g.run.balls-b.balls;st.wishes+=g.run.wishes-b.wishes;st.perfect+=g.run.perfect-b.perfect;
    if(first)st.runs++;
    st.zenny+=total;d.zenny+=total;
    st.maxLevel=Math.max(st.maxLevel,g.lvl);st.maxTime=Math.max(st.maxTime,Math.floor(g.t));
    if(firstWin){d.clears[idx]++;if(g.diffId==='hard')st.hardClears++;if(g.x2)st.x2Clears++;}
    const bk=String(idx),bb=d.best[bk];
    if(!bb||g.kills>bb.kills)d.best[bk]={kills:g.kills,t:Math.floor(g.t),diff:g.diffId};
    g.bank={kills:g.kills,bossKills:g.run.bossKills,chests:g.run.chests,balls:g.run.balls,wishes:g.run.wishes,perfect:g.run.perfect,coins:g.run.coins,t:g.t,counted:true,cleared:b.cleared||!!win};
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
    return{win,t:g.t,kills:g.kills,lvl:g.lvl,bossKills:g.run.bossKills,lines,mult,total,unlocked,ach,stage:idx,x2:g.x2};
  }
  buyChar(id){
    const c=CHARS.find(x=>x.id===id);
    if(!c||!c.price||this.d.unlocked.includes(id)||this.d.zenny<c.price)return false;
    this.d.zenny-=c.price;this.d.unlocked.push(id);this.checkAch(null);this.save.write();return true;
  }
  buy(id){
    const it=SHOP.find(s=>s.id===id),lv=this.d.shop[id]||0;
    if(!it||lv>=it.max)return false;
    const c=shopCost(it,lv);
    if(this.d.zenny<c)return false;
    this.d.zenny-=c;this.d.shop[id]=lv+1;this.d.stats.shopBuys++;
    if(lv+1>=it.max)this.d.stats.shopMax++;
    this.checkAch(null);this.save.write();
    return true;
  }
  refundAll(){
    let sum=0;
    for(const it of SHOP){const lv=this.d.shop[it.id]||0;for(let i=0;i<lv;i++)sum+=shopCost(it,i);}
    this.d.zenny+=Math.floor(sum*.9);this.d.shop={};this.save.write();
    return Math.floor(sum*.9);
  }
}
