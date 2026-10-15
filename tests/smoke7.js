const pp=require('/opt/npm-tools/node_modules/puppeteer');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1200,height:760});const errs=[];pg.on('pageerror',e=>errs.push('PE '+e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(800);
await pg.evaluate(()=>{window.__app.startGame({stage:0,char:'broly',diff:'normal',x2:false,sandbox:true});});await wait(2500);
await pg.evaluate(()=>{const g=window.__app.game;g.sb.god=true;g.startBerserk();});await wait(500);await pg.screenshot({path:'/tmp/o/bers1.png'});
await wait(2500);await pg.screenshot({path:'/tmp/o/bers2.png'});
// inverted input check
const inv=await pg.evaluate(async()=>{const a=window.__app,g=a.game;const x0=g.p.x;a.input.keys&&0;return g.bers.toFixed(1);});console.log('bers left',inv);
// Kaioken aura on goku
await pg.evaluate(()=>{window.__app.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true});});await wait(500);
await pg.evaluate(()=>{const g=window.__app.game;g.sb.god=true;g.setLevel(14);});await wait(4500);
await pg.evaluate(()=>{const g=window.__app.game;g.p.hp=g.p.maxHp;g.toggleKaioken();g.toggleKaioken();});await wait(700);await pg.screenshot({path:'/tmp/o/kai2.png'});
console.log(errs.filter(e=>!/ERR_TUNNEL|font/i.test(e)).join('\n')||'noerr');await b.close();})();
