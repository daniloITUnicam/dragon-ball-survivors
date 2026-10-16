/* Universal dash: Shift for every character, 4 s cooldown (shop: -0.4 s/level), damages enemies on the path, brief invulnerability. */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=process.env.SHOTS||'/tmp/o';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const pg=await b.newPage();await pg.setViewport({width:1000,height:640});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1800);
  const ev=(f,...a)=>pg.evaluate(f,...a);
  for(const id of ['goku','krillin','yamcha','satan']){
    await ev(id=>{window.__app.startGame({stage:5,char:id,diff:'normal',x2:false,sandbox:true});},id);await wait(800);
    const r=await ev(()=>{const g=window.__app.game;g.sb.god=false;g.input.x=1;g.input.y=0;g.p.face=1;g.dashCd=0;
      const x0=g.p.x;g.en.length=0;const en=g.mkEnemy(ENEMIES.sol||Object.values(ENEMIES)[0],g.p.x+110,g.p.y);en.hp=1e6;en.max=1e6;en.spd=0;en.armor=0;g.en.push(en);
      const hp0=g.en[0].hp,okd=g.dash();return{okd,cd:g.dashCd,inv:g.p.inv,hp0,x0};});
    await wait(350);
    const r2=await ev(()=>{const g=window.__app.game;return{x:g.p.x,eh:g.en[0]?g.en[0].hp:null,cd:g.dashCd,inv:g.p.inv};});
    ok(r.okd&&Math.abs(r.cd-4)<.01&&r.inv>=.6,id+': dash starts, cd 4s, invulnerable '+JSON.stringify(r));
    ok(r2.x>r.x0+100&&r2.eh<r.hp0,id+': moved forward and damaged the enemy '+JSON.stringify(r2));
    ok(!(await ev(()=>window.__app.game.dash())),id+': blocked during cooldown');
  }
  /* shop levels shorten the cooldown, real key press works */
  await ev(()=>{window.__app.save.d.shop.dash=3;});
  ok(await ev(()=>window.__app.game.dashCdMax)===4,'base dash cooldown 4 s (the shop upgrade is gone)');
  await ev(()=>{const g=window.__app.game;g.dashCd=0;g.dashT=0;});
  await pg.keyboard.down('ShiftLeft');await wait(120);await pg.keyboard.up('ShiftLeft');await wait(80);
  ok(await ev(()=>window.__app.game.dashCd>2),'Shift key triggers the dash');
  await pg.screenshot({path:OUT+'/dash_hud.png'});
  ok(errs.length===0,'no JS errors '+errs.join('|'));
  await b.close();console.log(fails?'FAILED':'ALL OK');process.exit(fails?1:0);
})().catch(e=>{console.log('ERR',e);process.exit(2)});
