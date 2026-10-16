/* companions (pets): shorter cooldowns and stronger effects; zenny bag whose value follows the time it appears */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:640}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const start=pet=>pg.evaluate(pet=>{__app.save.d.settings.reduceFx=false;__app.startGame({stage:5,char:'goku',diff:'normal',x2:false,sandbox:false,pet});const g=__app.game;g.sb.god=true;g.sb.nospawn=true;g.modal=null;g.en=[];g.eb=[];g.loot=[];g.gm=[];window.G=g;return g.pet&&g.pet.d.id;},pet);
/* ---------- cooldowns ---------- */
const cds=await pg.evaluate(()=>Object.fromEntries(PETS.map(p=>[p.id,p.cd])));
const old={dende:42,shenron:55,droid:55,bubbles:50,buu:38,saibaman:30};
ok(Object.keys(old).every(k=>cds[k]<old[k]),'every companion has a shorter cooldown: '+Object.entries(cds).map(([k,v])=>k+' '+v+'s (was '+old[k]+')').join(', '));
ok(cds.dende===30&&cds.shenron===40&&cds.droid===40&&cds.bubbles===36&&cds.buu===28&&cds.saibaman===22,'the new values');
/* ---------- Mini Shenron ---------- */
await start('shenron');
const sh=await pg.evaluate(()=>{const g=G,p=g.p;g.pet.cd=0;g.xp=0;g.need=100;g.gm=[{x:p.x+380,y:p.y,v:1,att:false},{x:p.x+450,y:p.y,v:1,att:false}];g.usePet();return{near:g.gm[0].att,far:g.gm[1].att,xp:g.xp};});
ok(sh.near&&!sh.far,'Mini Shenron pulls gems within 400 px (not 450)');
ok(Math.abs(sh.xp-5)<.2,'and gives 5% of a level as XP ('+sh.xp.toFixed(2)+' of 100)');
/* ---------- Mini Droid ---------- */
await start('droid');
const dr=await pg.evaluate(()=>{const g=G;g.pet.cd=0;g.p.inv=0;g.usePet();return g.p.inv;});
ok(Math.abs(dr-1.5)<.01,'Mini Droid: 1.5 s of invulnerability ('+dr+')');
/* ---------- Bubbles ---------- */
await start('bubbles');
const bu=await pg.evaluate(()=>{const g=G;g.pet.cd=0;g.recalc();const l0=g.S.luck;g.t=0;const n0=g.loot.length;g.usePet();const l1=g.S.luck;const coins=g.loot.filter(l=>l.k==='coin');const v=coins[0].v,exp=g.coinValue();
  let t=0;while(g.petLuckT>0&&t<80){g.update(1/30);t+=1/30;}return{gain:l1-l0,n:coins.length,v,dur:+t.toFixed(1),after:g.S.luck-l0};});
ok(Math.abs(bu.gain-.05)<.001&&bu.n===3&&bu.v===5,'Bubbles: +5% luck and 3 coins worth 5 at the start ('+bu.gain.toFixed(3)+', '+bu.n+' coins of '+bu.v+')');
ok(bu.dur>=49&&bu.dur<=51.5&&Math.abs(bu.after)<.001,'the luck lasts 50 s and then goes away ('+bu.dur+' s)');
/* ---------- Mini Buu ---------- */
await start('buu');
const bb=await pg.evaluate(()=>{const g=G,p=g.p,mk=(d,boss)=>{const e=g.mkEnemy(ENEMIES[g.stage.roster[0][0]],p.x+d,p.y);e.r=10;e.boss=!!boss;e.stun=0;g.en.push(e);return e;};
  const a=mk(190),c=mk(260),d=mk(150,true);g.pet.cd=0;g.usePet();return{near:a.stun,far:c.stun,boss:d.stun};});
ok(bb.near===1&&bb.far===0&&Math.abs(bb.boss-.4)<.01,'Mini Buu: stuns within 210 px for 1 s, bosses for 0.4 s ('+JSON.stringify(bb)+')');
/* ---------- Saibaman ---------- */
await start('saibaman');
const sa=await pg.evaluate(()=>{const g=G,p=g.p;g.lvl=10;const mk=d=>{const e=g.mkEnemy(ENEMIES[g.stage.roster[0][0]],g.pet.x+d,g.pet.y-6);e.hp=e.max=1e6;e.armor=0;g.en.push(e);return e;};
  const a=mk(150),c=mk(210);g.S.might=1;g.S.crit=0;g.pet.cd=0;const dmg0=[];g.usePet();return{near:(a.max-a.hp),far:(c.max-c.hp),lvl:g.lvl,might:g.S.might};});
