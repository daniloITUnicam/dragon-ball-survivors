/* v116: guard bar (break = 3 s stun, +25% damage), surprise boss (better chest), named finishing move */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const r=await pg.evaluate(()=>{const A=__app,o={};A.loop=()=>{};A.save.d.settings.hints=false;
  A.startGame({stage:1,char:'goku',diff:'normal',x2:false,sandbox:true});const g=A.game;g.sb.god=true;g.sb.nospawn=true;
  g.spawnBoss('freezer',true);const e=g.en.find(x=>x.boss);o.gd=!!e.gd;e.armor=0;
  g.damageEnemy(e,e.gd.max*.5,0,0,false);o.half=e.gd.v>0&&e.gd.v<e.gd.max;g.damageEnemy(e,e.gd.max,0,0,false);o.brk=e.gd.brk>0&&e.stun>=2.9;
  const h0=e.hp;g.damageEnemy(e,100,0,0,false);o.mul=Math.round(h0-e.hp);A.renderer.draw(g,1/60);
  for(let i=0;i<60*3.2;i++)g.update(1/60);o.back=e.gd.brk===0&&e.gd.v>0;
  /* surprise boss */
  g.sbx={at:0,done:false};g.finalSpawned=false;g.en=g.en.filter(x=>x!==e);g.bossAlive=0;g.update(1/60);const s=g.en.find(x=>x.surprise);o.sur=!!s&&!g.stage.bosses.some(q=>q[0]===s.bid);
  if(s){const rs=[];for(let i=0;i<40;i++)rs.push(BOSSX.chestRar(g,s));o.rar=Math.min(...rs)>=2;}
  /* the finishing move */
  g.en=[];g.spawnBoss('freezer',true);const f=g.en.find(x=>x.boss&&x.final);g.weapons.clear();g.addWeapon('kame');g.curW='kame';f.gd=null;f.armor=0;g.damageEnemy(f,f.hp*10,0,0,false);g.curW=null;
  o.fin=g.finisher&&A.ui.tr(g.finisher.n)==='Kamehameha'&&!!g.vic;for(let i=0;i<20;i++){g.updateVictory(1/60);A.renderer.draw(g,1/60);}
  return o;});
ok(r.gd&&r.half&&r.brk,'a boss guard soaks hits; emptied it breaks: 3 s stun');
ok(r.mul===125&&r.back,'while broken the boss takes +25% damage ('+r.mul+'), then the guard comes back');
ok(r.sur&&r.rar,'a surprise boss from another saga can show up, with an Epic-or-better chest');
ok(r.fin,'the final boss kill shows the finishing move name');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();})();
