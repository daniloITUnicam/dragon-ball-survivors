/* trinket rarity instances (caps, mythic), luck-driven Zeno stock, single slot with swap window, abilities off + no regen in the shop */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:640}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const r=await pg.evaluate(()=>{const o={};
 o.maxMight=[0,1,2,3,4].map(r=>Math.max(...TRINKETS.map(t=>(trinMods(t,r).might||0))));
 o.capsOk=[0,1,2,3,4].every(r=>TRINKETS.every(t=>{const m=trinMods(t,r);return Object.keys(m).every(k=>m[k]<=TCAP[k]*RS[r]+1e-9);}));
 o.descSample=TRINKETS.filter(t=>t.id==='dragonheart').map(t=>[0,3,4].map(r=>trinDesc(t,r).en));
 __app.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;window.G=g;
 window.step=(n)=>{for(let f=0;f<n;f++){if(g.modal&&g.modal.type!=='tswap'){try{__app.resolveModal(0);}catch(e){}if(g.modal)g.modal=null;}g.update(1/60);if(g.p.hp<g.p.maxHp*.2&&!(g.trial&&g.trial.zeno))g.p.hp=g.p.maxHp;}};
 /* luck -> rarity of the Zeno stock */
 const avg=(luck)=>{let sum=0,n=0,myth=0;for(let k=0;k<600;k++){g.S.luck=luck;g.trial=null;g.en=[];g.startZeno();for(const it of g.trial.items){sum+=it.rar;n++;if(it.rar===4)myth++;}g.endTrial();g.trial=null;g.audio.slowMusic&&g.audio.slowMusic(1);}return[sum/n,myth/n];};
 const a0=avg(0),a1=avg(1.5);o.luck0=a0[0];o.luck1=a1[0];o.myth0=a0[1];o.myth1=a1[1];
 g.S.luck=0;g.recalc();
 return o;});
console.log(JSON.stringify(r));
ok(r.capsOk,'every stat stays under its per-rarity cap');
ok(Math.abs(r.maxMight[3]-0.12)<1e-6||r.maxMight[3]<=.15,'legendary damage max '+r.maxMight[3]+' (<=15%)');
ok(r.maxMight[4]<=.20&&r.maxMight[4]>r.maxMight[3],'mythic damage max '+r.maxMight[4]+' (<=20%, above legendary)');
ok(r.luck1>r.luck0+.25,'higher luck -> higher rarity ('+r.luck0.toFixed(2)+' -> '+r.luck1.toFixed(2)+')');
ok(r.myth0>.003&&r.myth0<.03,'mythic is ~1% ('+(r.myth0*100).toFixed(1)+'%)');
const r2=await pg.evaluate(()=>{const g=G,o={};g.t=100;g.en=[];g.eb=[];
 g.S.luck=0;g.run.coins=99999;
 g.trinkets=[];g.tRar={};g.equipTrinket('boots',0);
 o.start=g.trinkets.join();
 g.startZeno();const tr=g.trial;
 /* abilities off / no regen inside */
 o.ability=g.useAbility();o.pet=g.usePet();o.senzu=(g.senzu=3,g.p.hp=5,g.useSenzu());
 g.p.hp=5;step(120);o.noRegen=g.p.hp===5;
 /* buying while holding one: comparison window */
 const it=tr.items.find(x=>x.id!=='boots'),c0=g.run.coins;
 g.zenoBuy(it);o.modal=g.modal&&g.modal.type;o.cur=g.modal&&g.modal.cur.id;o.nw=g.modal&&g.modal.nw.id===it.id;
 window.__it=it;window.__c0=c0;return o;});
ok(r2.start==='boots','single trinket equipped');
ok(!r2.ability&&!r2.pet&&!r2.senzu,'abilities, pet and Senzu are off inside the shop');
ok(r2.noRegen,'no passive regeneration inside the shop');
ok(r2.modal==='tswap'&&r2.nw,'a new trinket opens the comparison window');
await wait(500);
const dom=await pg.evaluate(()=>({tswap:!!document.querySelector('.tswap'),warn:(document.querySelector('.tswarn')||{}).textContent,cols:document.querySelectorAll('.tscol').length}));
ok(dom.tswap&&dom.cols===2&&/replaced|sostituit/i.test(dom.warn||''),'window shows both trinkets and the replace warning');
await pg.screenshot({path:'/tmp/tswap.png'});
const r3=await pg.evaluate(()=>{const g=G,o={};__app.resolveModal(1);o.keep=g.trinkets.join();o.unsold=!__it.sold;o.coinsKept=g.run.coins===__c0;
 step(5);o.noReopen=!g.modal;
 g.trial.lock=null;const oldSale=trinketSale(g.trR(g.trinkets[0]),g.sd);g.zenoBuy(__it);__app.resolveModal(0);o.replaced=g.trinkets.join()===__it.id&&g.trR(__it.id)===__it.rar;o.paid=__c0-g.run.coins===__it.price-oldSale;   /* the trinket it replaces was found in the run, so it is sold */o.sold=__it.sold;
 g.endZeno();
 /* training room: regen still works, abilities still off */
 g.p.hp=5;g.startTrial();const a=g.useAbility();step(120);o.trainRegen=g.p.hp>5;o.trainAbility=a;
 return o;});
ok(r3.keep==='boots'&&r3.unsold&&r3.coinsKept&&r3.noReopen,'keeping the current trinket costs nothing and does not re-ask while standing on it');
ok(r3.replaced&&r3.paid&&r3.sold,'replacing swaps the trinket (with its rarity), charges the price and sells the old one');
ok(r3.trainRegen&&!r3.trainAbility,'training room: abilities off but passive regeneration stays');
console.log(errs.length?errs.slice(0,4):'no errors');await b.close();process.exit(errs.length||process.exitCode?1:0);})();
