/* screenshots of a Super Dragon Ball lair: the statue (sheet tamasN) and the awakened Tamagami (sheet tamaN) */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:760}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(2000);
const ST=+(process.env.STAGE||4);await pg.evaluate(st=>{window.__ST=st;},ST);
const NOPACK=!!process.env.NOPACK;
const info=await pg.evaluate(np=>{if(np)for(const k of Object.keys(Sprites.sheets))if(/^tama/.test(k))delete Sprites.sheets[k];const A=__app,d=A.save.d;d.settings.sandbox=false;A.startGame({stage:+(window.__ST||4),char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;window.G=g;g.sb.nospawn=true;g.sb.god=true;g.en=[];
  g.save.sball=[];g.spawnLoot('sball',g.p.x+420,g.p.y);const l=g.loot[g.loot.length-1];window.L=l;
  return{sheets:Object.keys(Sprites.sheets).filter(k=>/tama/.test(k)),star:l.star,tama:l.tama,woke:l.woke};},NOPACK);
console.log(JSON.stringify(info));
await wait(1200);await pg.screenshot({path:'/tmp/o/tama_statue_s'+ST+(NOPACK?'_np':'')+'.png'});
await pg.evaluate(()=>{const g=G,l=L;g.p.x=l.x-230;g.p.y=l.y;});await wait(1800);
await pg.screenshot({path:'/tmp/o/tama_awake_s'+ST+(NOPACK?'_np':'')+'.png'});
console.log(JSON.stringify(await pg.evaluate(()=>{const g=G,e=g.en.find(x=>x.boss);return{woke:L.woke,boss:e&&e.bd.id,esid:e&&e.esid};})),errs.join('|'));
await b.close();})();
