const pp=require('/opt/npm-tools/node_modules/puppeteer');
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:900,height:520});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await new Promise(r=>setTimeout(r,800));
const list=(process.argv[2]||'0,1,2,3,4,5,6,7,8,9').split(',').map(Number);
for(const i of list){
 await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await new Promise(r=>setTimeout(r,600));
 await pg.evaluate(i=>{const a=window.__app;a.save.d.settings.sandbox=true;a.startGame({stage:i,char:'goku',diff:'easy',x2:false,sandbox:true});const g=a.game;g.p.x=(window.__px||1500);g.p.y=900;g.p.inv=999;},i);
 await new Promise(r=>setTimeout(r,900));
 await pg.screenshot({path:'/tmp/map'+i+'.png'});
 await pg.evaluate(()=>{window.__app.toMenu&&window.__app.toMenu();});
}
console.log(errs.join('|')||'noerr');await b.close();})();
