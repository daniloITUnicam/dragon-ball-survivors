/* every enemy with skills: spawn near the player, run 25 s, count skill starts, make sure nothing throws */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:640}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const r=await pg.evaluate(()=>{
 __app.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.god=true;window.G=g;
 const stat={},per={};let total=0;
 const skip={};
 const ids=Object.keys(ENEMIES).filter(id=>ENEMIES[id].sk);
 const orig={};for(const k in SKD){const f=SKD[k].start;orig[k]=f;SKD[k].start=function(...a){stat[k]=(stat[k]||0)+1;if(window.__cur)per[window.__cur+':'+k]=(per[window.__cur+':'+k]||0)+1;return f.apply(this,a);};}
 const bad=[];
 for(const id of ids){
  window.__cur=id;g.en=[];g.eb=[];g.bz=[];g.jbeams=[];g.p.x=0;g.p.y=0;g.t=300;
  const es=[];for(let i=0;i<3;i++){const e=g.mkEnemy(ENEMIES[id],140+i*20,(i-1)*40);e.age=100;es.push(e);g.en.push(e);}
  // force the rage trigger too
  es[0].hp=es[0].max*.4;
  for(let f=0;f<60*22;f++){if(g.modal){g.modal=null;}g.update(1/60);g.p.hp=g.p.maxHp;g.p.x=0;g.p.y=0;
    for(const e of es)if(!e.dead&&Math.hypot(e.x,e.y)>480){e.x=200;e.y=0;}}
  const a=es.filter(e=>!e.dead);
  const used=new Set();
  total++;
  if(es.some(e=>!isFinite(e.x)||!isFinite(e.y)||!isFinite(e.hp)))bad.push(id+' NaN');
 }
 const hi=Object.entries(per).filter(x=>x[1]>14);return {n:ids.length,stat,bad,hi};});
console.log(JSON.stringify(r));console.log(errs.length?errs.slice(0,4):'no errors');await b.close();process.exit(errs.length||r.bad.length?1:0);})();
