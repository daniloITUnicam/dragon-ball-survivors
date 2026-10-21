const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:760}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1500);
await pg.evaluate(()=>{const A=__app;A.save.d.settings.dmgNum=true;A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;window.G=g;g.sb.god=true;g.showNums=true;});
await wait(2500);
await pg.evaluate(()=>{const g=G,p=g.p;const spots=[[-120,-60,'137',0],[40,-90,'2540',6],[150,-20,'18',0],[-60,40,'12450',6],[110,70,'96',0],[-170,10,'4821',0],[10,-30,'330',6],[-110,-120,'61',0]];
 for(const [dx,dy,s,c] of spots)g.floatText(p.x+dx,p.y+dy,s,c);window.__keep=setInterval(()=>{for(const d of g.tx)if(d.t>.3)d.t=.3;},50);});
await wait(500);
await pg.screenshot({path:'/tmp/o/dmg59.png',clip:{x:340,y:180,width:600,height:400}});
console.log(errs.join('|')||'no errors');await b.close();})();
