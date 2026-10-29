/* v116: game feel - hit-stop + camera punch, combo tiers (Zenny/XP multiplier), overkill burst */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const r=await pg.evaluate(()=>{const A=__app,o={};A.loop=()=>{};A.save.d.settings.hints=false;A.save.d.settings.hitstop=true;
  A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true});const g=A.game;g.sb.god=true;g.sb.nospawn=true;
  /* hit-stop: the world holds still for a few frames, then goes on */
  g.hitStop(.08,.07);const t0=g.t;g.update(1/60);g.update(1/60);o.frozen=g.t===t0;for(let i=0;i<6;i++)g.update(1/60);o.goes=g.t>t0;
  const z0=A.renderer.Z;g.zoomP=.07;A.renderer.draw(g,1/60);o.zback=A.renderer.Z===z0&&g.zoomP<.07;
  A.save.d.settings.hitstop=false;g.hs=0;g.hitStop(.5,.1);o.off=!g.hs;A.save.d.settings.hitstop=true;
  /* combo tiers */
  g.streak=0;o.m0=g.comboMul;for(let i=0;i<100;i++){g.bumpStreak();g.streakT=1;}o.m100=g.comboMul;o.banner=[g.banner].concat(g.bq||[]).filter(Boolean).map(x=>x.txt).join(' / ');
  const c0=g.run.coins;g.addZenny(100);o.z=g.run.coins-c0;g.streak=0;o.mBreak=g.comboMul;
  /* overkill */
  const mk=(x,y)=>{const e=g.mkEnemy(ENEMIES[Object.keys(ENEMIES)[0]],g.p.x+x,g.p.y+y);g.en.push(e);return e;};
  g.en=[];const a=mk(100,0),nb=mk(130,0);a.hp=a.max=10;nb.hp=nb.max=9999;nb.kx=0;g.ovkCd=0;g.showNums=true;g.damageEnemy(a,500,0,0,false);
  o.ovk=a.dead&&nb.kx>0&&g.tx.some(x=>x.c===7);
  const c=mk(-100,0);c.hp=c.max=10;g.ovkCd=0;const n0=g.tx.filter(x=>x.c===7).length;g.damageEnemy(c,12,0,0,false);o.noOvk=g.tx.filter(x=>x.c===7).length===n0;
  return o;});
ok(r.frozen&&r.goes&&r.zback,'hit-stop freezes the world a moment, the camera punch eases back');
ok(r.off,'Settings > Gameplay > Hit-stop off: no freeze');
ok(r.m0===1&&r.m100===1.25&&/SUPER COMBO/.test(r.banner)&&r.z===125&&r.mBreak===1,'combo: ×1.25 at 100 kills in a row (banner '+r.banner+'), Zenny +25%, gone when the streak breaks');
ok(r.ovk&&r.noOvk,'overkill: a kill with 4× the needed damage bursts and pushes the neighbours; a normal kill does not');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();})();
