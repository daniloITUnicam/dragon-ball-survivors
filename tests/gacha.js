/* gacha: rates, tickets, bag, equip, in-run sale, ticket sources, Super Dragon Balls, and the screens */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:700}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
/* ---------- rates and pools ---------- */
const rt=await pg.evaluate(()=>{const N=300000,cnt=[0,0,0,0,0],cl=[0,0,0,0,0];for(let i=0;i<N;i++){cnt[gachaRarity(false)]++;cl[gachaRarity(true)]++;}
  const pools=[0,1,2,3,4].map(r=>gachaPool(r)),all=new Set(pools.flat().map(t=>t.id));
  return{n:cnt.map(x=>x/N*100),l:cl.map(x=>x/N*100),sizes:pools.map(p=>p.length),mythStats:pools[4].every(t=>t.m),everyUsed:TRINKETS.every(t=>all.has(t.id)),total:TRINKETS.length};});
const nr=[72,20,6,1.5,.5],tol=[.8,.7,.4,.2,.12];
ok(rt.n.every((v,i)=>Math.abs(v-nr[i])<tol[i]),'normal rates 72/20/6/1.5/0.5%: '+rt.n.map(v=>v.toFixed(2)).join(' / '));
ok(rt.l.every((v,i)=>Math.abs(v-[45,32,15,6,2][i])<[.8,.8,.6,.3,.2][i]),'lucky rates 45/32/15/6/2%: '+rt.l.map(v=>v.toFixed(2)).join(' / '));
ok(rt.l[4]>rt.n[4]*3&&rt.l[3]>rt.n[3]*3,'lucky tickets are clearly better for Legendary and Mythic');
ok(rt.sizes.every(s=>s>=20)&&rt.mythStats&&rt.everyUsed,'pools: '+rt.sizes.join('/')+' trinkets per rarity ('+rt.total+' trinkets, every one can drop, Mythics only from stat trinkets)');
ok(rt.total>=29,'new trinkets were added to widen the pool');
/* ---------- pulling ---------- */
const pl=await pg.evaluate(()=>{const A=__app,d=A.save.d,P=A.progress;d.settings.sandbox=false;d.tickets={t1:1,t10:1,l10:1};d.bag=[];d.equip=null;d.zenny=0;
  d.tickets.t10=0;const noTicket=P.gachaPull('t10');
  d.tickets.t10=1;const r1=P.gachaPull('t1'),r10=P.gachaPull('t10'),rl=P.gachaPull('l10');
  const after={...d.tickets};
  /* a forced duplicate pays the market value of Zeno-sama */
  d.bag=d.bag.filter(b=>!(b.id==='scouter'&&b.r===2));const keep=window.gachaRoll;d.tickets.t1=3;window.gachaRoll=()=>({id:'scouter',r:2});const a=P.gachaPull('t1')[0],z0=d.zenny,c=P.gachaPull('t1')[0];window.gachaRoll=keep;
  return{noTicket,n1:r1.length,n10:r10.length,nl:rl.length,after,bag:d.bag.length,firstDup:a.dup,secDup:c.dup,coins:c.coins,paid:d.zenny-z0,price:dupPayout(2),stat:d.stats.zenny>=dupPayout(2),pulls:d.gacha.pulls,
    uniq:new Set(d.bag.map(b=>b.id+'@'+b.r)).size===d.bag.length,sorted:r10.every((x,i)=>!i||x.at>r10[i-1].at)};});
ok(pl.noTicket===null,'no ticket, no pull');
ok(pl.n1===1&&pl.n10===10&&pl.nl===10&&pl.after.t1===0&&pl.after.t10===0&&pl.after.l10===0,'1x/10x/10x lucky tickets give 1/10/10 pulls and are spent');
ok(pl.uniq&&pl.bag>=1&&pl.bag<=21+1,'the bag keeps one entry per trinket and rarity ('+pl.bag+')');
ok(!pl.firstDup&&pl.secDup&&pl.coins===pl.price&&pl.paid===pl.price,'a duplicate pays 80% of the Zeno-sama market value ('+pl.paid+' = '+pl.price+') and is flagged');
ok(pl.pulls===1+10+10+2,'pull counter ('+pl.pulls+')');
/* ---------- save repair ---------- */
const sv=await pg.evaluate(()=>{const o={bag:[{id:'scouter',r:0,at:1},{id:'scouter',r:0,at:2},{id:'nope',r:0,at:3},{id:'cape',r:9,at:4},{id:'cape',r:1,at:5}],equip:{id:'boots',r:3},sball:[3,3,9,0,5],tickets:{t1:-4,t10:'x',l10:2.7}};
  const d=__app.save.normalize(o);return{bag:d.bag.map(b=>b.id+b.r),equip:d.equip,sball:d.sball,tk:d.tickets};});
