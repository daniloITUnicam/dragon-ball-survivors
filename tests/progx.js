/* v116: weapon diary, live records, daily mutator */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const r=await pg.evaluate(()=>{const A=__app,d=A.save.d,o={};A.loop=()=>{};d.settings.hints=false;d.settings.sandbox=false;
  /* daily mutator */
  const dm=PROGX.daily('2026-10-29');o.same=JSON.stringify(dm)===JSON.stringify(PROGX.daily('2026-10-29'));const other=(dm.stage+1)%STAGES.length;
  const st=PROGX.daily();const g0=new Game({stage:st.stage,char:'goku',diff:'normal',x2:false},A.makeEnv());o.mut=!!g0.dmutN;const g1=new Game({stage:(st.stage+1)%STAGES.length,char:'goku',diff:'normal',x2:false},A.makeEnv());o.noMut=!g1.dmutN;
  A.ui.show('main');A.ui.push('stages');o.tag=document.querySelectorAll('.card.stage .dtag').length===1;
  /* diary */
  d.wk={kame:998};A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false});const g=A.game;g.sb.god=true;g.sb.nospawn=true;
  const kill=w=>{const e=g.mkEnemy(ENEMIES[Object.keys(ENEMIES)[0]],g.p.x+100,g.p.y);g.en.push(e);g.curW=w;g.killEnemy(e);g.curW=null;};
  kill('kame');kill('kame');o.tier=PROGX.wkTier(PROGX.wkAll(g,'kame'))&&PROGX.wkTier(PROGX.wkAll(g,'kame')).n===1000;o.say=[g.banner].concat(g.bq||[]).some(x=>x&&/Kamehameha/.test(x.txt));
  A.renderer.draw(g,1/60);
  /* live records */
  d.best={'0':{kills:5,t:10,diff:'normal'}};PROGX.initRec(g);g.kills=6;PROGX.tickRec(g);o.rec=[g.banner].concat(g.bq||[]).some(x=>x&&/record/i.test(x.txt));
  g.kills=10;A.progress.finishRun(g,false,{});o.commit=d.wk.kame===1000;
  return o;});
ok(r.same&&r.mut&&r.noMut&&r.tag,'daily mutator: one stage a day, applied to that stage only, tagged on the stage screen');
ok(r.tier&&r.say&&r.commit,'weapon diary: the 1,000th kill with a weapon gives it the first tier; kills are saved');
ok(r.rec,'beating a personal record mid-run is announced');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();})();
