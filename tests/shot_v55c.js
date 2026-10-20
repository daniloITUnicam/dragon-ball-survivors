/* screenshots of the boss signature moves: Dodoria's body hurl, Dr. Gero's hold, Super Buu's rain:  node tests/shot_v55c.js [prefix] */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const pre=process.argv[2]||'/tmp/v55c_';
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:760,deviceScaleFactor:1}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const start=(id,dx)=>pg.evaluate((id,dx)=>{window.__MAPSEED=0;__app.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.nospawn=true;window.G=g;g.modal=null;g.en=[];g.eb=[];g.bossAlive=0;g.spawnBoss(id,false,{x:g.p.x+dx,y:g.p.y,k:1});const e=g.en[0];e.sh=99;e.sgT=.01;e.hp=e.max=1e7;g.sb.god=false;g.p.hp=g.p.maxHp=100000;return e.bd.sig;},id,dx);
const shot=async(nm,cl)=>{await pg.evaluate(()=>{const g=G;if(!g.__u)g.__u=g.update.bind(g);g.update=()=>{};});await wait(250);await pg.screenshot({path:pre+nm+'.png',clip:cl});await pg.evaluate(()=>{const g=G;g.update=g.__u;});};
const step=(t)=>pg.evaluate((t)=>{const g=G;let x=0;while(x<t){g.update(.016);x+=.016;}},t);
const cl={x:240,y:100,width:800,height:560};
console.log(await start('dodoria',300));
await step(.1);await shot('dodo_warn1',cl);await step(1.5);await shot('dodo_warn2',cl);await step(1.1);await pg.evaluate(()=>{G.p.x-=0;});await shot('dodo_locked',cl);
await step(.55);await shot('dodo_rush',cl);await step(.5);await shot('dodo_after',cl);
console.log(await start('gero',250));
await step(.1);await shot('gero_warn',cl);await step(1.25);await shot('gero_lunge',cl);await step(.4);await shot('gero_hold',cl);await step(1.2);await shot('gero_hold2',cl);
console.log(await start('superbu',200));
await step(.5);await shot('buu_charge',cl);await step(1.5);await shot('buu_fire',cl);await step(3);await shot('buu_rain',cl);await step(.7);await shot('buu_rain2',cl);
console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
