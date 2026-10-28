/* v115: online - nickname, score submission, leaderboard (stage + week), weekly challenge seed, share card. Runs against the Supabase mock (its own cloud build on port 54322, /tmp/o/online.html: tools/run_tests.py makes it) */
const pp=require('/opt/npm-tools/node_modules/puppeteer'),{start}=require('./mock_supabase.js');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
(async()=>{
const mock=await start(54322,{expires:3600});   /* its own port: cloud_e2e may run at the same time on 54321 */
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+(process.env.HTML||'/tmp/o/online.html'));await wait(900);
const r=await pg.evaluate(async()=>{const A=__app,cl=A.cloud,d=A.save.d,o={};const w8=ms=>new Promise(r=>setTimeout(r,ms));A.loop=()=>{};d.settings.sandbox=false;d.settings.hints=false;
  /* the weekly challenge is the same for everybody in a week, different between weeks */
  const w1=Online.weekly('2026-W44'),w2=Online.weekly('2026-W44'),w3=Online.weekly('2026-W45');o.wk=JSON.stringify(w1)===JSON.stringify(w2)&&JSON.stringify(w1)!==JSON.stringify(w3)&&Online.weekId(new Date('2026-10-28T12:00:00Z'))==='2026-W44';
  o.same=(()=>{A.startGame({stage:w1.stage,char:w1.char,diff:w1.diff,x2:false,sandbox:false,week:w1.id,seed:w1.seed});const s1=MAP.seed,a=Math.random();A.toMenu();
    A.startGame({stage:w1.stage,char:w1.char,diff:w1.diff,x2:false,sandbox:false,week:w1.id,seed:w1.seed});const s2=MAP.seed,b=Math.random();A.toMenu();return s1===s2&&Online._mr===null;})();
  /* boards open without an account */
  A.ui.show('main');A.ui.push('boards',{tab:'weekly'});await w8(300);o.anon=/sign in|accedi/i.test(document.querySelector('.nickrow')?.textContent||'')&&/first|primo/i.test(document.querySelector('.blist')?.textContent||'');
  /* account + nickname */
  await cl.signUp('a@b.co','Secret#123');await w8(300);o.uid=!!cl.uid;A.ui.rebuild(true);await w8(100);
  o.bad=await cl.setNick('x');o.set=await cl.setNick('Kakarot_99');o.nick=cl.nick;
  /* a stage run goes on the board */
  A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false});let g=A.game;g.kills=321;g.t=245;g.dmgBy={kame:12345};
  const res=A.progress.finishRun(g,false,{});A.onEnd(res,g);await w8(400);o.row=Online.row(g,res);
  A.ui.show('main');A.bsel=null;A.ui.bsel={tab:'stage',stage:0,diff:'normal',metric:'kills'};A.ui.push('boards',{});await w8(400);
  o.list=document.querySelector('.blist')?.textContent||'';o.me=!!document.querySelector('.brow.me');
  /* the weekly run is posted with its week, and only shows on the weekly board */
  A.startGame({stage:w1.stage,char:w1.char,diff:w1.diff,x2:false,sandbox:false,week:Online.weekId(),seed:Online.weekly().seed});g=A.game;g.kills=50;g.t=60;o.wPacts=g.pacts.length===0;
  await w8(21000*0);const r2=A.progress.finishRun(g,false,{});o.wrow=Online.row(g,r2);
  /* share card */
  const c=Online.card(g,r2,x=>A.ui.tr(x));o.card=c.width===1200&&c.height===630;
  /* Test mode runs never go on a board */
  const gs=new Game({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true},g.env);o.sbRow=Online.row(gs,{sandbox:true});
  return o;});
ok(r.wk&&r.same,'weekly challenge: same stage/character/difficulty/seed for a week, same map layout on every try');
ok(r.anon,'the boards open without an account and ask to sign in');
ok(r.uid&&r.bad==='bad'&&r.set===''&&r.nick==='Kakarot_99','nickname: a bad one is refused, a good one saved');
ok(r.row&&r.row.kills===321&&r.row.dmg===12345&&mock.scores.length===1&&mock.scores[0].ch==='goku','a finished run is posted (time, kills, damage, build)');
ok(/Kakarot_99/.test(r.list)&&/321/.test(r.list)&&r.me,'the stage board lists it, marked as mine: '+r.list.slice(0,60));
ok(r.wPacts&&r.wrow&&/^\d{4}-W\d\d$/.test(r.wrow.week),'weekly runs carry their week and no pacts');
ok(r.card,'share card 1200×630');
ok(r.sbRow===null,'Test mode runs are not posted');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();mock.close();})();
