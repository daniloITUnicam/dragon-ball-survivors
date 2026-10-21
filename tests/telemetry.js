/* Gameplay telemetry: per-minute / per-level / per-boss / per-enemy / per-weapon data, consistent with the game's own counters, stored on this device,
   exported as JSON / CSV from Settings > Gameplay > Game data; off switch; test-mode runs not recorded. Also: the Perfect Cell theme plays during the final boss of the Cell Games.
   node tests/telemetry.js   (HTML=<build>) */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const pg=await b.newPage();await pg.setViewport({width:1100,height:700});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1800);
  const ev=(f,...a)=>pg.evaluate(f,...a);
  const click=sel=>ev(s=>{const e=document.querySelector(s);if(e)e.click();return !!e;},sel);
  const start=(stage,sandbox)=>ev((stage,sandbox)=>{window.__MAPSEED=0;const A=__app;A.save.d.settings.sandbox=false;A.save.d.settings.lvAuto=true;A.save.d.settings.lvPrio=[];
    A.startGame({stage,char:'goku',diff:'normal',x2:false,sandbox:!!sandbox,pet:'none'});const g=A.game;window.G=g;g.modal=null;g.sb.god=true;return true;},stage,!!sandbox);
  await ev(()=>{localStorage.removeItem(TELE_KEY);});

  /* 1. a real stretch of play: 130 s of game time with spawns, automatic level-ups */
  await start(0);
  const r=await ev(()=>{const g=G;g.en.length=0;for(let i=0;i<9000&&g.t<130;i++){g.modal=null;g.update(1/30);}
    const T=g.tl,sum=o=>Object.values(o).reduce((a,v)=>a+v,0);
    return{t:g.t,min:T.min.length,m0:T.min[0]&&T.min[0].t,s10:T.s10.length,kills:g.kills,tk:T.tot.kills,dealt:T.tot.dealt,dmgBy:sum(g.dmgBy),lvl:g.lvl,lv:T.lv.length,
      lvOk:T.lv.every(l=>l.pick&&l.auto===1&&l.opts&&l.opts.length===3&&l.dt>=0),et:Object.keys(T.et).length,sp:Object.values(T.et).reduce((a,e)=>a+e.sp,0),tsp:T.tot.spawned,
      mk:T.min.reduce((a,m)=>a+m.kills,0),md:T.min.reduce((a,m)=>a+m.dealt,0),wp:Object.keys(T.wp).length,row:T.min[0],on:T.on};});
  ok(r.on&&r.t>=129,'recording is on and the run advanced ('+r.t.toFixed(0)+' s)');
  ok(r.min===2&&r.m0===60&&r.s10>=12,'one row per minute ('+r.min+') and a point every 10 s ('+r.s10+')');
  ok(r.kills>20&&r.tk===r.kills,'kills match the game counter ('+r.tk+' = '+r.kills+')');
  ok(Math.abs(r.dealt-r.dmgBy)<1&&r.dealt>0,'damage dealt matches damage-by-weapon ('+Math.round(r.dealt)+' = '+Math.round(r.dmgBy)+')');
  ok(r.lv===r.lvl-1&&r.lv>0&&r.lvOk,'every level-up is logged with its offer and pick ('+r.lv+' of '+(r.lvl-1)+')');
  ok(r.et>0&&r.sp===r.tsp&&r.sp>0,'per enemy type: '+r.et+' types, '+r.sp+' spawned');
  ok(r.mk<=r.tk&&r.md<=r.dealt+1&&r.wp>0,'minute rows add up to no more than the totals; per weapon rows exist ('+r.wp+')');
  ok(r.row&&r.row.enAvg>0&&r.row.dps>0&&r.row.w&&Object.keys(r.row.w).length>0&&r.row.might>0,'a minute row holds enemies, DPS, weapons and stats: '+JSON.stringify(r.row).slice(0,150)+'...');

  /* 2. a boss: kill time, damage dealt / taken during the fight */
  const bs=await ev(()=>{const g=G,T=g.tl;g.en.length=0;g.spawnBoss('c16',false);const e=g.en.find(x=>x.boss);g.curW='kame';g.damageEnemy(e,1000,0,0,false);
    for(let i=0;i<150;i++){g.modal=null;g.update(1/30);}g.sb.god=false;g.p.inv=0;g.hurt(50,e);g.sb.god=true;g.damageEnemy(e,1e9,0,0,true);for(let i=0;i<3;i++)g.update(1/30);
    const b=T.boss.find(x=>x.id==='c16');return{n:T.boss.filter(x=>x.id==='c16').length,b:b&&{id:b.id,killed:b.killed,kt:b.kt,ft:b.ft,dealt:b.dealt,taken:b.taken,dps:b.dps,fin:b.fin},hb:Object.keys(T.hb)};});
  ok(bs.n===1&&bs.b.id==='c16'&&bs.b.killed===1&&bs.b.fin===1,'boss logged: '+JSON.stringify(bs.b));
  ok(bs.b.kt>=2&&bs.b.ft>=2&&bs.b.dealt>=1000&&bs.b.taken>0&&bs.b.dps>0,'boss kill time, damage dealt and taken are measured');
  ok(bs.hb.some(k=>k.startsWith('boss:')),'damage taken is split by source ('+bs.hb.slice(0,4)+')');

  /* 3. hits, dodges */
  const hd=await ev(()=>{const g=G,T=g.tl,e=g.en.find(x=>!x.boss&&!x.dead)||{def:ENEMIES[Object.keys(ENEMIES)[0]]};const t0=T.tot.taken,d0=T.tot.dodges;g.sb.god=false;g.p.inv=0;g.S.dodge=0;g.hurt(30,e);const hit=T.tot.taken-t0;
    g.p.inv=0;g.S.dodge=1;g.hurt(30,e);const dod=T.tot.dodges-d0;g.S.dodge=0;g.sb.god=true;return{hit,dod};});
  ok(hd.hit>0&&hd.dod===1,'a hit adds damage taken ('+hd.hit+') and a dodge is counted');

  /* 4. end of the run: stored once, JSON and CSV */
  const fin=await ev(()=>{const g=G;g.p.inv=0;g.finish(false);const a=TeleStore.load(),run=a[0];return{n:a.length,res:run&&run.res,dur:run&&run.dur,min:run&&run.min.length,lv:run&&run.lv.length,boss:run&&run.boss.length,wps:run&&run.weapons.length,
    S:run&&run.S.might,json:(()=>{try{return JSON.parse(TeleStore.json()).length;}catch(e){return -1;}})(),
    csv:{m:TeleStore.csv('minutes').split('\n'),r:TeleStore.csv('runs').split('\n')[0],l:TeleStore.csv('levels').split('\n').length,b:TeleStore.csv('bosses'),w:TeleStore.csv('weapons').split('\n').length,e:TeleStore.csv('enemies').split('\n').length,d:TeleStore.csv('damage').split('\n').length}};});
  ok(fin.n===1&&fin.res==='quit'&&fin.dur>130&&fin.min>=3,'the finished run is stored once ('+fin.res+', '+fin.dur+' s, '+fin.min+' minute rows)');
  ok(fin.lv>0&&fin.boss>=2&&fin.wps>0&&fin.S>0&&fin.json===1,'it holds levels, boss, weapons and final stats; the JSON export parses');
  ok(fin.csv.m[0].startsWith('run,ts,stage,char,diff,x2,endless,res,m,t,T,lvl')&&fin.csv.m.length>=5,'CSV by minute: header + rows ('+(fin.csv.m.length-2)+')');
  ok(/might/.test(fin.csv.r)&&fin.csv.l>2&&/c16/.test(fin.csv.b)&&fin.csv.w>2&&fin.csv.e>2&&fin.csv.d>2,'CSV of runs, levels, bosses, weapons, enemies, damage sources');

  if(process.env.TELE_DUMP)require('fs').writeFileSync(process.env.TELE_DUMP,await ev(()=>TeleStore.json()));   /* sample export for tools/analyze_telemetry.py */

  /* 5. off switch and test mode */
  await start(0);await ev(()=>{__app.save.d.settings.tele=false;const g=G;g.en.length=0;for(let i=0;i<120;i++){g.modal=null;g.update(1/30);}g.finish(false);});
  ok(await ev(()=>TeleStore.count())===1,'with the switch off nothing is recorded');
  await start(0,true);await ev(()=>{__app.save.d.settings.tele=true;const g=G;for(let i=0;i<120;i++){g.modal=null;g.update(1/30);}g.finish(false);});
  ok(await ev(()=>TeleStore.count())===1,'a test-mode (sandbox) run is not recorded');

  /* 6. the Settings screen */
  await ev(()=>{__app.save.d.settings.tele=true;__app.toMenu();});await wait(500);
  await ev(()=>__app.ui.push('settings',{tab:'gameplay'}));await wait(300);
  ok(await click('.settings [data-fid="teleOpen"]'),'Settings > Gameplay has the "Game data" button');await wait(400);
  ok(await ev(()=>__app.ui.top.name==='telemetry'&&!!document.querySelector('[data-fid="telesw"]')&&!!document.querySelector('[data-fid="tx_all"]')&&!!document.querySelector('[data-fid="tx_minutes"]')),'its screen has the switch and the export buttons');
  ok(await ev(()=>{const t=document.querySelector('[data-fid="telesw"]').dataset.tip;return t&&t===__app.ui.t('teleSwD');}),'the switch has the explanation as a tooltip');
  await click('[data-fid="telesw"]');await wait(300);
  ok(await ev(()=>__app.save.d.settings.tele===false),'the switch turns recording off');
  await click('[data-fid="telesw"]');await wait(300);
  ok(await ev(()=>/boss/i.test(document.body.textContent)||document.body.textContent.includes(__app.ui.t('teleLast'))),'the last run summary is shown');
  await click('[data-fid="tx_all"]');await click('[data-fid="tx_minutes"]');
  await click('[data-fid="teleclear"]');await wait(150);ok(await ev(()=>TeleStore.count())===1,'delete needs a second press');
  await click('[data-fid="teleclear"]');await wait(300);
  ok(await ev(()=>TeleStore.count())===0&&await ev(()=>document.body.textContent.includes(__app.ui.t('teleNone'))),'second press deletes the data');

  /* 7. music: Perfect Cell's theme for the final boss of the Cell Games; other stages keep the synthesized final-boss music */
  ok(await ev(()=>!!trackUri('fboss8')&&/perfect/i.test(decodeURIComponent(trackUri('fboss8')))&&/cell games/i.test(decodeURIComponent(trackUri('stage8')))),'build maps "perfect cell theme" to the Cell final boss and "cell games" to the stage');
  await start(7);
  await ev(()=>{const g=G;g.sb.nospawn=true;g.en.length=0;window.__pl=null;__app.audio.play=n=>{window.__pl=n;};g.spawnBoss('cell',true);});for(let i=0;i<30&&!await ev(()=>window.__pl);i++)await wait(200);
  ok(await ev(()=>window.__pl)==='fboss8','Cell Games: the final boss plays fboss8 ('+await ev(()=>window.__pl)+')');
  ok(await ev(()=>['stage1','stage7','stage8','stage9','stage10','stage11','fboss2'].every(k=>!!trackUri(k))&&/freezer/i.test(decodeURIComponent(trackUri('fboss2')))),'music files: Saiyan Plains, Vegeta, Cell Games, Realm of the Gods, Hell, Snake Way + Freezer boss theme');
  await start(1);
  await ev(()=>{const g=G;g.sb.nospawn=true;g.en.length=0;window.__pl=null;__app.audio.play=n=>{window.__pl=n;};g.spawnBoss('freezer',true);});for(let i=0;i<30&&!await ev(()=>window.__pl);i++)await wait(200);
  ok(await ev(()=>window.__pl)==='fboss2','Namek: the final boss (Freezer) plays fboss2 ('+await ev(()=>window.__pl)+')');
  await ev(()=>{const g=G;g.en.length=0;window.__pl=null;g.spawnBoss('ginew',false);});for(let i=0;i<30&&!await ev(()=>window.__pl);i++)await wait(200);
  ok(await ev(()=>window.__pl)==='bossgen'&&await ev(()=>/generic/i.test(decodeURIComponent(trackUri('bossgen')))),'a boss that is not the stage final (Ginew on Namek) plays the generic boss battle, not the Freezer theme ('+await ev(()=>window.__pl)+')');
  await start(0);
  await ev(()=>{const g=G;g.sb.nospawn=true;g.en.length=0;window.__pl=null;__app.audio.play=n=>{window.__pl=n;};g.spawnBoss('tao',true);});for(let i=0;i<30&&!await ev(()=>window.__pl);i++)await wait(200);
  ok(await ev(()=>window.__pl)==='finalboss','another stage: the final boss keeps the old music');

  ok(errs.length===0,'no JS errors '+errs.join('|'));
  console.log(fails?'FAILED '+fails:'ALL OK');await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