ok(JSON.stringify(sv.bag)==='["scouter0","cape1"]'&&sv.equip===null&&JSON.stringify(sv.sball)==='[1,3]'&&sv.tk.t1===0&&sv.tk.t10===0&&sv.tk.l10===2,'a damaged save is repaired: '+JSON.stringify(sv));
/* ---------- equip and the run ---------- */
const eq=await pg.evaluate(()=>{const A=__app,d=A.save.d,P=A.progress;d.bag=[{id:'armor',r:4,at:Date.now()},{id:'scouter',r:0,at:Date.now()+1}];d.equip=null;
  const go=()=>{A.startGame({stage:5,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;g.sb.nospawn=true;g.sb.god=true;g.modal=null;window.G=g;return g;};
  const base=go().S.armor;
  const bad=P.equipTrinket('boots',3);const okq=P.equipTrinket('armor',4);const e1=JSON.stringify(d.equip);
  const g=go();
  return{bad,okq,e1,tr:g.trinkets.slice(),rar:g.tRar.armor,src:g.tSrc.armor,picks:g.run.tpicks||0,mythic:g.run.mythic||0,armor:g.S.armor,base};});
ok(eq.bad===false&&eq.okq===true&&eq.tr[0]==='armor'&&eq.rar===4&&eq.src==='bag','the equipped trinket starts the run in the slot at its rarity (a trinket you do not own cannot be equipped)');
ok(eq.picks===0&&eq.mythic===0,'and it does not count as a pick for the achievements');
ok(eq.armor>eq.base+2,'its stats apply (Mythic Royal Saiyan Armor: armor '+eq.base.toFixed(1)+' -> '+eq.armor.toFixed(1)+')');
/* ---------- a trinket found in the run is sold ---------- */
const sl=await pg.evaluate(()=>{const g=G,out={};const sd=g.sd,sale=r=>trinketSale(r,sd);g.modal=null;g.tq=[];Object.defineProperty(g,'runCap',{get:()=>1,configurable:true});   /* v109: no trinket limit in a run - the swap rules are checked with the old limit of 1 */
  out.mythicSale=trinketSale(4,0);out.table=[0,1,2,3,4].map(r=>trinketSale(r,0));
  const c0=g.run.coins;
  g.addTrinket('potara',1);out.m1=g.modal&&g.modal.type;g.resolveModal(0);                 /* replace the bag trinket: it stays in the bag, nothing is sold */
  out.afterBag=g.run.coins-c0;out.src1=g.tSrc.potara;out.cur1=g.trinkets[0];
  g.addTrinket('cape',1);g.resolveModal(0);out.sold1=g.run.coins-c0-out.afterBag;out.exp1=sale(1);       /* replace a found one: it is sold */
  const c1=g.run.coins;g.addTrinket('boots',0);g.resolveModal(1);out.sold2=g.run.coins-c1;out.exp2=sale(0);out.cur2=g.trinkets[0];   /* decline: the offered one is sold */
  const c2=g.run.coins;g.tq.push({id:'scouter',rar:0,onYes(){},onNo(){},buy:true});g.drainTQ();g.resolveModal(1);out.shop=g.run.coins-c2;     /* decline in Zeno-sama's shop: not bought, not sold */
  const c3=g.run.coins,held=g.trinkets[0],hr=g.trR(held);const v=g.sellHeld();out.end=g.run.coins-c3;out.expEnd=sale(hr);out.src3=g.tSrc[held];out.again=g.sellHeld();
  out.bagKept=__app.save.d.bag.some(b=>b.id==='armor'&&b.r===4);delete g.runCap;out.formula=[0,1,2,3,4].every(r=>trinketSale(r,0)===Math.round((ZENO_PRICE[r]+GACHA.sell[r])*ZMUL*TSELL_MUL));return out;});
ok(sl.formula&&sl.table.every((v,i)=>i===0||v>sl.table[i-1]),'sale value = (market value + bonus) x ZMUL x TSELL_MUL, rising with rarity ('+sl.table.join('/')+')');
ok(sl.m1==='tswap'&&sl.afterBag===0&&sl.src1==='run'&&sl.cur1==='potara','replacing the trinket from the bag sells nothing (it stays in the bag)');
ok(sl.sold1===sl.exp1,'replacing a trinket found in the run sells it ('+sl.sold1+')');
ok(sl.sold2===sl.exp2&&sl.cur2==='cape','keeping the old one sells the offered one ('+sl.sold2+')');
ok(sl.shop===0,'declining an offer in Zeno-sama\'s shop sells nothing');
ok(sl.end===sl.expEnd&&sl.src3==='sold'&&sl.again===0,'the trinket held at the end of the run is sold once ('+sl.end+')');
ok(sl.bagKept,'the bag is never touched');
/* ---------- ticket sources ---------- */
const ts=await pg.evaluate(()=>{const g=G,out={},r0=Math.random;
  g.en=[];g.bossAlive=0;g.spawnBoss('raditz');let e=g.en.find(x=>x.boss);Math.random=()=>0.05;g.killEnemy(e);out.boss20=g.run.tk.t10;
  Math.random=r0;g.en=[];g.bossAlive=0;g.spawnBoss('nappa');e=g.en.find(x=>x.boss);Math.random=()=>0.5;g.killEnemy(e);out.bossNo=g.run.tk.t10;Math.random=r0;
  const e1=g.run.tk.t1;g.eliteDown({x:g.p.x,y:g.p.y,r:10});out.elite=g.run.tk.t1-e1;
  g.modal=null;g.balls=6;g.collectLoot({k:'ball',x:g.p.x,y:g.p.y,star:7});for(let k=0;!(g.modal&&g.modal.type==='wish')&&k<900;k++){if(g.modal)g.resolveModal(0);g.update(1/60);}   /* v113: Shenron appears first (a level-up on the way is answered) */
  if(g.modal)g.modal.options[3]='tickets';   /* v115: 4 wishes out of 7, drawn at random */
  out.wishOptions=g.modal&&g.modal.options.slice();const t0=g.run.tk.t10;g.resolveModal(3);out.wish=g.run.tk.t10-t0;out.log=g.wishLog.slice(-1)[0];
  out.chance=GACHA.bossChance;return out;});
ok(ts.chance===1&&ts.boss20===1&&ts.bossNo===2,'every boss drops a 10x ticket (100%)');
ok(ts.elite===1,'an Elite drops a 1x ticket');
ok(ts.wishOptions.length===4&&ts.wishOptions[3]==='tickets'&&ts.wish===1&&ts.log==='tickets','the Dragon Ball wish can be 10 tickets (a 10x ticket) '+JSON.stringify([ts.wishOptions,ts.wish,ts.log]));
const fl=await pg.evaluate(()=>{const g=G,d=__app.save.d,t0={...d.tickets},run={...g.run.tk};g.finish(false);const t1={...d.tickets};
  g.ended=false;g.finish(false);const t2={...d.tickets};   /* a second finish (continue) must not pay twice */
  return{run,gain:{t1:t1.t1-t0.t1,t10:t1.t10-t0.t10,l10:t1.l10-t0.l10},again:t2.t10-t1.t10+t2.t1-t1.t1,res:__app.lastRes||null};});
ok(fl.gain.t10===fl.run.t10&&fl.gain.t1===fl.run.t1&&fl.again===0,'tickets found in the run are saved at its end, once ('+JSON.stringify(fl.gain)+')');
/* ---------- Test mode ---------- */
const tm=await pg.evaluate(()=>{const A=__app,d=A.save.d,P=A.progress;d.tickets={t1:0,t10:0,l10:0};const n0=d.bag.length;d.settings.sandbox=true;const r=P.gachaPull('t10');const free=r&&r.length===10&&d.tickets.t10===0;
  const flagged=d.bag.filter(b=>b.t).length;d.settings.sandbox=false;const back=P.revertTest();return{free,flagged,gone:d.bag.length===n0,back,eq:d.equip&&d.equip.id};});
ok(tm.free&&tm.flagged>=1&&tm.gone,'Test mode: free pulls, and the trinkets obtained go away when Test is turned off ('+tm.flagged+' removed)');
/* ---------- Super Dragon Balls ---------- */
const sb=await pg.evaluate(()=>{const A=__app,d=A.save.d,P=A.progress,out={};d.sball=[];d.settings.sandbox=false;
  out.stages=STAGES.filter(s=>s.sup).map(s=>s.no).sort((a,b)=>a-b);out.last=STAGE_ORDER.slice(-SUPER_STAGES).every(i=>STAGES[i].sup);out.nSup=STAGES.filter(s=>s.sup).length;
  out.a=P.addSuperBall(2);out.dup=P.addSuperBall(2);out.bad=P.addSuperBall(4);d.settings.sandbox=true;out.sbx=P.addSuperBall(1);d.settings.sandbox=false;
  out.have=d.sball.slice();
  P.addSuperBall(1);out.six=d.sball.length;out.early=P.useSuperBalls('lucky');
  P.addSuperBall(3);out.seven=d.sball.length;
  out.noReward=P.useSuperBalls('xx');out.stillSeven=d.sball.length;
  const l0=d.tickets.l10;out.lucky=P.useSuperBalls('lucky');out.l10=d.tickets.l10-l0;out.zero=d.sball.length;
  for(let n=1;n<=3;n++)P.addSuperBall(n);const lock=CHARS.find(c=>!d.unlocked.includes(c.id));out.locked=!!lock;out.owned=P.useSuperBalls('char',lock.id);out.unlocked=d.unlocked.includes(lock.id);out.zero2=d.sball.length;
  out.again=P.useSuperBalls('char','goku');return out;});
ok(sb.nSup===3&&sb.last,'the last 3 stages of the campaign hold Super Dragon Balls (stage numbers '+sb.stages.join(', ')+')');
ok(sb.a===2&&sb.dup===0&&sb.bad===0&&sb.sbx===0&&JSON.stringify(sb.have)==='[2]','each Super Ball is stored once, only 1-3, never in test/sandbox runs');
ok(sb.six===2&&sb.early===false&&sb.seven===3&&sb.noReward===false&&sb.stillSeven===3,'all three are needed to use them, and an unknown reward spends nothing');
ok(sb.lucky&&sb.l10===1&&sb.zero===0,'3 Super Balls -> one 10x Lucky ticket, and they are spent');
ok(sb.locked&&sb.owned&&sb.unlocked&&sb.zero2===0&&sb.again===false,'3 Super Balls -> a locked character of your choice, for free');
/* the stage: normal balls are replaced by Super Dragon Balls */
const st=await pg.evaluate(()=>{const A=__app,d=A.save.d,out={};d.sball=[];
  const sup=STAGES.findIndex(s=>s.sup),norm=STAGES.findIndex(s=>!s.sup);
  const trySt=i=>{A.startGame({stage:i,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;g.sb.nospawn=true;g.sb.god=true;g.modal=null;window.G=g;return g;};
  const r0=Math.random;Math.random=()=>0.1;let g=trySt(sup);out.planLow=!!g.supPlan;Math.random=()=>0.9;g=trySt(sup);out.planHigh=!!g.supPlan;Math.random=r0;
  d.sball=[1,2,3];Math.random=()=>0.1;g=trySt(sup);out.planFull=!!g.supPlan;Math.random=r0;d.sball=[];     /* never when all 3 are owned */
  out.chance=SUP_CHANCE;
  g=trySt(sup);g.supPlan={at:0,done:false};g.t=3;g.ballAt=0;g.updateBallPlan();out.ballOnSup=g.loot.some(l=>l.k==='ball');g.updateSuperPlan();
  const l=g.loot.find(x=>x.k==='sball');out.has=!!l;out.star=l&&l.star;out.far=l&&Math.hypot(l.x-g.p.x,l.y-g.p.y);g.updateSuperPlan();out.once=g.loot.filter(x=>x.k==='sball').length;
  g.en=[];g.p.x=l.x-200;g.p.y=l.y;g.update(1/30);out.guard=g.en.filter(e=>e.tama).length;out.near=!!l.lock;
  g.p.x=l.x;g.p.y=l.y;g.update(1/30);out.lockedStill=!l.dead;
  const tb=g.en.find(e=>e.tama);if(tb){tb.hp=1;g.damageEnemy(tb,99999,0,0,false);}
  g.p.x=l.x;g.p.y=l.y;g.update(1/30);g.update(1/30);out.saved=d.sball.slice();out.gone=!!l.dead;out.ownedHud=[...g.ballOwned()];
  g=trySt(norm);g.ballAt=0;g.t=g.ballEvery+10;g.updateBallPlan();out.ballNormal=g.loot.some(l=>l.k==='ball');out.supNormal=!!g.supPlan;
  return out;});
ok(st.planLow&&!st.planHigh&&st.chance>=.4&&st.chance<=.7,'a Super Ball is planned only by chance ('+Math.round(st.chance*100)+'% of the runs in those stages)');
ok(!st.planFull,'no new Super Ball is planned when you already hold all 3');
ok(!st.ballOnSup&&st.ballNormal&&!st.supNormal,'normal Dragon Balls are replaced in the last stages and still exist elsewhere');
ok(st.has&&st.far>=500&&st.once===1&&st.star>=1&&st.star<=3,'the Super Ball lands far away, once ('+Math.round(st.far)+' px, star '+st.star+')');
ok(st.near&&st.guard===1&&st.lockedStill,'a Tamagami wakes when you get near and the ball stays locked until it falls ('+st.guard+' guardian)');
ok(st.saved.length===1&&st.saved[0]===st.star&&st.gone&&st.ownedHud.join()===st.saved.join(),'picking it up stores it in the save for good');
/* ---------- screens ---------- */
const ui=await pg.evaluate(async()=>{const A=__app,d=A.save.d,U=A.ui,out={},sl=ms=>new Promise(r=>setTimeout(r,ms));A.toMenu();d.settings.sandbox=false;d.bag=[];d.zenny=0;d.equip=null;
  d.tickets={t1:2,t10:2,l10:1};U.show('main');
  out.menuBtn=[...document.querySelectorAll('button')].map(x=>x.textContent);
  U.push('gacha');out.cards=document.querySelectorAll('.tkcard').length;out.disabled=[...document.querySelectorAll('.tkcard')].map(c=>c.querySelector('button').disabled);
  out.count0=[...document.querySelectorAll('.tkcount')].map(x=>x.textContent);
  document.querySelector('[data-fid="pullt10x1"]').click();out.over=!!document.querySelector('.gov');out.reels=document.querySelectorAll('.greel').length;
  document.querySelector('.gskip').click();await sl(900);
  out.cards2=document.querySelectorAll('.gcard').length;out.news=document.querySelectorAll('.gnew').length;out.dups=document.querySelectorAll('.gdup').length;out.bag=d.bag.length;out.t10=d.tickets.t10;
  out.sum=document.querySelector('.gsum')&&document.querySelector('.gsum').textContent;
  document.querySelector('[data-fid="gclose"]').click();out.closed=!document.querySelector('.gov');
  out.count=[...document.querySelectorAll('.tkcount')].map(x=>x.textContent);
  return out;});
ok(ui.menuBtn.some(t=>/Gacha/.test(t)),'the main menu has the Gacha button');
ok(ui.cards===3&&ui.disabled.every(x=>x===false)&&ui.count0.join()==='× 2,× 2,× 1','the Gacha screen shows the three ticket kinds with their counters ('+ui.count0.join(' ')+')');
ok(ui.over&&ui.reels===10,'a 10x pull opens the summon with 10 reels');
ok(ui.cards2===10&&ui.news+ui.dups===10&&ui.news===ui.bag&&ui.t10===1&&ui.closed,'skipping shows the 10 trinkets at once, each flagged new or duplicate; the ticket is spent and the window closes');
ok(ui.count.join()==='× 2,× 1,× 1','ticket counters refresh after the pull ('+ui.count.join(' ')+')');
/* ---------- several tickets at once ---------- */
const bk=await pg.evaluate(()=>{const A=__app,d=A.save.d,P=A.progress,o={};d.settings.sandbox=false;d.bag=[];
  d.tickets={t1:250,t10:30,l10:3};
  o.max=[P.gachaMaxTimes('t1'),P.gachaMaxTimes('t10'),P.gachaMaxTimes('l10')];
  const a=P.gachaPull('t1',10);o.a=a.length;o.t1a=d.tickets.t1;
  const b=P.gachaPull('t1',100);o.b=b.length;o.t1b=d.tickets.t1;
  const c=P.gachaPull('t10',10);o.c=c.length;o.t10c=d.tickets.t10;
  const e=P.gachaPull('t1',1000);o.clamp=e.length;o.t1e=d.tickets.t1;           /* never more than 100 pulls in one go */
  d.tickets.t1=5;o.short=P.gachaPull('t1',10);o.t1s=d.tickets.t1;                  /* not enough tickets: nothing is spent */
  d.tickets.l10=3;const l=P.gachaPull('l10',3);o.l=l.length;o.pulls=d.gacha.pulls;
  o.noDupInBag=new Set(d.bag.map(x=>x.id+'@'+x.r)).size===d.bag.length;
  return o;});
ok(bk.max.join()==='100,10,10','at most 100 pulls at once: 100 / 10 / 10 tickets ('+bk.max.join('/')+')');
ok(bk.a===10&&bk.t1a===240&&bk.b===100&&bk.t1b===140,'x1 tickets: 10 at once and 100 at once spend that many tickets');
ok(bk.c===100&&bk.t10c===20,'10 tickets of 10x = 100 pulls');
ok(bk.clamp===100&&bk.t1e===40,'asking for more than 100 is capped to 100');
ok(bk.short===null&&bk.t1s===5,'without enough tickets nothing happens and nothing is spent');
ok(bk.l===30&&bk.noDupInBag,'lucky tickets work in bulk too, and the bag keeps one entry per trinket+rarity ('+bk.pulls+' pulls counted)');
const bu=await pg.evaluate(async()=>{const A=__app,d=A.save.d,U=A.ui,out={},sl=ms=>new Promise(r=>setTimeout(r,ms));
  d.settings.sandbox=false;d.bag=[];d.zenny=0;d.tickets={t1:37,t10:12,l10:0};U.show('main');U.push('gacha');
  const q=f=>document.querySelector('[data-fid="'+f+'"]');
  const st=l=>l.map(f=>{const b=q(f);return b?(b.disabled?'off':'on'):'-';}).join();
  out.t1=st(['pullt1x1','pullt1x10','pullt1x100','pullt1all']);
  out.t10=st(['pullt10x1','pullt10x10','pullt10x100','pullt10all']);
  out.l10=st(['pulll10x1','pulll10x10']);
  /* 10 pulls keep the 10-reel summon */
  q('pullt1x10').click();out.reels10=document.querySelectorAll('.greel').length;out.bulk10=!!document.querySelector('.gov.bulk');
  document.querySelector('.gskip').click();await sl(900);out.cards10=document.querySelectorAll('.gcard').length;q('gclose').click();
  /* 100 pulls: compact summon, one reel, tiles */
  d.tickets.t1=150;U.rebuild(true);
  q('pullt1x100').click();out.bulk=!!document.querySelector('.gov.bulk');out.reels=document.querySelectorAll('.greel').length;
  document.querySelector('.gskip').click();await sl(900);
  const tiles=[...document.querySelectorAll('.gtile')];out.tiles=tiles.length;out.cnt=tiles.length;
  out.sum=document.querySelector('.gsum').textContent;out.again=(q('again')||{}).textContent;out.left=d.tickets.t1;out.bag=d.bag.length;
  out.order=tiles.map(t=>+/ r(\d)/.exec(t.className)[1]);
  q('again').click();await sl(300);document.querySelector('.gskip')&&document.querySelector('.gskip').click();await sl(900);out.left2=d.tickets.t1;   /* only 50 left: it pulls 50 */
  out.cnt2=document.querySelectorAll('.gtile').length;
  q('gclose').click();out.closed=!document.querySelector('.gov');return out;});
ok(bu.t1==='on,on,off,-'&&bu.t10==='on,on,-,-'&&bu.l10==='off,off','ticket cards: x1 / x10 / x100 buttons, no "All" button ('+bu.t1+' | '+bu.t10+' | '+bu.l10+')');
ok(bu.reels10===10&&!bu.bulk10&&bu.cards10===10,'10 pulls keep the 10-reel summon');
ok(bu.bulk&&bu.reels===1,'more than 10 pulls use the compact summon (one quick reel)');
ok(bu.tiles===100&&bu.left===50&&bu.bag>=1,'100 pulls are shown one small tile each ('+bu.tiles+' tiles)');
ok(bu.order.every((r,i)=>i===0||bu.order[i-1]>=r),'best rarity first');
ok(/×50/.test(bu.again||'')&&bu.left2===0&&bu.cnt2===50,'"Pull again" repeats the amount, limited by the tickets left ('+bu.again+')');
ok(bu.closed,'the summary closes');

/* mythic banner */
const my=await pg.evaluate(async()=>{const U=__app.ui,d=__app.save.d,out={},sl=ms=>new Promise(r=>setTimeout(r,ms));d.tickets.t1=5;const keep=window.gachaRoll;
  window.gachaRoll=()=>({id:'dragonheart',r:4});U.gachaPull('t1');await sl(3300);out.banner=!!document.querySelector('.gjack:not(.leg) .gbanner');out.text=document.querySelector('.gjack .gbanner')&&document.querySelector('.gjack .gbanner').textContent;
  out.shakes=!!document.querySelector('.gov');U.closeReveal();
  window.gachaRoll=()=>({id:'armor',r:3});U.gachaPull('t1');await sl(3400);out.leg=!!document.querySelector('.gjack.leg');U.closeReveal();
  window.gachaRoll=()=>({id:'scouter',r:0});U.gachaPull('t1');await sl(3400);out.none=!document.querySelector('.gjack')&&!!document.querySelector('.gcard');U.closeReveal();window.gachaRoll=keep;return out;});
ok(my.banner,'a Mythic shows the big banner ("'+my.text+'")');
ok(my.leg,'a Legendary shows the golden banner');
ok(my.none,'a Common has no banner');
/* the bag */
const bg=await pg.evaluate(async()=>{const A=__app,d=A.save.d,U=A.ui,out={};
  d.bag=[];const t0=Date.now()-100000;[['scouter',0],['scouter',3],['armor',4],['potara',1],['cape',1],['crystal',2],['dragonheart',3],['senzubag',0]].forEach(([id,r],i)=>d.bag.push({id,r,at:t0+i*1000}));d.equip=null;d.equips=[null,null,null];U.bagF=null;U.bagSel='';
  U.show('main');U.push('chars');out.slot=!!document.querySelector('.tslot');out.slotEmpty=document.querySelector('.tslot').textContent;
  document.querySelector('.tslot').click();out.screen=U.top.name;out.cards=document.querySelectorAll('.baggrid .tcard').length;
  const search=document.querySelector('.achsearch');search.value='crit';search.dispatchEvent(new Event('input'));out.crit=[...document.querySelectorAll('.baggrid .tcard .cn')].map(x=>x.textContent);
  search.value='';search.dispatchEvent(new Event('input'));
  document.querySelector('[data-fid="rc0"]').click();out.noCommon=document.querySelectorAll('.baggrid .tcard').length;
  document.querySelector('[data-fid="rc0"]').click();out.all=document.querySelectorAll('.baggrid .tcard').length;
  const srt=k=>document.querySelector('[data-fid="bs_'+k+'"]').click();   /* sorting is a column of icon buttons */
  srt('rar');out.byRar=document.querySelector('.baggrid .tcard .ctag').textContent;
  srt('old');out.oldest=document.querySelector('.baggrid .tcard .cn').textContent;
  srt('new');out.newest=document.querySelector('.baggrid .tcard .cn').textContent;
  document.querySelector('.baggrid .tcard').click();   /* select the newest one, then equip it */
  document.querySelector('[data-fid="beq"]').click();out.afterEquip=U.top.name;out.eq=d.equip&&d.equip.id+d.equip.r;out.slotFull=document.querySelector('.tslot.on')&&document.querySelector('.tslot .tsn').textContent;
  document.querySelector('[data-fid="tunq"]').click();out.unq=d.equip;
  return out;});
ok(bg.slot&&/\+/.test(bg.slotEmpty),'the character screen has the trinket slot with a +');
ok(bg.screen==='bag'&&bg.cards===8,'clicking the + opens the bag with every trinket found ('+bg.cards+')');
ok(bg.crit.length>=2&&bg.crit.every(n=>/Scouter|Crystal/.test(n)),'search by effect: "crit" -> '+bg.crit.join(', '));
ok(bg.noCommon===6&&bg.all===8,'the rarity chips hide a rarity ('+bg.noCommon+' left without Common) and bring it back');
ok(/^Mythic/.test(bg.byRar),'sorted by rarity the Mythic comes first ('+bg.byRar+')');
ok(bg.oldest==='Broken Scouter'&&bg.newest==='Senzu Pouch','sorted by date obtained: oldest "'+bg.oldest+'", newest "'+bg.newest+'"');
ok(bg.afterEquip==='chars'&&bg.eq&&bg.slotFull,'equipping from the slot goes back to the character screen with the trinket in it ('+bg.slotFull+')');
ok(bg.unq===null,'the slot can be emptied again');
/* Super Shenron in the stage menu */
const ss=await pg.evaluate(async()=>{const A=__app,d=A.save.d,U=A.ui,out={};d.sball=[1,2];U.show('main');U.push('stages');out.before=!!document.querySelector('.superc');
  d.sball=[1,2,3];U.rebuild();const sc=document.querySelector('.superc');out.after=!!sc;out.first=!!sc&&sc.parentNode.firstElementChild===sc;
  sc.click();out.screen=U.top.name;out.opts=document.querySelectorAll('.supbox .card').length;
  const nUn=d.unlocked.length;document.querySelector('[data-fid="sbchar"]').click();out.next=U.top.name;out.claimBar=!!document.querySelector('.claimbar');
  document.querySelector('.char.locked').click();out.claimBtn=!!document.querySelector('[data-fid="sbclaim"]');out.price=!!document.querySelector('[data-fid="buychar"]');
  document.querySelector('[data-fid="sbclaim"]').click();out.unl=d.unlocked.length-nUn;out.spent=d.sball.length;
  U.pop();out.gone=!document.querySelector('.superc');
  d.sball=[1,2,3];U.rebuild();const l0=d.tickets.l10;document.querySelector('.superc').click();document.querySelector('[data-fid="sblucky"]').click();out.lucky=d.tickets.l10-l0;out.toGacha=U.top.name;out.spent2=d.sball.length;
  return out;});
ok(!ss.before&&ss.after&&ss.first,'the Super Shenron scenario appears first in the stage menu only with all 3 Super Balls');
ok(ss.screen==='superWish'&&ss.opts===2,'it offers two rewards');
ok(ss.next==='chars'&&ss.claimBar&&ss.claimBtn&&!ss.price,'"free character" takes you to the character screen, where a locked one is claimed instead of bought');
ok(ss.unl===1&&ss.spent===0&&ss.gone,'claiming unlocks it, spends the 3 balls and the scenario disappears');
ok(ss.lucky===1&&ss.toGacha==='gacha'&&ss.spent2===0,'"10x Lucky tickets" gives the ticket and sends you to the Gacha');
console.log(errs.length?errs.slice(0,3):'no page errors');await b.close();process.exit(errs.length||process.exitCode?1:0);})();
