/* in-game screenshot with a crowd of every enemy type: node tests/shot_enemies.js out.png [stage] [boss] */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push('PE '+e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(800);
const st=+(process.argv[3]||0),boss=process.argv[4];
await pg.evaluate((st,boss)=>{window.__app.startGame({stage:st,char:'goku',diff:'normal',x2:false,sandbox:true,pet:'dende'});const g=window.__app.game;g.sb.god=true;g.sb.nospawn=true;
 const ids=Object.keys(ENEMIES);const p=g.p;ids.forEach((id,i)=>{const col=i%8,row=(i/8)|0;const e=g.mkEnemy(ENEMIES[id],p.x-300+col*85,p.y-190+row*85);e.spd=0;e.sp0=0;g.en.push(e);});
 if(boss){const bb=g.mkEnemy?null:null;}
},st,boss);
await wait(900);await pg.screenshot({path:process.argv[2]||'/tmp/o/shot_en.png'});
console.log(errs.join('\n')||'noerr');await b.close();})();
