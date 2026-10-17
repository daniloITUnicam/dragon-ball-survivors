/* a row of every pickup, for a visual check: node tests/shot_loot.js [out] */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const out=process.argv[2]||'/tmp/loot.png';
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:760,height:420,deviceScaleFactor:3}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
await pg.evaluate(()=>{__app.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.god=true;window.G=g;g.en=[];
 const ks=['coin','bag','heal','magnet','dmg','haste','xp','capsule','luck'];g.loot=[];
 ks.forEach((k,i)=>{g.loot.push({k,x:g.p.x-170+i*42,y:g.p.y-70,v:k==='bag'?400:0,t:2+i*.37,star:0});});
 for(let i=0;i<90;i++){g.en=[];g.update(1/60);}});
await pg.screenshot({path:out,clip:{x:230,y:90,width:300,height:130}});
console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
