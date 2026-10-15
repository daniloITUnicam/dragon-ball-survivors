const pp=require('/opt/npm-tools/node_modules/puppeteer');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1200,height:760});const errs=[];pg.on('pageerror',e=>errs.push('PE '+e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(800);
for(const pt of ['crossbeam','encircle','vortex','wall','homing']){
  await pg.evaluate(pt=>{window.__app.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true,pet:'dende'});const g=window.__app.game;g.sb.god=true;g.sb.nospawn=true;g.spawnBoss('raditz',false);const e=g.en.find(x=>x.boss);e.max=e.hp=1e8;e.tfT=1e9;e.x=g.p.x+180;e.y=g.p.y-30;e.sh=1e9;
    e.bd=Object.assign({},e.bd,{pats:[pt]});const o=Math.random;Math.random=()=>.99;g.bossAttack(e);Math.random=o;},pt);
  await wait(pt==='wall'||pt==='homing'?700:500);await pg.screenshot({path:'/tmp/o/s11_'+pt+'.png'});
}
console.log(errs.join('\n')||'noerr');await b.close();})();
