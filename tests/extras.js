/* v117: boss weaknesses, the charged Kamehameha, the golden Saibaman */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const r=await pg.evaluate(()=>{const A=__app,o={};A.loop=()=>{};A.save.d.settings.hints=false;
  o.all=Object.keys(BOSSES).every(id=>WEAK_KINDS.includes(EXTRAS.weak(id)))&&EXTRAS.weak('cell')==='beam'&&EXTRAS.weak('bu')==='blast';
  A.startGame({stage:7,char:'goku',diff:'normal',x2:false,sandbox:true});const g=A.game;g.sb.god=true;g.sb.nospawn=true;
  g.spawnBoss('cell');const e=g.en.find(x=>x.boss);e.armor=0;e.gd=null;g.weapons.clear();g.addWeapon('kame');g.addWeapon('ki');
  let h0=e.hp;g.curW='kame';g.damageEnemy(e,100,0,0,false);const a=h0-e.hp;h0=e.hp;g.curW='ki';g.damageEnemy(e,100,0,0,false);const b2=h0-e.hp;g.curW=null;o.weak=Math.round(a)===115&&Math.round(b2)===100;
  /* charged beam */
  const k=g.weapons.get('kame');for(let i=0;i<120;i++){EXTRAS.hold(g,true,1/60);if(i%30===0)A.renderer.draw(g,1/60);}o.ch=g.kch>=1.9;EXTRAS.hold(g,false,1/60);o.boost=g.kBoost>.95;
  k.beams=[];k.fire(0);const big=k.beams[0];k.beams=[];k.fire(0);const nor=k.beams[0];o.big=big.dmg/nor.dmg>2.4&&big.wid>nor.wid*1.7;
  /* golden Saibaman */
  g.en=[];EXTRAS.spawnGold(g);const s=g.gold;o.gold=!!s&&s.goldS;const d0=Math.hypot(s.x-g.p.x,s.y-g.p.y);for(let i=0;i<60;i++)g.update(1/60);o.runs=Math.hypot(s.x-g.p.x,s.y-g.p.y)>d0;A.renderer.draw(g,1/60);
  const l0=g.loot.length;g.killEnemy(s);o.bag=g.loot.filter(l=>l.k==='bag').length>=2&&!g.gold;
  EXTRAS.spawnGold(g);const s2=g.gold;for(let i=0;i<60*11;i++)g.update(1/60);o.away=!g.gold&&s2.dead;
  return o;});
ok(r.all,'every boss has a weakness (Cell: beams, Buu: blasts)');
ok(r.weak,'the right kind of weapon deals +15% to the boss');
ok(r.ch&&r.boost&&r.big,'holding the ability key charges the next Kamehameha: ×2.5 damage, ×1.8 width at full charge');
ok(r.gold&&r.runs&&r.bag&&r.away,'the golden Saibaman runs away, drops 2 bags when caught, escapes after 10 s');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();})();
