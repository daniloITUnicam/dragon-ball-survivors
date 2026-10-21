/* in-game shots of the Namek / Inferno rocks: node tests/shot_rocks.js <theme> [prefix] [w h] — two views near the start (a few seconds apart, to see the animation) */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const th=process.argv[2]||'namek',pre=process.argv[3]||'/tmp/rocks_'+th,W=+process.argv[4]||1100,H=+process.argv[5]||620;
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:W,height:H,deviceScaleFactor:1}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1800);
const info=await pg.evaluate((th)=>{const idx=STAGES.findIndex(s=>s.theme===th);window.__MAPSEED=0;__app.startGame({stage:idx,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.god=true;window.G=g;g.en=[];
 /* put the camera where there are the most rocks */
 let best=null,bn=-1;for(let x=-1500;x<=1500;x+=250)for(let y=-1500;y<=1500;y+=250){let n=0;for(const o of World.visible(th,x-300,y-200,x+300,y+200))if(o.v!==undefined)n++;if(n>bn){bn=n;best=[x,y];}}
 g.p.x=best[0];g.p.y=best[1];return{best,bn};},th);
console.log(JSON.stringify(info));
for(let s=0;s<3;s++){await pg.evaluate(()=>{const g=window.G;g.en=[];for(let i=0;i<30;i++){g.en=[];g.update(1/60);}});await wait(200);await pg.screenshot({path:pre+'_'+s+'.png'});}
console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
