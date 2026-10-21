/* Endless mode + the balance changes of the same release: coin decay, milestones, weapons Lv100, Zeno's Shop, auto-select, payout after "Continue",
   escalation per difficulty, Extreme spawn steps, Broly's berserk, magnet on bags: node tests/endless.js */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const ok=(c,m)=>{console.log((c?'  ok  ':'FAIL  ')+m);if(!c)fails++;};
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:640}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const start=(diff,stage,sandbox)=>pg.evaluate((diff,stage,sandbox)=>{window.__MAPSEED=0;const A=__app;A.save.d.settings.sandbox=false;
  A.startGame({stage:stage||0,char:'goku',diff:diff||'normal',x2:false,sandbox:!!sandbox,pet:'none'});const g=A.game;window.G=g;g.sb.nospawn=true;g.modal=null;g.p.hp=g.p.maxHp=1e7;g.en.length=0;return true;},diff,stage,sandbox);

/* 1. constants */
const K=await pg.evaluate(()=>({k:ENDLESS_COIN_K,t:ENDLESS_COIN_T,mile:ENDLESS_MILE,w:ENDLESS_W,bonus:ENDLESS_BONUS,zeno:ENDLESS_ZENO,cd:ENDLESS_CD_MIN,wxl:WXL,wmax:WMAX,dmg:XL_DMG,area:XL_AREA,xcd:XL_CD}));
ok(K.k===.9&&K.t===15,'coin income x0.9 every 15 s');
ok(K.mile===50&&K.bonus===100&&K.w===4,'every 50 levels: +100 coins and 4 of the old escalation steps');
ok(K.zeno===300&&K.cd===.2&&K.wxl===95&&K.wmax===5,"Zeno's Shop every 300 s; cooldown floor 0.2 s; weapons 5 + 95 extra levels = Lv 100");

/* 2. entering Endless */
await start('extreme',5);
const e0=await pg.evaluate(()=>{const g=G;g.t=900;g.setLevel?g.setLevel(30):0;const b0=g.escSteps();g.continueAfterWin();return{b0,en:g.endless,mile:g.enMile,en0:{...g.en0},zn:g.map.zenoNext,t:g.t,lvl:g.lvl,steps:g.escSteps(),need:g.need};});
ok(e0.en&&e0.en0.t===900&&e0.en0.lvl>=30&&e0.zn===900+300,"Continue: Endless on, reference taken, Zeno's Shop due in 300 s ("+e0.zn+")");
ok(e0.steps===e0.b0,'the escalation does not jump when Endless starts ('+e0.b0+' -> '+e0.steps+')');

/* 3. coin decay: x0.9 every 15 s, compounding, the milestone bonus exempt */
const cd=await pg.evaluate(()=>{const g=G,t0=g.en0.t,out=[];for(const dt of[0,14.9,15,30,45,150,600]){g.t=t0+dt;out.push([dt,g.coinK()]);}
  g.t=t0+30;const c0=g.run.coins;g.addZenny(100);const got=g.run.coins-c0;g.t=t0;return{out,got};});
ok(cd.out.every(([dt,k])=>Math.abs(k-Math.pow(.9,Math.floor(dt/15)))<1e-9),'coinK follows 0.9^floor(t/15): '+cd.out.map(([d,k])=>d+'s:'+k.toFixed(3)).join(' '));
ok(cd.got===81,'100 zenny after 30 s of Endless are worth 81 ('+cd.got+')');

/* 4. the enemies do not grow with time any more, only with the player levels (every 50: +100 coins, +4 steps) */
const ms=await pg.evaluate(()=>{const g=G,s0=g.escSteps();g.t=g.en0.t+3600;const s1=g.escSteps();g.t=g.en0.t+100;
  const lv0=g.lvl,c0=g.run.coins,m0=g.enMile;let said=[];const sp=g.say.bind(g);g.say=(a,b,c,d)=>{said.push([a,d]);return sp(a,b,c,d);};
  g.setLevel(Math.ceil((lv0+1)/50)*50);const m1=g.enMile,c1=g.run.coins,s2=g.escSteps();
  g.setLevel(m1*50+100);const m2=g.enMile,c2=g.run.coins,s3=g.escSteps();g.say=sp;
  const ms0=said.find(x=>x[1]&&/100/.test(x[1]));return{s0,s1,m0,m1,c0,c1,s2,m2,c2,s3,said:said.length,sub:ms0&&ms0[1]};});
