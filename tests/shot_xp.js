/* screenshots of the HUD with the artwork EXP bar at several fills / sizes: node tests/shot_xp.js [prefix] */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const pre=process.argv[2]||'/tmp/xp_';
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:720,deviceScaleFactor:1}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
await pg.evaluate(()=>{window.__MAPSEED=0;__app.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;window.G=g;g.setLevel(27);});
for(const [f,nm] of [[.04,'a'],[.35,'b'],[.85,'c'],[1,'d']]){
  await pg.evaluate(f=>{const g=window.G;g.xp=g.need*f;},f);await wait(300);
  await pg.screenshot({path:pre+nm+'.png',clip:{x:0,y:0,width:640,height:200}});
}
await pg.setViewport({width:844,height:390,deviceScaleFactor:1});await wait(400);
await pg.screenshot({path:pre+'e.png',clip:{x:0,y:0,width:844,height:200}});
await pg.setViewport({width:390,height:760,deviceScaleFactor:1});await wait(400);
await pg.screenshot({path:pre+'f.png',clip:{x:0,y:0,width:390,height:200}});
console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
