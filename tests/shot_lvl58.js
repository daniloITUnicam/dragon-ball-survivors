const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:760}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1500);
await pg.evaluate(()=>{const A=__app,d=A.save.d;d.settings.sandbox=false;A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;window.G=g;g.sb.nospawn=true;g.sb.god=true;
  g.pass={might:2,vit:1,speed:3,armor:1,growth:2};g.recalc();
  g.options=null;g.levelOptions=()=>[{type:'p',id:'might',lv:2},{type:'p',id:'vit',lv:1},{type:'p',id:'speed',lv:3}];g.xp=g.need+1;g.levelUp();});
await wait(700);
console.log(await pg.evaluate(()=>{const A=__app;return A.state+' '+(A.ui.top&&A.ui.top.name)+' cards:'+document.querySelectorAll('.card.opt').length+' imgs:'+document.querySelectorAll('.card.opt .gimg img').length;}));
await pg.screenshot({path:'/tmp/o/lvl58.png'});
await pg.evaluate(()=>{const A=__app;A.game.modal=null;A.ui.clear&&A.ui.clear();A.pause();});await wait(600);
await pg.screenshot({path:'/tmp/o/pause58.png'});console.log(errs.join('|')||'no errors');await b.close();})();
