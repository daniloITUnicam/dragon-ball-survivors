const pp=require('/opt/npm-tools/node_modules/puppeteer');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1200,height:760});const errs=[];pg.on('pageerror',e=>errs.push('PE '+e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(800);
await pg.evaluate(()=>{window.__app.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true,pet:'dende'});const g=window.__app.game;g.sb.god=true;g.sb.nospawn=true;const p=g.p;
 g.chests.push({x:p.x+900,y:p.y-100,final:false,t:0});g.chests.push({x:p.x-700,y:p.y+500,final:false,t:0});g.chests.push({x:p.x+100,y:p.y-800,final:false,t:0});});
await wait(600);await pg.screenshot({path:'/tmp/o/s13_arrows.png'});
console.log(errs.join('\n')||'noerr');await b.close();})();
