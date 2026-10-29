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
  A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false});let g=A.game;await w8(300);o.token=!!g.runId;g.kills=321;g.t=245;g.dmgBy={kame:12345};
  const res=A.progress.finishRun(g,false,{});A.onEnd(res,g);await w8(400);o.row=Online.row(g,res);
  A.ui.show('main');A.bsel=null;A.ui.bsel={tab:'stage',stage:0,diff:'normal',metric:'kills'};A.ui.push('boards',{});await w8(400);
  o.list=document.querySelector('.blist')?.textContent||'';o.me=!!document.querySelector('.brow.me');
  /* the weekly run is posted with its week, and only shows on the weekly board */
  A.startGame({stage:w1.stage,char:w1.char,diff:w1.diff,x2:false,sandbox:false,week:Online.weekId(),seed:Online.weekly().seed});g=A.game;await w8(300);g.kills=50;g.t=60;o.wPacts=g.pacts.length===0;
  await w8(21000*0);const r2=A.progress.finishRun(g,false,{});o.wrow=Online.row(g,r2);
  /* share card */
  const c=Online.card(g,r2,x=>A.ui.tr(x));o.card=c.width===1200&&c.height===630;
  /* v118: no token or developer tools open = not posted */
  {const g2=new Game({stage:0,char:'goku',diff:'normal',x2:false},g.env);o.noTok=Online.row(g2,{win:false})===null;g2.runId='x';o.tok=!!Online.row(g2,{win:false});GUARD.tainted=true;o.taint=Online.row(g2,{win:false})===null;GUARD.tainted=false;}
  /* Test mode runs never go on a board */
  const gs=new Game({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true},g.env);o.sbRow=Online.row(gs,{sandbox:true});
  return o;});
/* v116: community events, the weekly ghost, overtaken */
mock.profiles.set('u-rival','Vegeta_IV');
const r2=await pg.evaluate(async()=>{const A=__app,cl=A.cloud,o={},w8=ms=>new Promise(r=>setTimeout(r,ms));
  const evs=COMMUNITY.events();o.three=evs.length===3&&new Set(evs.map(e=>e.kind)).size===3;
  const W=Online.weekly();A.startGame({stage:W.stage,char:W.char,diff:W.diff,x2:false,sandbox:false,week:W.id,seed:W.seed});let g=A.game;g.sb.god=true;await w8(300);
  for(let i=0;i<60*5;i++)g.update(1/60);g.kills=120;g.run.bossKills=3;g.t=90;o.trail=g.gtrail&&g.gtrail.p.length>=8;
  const res=A.progress.finishRun(g,false,{});A.onEnd(res,g);await w8(500);
  const tot=await cl.community();o.comm=evs.some(e=>(tot[e.key]||0)>0)||Object.keys(tot).length>0;o.tot=JSON.stringify(tot);
  A.startGame({stage:W.stage,char:W.char,diff:W.diff,x2:false,sandbox:false,week:W.id,seed:W.seed});await w8(400);g=A.game;o.ghost=!!(g.ghost&&g.ghost.path&&g.ghost.nick==='Kakarot_99');A.renderer.draw(g,1/60);
  A.toMenu();A.ui.bsel={tab:'comm',stage:0,diff:'normal',metric:'t'};A.ui.push('boards',{});await w8(400);o.list=document.querySelectorAll('.crow').length;
  try{localStorage.setItem('dbs-ovt-'+cl.uid,new Date(Date.now()-60000).toISOString());}catch(e){}cl._ovt=0;
  window.__ovt=null;return o;});
mock.scores.push({user_id:'u-rival',stage:0,diff:'normal',ch:'vegeta',t:999,kills:999,dmg:1,lvl:9,win:true,pacts:0,week:null,created_at:Date.now()+5000});
const r3=await pg.evaluate(async()=>{const A=__app,cl=A.cloud,w8=ms=>new Promise(r=>setTimeout(r,ms));const L=await cl.checkOvertaken();
  A.save.d.wk={kame:1000};await cl.setTitle('w:kame:0');A.ui.show('main');A.ui.bsel={tab:'stage',stage:0,diff:'normal',metric:'kills'};A.ui.push('boards',{});await w8(400);
  return{n:L.length,nick:L[0]&&L[0].nick,title:(document.querySelector('.brow.me .btitle')||{}).textContent||''};});
ok(/Kamehameha/.test(r3.title),'the chosen title shows next to the nickname on the boards: '+r3.title);
ok(r2.three,'3 community events this week, one of each kind');
ok(r2.trail&&r2.comm,'a run adds to the community totals '+r2.tot);
ok(r2.ghost,'the weekly leader comes back as a ghost on the next try');
ok(r2.list===3,'the Community tab lists the 3 events');
ok(r3.n===1&&r3.nick==='Vegeta_IV','"overtaken": a rival who passes your best is announced');
ok(r.wk&&r.same,'weekly challenge: same stage/character/difficulty/seed for a week, same map layout on every try');
ok(r.anon,'the boards open without an account and ask to sign in');
ok(r.uid&&r.bad==='bad'&&r.set===''&&r.nick==='Kakarot_99','nickname: a bad one is refused, a good one saved');
ok(r.token,'a ranked run gets a run token from the server when it starts');
ok(r.row&&r.row.kills===321&&r.row.dmg===12345&&mock.scores.some(x=>x.ch==='goku'&&x.kills===321),'a finished run is posted (time, kills, damage, build)');
ok(/Kakarot_99/.test(r.list)&&/321/.test(r.list)&&r.me,'the stage board lists it, marked as mine: '+r.list.slice(0,60));
ok(r.wPacts&&r.wrow&&/^\d{4}-W\d\d$/.test(r.wrow.week),'weekly runs carry their week and no pacts');
ok(r.card,'share card 1200×630');
ok(r.noTok&&r.tok&&r.taint,'without a run token, or with developer tools opened, nothing is posted');
ok(r.sbRow===null,'Test mode runs are not posted');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();mock.close();})();
