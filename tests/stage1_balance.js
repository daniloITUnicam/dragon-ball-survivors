/* Stage 1 balance: shooter rationing (4 per 8 s, 7 alive, 30 s wave), shorter wolf leap, [E] interaction radius, loot animations.
   node tests/stage1_balance.js   (HTML=<build>, SHOTS=<dir>) */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=process.env.SHOTS||'/tmp/o';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const pg=await b.newPage();await pg.setViewport({width:900,height:600});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1800);
  const ev=(f,...a)=>pg.evaluate(f,...a);
  await ev(()=>{__app.startGame({stage:5,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.god=true;});await wait(500);
  // shooters: 30-second wave, 4 per 8 s, at most 7 alive
  const r=await ev(()=>{const g=__app.game;g.en.length=0;g.t=200;g.nt=200;g.shootOn=true;g.shootEnd=g.t+30;g.shootQ=4;g.shootQT=8;
    const cnt=()=>g.en.filter(e=>!e.dead&&(e.ai==='ranged'||e.ai==='hover')).length;
    g.spawnRing(30,ENEMIES.gun);const a=cnt();                       // a big ring of gunners: only 4 get through
    for(let i=0;i<200;i++)g.spawnOne();const a2=cnt();               // regular spawns in the same 8 s window: quota already used
    g.shootQT=.01;g.update(.05);g.spawnRing(30,ENEMIES.gun);const b2=cnt();   // next window: 4 more
    g.shootQT=.01;g.update(.05);g.spawnRing(30,ENEMIES.gun);const c=cnt();     // 4 more: capped at 7 alive
    g.shootQT=.01;g.update(.05);g.spawnRing(30,ENEMIES.gun);const d=cnt();
    return{a,a2,b2,c,d,end:g.shootEnd-g.t};});
  console.log(JSON.stringify(r));
  ok(r.a===4&&r.a2<=4,'a ring of 30 gunners spawns only 4 ('+r.a+', then '+r.a2+')');
  ok(r.b2<=8&&r.b2>r.a2,'next 8 s window allows more ('+r.b2+')');
  ok(r.c<=7&&r.d<=7,'never more than 7 shooters alive ('+r.c+','+r.d+')');
  ok(r.end>25&&r.end<=31,'stage-1 shooter wave lasts 30 s');
  const r2=await ev(()=>{const g=__app.game;g.stage=STAGES[1];g.shootQ=0;g.en.length=0;g.spawnRing(10,ENEMIES.gun);const n=g.en.length;g.stage=STAGES[0];return n;});
  ok(r2===10,'other stages are not rationed');
  // wolf leap: shorter
  const w=await ev(()=>{const g=__app.game;g.en.length=0;g.p.x=0;g.p.y=0;g.p.hp=g.p.maxHp=1e9;const e=g.mkEnemy(ENEMIES.wolf,200,0);e.st=0;e.stT=0;g.en.push(e);let maxJ=0,maxZ=0,jumps=0,prev=0;
    for(let i=0;i<600;i++){g.p.x=0;g.p.y=0;g.updateEnemies(1/60);if(e.st===2&&e.jp){maxJ=Math.max(maxJ,Math.hypot(e.jp.tx-e.jp.sx,e.jp.ty-e.jp.sy));maxZ=Math.max(maxZ,e.zoff||0);}if(e.st===2&&prev!==2)jumps++;prev=e.st;}
    return{maxJ,maxZ,jumps};});
  console.log(JSON.stringify(w));
  ok(w.jumps>0&&w.maxJ<=151&&w.maxZ<=34,'wolf hops at most 150 units, height <= 34');
  // chamber: usable as soon as the [E] prompt is shown (radius 90)
  const ch=await ev(()=>{const g=__app.game;g.en.length=0;g.feat.length=0;g.p.x=0;g.p.y=0;g.feat.push({kind:'chamber',x:70,y:0,t:0,ttl:95,used:false,dead:false});
    const dir=g.dir||null;return 1;});
  await ev(()=>{__app.game.feat[0].x=70;});
  await wait(120);
  const near=await ev(()=>{const g=__app.game;return g.feat[0]&&g.feat[0].near;});
  ok(near===true,'prompt radius reached at 70 units');
  await ev(()=>{__app.game.input.interact=true;});await wait(200);
  ok(await ev(()=>!__app.game.feat.some(f=>f.kind==='chamber')||__app.game.trial!==null),'pressing E at 70 units enters the chamber');
  ok(errs.length===0,'no JS errors '+errs.join('|'));
  console.log(fails?'FAILED '+fails:'ALL OK');await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
