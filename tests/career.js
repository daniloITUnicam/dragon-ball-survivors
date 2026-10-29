/* v117: career stats, titles, build codes */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const r=await pg.evaluate(()=>{const A=__app,d=A.save.d,o={};A.loop=()=>{};d.settings.hints=false;d.settings.sandbox=false;
  A.startGame({stage:1,char:'vegeta',diff:'hard',x2:false,sandbox:false,pacts:['iron']});const g=A.game;g.sb.god=true;g.sb.nospawn=true;g.addWeapon('ki');g.weapons.get('ki').lv=4;
  g.addTrinket(TRINKETS[0].id,3);g.bkills={freezer:2};g.kills=500;g.t=120;
  const code=BUILD.encode(g),B=BUILD.decode(code);o.code=/^DBS1-/.test(code)&&B.c==='vegeta'&&B.s===1&&B.d==='hard'&&B.p[0]==='iron'&&B.w.some(w=>w[0]==='ki'&&w[1]===4)&&B.t.length===1;
  o.bad=BUILD.decode('DBS1-garbage!!')===null&&BUILD.decode('hello')===null;
  A.progress.finishRun(g,true,{});o.bk=d.bk.freezer>=2&&d.sk[1]>=500;
  A.ui.show('main');A.ui.push('career');o.screen=/Frieza|Freezer/.test(document.querySelector('.career').textContent);
  d.wk={kame:10000};const L=TITLES.list(d);o.titles=L.includes('w:kame:1')&&A.ui.tr(TITLES.text('w:kame:1')).length>3;
  A.ui.push('buildView',{code});o.view=document.querySelectorAll('.bview .chip').length>=2;
  return o;});
ok(r.code&&r.bad,'a build code carries character, stage, difficulty, pacts, weapons and trinkets; garbage is refused');
ok(r.bk&&r.screen,'career: bosses by id and kills by stage are kept and shown');
ok(r.titles,'titles come from the weapon diary (and Mastery 10)');
ok(r.view,'pasting a code shows the build');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();})();
