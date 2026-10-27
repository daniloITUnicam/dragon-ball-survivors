/* v109: Quantità on level-up (max 2), shop on/off + Shift buy, chests (upgrades first, trinkets only when maxed, perfection floors), no trinket cap,
   traps on step (30% / 40% / 10%), banner queue + event history, stat breakdown, form levels, damage taken by source, loot floating to the shore */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const r=await pg.evaluate(()=>{const A=__app,o={};A.loop=()=>{};
  const st=STAGES.findIndex(s=>s.theme==='redrock');A.startGame({stage:st,char:'goku',diff:'normal',x2:false,sandbox:false});const g=A.game;g.sb.god=false;
  /* Quantità */
  o.projMax=passMax('proj')===2&&passMax('might')===5;g.applyOption({type:'p',id:'proj',lv:0});g.applyOption({type:'p',id:'proj',lv:1});o.proj=g.S.proj;o.projGone=!g.upgradePool().some(x=>x.id==='proj');
  o.dsunday=evoPass('dsunday',0)==='proj';
  /* forms */
  o.forms=FORM_TIERS.map(f=>f.lvl).join();o.f1=FORM_TIERS[0].might;
  /* chests */
  g.pass.proj=0;g.recalc();
  o.chest=[0,1,2,3,4].map(r=>g.chestRewards(false,true,false,r)).map(R=>({n:R.length,up:R.filter(x=>x.k==='up'||x.k==='evo').length,tr:R.filter(x=>x.k==='trinket').length}));
  for(const id of ['ki','kame','disc','spirit','aura']){const w=g.addWeapon(id);while(w.lv<WMAX)w.upgrade();w.evo=g.maxEvo(id);}
  for(const id in PASS)g.pass[id]=0;for(const id of ['might','vit','speed','armor','regen'])g.pass[id]=passMax(id);g.recalc();
  o.maxed=g.allMaxed();
  o.chestMax=[0,1,2,3,4].map(r=>{let mn=101,n=0;for(let i=0;i<200;i++){const R=g.chestRewards(false,true,false,r).filter(x=>x.k==='trinket');n=R.length;for(const x of R)mn=Math.min(mn,x.pf);}return{n,mn};});
  /* no cap */
  g.trinkets=[];for(const id of ['boots','cape','scouter','armor','potara','radar'])g.addTrinket(id,1);o.carried=g.trinkets.length;o.noSwap=!g.modal;
  /* shop off */
  A.save.d.shop.might=4;A.save.d.shopOff={might:1};o.offLv=g.shopLv('might');A.save.d.shopOff={};o.onLv=g.shopLv('might');
  /* banner queue + history */
  g.banner=null;g.bq=[];g.say('A');g.say('B');g.say('A');const seq=[];for(let i=0;i<420;i++){g.tickBanner(1/60);const k=g.banner?g.banner.txt:'-';if(seq[seq.length-1]!==k)seq.push(k);}o.seq=seq.join('');
  o.log=g.evLog.filter(e=>e.txt==='A'||e.txt==='B').length>=2;
  /* stat breakdown adds up */
  const sb=g.statBreak();o.sbHp=sb.hp[0].v==String(g.C.hp);o.sbKeys=['hp','might','spd','cd','armor','regen','crit','dodge','area','luck','xp','gold','magnet','proj'].every(k=>Array.isArray(sb[k]));
  /* trap */
  const z=World.zonesNear('redrock',0,0,8000).find(q=>q.kind==='trap');o.trap=!!z;
  if(z){g.en=[];g.trinkets=[];g.recalc();g.p.x=z.x;g.p.y=z.y;g.p.inv=0;g.p.hp=g.p.maxHp;g.S.dodge=0;const h0=g.p.hp;
    for(let i=0;i<50;i++){g.p.x=z.x;g.p.y=z.y;g.update(1/60);g.modal=null;}o.trapHit=1-g.p.hp/h0;o.takenTrap=!!(g.takenBy.trap&&g.takenBy.trap.v>0);
    const e=g.mkEnemy(ENEMIES[g.stage.roster[0][0]],z.x,z.y);e.hp=e.max=1000;e.armor=3;e.spd=0;g.en=[e];g.p.x=z.x+400;z.trig=null;g.weapons.clear();g.dmgBy={};for(let i=0;i<60;i++){e.x=z.x;e.y=z.y;g.update(1/60);g.modal=null;}o.enemyHit=(g.dmgBy.trap||0)/e.max;}
  /* damage taken by enemy */
  g.takenBy={};const e2=g.mkEnemy(ENEMIES[g.stage.roster[0][0]],g.p.x,g.p.y);g.p.inv=0;g.hurt(10,e2);o.byEnemy=Object.keys(g.takenBy).some(k=>k.startsWith('e:'));
  return o;});
