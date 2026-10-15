const pp=require('/opt/npm-tools/node_modules/puppeteer');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1200,height:760});const errs=[];pg.on('pageerror',e=>errs.push('PE '+e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(800);
await pg.evaluate(()=>{window.__app.startGame({stage:0,char:'bu',diff:'normal',x2:false,sandbox:true});});await wait(600);
async function shot(name,lv,evo,wt){
 await pg.evaluate((lv,evo)=>{const g=window.__app.game;g.sb.god=true;g.sb.nospawn=true;const w=g.weapons.get('spirit');w.lv=lv;w.evo=evo;w.bombs=[];w.burns=[];w.cd=0;for(const k of g.weapons.keys())if(k!=='spirit')g.weapons.get(k).cd=999;
  g.p.x=0;g.p.y=0;
  g.en.length=0;for(let i=0;i<14;i++){const e=g.spawnEnemy?g.spawnEnemy('sol'):null;}
 },lv,evo);
 await wait(wt);await pg.screenshot({path:'/tmp/o/sb_'+name+'.png'});
}
await shot('lv1_fall',1,false,900);
await shot('lv5_fall',5,false,900);
await shot('evo1_fall',5,1,1100);
await wait(500);await pg.screenshot({path:'/tmp/o/sb_evo1_hit.png'});
await wait(1500);await pg.screenshot({path:'/tmp/o/sb_evo1_burn.png'});
await shot('evo2_fall',5,2,1150);
await wait(450);await pg.screenshot({path:'/tmp/o/sb_evo2_hit.png'});
console.log(errs.filter(e=>!/ERR_TUNNEL/.test(e)).join('\n')||'noerr');await b.close();})();