ok(ms.s0===ms.s1,'one hour of Endless without levelling: the enemies stay the same ('+ms.s0+' = '+ms.s1+')');
ok(ms.m1===ms.m0+1&&ms.c1-ms.c0===100&&ms.s2===ms.s0+4,'reaching the next multiple of 50: +100 coins exactly and +4 steps ('+(ms.c1-ms.c0)+' coins, steps '+ms.s0+' -> '+ms.s2+')');
ok(ms.m2===ms.m1+2&&ms.c2-ms.c1===200&&ms.s3===ms.s2+8,'two milestones at once pay twice and escalate twice');
ok(ms.said>=2&&/100/.test(ms.sub||'')&&/%/.test(ms.sub||''),'the warning announces the coins and the stronger enemies: '+(ms.sub||'').replace(/\n/g,' '));

/* 5. weapons beyond Lv 5 (Endless only): +4% damage, +1.2% size, -0.5% cooldown per level, cooldown never under 0.2 s */
const wx=await pg.evaluate(()=>{const g=G,w=g.addWeapon('kame');const before=w.canXl();
  w.lv=5;w.evo=1;                                   /* the last tier available to this player (maxEvo 1) */
  const can=w.canXl(),opt=g.upgradePool().some(o=>o.type==='w'&&o.id==='kame'&&o.xl!==undefined);
  const d0=w.dm,a0=w.e2a,c0=w.e2c;w.upgrade();w.upgrade();w.upgrade();w.upgrade();
  const r={before,can,opt,xl:w.xl,show:w.lvShow,dm:w.dm/d0,area:w.e2a/a0,cd:w.e2c/c0};
  w.xl=94;w.upgrade();r.cap=w.xl;r.canAtCap=w.canXl();r.show95=w.lvShow;
  const S0=g.S.cd;g.S.cd=.5;r.cdTot=w.e2c*g.S.cd;g.S.cd=1;r.cdTot1=w.e2c*g.S.cd;g.S.cd=S0;
  g.endless=false;r.canOff=w.canXl();g.endless=true;return r;});
ok(!wx.before&&wx.can&&wx.opt,'a finished weapon offers extra levels in Endless (and only there)');
ok(wx.xl===4&&wx.show===9,'upgrade() adds extra levels: Lv '+wx.show);
ok(Math.abs(wx.dm-(1+.04*4))<1e-9&&Math.abs(wx.area-(1+.012*4))<1e-9,'4 extra levels: damage x'+wx.dm.toFixed(3)+', size x'+wx.area.toFixed(3));
ok(wx.cd<1&&Math.abs(wx.cd-(1-.005*4))<1e-9,'cooldown x'+wx.cd.toFixed(3));
ok(wx.cap===95&&!wx.canAtCap&&wx.show95===100,'the weapon stops at Lv 100 (5 + 95)');
ok(wx.cdTot>=.2-1e-9&&wx.cdTot1>=.2-1e-9,'the total cooldown (stat x weapon) never goes below 0.2 s ('+wx.cdTot.toFixed(3)+')');
ok(!wx.canOff,'outside Endless the weapon stops at Lv 5');

/* 6. level-up: auto-select (no menu) / the menu; XP curve of Endless */
const au=await pg.evaluate(()=>{const g=G;g.save.settings.lvAuto=true;g.modal=null;const l0=g.lvl,own0=g.weapons.size+Object.keys(g.pass).length;g.xp=g.need;g.levelUp();
  const r={modal:!!g.modal,lvl:g.lvl-l0,prio:g.enPrio().length};g.save.settings.lvAuto=false;g.modal=null;g.xform=null;g.afterX=null;g.xp=g.need;g.levelUp();r.modal2=g.modal&&g.modal.type;g.modal=null;
  r.n=[g.endlessNeed(g.en0.lvl),g.endlessNeed(g.en0.lvl+10),g.endlessNeed(g.en0.lvl+40)];r.rate=g.en0.rate;return r;});