ok(r.projMax&&r.proj>=2&&r.projGone,'Quantità: level-up upgrade, max 2, adds to S.proj ('+r.proj+')');
ok(r.dsunday,'Double Sunday evolves with Quantità');
ok(r.forms==='5,10,20,30,50,70,90,120'&&Math.abs(r.f1-.253)<1e-9,'form levels 5/10/20/30/50/70/90/120, first form +15%');
ok(r.chest.map(c=>c.up).join()==='1,3,4,5,6'&&r.chest.every(c=>c.tr===0),'chests give 1/3/4/5/6 character upgrades and no trinket while something can level ('+JSON.stringify(r.chest)+')');
ok(r.maxed&&r.chestMax.map(c=>c.n).join()==='1,2,3,3,3','everything maxed: 1/2/3/3/3 trinkets');
ok(r.chestMax[2].mn>=35&&r.chestMax[3].mn>=50&&r.chestMax[4].mn>=75,'perfection floors 35/50/75 ('+r.chestMax.map(c=>c.mn).join('/')+')');
ok(r.carried===6&&r.noSwap,'no trinket cap in a run');
ok(r.offLv===0&&r.onLv===4,'a shop upgrade switched off counts as 0 in the run');
ok(r.seq==='AB-'&&r.log,'banners queue (no overlap, no duplicate) and go into the event history ('+r.seq+')');
ok(r.sbHp&&r.sbKeys,'stat breakdown for every stat');
ok(r.trap&&Math.abs(r.trapHit-.30)<.02&&r.takenTrap,'trap on step: 30% of max HP ('+(r.trapHit*100).toFixed(1)+'%), logged as trap damage');
ok(r.enemyHit>=.39&&r.enemyHit<.45,'trap on an enemy: 40% of its health, armor ignored ('+(r.enemyHit*100).toFixed(1)+'%)');
ok(r.byEnemy,'damage taken is logged by enemy');
/* shop UI: switches, Shift buys max */
const s=await pg.evaluate(async()=>{const A=__app,d=A.save.d;A.game&&(A.game.ended=true);d.zenny=100000;d.shop={might:1};d.shopOff={};A.save.write();A.ui.show('main');A.ui.push('shop');await new Promise(r=>setTimeout(r,300));
  const o={};o.tog=!!document.querySelector('[data-fid="shtmight"]');o.all=!!document.querySelector('[data-fid="shalloff"]');o.tip=(document.querySelector('[data-fid="shgold"]')||{}).getAttribute('data-tip')||'';
  document.querySelector('[data-fid="shmight"]').dispatchEvent(new MouseEvent('click',{bubbles:true,shiftKey:true}));await new Promise(r=>setTimeout(r,200));o.might=d.shop.might;
  document.querySelector('[data-fid="shalloff"]').click();o.off=Object.keys(d.shopOff).length;return o;});
ok(s.tog&&s.all&&/Shift|Maiusc|Mayús|Maj|Umschalt/.test(s.tip),'shop: per-upgrade switch, switch-all button, Shift tooltip');
ok(s.might===6,'Shift + click buys the max ('+s.might+')');
ok(s.off>=1,'"switch all off" turns every bought upgrade off');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();})();
