/* v53 gameplay: Easy -20%, respawn above the screen, enemy speed by stage, passive nerfs, totems, Senzu, abilities in training, weapon count, TAB target,
   maxed level-up (zenny bags + auto choice), Ki Blast replaces Barrage, no ground capsules, Super Dragon Balls x3 + Tamagami, water / lava */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:760}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
let bad=0;const ok=(c,m)=>{console.log((c?'  ok  ':'FAIL  ')+m);if(!c)bad++;};
const ev=(f,...a)=>pg.evaluate(f,...a);
const go=(o)=>ev((o)=>{const A=__app,d=A.save.d;d.settings.sandbox=false;d.settings.weapons=(o&&o.weapons)||5;A.startGame(Object.assign({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'},o||{}));const g=A.game;g.sb.nospawn=true;g.sb.god=true;window.G=g;return 1;},o);
/* ---------- numbers ---------- */
let r=await ev(()=>({easy:DIFF.easy.hp,pm:PASS.might.d.en,ps:PASS.speed.d.en,ph:PASS.haste.d.en,pg:PASS.growth.d.en,kiDmg:WS.ki.dmg[0],bar:typeof WEAPONS.barrage,sb:SB_TOTAL,spd0:stageSpd(0),spd44:stageSpd(4.4),spd10:stageSpd(10)}));
ok(Math.abs(r.easy-.72)<1e-9,'Easy: enemy / boss HP x0.72 (-20% on the old 0.9)');
ok(/10%/.test(r.pm)&&/6%/.test(r.ps)&&/5%/.test(r.ph)&&/8%/.test(r.pg),'passive nerfs in the text: Zenkai 10, Swift Flight 6, Gravity 5, Meditation 8 -> '+[r.pm,r.ps,r.ph,r.pg].join(' | '));
ok(r.bar==='undefined'&&r.kiDmg<10,'Ki Barrage is gone, Ki Blast level 1 damage '+r.kiDmg+' (was 10)');
ok(r.sb===3,'3 Super Dragon Balls');
ok(Math.abs(r.spd0-.8)<1e-9&&Math.abs(r.spd44-1.1)<1e-9&&r.spd10===1.1,'enemy speed by stage difficulty: x'+r.spd0+' ... x'+r.spd44);
r=await ev(()=>CHARS.filter(c=>c.start.includes('barrage')).length+':'+CHARS.every(c=>c.start.every(id=>WEAPONS[id])));
ok(r==='0:true','no character starts with Ki Barrage and every starting weapon exists');
/* ---------- run: stats ---------- */
await go();
r=await ev(()=>{const g=G;g.pass={might:2,speed:2,haste:2,growth:2};g.recalc();const S=g.S;return{might:S.might,spd:S.spd,cd:S.cd,xp:S.xp};});
const base=await ev(()=>{const g=G;g.pass={};g.recalc();return{might:g.S.might,spd:g.S.spd,cd:g.S.cd,xp:g.S.xp};});
ok(Math.abs(r.might/base.might-1.2)<1e-6&&Math.abs(r.spd/base.spd-1.12)<1e-6&&Math.abs(base.cd-r.cd-.1)<1e-6&&Math.abs(r.xp/base.xp-1.16)<1e-6,'Zenkai x2 = +20%, Swift Flight x2 = +12%, Gravity x2 = -0.10 cooldown, Meditation x2 = +16%');
/* respawn above the screen */
r=await ev(()=>{const g=G;g.p.x=0;g.p.y=0;const up=g.spawnSpot(-Math.PI/2,500,0),dn=g.spawnSpot(Math.PI/2,500,0);return{up:up[1],dn:dn[1]};});
ok(Math.abs(r.up+750)<1e-6&&Math.abs(r.dn-500)<1e-6,'enemies appear 50% farther above the player (750 vs 500 below)');
r=await ev(()=>{const g=G;g.p.x=0;g.p.y=0;g.en=[];const e=g.mkEnemy(ENEMIES[STAGES[0].roster[0][0]],0,-700);g.en.push(e);g.updateEnemies(.016);return Math.abs(e.y+700)<20;});
ok(r,'an enemy 700 px above is not teleported away by the off-screen check');
/* enemy speed uses the stage factor */
r=await ev(()=>{const g=G;const e=g.mkEnemy(ENEMIES.sai,0,0);return{k:g.spdK,s:e.spd,d:ENEMIES.sai.spd};});
ok(Math.abs(r.s-r.d*r.k)<1e-6&&r.k<1.1,'first stage: enemies walk at x'+r.k+' of their base speed');
/* ---------- totems ---------- */
r=await ev(()=>{const g=G;const out=[];for(const fi of[-1,0,1,3]){g.formIdx=fi;out.push([g.totemCd(),g.totemHeal()]);}g.formIdx=-1;g.applyTotem('risk');return{out,risk:g.riskT};});
ok(r.out[0][0]===20&&Math.abs(r.out[1][0]-16)<1e-9&&Math.abs(r.out[2][0]-12.8)<1e-9&&Math.abs(r.out[3][0]-20*.8**4)<1e-9,'Storm / Spirit totem: 20 s, -20% per transformation ('+r.out.map(x=>x[0].toFixed(1)).join(', ')+')');
ok(r.out[0][1]===.06&&Math.abs(r.out[1][1]-.075)<1e-9&&r.out[3][1]===.12&&r.risk===180,'Spirit heal 6% -> up to 12%, Risk totem lasts 180 s');
/* ---------- Senzu ---------- */
r=await ev(()=>{const g=G;g.senzu=1;g.senzuCd=0;g.p.hp=g.p.maxHp*.2;g.recalc();const m0=g.S.might+g.S.spd+g.S.cd*10+g.p.maxHp+g.S.regen+g.S.magnet,h0=g.p.hp;const ok=g.useSenzu();const m1=g.S.might+g.S.spd+g.S.cd*10+g.p.maxHp+g.S.regen+g.S.magnet;return{ok,heal:(g.p.hp-h0)/g.p.maxHp,changed:Math.abs(m1-m0)>1e-9,n:g.szN};});
ok(r.ok&&r.heal>.49&&r.heal<.62&&r.changed&&r.n===1,'a Senzu restores 50% HP and raises a random stat ('+Math.round(r.heal*100)+'%)');
/* ---------- abilities: allowed in training, off in Zeno ---------- */
r=await ev(()=>{const g=G;g.trial={phase:'train',zeno:false};const a=g.abBlocked();g.trial={phase:'zeno',zeno:true};const b2=g.abBlocked();g.trial=null;return{train:a,zeno:b2};});
ok(r.train===false&&r.zeno===true,'abilities work in the Room of Spirit and Time, not in Zeno\'s Shop');
/* ---------- ability cooldown / passive scaling ---------- */
r=await ev(()=>{const g=G;g.lvl=1;const a=g.passK();g.lvl=50;const b2=g.passK();g.lvl=100;const c=g.passK();g.lvl=300;const d=g.passK();g.lvl=1;return{a,b2,c,d,cd:g.cdFor(60),old:60*.7,base:abBase(60)};});
ok(r.a===1.5&&Math.abs(r.b2-3.95)<1e-9&&Math.abs(r.c-6.45)<1e-9&&r.d===r.c,'character passive factor: x1.5 at Lv 1, x3.95 at Lv 50, x6.45 at Lv 100 (cap)');
ok(r.cd<r.old*.7&&Math.abs(r.cd-27.3)<.11,'ability cooldown -35% (60 s base: '+r.cd+' s instead of '+r.old+' s)');
/* ---------- target (TAB) ---------- */
r=await ev(()=>{const g=G;g.en=[];g.p.x=0;g.p.y=0;const mk=(x,hp,boss)=>{const e=g.mkEnemy(ENEMIES.sai,x,0);e.hp=hp;e.max=hp;e.boss=!!boss;g.en.push(e);return e;};
  const a=mk(100,50),b2=mk(200,500),c=mk(300,10),d=mk(400,900,true);const out=[];
  for(let m=0;m<4;m++){g.tgt=m;const t=g.nearest(0,0,700);out.push(g.en.indexOf(t));}
  g.tgt=3;g.en.pop();const t2=g.nearest(0,0,700);const fb=g.en.indexOf(t2);g.tgt=2;const t3=g.nearest(50,0,700);g.tgt=0;return{out,fb,near:g.en.indexOf(g.nearest(0,0,700)),other:g.en.indexOf(t3)};});
ok(r.out.join()==='0,3,2,3','TAB modes pick closest / most HP / least HP / boss -> '+r.out.join());
ok(r.fb===0&&r.near===0,'without a boss the boss mode falls back to the closest enemy');
r=await ev(()=>{const g=G;g.tgt=0;const t0=g.tgt;g.cycleTarget();g.cycleTarget();g.cycleTarget();g.cycleTarget();return[t0,g.tgt];});
ok(r[1]===0,'cycleTarget runs through the 4 modes and wraps');
await ev(()=>{G.tgt=0;});
/* ---------- weapon count ---------- */
await go({char:'gotenks',weapons:1});
r=await ev(()=>({w:[...G.weapons.keys()],max:G.maxW}));
ok(r.max===1&&r.w.length===1&&r.w[0]==='homing','weapons per run = 1: Gotenks starts with only Homing Orbs ('+r.w+')');
r=await ev(()=>{G.lvl=2;const o=G.levelOptions();return o.filter(x=>x.type==='w'&&x.lv===0).length;});
ok(r===0,'with the weapon slot full no new weapon is offered');
await go({char:'gotenks',weapons:3});
r=await ev(()=>({w:[...G.weapons.keys()],max:G.maxW,c:CHARS.find(c=>c.id==='gotenks').start}));
ok(r.max===3&&r.w.length===2&&r.w.includes('ki'),'weapons per run = 3: both starting weapons (Ki Blast replaced the Barrage)');
/* ---------- UI: weapon dots + stage stats ---------- */
await ev(()=>{const A=__app;A.toMenu();A.ui.show('stages');});await wait(500);
r=await ev(()=>({st:document.querySelectorAll('.ststats').length,txt:(document.querySelector('.ststats')||{}).textContent}));
ok(r.st>=10&&/%/.test(r.txt||''),'stage cards describe the enemies (health / damage / speed / count): '+r.txt);
await ev(()=>{__app.ui.sel.stage=0;__app.ui.push('chars');});await wait(500);
r=await ev(()=>({dots:document.querySelectorAll('.wdot').length,on:document.querySelectorAll('.wdot.on').length}));
ok(r.dots===5&&r.on===1,'character screen: 5 dots, one marked with a Dragon Ball');
await ev(()=>document.querySelector('[data-fid="wn2"]').click());await wait(250);
r=await ev(()=>({w:__app.save.d.settings.weapons,on:document.querySelector('.wdot.on')&&document.querySelector('.wdot.on').getAttribute('data-fid')}));
ok(r.w===2&&r.on==='wn2','clicking the second dot saves 2 weapons per run');
await ev(()=>{__app.save.d.settings.weapons=5;});
/* ---------- maxed level-up ---------- */
await go({weapons:1});
r=await ev(()=>{const g=G;g.weapons.forEach(w=>{w.lv=5;w.evo=g.maxEvo(w.id);});for(const k in PASS)g.pass[k]=5;const o=g.levelOptions();return{n:o.length,z:o.every(x=>x.type==='z'&&x.v>0),v:o.map(x=>x.v)};});
ok(r.n===3&&r.z&&r.v[0]<r.v[1]&&r.v[1]<r.v[2],'everything maxed: 3 bags of zenny to choose from '+r.v);
await ev(()=>{const g=G;g.xp=g.need+1;g.levelUp();});await wait(500);
r=await ev(()=>({modal:G.modal&&G.modal.maxed,btn:!!document.querySelector('[data-fid="lvauto"]'),st:__app.state,xp:G.xp,need:G.need,paused:G.paused,o:G.modal&&G.modal.options.map(x=>x.type)}));console.log(JSON.stringify(r));
ok(r.modal&&r.btn,'the window shows the "Auto-choose" button');
const c0=await ev(()=>G.run.coins);
await ev(()=>document.querySelector('[data-fid="lvauto"]').click());await wait(400);
r=await ev(()=>({auto:G.autoZ,coins:G.run.coins,m:G.modal}));
ok(r.auto===true&&r.coins>c0&&!r.m,'Auto-choose takes the biggest bag and stays on');
await ev(()=>{const g=G;g.xp=g.need+1;g.levelUp();});
r=await ev(()=>({m:G.modal,coins:G.run.coins}));
ok(r.m===null&&r.coins>c0,'the next maxed level-up is resolved without a window');
await ev(()=>{const g=G;g.weapons.forEach(w=>{w.lv=1;w.evo=0;});g.pass={};g.xp=g.need+1;g.levelUp();});
r=await ev(()=>({auto:G.autoZ,t:G.modal&&G.modal.type,z:G.modal&&G.modal.options.every(o=>o.type==='z')}));
ok(r.auto===false&&r.t==='level'&&!r.z,'a weapon / upgrade choice stops the automatic pick');
await ev(()=>{G.modal=null;__app.ui.closeModal();__app.state='play';});
r=await ev(()=>{const g=G;__app.save.d.settings.zAuto=true;g.weapons.forEach(w=>{w.lv=5;w.evo=g.maxEvo(w.id);});for(const k in PASS)g.pass[k]=5;const c1=g.run.coins;g.xp=g.need+1;g.levelUp();const r2={m:g.modal,gain:g.run.coins>c1};__app.save.d.settings.zAuto=false;return r2;});
ok(r.m===null&&r.gain,'the gameplay setting keeps the automatic pick always on');
/* ---------- loot ---------- */
await go();
r=await ev(()=>{const g=G;g.t=800;g.lootCd={};let cap=0;for(let i=0;i<300;i++){const w=g.lootWeights();if(w.capsule)cap++;}return cap;});
ok(r===0,'no more Hoi-Poi capsules on the ground');
r=await ev(()=>{const g=G;g.p.x=0;g.p.y=0;g.p.hp=g.p.maxHp;g.S.magnet=400;g.loot=[{k:'dmg',x:150,y:0,v:0,t:1,star:0},{k:'haste',x:150,y:30,v:0,t:1,star:0}];g.updatePickups(.2);return{dmg:g.loot.find(l=>l.k==='dmg')?150-g.loot.find(l=>l.k==='dmg').x:-1,haste:150-g.loot.find(l=>l.k==='haste').x};});
ok(r.dmg>0&&r.haste===0,'the red +15% damage arrow is attracted like coins and hearts');
/* ---------- Super Dragon Balls / Tamagami ---------- */
await go({stage:4});
r=await ev(()=>{const g=G;g.save.sball=[];g.boss0=g.bossAlive;g.spawnLoot('sball',900,900);const l=g.loot[g.loot.length-1];return{star:l.star,tama:l.tama,okStar:l.star>=1&&l.star<=3};});
ok(r.okStar&&r.tama===1,'a Super Dragon Ball spawns with a Tamagami statue (star '+r.star+')');
r=await ev(()=>{const g=G;const l=g.loot[g.loot.length-1];g.p.x=l.x-200;g.p.y=l.y;g.updatePickups(.016);const b2=g.en.find(e=>e.boss);return{woke:l.woke,lock:l.lock,boss:b2&&b2.bd.id,tama:!!(b2&&b2.tama),hp:b2&&b2.max,alive:g.bossAlive};});
ok(r.woke&&r.lock&&/^tama[123]/.test(r.boss)&&r.tama&&r.alive===1,'approaching wakes the statue: '+r.boss+' appears and the ball is locked');
r=await ev(()=>{const g=G;const l=g.loot[g.loot.length-1];g.p.x=l.x;g.p.y=l.y;g.updatePickups(.016);return l.dead===true;});
ok(r===false,'the ball cannot be taken while the Tamagami lives');
r=await ev(()=>{const g=G;const l=g.loot[g.loot.length-1];const e=g.en.find(e=>e.boss);g.sb.god=true;e.hp=1;g.damageEnemy(e,99999,0,0,false);const unlocked=!l.lock&&l.beaten;g.updatePickups(.016);return{unlocked,taken:l.dead===true,saved:g.save.sball.length};});
ok(r.unlocked&&r.taken&&r.saved===1,'beating the Tamagami unlocks the ball; collecting it stores it ('+r.saved+'/3)');
r=await ev(()=>{const g=G;const out=[];for(let s=1;s<=3;s++){const id='tama'+s,bd=BOSSES[id];out.push(!!bd&&!!bd.sp&&!!BOSSES[bd.p2]&&bd.pats.every(p=>true));}return out;});
ok(r.every(Boolean),'Tamagami 1, 2 and 3 exist with a Fury form');
r=await ev(()=>{const g=G;const res=[];for(const id of['tama1','tama2','tama3']){const bd=BOSSES[id];g.en=[];g.eb=[];g.bz=[];g.spawnBoss(id,false,{x:g.p.x+300,y:g.p.y,k:1});const e=g.en[0];for(const p of['hammer','palm','swordwave','bulletstorm','wall','cross','nova','slam','rush','crossbeam']){try{e.bd=Object.assign({},bd,{pats:[p],rnd:false});e.phase=0;g.bossAttack(e);}catch(err){res.push(id+':'+p+':'+err.message);}}
  g.en=[];g.bossAlive=0;}return res;});
ok(r.length===0,'every Tamagami attack pattern runs without errors '+r.join('|'));
r=await ev(()=>{const g=G;g.en=[];g.eb=[];g.bossAlive=0;g.spawnBoss('tama3',false,{x:g.p.x+300,y:g.p.y,k:1});const e=g.en[0];e.hp=e.max*.4;g.updateEnemies(.016);for(let i=0;i<5;i++)g.updateEnemies(.016);return{id:e.bd.id,name:e.bd.n.en,fury:/Fury/.test(e.bd.n.en)||e.p2||e.xf||e.mt};});
ok(r.fury,'below half health a Tamagami enters its Fury form ('+r.name+')');
/* HUD indicator + render without errors */
await go({stage:4});
await ev(()=>{G.save.sball=[1,2];G.spawnLoot('sball',G.p.x+300,G.p.y);});
await wait(600);
ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
/* ---------- water and lava ---------- */
await go({stage:5});
r=await ev(()=>{const g=G;const th=g.stage.theme;if(!Sea.has(th))return{no:1};let w=null;for(let x=-4000;x<4000&&!w;x+=40)for(let y=-4000;y<4000;y+=40)if(Sea.wet(th,x,y)>.03&&Sea.wet(th,x-40,y)<-.01){w=[x,y];break;}return{th,w};});
ok(r.w,'the beach has water ('+r.th+') at '+(r.w||[]).join(','));
if(r.w){
  r=await ev((w)=>{const g=G;g.p.x=w[0]-40;g.p.y=w[1];g.input.x=1;g.input.y=0;for(let i=0;i<200;i++)g.update(.016);return{wet:Sea.wet(g.stage.theme,g.p.x,g.p.y),x:g.p.x,w0:w[0]};},r.w);
  ok(r.wet<=.012,'walking into the water is blocked (wet '+r.wet.toFixed(3)+')');
}
await go({stage:9});
r=await ev(()=>{const g=G;const th=g.stage.theme;g.sb.god=false;let w=null;for(let x=-4000;x<4000&&!w;x+=40)for(let y=-4000;y<4000;y+=40)if(Sea.wet(th,x,y)>.05){w=[x,y];break;}if(!w)return{no:1};g.p.x=w[0];g.p.y=w[1];g.p.inv=0;g.p.hp=g.p.maxHp;const h0=g.p.hp;for(let i=0;i<60;i++)g.updateLava(1/60);return{loss:(h0-g.p.hp)/g.p.maxHp,th};});
ok(r.loss>.095&&r.loss<.105,'lava burns 10% of the maximum HP per second ('+(r.loss*100).toFixed(1)+'%/s on '+r.th+')');
console.log(bad?('\n'+bad+' FAILED'):'\nALL OK');await b.close();process.exit(bad?1:0);
})();
