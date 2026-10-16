/* Bosses and Saibamen drawn from pack sheets (flash, facing, transformation aura) without errors. */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=process.env.SHOTS||'/tmp/o';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const pg=await b.newPage();await pg.setViewport({width:900,height:600});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1800);
  const ev=(f,...a)=>pg.evaluate(f,...a);
  const ids=await ev(()=>Object.keys(BOSSES).filter(id=>Sprites.BOSS_SHEET[id]&&Sprites.sheets[Sprites.BOSS_SHEET[id]]));
  ok(ids.length>=30,'bosses with pack art: '+ids.length);
  ok(Object.values(await ev(()=>Sprites.BOSS_SHEET)).every(s=>true)&&await ev(()=>Object.values(Sprites.BOSS_SHEET).every(s=>Sprites.sheets[s])),'every mapped boss sheet exists');
  for(const id of ['raditz','jiren','janemba','cabba2','kidbu']){
    await ev(id=>{window.__app.startGame({stage:5,char:'goku',diff:'normal',x2:false,sandbox:true});const g=window.__app.game;g.sb.god=true;g.en.length=0;g.spawnBoss(id,false);
      const e=g.en[0];e.x=g.p.x+110;e.y=g.p.y;e.spd=0;e.face=-1;g.en.push(g.mkEnemy(ENEMIES.sai,g.p.x-110,g.p.y));},id);
    await wait(700);
    ok(await ev(()=>window.__app.game.en[0].esid&&true),id+': boss uses a sheet');
    await pg.screenshot({path:OUT+'/boss_'+id+'.png',clip:{x:150,y:160,width:600,height:300}});
  }
  ok(errs.length===0,'no JS errors '+errs.join('|'));
  await b.close();console.log(fails?'FAILED':'ALL OK');process.exit(fails?1:0);
})().catch(e=>{console.log('ERR',e);process.exit(2)});
