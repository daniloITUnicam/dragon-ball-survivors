/* extra trinket slots (shop "Extra Trinket", up to 3), the swap window with several trinkets, "refuse lower rarities", the weapon blacklist (shop "Weapon Blacklist") */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:700}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
/* v109: a run carries any number of trinkets (Game.runCap = TRIN_RUN_CAP); these checks exercise the swap window, so they put the old cap (the bag slots) back */
const capFree=await pg.evaluate(()=>{__app.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.trinkets=[];for(const id of ['boots','cape','scouter','armor','potara'])g.addTrinket(id,1);return g.trinkets.length===5&&!g.modal;});
await pg.evaluate(()=>{Object.defineProperty(Game.prototype,'runCap',{get(){return this.tcap;},configurable:true});});

const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
ok(capFree,'v109: five found trinkets are all carried, no swap window');
const go=(lv)=>pg.evaluate((lv)=>{const A=__app,d=A.save.d;d.shop.tslot=lv;d.settings.trinRefuse=false;d.settings.sandbox=false;d.equip=null;
  A.startGame({stage:5,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;g.sb.nospawn=true;g.sb.god=true;g.modal=null;window.G=g;return g.tcap;},lv);
/* ---------- capacity follows the shop upgrade ---------- */
const caps=[];for(const lv of[0,1,2])caps.push(await go(lv));
ok(caps.join()==='1,2,3','slots = 1 + shop purchases ('+caps.join('/')+')');
const sh=await pg.evaluate(()=>{const it=SHOP.find(x=>x.id==='tslot'),bn=SHOP.find(x=>x.id==='ban');return{tslot:it&&[it.max,shopCost(it,0),shopCost(it,1)],ban:bn&&[bn.max,shopCost(bn,0),shopCost(bn,9)]};});
ok(sh.tslot&&sh.tslot[0]===2&&sh.tslot[1]===3600&&sh.tslot[2]===10800,'"Extra Trinket": 2 purchases, '+(sh.tslot||[]).join('/'));
ok(sh.ban&&sh.ban[0]===10,'"Weapon Blacklist": 10 purchases, from '+(sh.ban||[])[1]+' to '+(sh.ban||[])[2]);
/* ---------- filling 3 slots, then the swap window ---------- */
await go(2);
const f=await pg.evaluate(()=>{const g=G,o={};
  o.a=g.addTrinket('boots',0);o.b=g.addTrinket('cape',1);o.c=g.addTrinket('scouter',0);o.n=g.trinkets.length;o.noModal=!g.modal;
  o.rars=g.trinkets.map(id=>g.trR(id)).join();
  g.addTrinket('armor',3);o.modal=g.modal&&g.modal.type;o.curs=g.modal&&g.modal.curs.length;o.nw=g.modal&&g.modal.nw.id;
  return o;});
ok(f.n===3&&f.noModal,'three trinkets fit without any window ('+f.rars+')');
ok(f.modal==='tswap'&&f.curs===3&&f.nw==='armor','the 4th opens the swap window listing the 3 carried trinkets');
await wait(400);
const dom=await pg.evaluate(()=>({cols:document.querySelectorAll('.tscol').length,btns:[...document.querySelectorAll('.tsbtn button')].length,multi:!!document.querySelector('.tswap.multi'),keep:[...document.querySelectorAll('.row button')].map(x=>x.textContent).join('|'),tog:!!document.querySelector('.trtog')}));
ok(dom.cols===4&&dom.btns===3&&dom.multi&&dom.tog,'window: new + 3 current columns, a Replace button under each, and the refuse switch ('+dom.keep+')');
await pg.screenshot({path:'/tmp/tswap_multi.png'});
/* keys: 4 = keep all, 2 = replace the second */
const k=await pg.evaluate(()=>{const g=G,o={};const before=g.trinkets.slice();const c0=g.run.coins;
  /* the highlighted (Space) button is the weakest carried trinket */
  o.focus=document.querySelector('.tsbtn [data-focus]')&&[...document.querySelectorAll('.tsbtn button')].indexOf(document.querySelector('.tsbtn [data-focus]'));
  o.weakest=g.modal.curs.reduce((bb,c,i)=>c.rar<g.modal.curs[bb].rar?i:bb,0);
  const rep=g.modal.curs[1].id;
  window.dispatchEvent(new KeyboardEvent('keydown',{code:'Digit2',bubbles:true}));
  o.after=g.trinkets.slice();o.hasNew=g.trinkets.includes('armor');o.lost=!g.trinkets.includes(rep);o.slotPos=g.trinkets.indexOf('armor');o.repId=rep;
  o.gain=g.run.coins-c0;o.exp=trinketSale(1,g.sd);o.modalGone=!g.modal;o.rar=g.trR('armor');o.srcNew=g.tSrc.armor;
  return o;});
ok(k.focus===k.weakest,'Space/focus defaults to the weakest trinket');
ok(k.hasNew&&k.lost&&k.slotPos===1&&k.rar===3&&k.srcNew==='run'&&k.modalGone,'key 2 replaces the 2nd trinket in its own slot');
ok(k.gain===k.exp,'the replaced trinket (found in the run) is sold ('+k.gain+')');
await pg.evaluate(()=>{const g=G;window.__c0=g.run.coins;window.__before=g.trinkets.join();g.addTrinket('potara',1);});
await wait(300);
const kp=await pg.evaluate(()=>{const g=G,o={};o.m=g.modal&&g.modal.curs.length;
  window.dispatchEvent(new KeyboardEvent('keydown',{code:'Digit4',bubbles:true}));   /* the 4th option keeps what you have */
  o.same=g.trinkets.join()===__before;o.sold=g.run.coins-__c0;o.exp=trinketSale(1,g.sd);return o;});
ok(kp.m===3&&kp.same&&kp.sold===kp.exp,'the last option keeps the 3 trinkets and sells the offered one');
/* ---------- upgrade in place for the same trinket, duplicates ---------- */
const du=await pg.evaluate(()=>{const g=G,o={};const c0=g.run.coins,n0=g.trinkets.length;
  const r0=g.trR('armor');g.addTrinket('armor',4);o.up=g.trR('armor');o.n=g.trinkets.length===n0;o.pos=g.trinkets.indexOf('armor');
  g.addTrinket('armor',1);o.lowerSold=g.run.coins-c0>0;o.rAfter=g.trR('armor');o.noModal=!g.modal;return o;});
ok(du.up===4&&du.n,'a better copy of a carried trinket upgrades it in place');
ok(du.rAfter===4&&du.lowerSold&&du.noModal,'a worse or equal copy of a carried trinket is just sold');
/* ---------- refuse lower rarities ---------- */
const rf=await pg.evaluate(()=>{const g=G,o={};g.modal=null;g.tq=[];g.trinkets=[];g.tRar={};g.tSrc={};
  g.addTrinket('armor',3);g.addTrinket('cape',2);g.addTrinket('boots',2);
  const s=__app.save.d.settings;s.trinRefuse=true;
  let c0=g.run.coins;g.addTrinket('scouter',1);o.lowerAuto=!g.modal&&g.run.coins-c0===trinketSale(1,g.sd)&&!g.trinkets.includes('scouter');
  c0=g.run.coins;g.addTrinket('potara',2);o.sameMenu=g.modal&&g.modal.type==='tswap';g.resolveModal(3);
  g.addTrinket('dragonheart',3);o.betterMenu=g.modal&&g.modal.type==='tswap';g.resolveModal(3);
  o.refused=g.run.trefused||0;
  s.trinRefuse=false;g.addTrinket('scouter',0);o.offMenu=g.modal&&g.modal.type==='tswap';g.resolveModal(3);
  /* the shop's offers are never refused automatically */
  s.trinRefuse=true;g.addTrinket('scouter',0,{buy:true,onYes(){},onNo(){}});o.buyMenu=g.modal&&g.modal.type==='tswap';g.resolveModal(3);
  s.trinRefuse=false;
  return o;});
ok(rf.lowerAuto,'setting ON: a trinket of lower rarity than all you carry is sold at once, no window');
ok(rf.betterMenu,'setting ON: a trinket that is not worse than every one you carry still opens the swap window');   /* "worse" = lower rarity, or the same rarity with less perfection (so a same-rarity roll may be skipped too) */
ok(rf.offMenu&&rf.buyMenu&&rf.refused>=1,'setting OFF (and Zeno-sama\'s offers) always open the window');
/* the switch inside the window changes the same setting */
const sw=await pg.evaluate(()=>{const g=G;g.modal=null;__app.save.d.settings.trinRefuse=false;g.addTrinket('potara',2);return!!g.modal;});
await wait(300);
const tg=await pg.evaluate(()=>{const b=document.querySelector('.trtog');b.click();const o={on:__app.save.d.settings.trinRefuse,txt:b.textContent,cls:b.classList.contains('on')};G.resolveModal(3);return o;});
ok(sw&&tg.on===true&&tg.cls,'the switch in the swap window turns the setting on ('+tg.txt+')');
const st=await pg.evaluate(()=>{__app.save.d.settings.trinRefuse=false;__app.ui.show('settings');__app.ui.top.args={tab:'gameplay'};__app.ui.rebuild();return!!document.querySelector('[data-fid="ttrinRefuse"]');});
ok(st,'Settings has the same option');
/* ---------- end of run sells every found trinket; HUD draws all slots ---------- */
await go(2);
const en=await pg.evaluate(()=>{const g=G,o={};g.addTrinket('boots',0);g.addTrinket('cape',1);g.addTrinket('scouter',2);
  const exp=trinketSale(0,g.sd)+trinketSale(1,g.sd)+trinketSale(2,g.sd);const c0=g.run.coins;const v=g.sellHeld();o.v=v;o.exp=exp;o.gain=g.run.coins-c0;o.again=g.sellHeld();
  o.srcs=Object.values(g.tSrc).join();return o;});
ok(en.v===en.exp&&en.gain===en.exp&&en.again===0,'at the end of the run all 3 found trinkets are sold, once ('+en.v+')');
const hud=await pg.evaluate(()=>{const g=G;g.trinkets=[];g.tRar={};g.tSrc={};g.addTrinket('boots',0);g.addTrinket('cape',1);g.addTrinket('scouter',2);g.update(1/60);__app.renderer.draw(g,0);return __app.renderer.zones.filter(z=>z.k==='trinket').length;});
ok(hud===3,'the HUD shows 3 trinket slots with tooltips');
/* ---------- weapon blacklist ---------- */
const bn=await pg.evaluate(()=>{const A=__app,d=A.save.d,P=A.progress,o={};d.wu={ki:1,kame:1,javelin:1,dsunday:1};d.banned=[];d.shop.ban=0;
  o.noSlot=P.toggleBan('javelin')===false;
  d.shop.ban=2;o.b1=P.toggleBan('javelin');o.b2=P.toggleBan('dsunday');o.b3=P.toggleBan('kame');o.list=d.banned.join();
  o.un=P.toggleBan('javelin');o.list2=d.banned.join();
  const nd=A.save.normalize(JSON.parse(JSON.stringify({...d,banned:['dsunday','dsunday','nope','kame','javelin'],shop:{...d.shop,ban:2}})));o.norm=nd.banned.join();
  const nd2=A.save.normalize(JSON.parse(JSON.stringify({...d,banned:['dsunday','kame'],shop:{}})));o.norm0=nd2.banned.length;
  return o;});
ok(bn.noSlot&&bn.b1&&bn.b2&&!bn.b3&&bn.list==='javelin,dsunday','bans are limited to the purchased amount ('+bn.list+')');
ok(bn.un&&bn.list2==='dsunday','tapping a banned weapon lifts the ban');
ok(bn.norm==='dsunday,kame'&&bn.norm0===0,'a loaded save drops duplicates, unknown weapons and bans beyond what was bought ('+bn.norm+')');
const lo=await pg.evaluate(()=>{const A=__app,d=A.save.d;d.wu={};for(const id in WEAPONS)d.wu[id]=1;d.banned=['javelin','dsunday','breaker'];d.shop.ban=3;
  A.startGame({stage:5,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;g.sb.nospawn=true;g.modal=null;
  const seen=new Set();for(let i=0;i<600;i++)for(const o of g.levelOptions())if(o.type==='w'&&o.lv===0)seen.add(o.id);
  const out={seen:[...seen],others:seen.size};
  d.banned=[];const seen2=new Set();for(let i=0;i<600;i++)for(const o of g.levelOptions())if(o.type==='w'&&o.lv===0)seen2.add(o.id);out.free=seen2.size;
  out.hit=['javelin','dsunday','breaker'].filter(x=>seen.has(x));out.hit2=['javelin','dsunday','breaker'].filter(x=>seen2.has(x));
  d.banned=[];d.shop.ban=0;return out;});
ok(lo.hit.length===0&&lo.others>5,'banned weapons never show up as new weapons in level-up cards ('+lo.others+' other weapons still do)');
ok(lo.hit2.length===3,'without bans they do ('+lo.hit2.join()+')');
/* ---------- shop screen: card + manage screen ---------- */
const ui=await pg.evaluate(()=>{const A=__app,d=A.save.d;d.wu={ki:1,kame:1,javelin:1};d.banned=['javelin'];d.shop.ban=2;d.shop.tslot=1;A.ui.show('shop');return{cards:document.querySelectorAll('.shopi').length,manage:!!document.querySelector('[data-fid="shbanm"]'),txt:(document.querySelector('[data-fid="shbanm"]')||{}).textContent,total:SHOP.length};});
ok(ui.cards===ui.total&&ui.manage&&/1\/2/.test(ui.txt||''),'shop shows both new cards and the manage button ('+ui.txt+')');
await pg.screenshot({path:'/tmp/shop_new.png'});
const ui2=await pg.evaluate(()=>{document.querySelector('[data-fid="shbanm"]').click();return{cards:document.querySelectorAll('.bancard').length,on:document.querySelectorAll('.bancard.on').length};});
ok(ui2.cards===3&&ui2.on===1,'manage screen lists the unlocked weapons and marks the banned one');
await pg.screenshot({path:'/tmp/bans.png'});
const ui3=await pg.evaluate(()=>{document.querySelector('[data-fid="bankame"]').click();return{on:document.querySelectorAll('.bancard.on').length,list:__app.save.d.banned.join()};});
ok(ui3.on===2&&ui3.list==='javelin,kame','clicking a weapon bans it (up to the purchased amount)');
const ui4=await pg.evaluate(()=>{document.querySelector('[data-fid="banki"]').click();return{on:document.querySelectorAll('.bancard.on').length};});
ok(ui4.on===2,'a 3rd ban is refused when the bans are used up');
/* refund returns the money and clears the bans */
const rfn=await pg.evaluate(()=>{const A=__app,d=A.save.d;const z0=d.zenny;const v=A.progress.refundAll();return{v,banned:d.banned.length,tslot:d.shop.tslot||0};});
ok(rfn.v>0&&rfn.banned===0&&rfn.tslot===0,'refund gives back the new upgrades too and clears the bans ('+rfn.v+')');
console.log(errs.length?errs.slice(0,4):'no errors');await b.close();process.exit(errs.length||process.exitCode?1:0);})();
