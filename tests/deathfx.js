/* Death animation: killed enemies dissolve (corpse.js), bosses send out a shock wave; Space collects the chest.   node tests/deathfx.js   (SHOTS=<dir> for pictures) */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=process.env.SHOTS||'/tmp';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const pg=await b.newPage();await pg.setViewport({width:1100,height:700,deviceScaleFactor:2});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1800);
  const ev=(f,...a)=>pg.evaluate(f,...a);
  const clear=async()=>{for(let i=0;i<60&&await ev(()=>G.corpses.length);i++)await wait(150);};   /* software rendering is slow: wait until the bodies are really gone */
  const start=stage=>ev(stage=>{window.__MAPSEED=0;const A=__app;A.save.d.settings.sandbox=false;A.save.d.settings.reduceFx=false;A.save.d.settings.lvAuto=true;FXL.on=false;A.startGame({stage,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;window.G=g;window.__nm=true;if(!window.__nmi)window.__nmi=setInterval(()=>{if(window.__nm&&window.G&&G.modal)G.modal=null;},30);g.sb.nospawn=true;g.sb.god=true;g.showNums=false;g.modal=null;g.en.length=0;return true;},stage);

  /* 1. ordinary enemies */
  await start(0);
  const r=await ev(()=>{const g=G,p=g.p,out=[];for(let i=0;i<5;i++){const e=g.mkEnemy(ENEMIES.sol,p.x+70+i*32,p.y-20+(i%2)*30);g.en.push(e);}
    for(const e of g.en.slice())g.damageEnemy(e,e.hp+1,60,0,false);
    return{c:g.corpses.length,kills:g.kills,alive:g.en.filter(e=>!e.dead).length};});
  ok(r.c===5&&r.kills===5,'five kills leave five dissolving bodies ('+r.c+')');
  await wait(100);
  const mid=await ev(()=>({n:G.corpses.length,snap:G.corpses.filter(c=>c.cv).length,t:G.corpses[0]&&G.corpses[0].t}));
  ok(mid.n>0&&mid.snap>0,'while they dissolve each body has its own picture ('+mid.snap+' of '+mid.n+', t='+(mid.t||0).toFixed(2)+')');
  await ev(()=>{G.timeScale=0;});   /* freeze the clock to take pictures at chosen moments */
  for(const [nm,k] of [['a',.12],['b',.3],['c',.5],['d',.75]]){await ev(k=>{for(const c of G.corpses)c.t=k*c.dur;},k);await wait(60);await pg.screenshot({path:OUT+'/death_'+nm+'.png',clip:{x:420,y:230,width:300,height:160}});}
  await ev(()=>{G.timeScale=1;});
  await clear();
  ok(await ev(()=>G.corpses.length)===0,'the bodies are gone after about half a second');
  ok(await ev(()=>Object.values(CorpsePool.free).reduce((a,v)=>a+v.length,0))>0,'their canvases went back to the pool');

  /* 2. off screen, many at once, reduced effects, explosive */
  const lim=await ev(()=>{const g=G,p=g.p;for(let i=0;i<80;i++){const e=g.mkEnemy(ENEMIES.sai,p.x+60+(i%20)*10,p.y+(i/20|0)*12);g.en.push(e);g.damageEnemy(e,1e9,0,0,false);}
    const far=g.mkEnemy(ENEMIES.sai,p.x+5000,p.y);g.en.push(far);const n0=g.corpses.length;g.damageEnemy(far,1e9,0,0,false);return{n:n0,after:g.corpses.length};});
  ok(lim.n<=40&&lim.after===lim.n,'80 kills at once: at most '+lim.n+' bodies, and none for an enemy dying off screen');
  await clear();
  await ev(()=>{FXL.on=true;const g=G,p=g.p,e=g.mkEnemy(ENEMIES.sai,p.x+60,p.y);g.en.push(e);g.damageEnemy(e,1e9,0,0,false);window.__c=g.corpses.length;window.__d=[__app.state,G.modal&&G.modal.type,G.timeScale,FXL.on,g.trial,e.ai,g.corpses.map(c=>c.t.toFixed(2)).join()];FXL.on=false;});
  ok(await ev(()=>window.__c)===0,'with "Reduce effects" on there is no dissolve '+await ev(()=>JSON.stringify(window.__d)));

  /* 3. a boss: shock wave + dissolving body */
  await start(7);
  const bs=await ev(()=>{const g=G;g.spawnBoss('c16',false);const e=g.en.find(x=>x.boss);e.x=g.p.x+120;e.y=g.p.y;const f0=g.fx.filter(f=>f.shock).length;g.damageEnemy(e,1e9,0,0,true);
    return{shock:g.fx.filter(f=>f.shock).length-f0,c:g.corpses.length,boss:g.corpses[0]&&g.corpses[0].boss,flash:g.flash>.3,shake:g.shake>=.9};});
  ok(bs.shock>=3&&bs.c===1&&bs.boss,'a boss death: '+bs.shock+' shock rings and a dissolving body');
  ok(bs.flash&&bs.shake,'white flash and strong shake');
  await ev(()=>{G.timeScale=0;for(const c of G.corpses)c.t=.35*c.dur;});await wait(80);await pg.screenshot({path:OUT+'/death_boss.png'});await ev(()=>{G.timeScale=1;});
  await clear();
  ok(await ev(()=>G.corpses.length)===0,'the boss body is gone after about a second');
  /* the final boss keeps its victory sequence: rings yes, no extra body */
  const fb=await ev(()=>{const g=G;g.spawnBoss('cell',true);const e=g.en.find(x=>x.boss&&x.final);const f0=g.fx.filter(f=>f.shock).length;g.damageEnemy(e,1e9,0,0,true);return{shock:g.fx.filter(f=>f.shock).length-f0,c:g.corpses.length,vic:!!g.vic};});
  ok(fb.shock>=3&&fb.c===0&&fb.vic,'the final boss: rings, no extra body, victory sequence starts');

  /* 4. Space collects the chest */
  await start(0);
  await ev(()=>{window.__nm=false;});
  await ev(()=>{const g=G;g.chests.push({x:g.p.x+5,y:g.p.y,final:false,t:0,elite:true});});await wait(1200);
  ok(await ev(()=>G.modal&&G.modal.type==='chest'),'a chest opens its window');
  await pg.keyboard.press('Space');await wait(500);
  ok(await ev(()=>!G.modal&&__app.state==='play'),'Space presses "Collect" even when a reward card has the focus');

  ok(errs.length===0,'no JS errors '+errs.join('|'));
  console.log(fails?'FAILED '+fails:'ALL OK');await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
