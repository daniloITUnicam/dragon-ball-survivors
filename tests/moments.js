/* v116: Last Stand, the ally, the boss transformation cinematic */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const r=await pg.evaluate(()=>{const A=__app,o={};A.loop=()=>{};A.save.d.settings.hints=false;
  A.startGame({stage:1,char:'vegeta',diff:'normal',x2:false,sandbox:true});const g=A.game;g.sb.nospawn=true;g.t=120;
  /* Last Stand */
  const p=g.p;p.hp=p.maxHp*.15;p.inv=0;g.abCd=30;g.hurt(p.maxHp*.08);o.ls=g.lsT>7&&g.abCd===0&&g.lsUsed;
  for(let i=0;i<60;i++){g.update(1/60);g.abCd=20;g.update(1/60);}A.renderer.draw(g,1/60);o.cd0=g.abCd===0||g.abCd<20;
  for(let i=0;i<60*8;i++)g.update(1/60);o.survived=g.run.lastStand===1&&!g.lsT;
  p.hp=p.maxHp*.15;p.inv=0;g.hurt(p.maxHp*.08);o.once=!g.lsT;
  /* the ally */
  p.hp=p.maxHp*.2;g.en=[];for(let i=0;i<16;i++){const e=g.mkEnemy(ENEMIES[Object.keys(ENEMIES)[0]],p.x+rnd(-150,150),p.y+rnd(-120,120));e.hp=e.max=5000;e.spd=0;g.en.push(e);}
  g.sb.god=true;MOMENTS.checkAlly(g);o.ally=g.ally&&g.ally.id!=='vegeta'&&g.ally.C;const k0=Object.assign({},g.dmgBy);
  for(let i=0;i<60*5;i++){g.update(1/60);if(i%20===0)A.renderer.draw(g,1/60);}o.allyHit=(g.dmgBy.ally||0)>0;
  for(let i=0;i<60*11;i++)g.update(1/60);o.gone=!g.ally;
  /* the boss cinematic */
  g.en=[];g.spawnBoss('freezer');const e=g.en.find(x=>x.boss);e.x=p.x+300;e.y=p.y;g.bossTransform(e);o.cine=!!g.bcine;
  const t0=g.t;for(let i=0;i<30;i++){g.update(1/60);A.renderer.draw(g,1/60);}o.paused=g.t===t0&&!!A.renderer.camOff;
  for(let i=0;i<90;i++)g.update(1/60);o.cineEnd=!g.bcine;
  return o;});
ok(r.ls&&r.cd0,'Last Stand under 10% HP: 8 s, the ability has no cooldown');
ok(r.survived&&r.once,'surviving it counts (trophy); only once per run');
ok(r.ally&&r.allyHit&&r.gone,'an ally drops in when things look bad, hits with its move and leaves after 15 s');
ok(r.cine&&r.paused&&r.cineEnd,'a boss transformation is a short cinematic (world paused, camera on the boss)');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();})();
