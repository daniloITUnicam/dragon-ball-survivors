/* screenshots of the new bosses (androids, Kaioshin, Champa, Zeno-sama) lined up, plus a few moves:  node tests/shot_v55d.js [prefix] */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const pre=process.argv[2]||'/tmp/v55d_';
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:760,deviceScaleFactor:1}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const line=(ids,stage)=>pg.evaluate((ids,stage)=>{window.__MAPSEED=0;__app.startGame({stage,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.nospawn=true;window.G=g;g.modal=null;g.en=[];g.eb=[];g.bossAlive=0;
  ids.forEach((id,i)=>{g.spawnBoss(id,false,{x:g.p.x+(i-(ids.length-1)/2)*130,y:g.p.y-70+(i%2)*60,k:1});});for(const e of g.en){e.sh=999;e.sgT=999;e.stun=999;e.hp=e.max;}g.p.hp=g.p.maxHp=1e6;return g.en.length;},ids,stage);
const shot=async(nm,cl)=>{await pg.evaluate(()=>{const g=G;if(!g.__u)g.__u=g.update.bind(g);g.update=()=>{};});await wait(250);await pg.screenshot({path:pre+nm+'.png',clip:cl});await pg.evaluate(()=>{const g=G;g.update=g.__u;});};
const step=(t)=>pg.evaluate((t)=>{const g=G;let x=0;while(x<t){g.update(.016);x+=.016;}},t);
const cl={x:60,y:40,width:1160,height:420};
console.log(await line(['c13','c13s','c14','c15','c16','c17','c18'],2));await step(.2);await shot('androids1',cl);
console.log(await line(['c19','c21','c21m','shin','daikai','champa','zeno'],8));await step(.2);await shot('androids2',cl);
// moves
const mv=async(id,pat,nm,t1,stage)=>{await pg.evaluate((id,pat,stage)=>{window.__MAPSEED=0;__app.startGame({stage,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.nospawn=true;window.G=g;g.modal=null;g.en=[];g.eb=[];g.bossAlive=0;g.spawnBoss(id,false,{x:g.p.x+300,y:g.p.y-20,k:1});const e=g.en[0];e.sh=999;e.bd=Object.assign({},BOSSES[id],{pats:[pat],rnd:false,ext:[pat],sig:null});g.p.hp=g.p.maxHp=1e6;g.bossAttack(e);},id,pat,stage);await step(t1);await shot(nm,{x:240,y:100,width:800,height:560});};
await mv('c15','barrier','mv_barrier',.3,2);
await mv('c16','selfd','mv_selfd',1.2,2);
await mv('c16','hflash','mv_hflash',1.5,2);
await mv('champa','sdh','mv_sdh',.7,8);
await mv('zeno','erase','mv_erase',.9,8);
await mv('c13','dbomber','mv_dbomber',.6,2);
console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