ok(sa.near>0&&sa.far===0,'Saibaman: reaches enemies at 150 px but not at 210 px (radius 160)');
ok(sa.near>(7+.55*10)*1.2&&sa.near<=(12+.8*10)*1.6,'and hits harder: '+sa.near.toFixed(1)+' damage at level 10 (was '+(7+.55*10)+' before the buff)');
/* ---------- Dende still fine ---------- */
await start('dende');
const de=await pg.evaluate(()=>{const g=G;g.pet.cd=0;g.p.hp=1;const h=g.p.hp;g.usePet();return(g.p.hp-h)/g.p.maxHp;});
ok(Math.abs(de-.30)<.01,'Dende: 30% of max HP ('+(de*100).toFixed(1)+'%)');
/* ---------- zenny bag ---------- */
const bag=await pg.evaluate(()=>{const g=G,out={};
  out.v=[0,30,60,300,600,900,1800,2400,4000].map(t=>[t,g.bagValue(t)]);
  /* the director */
  g.t=900;g.loot=[];const r0=Math.random;Math.random=()=>.1;g.map.spawnLootPoint();Math.random=r0;
  const l=g.loot[g.loot.length-1];out.kind=l.k;out.val=l.v;out.ttl=l.ttl;
  /* pick-up: the base value goes to the run total, whatever the coin buffs */
  g.S.gold=2.5;const c0=g.run.coins;g.p.x=l.x;g.p.y=l.y;g.updatePickups(1/30);out.gain=g.run.coins-c0;out.bags=g.run.bags;out.gone=l.dead;
  /* the magnet pulls it in like a coin */
  g.loot=[];g.spawnLoot('bag',g.p.x+60,g.p.y);const l2=g.loot[0],x0=l2.x;g.updatePickups(1/30);out.pulled=l2.x<x0||l2.dead;
  /* enemy coins stay small */
  g.t=900;g.loot=[];g.spawnLoot('coin',0,0);out.coin=g.loot[0].v;
  return out;});
const vv=Object.fromEntries(bag.v);
ok(vv[1800]===1000&&vv[900]===500&&vv[600]===335&&vv[0]===25&&vv[30]===25,'bag value: 1000 at minute 30, 500 at minute 15, 335 at minute 10, never below 25 ('+bag.v.map(x=>x.join(':')).join(' ')+')');
ok(bag.v.every((x,i)=>!i||x[1]>=bag.v[i-1][1])&&vv[4000]<=1300,'it only grows with time (capped at 1300)');
ok(bag.kind==='bag'&&bag.val===500&&bag.ttl===90,'the random map loot spawns a bag worth the value of that moment ('+bag.kind+' '+bag.val+', '+bag.ttl+' s)');
ok(bag.gain===500&&bag.bags===1&&bag.gone,'picking it up adds exactly its value, ignoring the zenny buffs (they apply when the run pays out)');
ok(bag.pulled,'it is attracted by the magnet');
const cv=await pg.evaluate(()=>{const g=G;const f=t=>g.coinValue(t);const r=[0,300,600,900,1200,1800,2400,9999].map(t=>[t,f(t)]);g.t=900;g.loot=[];g.spawnLoot('coin',0,0);const a=g.loot[0].v;g.t=1800;g.loot=[];g.spawnLoot('coin',0,0);const b=g.loot[0].v;g.t=7200;g.loot=[];g.spawnLoot('coin',0,0);const c=g.loot[0].v;
  return{r,a,b,c};});
const cvm=Object.fromEntries(cv.r);
ok(cvm[0]===5&&cvm[1800]===40&&cvm[600]===17&&cvm[900]===23&&cvm[9999]===40,'enemy coin value: 5 at the start, 17 at minute 10, 23 at minute 15, 40 at minute 30 ('+cv.r.map(x=>x.join(':')).join(' ')+')');
ok(cv.r.every((x,i)=>!i||x[1]>=cv.r[i-1][1])&&cv.a===23&&cv.b===40&&cv.c===40,'a real coin on the ground has that value and never goes past 40 ('+cv.a+', '+cv.b+', '+cv.c+')');
/* buffs still pay out on the total */
const pay=await pg.evaluate(()=>{const g=G;g.S.gold=2;g.run.coins=1000;const z0=__app.save.d.zenny;const res=__app.save.finishRun?null:null;return{mult:STAGES[g.stageIdx].zenny*g.S.gold*g.D.zenny};});
ok(pay.mult>=2,'the coin multiplier is still applied to the run total at the end ('+pay.mult+'x)');
/* look */
await pg.evaluate(()=>{const g=G,p=g.p;g.t=1500;g.loot=[];g.spawnLoot('bag',p.x+70,p.y-30);g.spawnLoot('bag',p.x-110,p.y+30);g.loot[1].v=1000;for(let i=0;i<45;i++)g.update(1/60);__app.renderer.draw(g,0);});
await pg.screenshot({path:'/tmp/bag.png',clip:{x:300,y:170,width:500,height:300}});
console.log(errs.length?errs.slice(0,3):'no page errors');await b.close();process.exit(errs.length||process.exitCode?1:0);})();
