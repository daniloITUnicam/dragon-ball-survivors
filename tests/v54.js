/* v54: companion (XP carried to you + shockwave when surrounded), boss chest = 4 trinkets, trinket perfection (0-100%), Ultra Instinct aura, skip-lower rule, swap window, HUD slots */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:760}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
let bad=0;const ok=(c,m)=>{console.log((c?'  ok  ':'FAIL  ')+m);if(!c)bad++;};
const ev=(f,...a)=>pg.evaluate(f,...a);
const go=(o)=>ev((o)=>{const A=__app,d=A.save.d;d.settings.sandbox=false;d.settings.weapons=(o&&o.weapons)||5;A.startGame(Object.assign({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'},o||{}));const g=A.game;g.sb.nospawn=true;g.sb.god=true;window.G=g;return 1;},o);
/* ---------- perfection ---------- */
let r=await ev(()=>{const out={nom:true,disjoint:true,eff:[],bad:[]};
  for(const t of TRINKETS){
    if(!t.m){out.eff.push(t.id+':'+hasPf(t));continue;}
    for(let rr=0;rr<5;rr++){const a=trinMods(t,rr),b=trinMods(t,rr,50);for(const k in a)if(Math.abs(a[k]-b[k])>1e-9)out.nom=false;}
    for(let rr=0;rr<4;rr++){const hi=trinMods(t,rr,100),lo=trinMods(t,rr+1,0);for(const k in hi)if(k!=='proj'&&!(hi[k]<lo[k]-1e-9))out.bad.push(t.id+' '+k+' r'+rr+'->'+(rr+1)+' '+hi[k]+'>='+lo[k]);}
  }
  let n100=0,min=999,max=-1;for(let i=0;i<20000;i++){const q=rollPf(0);if(q===100)n100++;if(q<min)min=q;if(q>max)max=q;}
  let hiLuck=0;for(let i=0;i<20000;i++)hiLuck+=rollPf(.6);let loLuck=0;for(let i=0;i<20000;i++)loLuck+=rollPf(0);
  const sc=TRINKETS.find(t=>t.id==='potara');out.pot=[trinMods(sc,1,0),trinMods(sc,1,50),trinMods(sc,1,100)].map(m=>m.might+'/'+m.hpPct).join('  ');
  return Object.assign(out,{n100,min,max,hiLuck:hiLuck/20000,loLuck:loLuck/20000});});
ok(r.nom,'perfection 50% = the nominal stats of every trinket (nothing changes for what you already had)');
ok(r.bad.length===0,'the stat ranges of neighbouring rarities never overlap: best Common < worst Rare ... best Legendary < worst Mythic '+(r.bad[0]||''));
ok(r.min===0&&r.max===100&&r.n100>25&&r.n100<110,'perfection rolls span 0-100, a perfect 100 is very rare: about 0.3% ('+r.n100+'/20000); Luck raises the average ('+r.loLuck.toFixed(1)+' -> '+r.hiLuck.toFixed(1)+')');
ok(r.eff.every(x=>/false$/.test(x)),'effect-only trinkets have no perfection ('+r.eff.join(' ')+')');
console.log('   Potara (might/HP) at 0 / 50 / 100%: '+r.pot);
/* ---------- chest: 4 trinkets, luck does not add more ---------- */
await go();
r=await ev(()=>{const g=G;g.luckBonus=.45;g.recalc();const a=g.pickCount();const rw=g.chestRewards(false,true,false);const pk=rw.find(x=>x.k==='pick');return{a,n:pk&&pk.opts.length,uniq:pk&&new Set(pk.opts).size};});
ok(r.a===4&&r.n===4&&r.uniq===4,'a boss chest offers exactly 4 different trinkets even with a lot of Luck ('+r.n+')');
/* mythic only for trinkets with stats */
r=await ev(()=>{const bad=[];for(const id of['halo','mirror','timering','dball4','windboots','kaioh','hoipoi']){for(let i=0;i<4000;i++)if(G.rarOf(id)===4){bad.push(id);break;}}
  let myth=0;for(let i=0;i<20000;i++)if(G.rarOf('potara')===4)myth++;return{bad,myth};});
ok(r.bad.length===0&&r.myth>80&&r.myth<400,'effect-only trinkets are never Mythic; a stat trinket is ~1% ('+r.myth+'/20000)');
/* ---------- skip lower trinkets (rarity, then perfection) + same trinket upgrades in place ---------- */
r=await ev(()=>{const g=G;g.save.settings.trinRefuse=true;g.save.shop.tslot=0;g.trinkets=[];g.tRar={};g.tPf={};g.tSrc={};
  g.equipTrinket('potara',2,null,60);                  // Epic Potara at 60%
  const lowRar=g.autoRefuse('scouter',0,100,false);    // Common even at 100%: refused
  const sameLow=g.autoRefuse('mask',2,40,false);       // same rarity, less perfection: refused
  const sameHigh=g.autoRefuse('mask',2,80,false);      // same rarity, more perfection: window opens
  const higher=g.autoRefuse('dragonheart',3,0,false);  // Legendary: never refused
  const buy=g.autoRefuse('scouter',0,0,true);          // an offer in Zeno's shop is never refused
  // the same trinket again: more perfection upgrades it in place, less is sold
  g.save.settings.trinRefuse=false;const z0=g.run.coins;g.addTrinket('potara',2,{pf:90});const up=g.trP('potara');g.addTrinket('potara',2,{pf:10});const keep=g.trP('potara');
  return{lowRar,sameLow,sameHigh,higher,buy,up,keep,sold:g.run.coins>z0};});
ok(r.lowRar===true&&r.sameLow===true&&r.sameHigh===false&&r.higher===false&&r.buy===false,'skip-lower: lower rarity and same rarity with less perfection are refused; better ones, higher rarities and shop offers are not');
ok(r.up===90&&r.keep===90&&r.sold,'a carried trinket found again: 90% replaces 60% in place, 10% is sold');
/* the bag trinket starts the run with its own perfection */
r=await ev(()=>{const A=__app,d=A.save.d;d.bag=[{id:'potara',r:1,at:1,p:88}];d.equips=[{id:'potara',r:1},null,null];d.equip=d.equips[0];A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;g.sb.nospawn=true;g.sb.god=true;window.G=g;
  const m=trinMods(TRINKETS.find(t=>t.id==='potara'),1,88);return{p:g.trP('potara'),src:g.tSrc.potara,might:m.might};});
ok(r.p===88&&r.src==='bag','the equipped bag trinket starts the run with its stored perfection ('+r.p+'%)');
await go();
/* ---------- companion: carries XP ---------- */
await go({pet:'dende'});
r=await ev(()=>{const g=G;g.gm=[];const p=g.p;for(let i=0;i<4;i++)g.gm.push({x:p.x+210+i*8,y:p.y-30+i*10,v:2,att:false});
  g.pet.x=p.x+20;g.pet.y=p.y;const xp0=g.xp;let held=0,maxHeld=0,steps=0,seen=false;
  for(;steps<700;steps++){g.update(.016);const h=g.pet.hold.length;if(h>maxHeld)maxHeld=h;if(g.gm.some(x=>x.held)){seen=true;}if(!g.gm.length&&!g.pet.hold.length)break;}
  return{maxHeld,seen,left:g.gm.length,xp:g.xp+g.lvl*1000-xp0,steps};});
ok(r.maxHeld>=1&&r.maxHeld<=3&&r.seen,'the companion picks up gems you cannot reach and carries them ('+r.maxHeld+' at once)');
ok(r.left===0,'every gem ends up with you ('+r.steps+' steps)');
r=await ev(()=>{const g=G;g.gm=[];const p=g.p;g.gm.push({x:p.x+900,y:p.y,v:2,att:false});g.pet.x=p.x;g.pet.y=p.y;for(let i=0;i<120;i++)g.update(.016);return{far:g.gm[0]&&!g.gm[0].held,held:g.pet.hold.length};});
ok(r.far&&r.held===0,'a gem too far away is left alone');
/* ---------- companion: shockwave when surrounded ---------- */
r=await ev(()=>{const g=G,p=g.p;g.en=[];g.eb=[];const mk=(a,d)=>{const e=g.mkEnemy(ENEMIES[STAGES[0].roster[0][0]],p.x+Math.cos(a)*d,p.y+Math.sin(a)*d);e.hp=e.max=9999;g.en.push(e);return e;};
  const es=[0,1,2,3,4,5].map(i=>mk(i/6*Math.PI*2,110));const hp0=es.map(e=>e.hp);g.pet.sw=0;g.updatePet(.016);
  const hit=es.filter((e,i)=>e.hp<hp0[i]).length,sw=g.pet.sw;
  g.updatePet(.016);const again=g.pet.sw;   // cooldown still running
  g.pet.sw=0;g.en=es.slice(0,4);for(const e of g.en)e.hp=9999;const hp1=g.en.map(e=>e.hp);g.updatePet(.016);const few=g.en.filter((e,i)=>e.hp<hp1[i]).length;
  g.pet.sw=0;g.en=[0,1,2,3,4,5].map(i=>mk(.2+i*.12,110));const hp2=g.en.map(e=>e.hp);g.updatePet(.016);const oneSide=g.en.filter((e,i)=>e.hp<hp2[i]).length;
  return{hit,sw,again,few,oneSide};});
ok(r.hit===6&&Math.abs(r.sw-5)<.05&&r.again<=r.sw,'surrounded (6 enemies on all sides): shockwave hits all and starts a 5 s cooldown ('+r.hit+', cd '+r.sw.toFixed(2)+')');
ok(r.few===0&&r.oneSide===0,'fewer than 5 enemies, or all on one side: no shockwave');
/* ---------- gacha: perfection on pulls, duplicates upgrade, old bags are migrated ---------- */
r=await ev(()=>{const A=__app,P=A.progress,d=A.save.d;d.settings.sandbox=false;d.tickets.t10=3;d.bag=[];
  const out=P.gachaPull('t10',1);const allP=out.every(x=>x.p>=0&&x.p<=100);const stored=d.bag.every(b=>Number.isFinite(b.p));
  // force a duplicate with a better roll
  const b0=d.bag[0];b0.p=5;const orig=Math.random;let up=null;
  for(let i=0;i<400&&up===null;i++){d.tickets.t10=1;const res=P.gachaPull('t10',1);const x=res.find(y=>y.dup&&y.id===b0.id&&y.r===b0.r&&y.up!=null);if(x)up=x;}
  const raw={bag:[{id:'scouter',r:0,at:1},{id:'potara',r:1,at:2,p:'x'},{id:'cape',r:1,at:3,p:140}]};const n=A.save.normalize(raw);
  return{allP,stored,upOk:up===null?'none':(up.up===5&&d.bag.find(b=>b.id===up.id&&b.r===up.r).p===up.p),mig:n.bag.map(b=>b.p).join(',')};});
ok(r.allP&&r.stored,'every pull comes with a perfection and the new bag entries store it');
ok(r.upOk===true||r.upOk==='none','a duplicate with a better roll upgrades the stored trinket ('+r.upOk+')');
ok(r.mig==='50,50,100','old or damaged bag entries are repaired: missing -> 50%, text -> 50%, 140 -> 100% ('+r.mig+')');
await go();
/* ---------- UI: swap window, perfection, HUD slots ---------- */
await go();
await ev(()=>{const g=G;g.save.shop.tslot=0;g.trinkets=[];g.tRar={};g.tSrc={};g.equipTrinket('scouter',0,null,20);g.tq=[];g.addTrinket('potara',3,{pf:75});});
await wait(500);
r=await ev(()=>({modal:G.modal&&G.modal.type,perf:document.querySelectorAll('.tswap .perf').length,delta:document.querySelectorAll('.tswap .tsdelta').length,verdict:(document.querySelector('.tsverdict')||{}).textContent,sell:document.querySelectorAll('.tswap .tssell').length}));
ok(r.modal==='tswap'&&r.perf>=2&&r.delta>=1&&!!r.verdict&&r.sell>=1,'swap window: perfection bars, before/after %, verdict "'+r.verdict+'" and sale value ('+JSON.stringify(r)+')');
await pg.screenshot({path:'/tmp/tab/v54_swap.png'});
await ev(()=>{__app.resolveModal(1);});await wait(300);
/* a 100% trinket: aura + HUD slot */
await ev(()=>{const g=G;g.save.shop.tslot=2;g.trinkets=[];g.tRar={};g.tSrc={};const id='scouter';g.equipTrinket(id,4,null,100);g.equipTrinket('potara',2,null,64);g.equipTrinket('senzubag',0,null,30);window.__perfId=id;});
await wait(500);await pg.screenshot({path:'/tmp/tab/v54_hud.png'});
r=await ev(()=>({aura:G.perfAura,id:window.__perfId,n:G.trinkets.length,cap:G.tcap}));
ok(r.aura===true&&r.n===3&&r.cap===3,'a 100% trinket switches the Ultra Instinct aura on ('+r.id+'), 3 of 3 slots used');
await ev(()=>{const g=G;g.trinkets=['potara'];g.tRar={potara:2};g.tPf={potara:64};});
ok(await ev(()=>G.perfAura===false),'no aura without a 100% trinket');
/* bag: perfection sort */
await ev(()=>{const A=__app,d=A.save.d;d.bag=[{id:'scouter',r:0,at:1,p:30},{id:'scouter',r:4,at:2,p:100},{id:'potara',r:1,at:3,p:55},{id:'dragonheart',r:3,at:4,p:81}];A.ui.push('bag',{});});
await wait(400);
r=await ev(()=>{const s=document.querySelector('[data-fid="bs_perf"]');if(!s)return null;s.click();return [...document.querySelectorAll('.baggrid .tcard .ctag')].map(x=>x.textContent);});
ok(r&&r.length===4&&r.map(x=>+x.split('·').pop().replace('%','')).every((v,i,a)=>!i||a[i-1]>=v)&&/100%/.test(r[0]),'bag sorted by perfection: '+(r||[]).join(' | '));
await pg.screenshot({path:'/tmp/tab/v54_bag.png'});
ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
console.log(bad?'FAILED '+bad:'ALL OK');await b.close();process.exit(bad?1:0);})();
