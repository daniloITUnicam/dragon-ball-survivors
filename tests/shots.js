/* screenshots of the main screens (visual check of the UI skin): node tests/shots.js [prefix] */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const pre=process.argv[2]||'/tmp/sh_';
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:640}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1800);
const shot=async n=>{await wait(500);await pg.screenshot({path:pre+n+'.png'});};
await shot('main');
await pg.evaluate(()=>{const d=__app.save.d;d.zenny=1234;d.tickets={t1:3,t10:1,l10:1};d.wu={ki:1,kame:1,disc:1,aura:1};__app.ui.show('chars');});await shot('chars');
await pg.evaluate(()=>{__app.ui.show('shop');});await shot('shop');
await pg.evaluate(()=>{__app.ui.show('stages');});await shot('stages');
await pg.evaluate(()=>{__app.ui.show('settings');});await shot('settings');
await pg.evaluate(()=>{__app.ui.show('ach');});await shot('ach');
await pg.evaluate(()=>{__app.ui.show('gacha');});await shot('gacha');
await pg.evaluate(()=>{const A=__app;A.startGame({stage:5,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;g.sb.nospawn=true;g.sb.god=true;g.modal=null;window.G=g;g.t=300;g.kills=240;g.dmgBy={kame:123456,ki:45000,disc:9800,other:3300};g.run.tk={t1:2,t10:1,l10:0};g.run.tsold=3;g.finish(true);});
await shot('end');
await pg.evaluate(()=>{const A=__app;A.startGame({stage:5,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;g.sb.nospawn=true;g.sb.god=true;window.G=g;g.update(.1);g.lvl=3;g.modal={type:'level',options:g.levelOptions()};});
await shot('level');
console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
