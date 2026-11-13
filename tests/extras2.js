/* v117: weather effects, enemy album rewards */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const r=await pg.evaluate(()=>{const A=__app,d=A.save.d,o={};A.loop=()=>{};d.settings.hints=false;d.settings.sandbox=false;
  A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true});const g=A.game;g.sb.god=true;g.sb.nospawn=true;g.weapons.clear();g.addWeapon('chain');g.addWeapon('ki');
  Ambient.wxOn=true;Ambient.evK='rain';Ambient.evI=.9;g.curW='chain';o.rain=EXTRAS.wxDmg(g)===1.1;g.curW='ki';o.notKi=EXTRAS.wxDmg(g)===1;g.curW=null;o.tag=!!EXTRAS.wxTag(g);
  Ambient.evK='sand';const n0=g.gm.length;g.dropGem(g.p.x+50,g.p.y,10);o.gem=g.gm[g.gm.length-1].v===12;Ambient.evI=0;o.calm=EXTRAS.wxGem(g)===1;
  /* album */
  d.seen={};d.album={};Object.keys(ENEMIES).slice(0,12).forEach(k=>d.seen[k]=1);const z0=d.zenny;o.c10=EXTRAS.albumClaim(A,0)&&d.zenny===z0+500;o.c25=!EXTRAS.albumClaim(A,1);o.twice=!EXTRAS.albumClaim(A,0);
  A.ui.show('main');A.ui.push('glossary',{tab:'enemies'});o.btns=document.querySelectorAll('.album button').length===3;
  return o;});
ok(r.rain&&r.notKi&&r.tag,'rain: electric attacks +10% (only those), with a HUD line');
ok(r.gem&&r.calm,'sandstorm: gems +20%');
ok(r.c10&&r.c25&&r.twice&&r.btns,'enemy album: 10 discovered pay 500 Z once, 25 not yet; buttons in the glossary');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();})();
