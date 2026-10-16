const pp=require('/opt/npm-tools/node_modules/puppeteer');
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await new Promise(r=>setTimeout(r,1500));
for(let i=0;i<10;i++){
 const r=await pg.evaluate((i)=>{__app.startGame({stage:i,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.god=true;
  g.t=400;let n=0;for(const [id] of g.stage.roster){for(let k=0;k<2;k++){const e=g.mkEnemy(ENEMIES[id],g.p.x+150+k*40,g.p.y+(n%7-3)*40);g.en.push(e);}n++;}
  for(let f=0;f<900;f++)g.update(1/60);return g.stage.n.en+' alive '+g.en.length;},i);
 console.log(i,r);}
console.log(errs.length?errs.slice(0,3):'no errors');await b.close();process.exit(errs.length?1:0);})();