ok(!au.modal&&au.lvl===1,'auto-select: the level-up applies a card and opens no menu');
ok(au.modal2==='level','auto-select off: the usual menu opens');
ok(au.n[0]<au.n[1]&&au.n[1]<au.n[2]&&Math.abs(au.n[0]-Math.max(40,Math.round(au.rate*12)))<=1,'XP per level grows slowly: '+au.n.join(' < '));
ok(au.prio>=1&&au.prio<=10,'the priority list has at most 10 entries (5 weapons + 5 upgrades)');

/* 7. Zeno's Shop: the red button returns every 5 minutes */
const zn=await pg.evaluate(()=>{const g=G,m=g.map;g.feat=g.feat.filter(f=>f.kind!=='secret'&&f.kind!=='zenoportal');g.t=m.zenoNext+1;const n0=g.feat.length,z0=m.zenoNext;m.update(.016);
  return{spawned:g.feat.some(f=>f.kind==='secret'),z0,z1:m.zenoNext,t:g.t,ttl:(g.feat.find(f=>f.kind==='secret')||{}).ttl};});
ok(zn.spawned&&Math.abs(zn.z1-(zn.t+300))<.5,"Zeno's red button appears and the next one is scheduled 300 s later");

/* 8. payout: winning pays, Endless pays only what was earned after the win, spending in the shop is taken from the old coins first, never negative */
await start('normal',0,false);
const py=await pg.evaluate(()=>{const A=__app,g=G,d=A.save.d,out={};
  g.t=600;g.kills=100;g.run.coins=1000;g.sellHeld();const res1=A.progress.finishRun(g,true);g.ended=true;out.p1=res1.total;out.bank=g.bank.coins;
  const stg=STAGES[g.stageIdx],mult=stg.zenny*g.S.gold*g.D.zenny;out.exp1=Math.floor((1000+Math.round(200*ZMUL*(g.stageIdx+1)))*mult);
  g.continueAfterWin();const t0=g.en0.t;g.t=t0+30;g.addZenny(100);   /* 81 */
  g.spendCoins(500);                                    /* Zeno: eats the old coins first */
  g.t=t0+60;g.addZenny(100);                            /* 100 x 0.9^4 = 65.61 -> 66 */
  g.ended=false;const res2=A.progress.finishRun(g,false);out.p2=res2.total;out.exp2=Math.floor(Math.round(100*Math.pow(.9,4))*mult*.75);
  /* a second Endless death without earning: nothing */
  g.ended=false;const res3=A.progress.finishRun(g,false);out.p3=res3.total;return out;});
ok(py.bank===1000&&py.p1===py.exp1,'the win pays the coins of the run ('+py.p1+')');
ok(py.p2===py.exp2&&py.p2>=0,'after "Continue" only the coins earned afterwards are paid, with the 25% penalty of a defeat ('+py.p2+' = '+py.exp2+')');
ok(py.p3===0,'a second end without new coins pays nothing (no double payout)');

/* 9. outside Endless: escalation per difficulty (every 10 minutes, Easy every 60 s), Extreme spawn steps */
const df=await pg.evaluate(()=>{const out={};for(const d of['easy','normal','hard','extreme']){const g=__app.startGame({stage:0,char:'goku',diff:d,x2:false,sandbox:true,pet:'none'});const G2=__app.game;G2.t=600;out[d]={hp:G2.escF.hp,dm:G2.escF.dmg,ar:G2.escF.arm,steps:G2.escSteps(),x:G2.xSteps()};G2.t=1800;out[d].s30=G2.escSteps();
  if(d==='extreme'){G2.t=0;out.x0=G2.xSteps();G2.t=300;out.x300=G2.xSteps();G2.t=3600;out.x3600=G2.xSteps();}}return out;});
ok(df.easy.hp===.01&&df.easy.dm===.01&&df.easy.ar===0,'Easy: +1% health, +1% damage per step');
ok(df.normal.hp===.10&&df.normal.dm===.02&&df.hard.hp===.10&&df.hard.dm===.02,'Normal / Hard: +10% health, +2% damage');
ok(df.extreme.hp===.15&&df.extreme.dm===.05&&df.extreme.ar===.15,'Extreme: +15% health, +5% damage, +15% armor');
ok(df.easy.steps===10&&df.normal.steps===1&&df.hard.steps===1&&df.extreme.steps===1&&df.normal.s30===3&&df.extreme.s30===3,'Normal / Hard / Extreme: one step every 10 minutes (600 s = 1 step, 30 min = 3); Easy keeps one per minute');
ok(df.extreme.x===20&&df.x0===0&&df.x300===10&&df.x3600===60&&df.easy.x===0&&df.normal.x===0,'Extreme: +2% enemies every 30 s, 60 steps at most ('+df.x300+' at 5 min, '+df.x3600+' at 1 h)');

/* 10. Broly's berserk: 6 s (8 s in the final form), the weapons aim badly */
const bs=await pg.evaluate(()=>{const A=__app;A.startGame({stage:0,char:'broly',diff:'normal',x2:false,sandbox:true,pet:'none'});const g=A.game;window.G=g;g.sb.nospawn=true;g.modal=null;
  let tier=0;Object.defineProperty(g,'abTier',{get:()=>tier,configurable:true});g.bersCd=0;const a=g.startBerserk(),t1=g.bersMax;g.bers=0;g.bersCd=0;tier=2;const b2=g.startBerserk(),t2=g.bersMax;
  const j=[];for(let i=0;i<400;i++)j.push(g.aimJit());g.bers=0;const j0=g.aimJit();
  return{a,b2,t1,t2,mx:Math.max(...j),mn:Math.min(...j),nz:j.filter(v=>v!==0).length,j0,aim:BERS_AIM};});
ok(bs.t1===6&&bs.t2===8,'Broly berserk lasts 6 s ('+bs.t1+') and 8 s in the final form ('+bs.t2+')');
ok(bs.mx<=bs.aim&&bs.mn>=-bs.aim&&bs.mx>.2&&bs.mn<-.2&&bs.nz>390&&bs.j0===0,'while it lasts the aim of every weapon is off by up to +-'+bs.aim+' rad; otherwise exact');

/* 11. the Magnet pick-up drags zenny bags and coins (not the ones on the islands) */
await start('normal',0,true);
const mg=await pg.evaluate(()=>{const g=G,p=g.p;g.loot.length=0;
  const mk=(k,dx,isle)=>{g.loot.push({k,x:p.x+dx,y:p.y,v:5,t:0,ttl:0,isle});return g.loot[g.loot.length-1];};
  const bag=mk('bag',900),coin=mk('coin',-900),isl=mk('bag',900,true),heal=mk('heal',700);
  g.collectLoot({k:'magnet',x:p.x,y:p.y});
  const atts=[bag.att,coin.att,!!isl.att,!!heal.att];
  const d0=Math.hypot(bag.x-p.x,bag.y-p.y);for(let i=0;i<10;i++){g.modal=null;g.update(1/60);}const d1=Math.hypot(bag.x-p.x,bag.y-p.y);
  return{atts,d0,d1};});
ok(mg.atts[0]&&mg.atts[1]&&!mg.atts[2]&&!mg.atts[3],'the Magnet marks bags and coins, not the island ones nor hearts');
ok(mg.d1<mg.d0-100,'the marked bag flies toward the player ('+Math.round(mg.d0)+' -> '+Math.round(mg.d1)+' px)');

console.log(errs.length?'page errors: '+errs.slice(0,4).join(' | '):'  ok  no page errors');if(errs.length)fails++;
await b.close();console.log(fails?fails+' FAILED':'all ok');process.exit(fails?1:0);})();
