/* v116: Ki Clash - a charged boss beam turns into a mash duel: win = stun + big hit, lose = a harder beam */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const r=await pg.evaluate(()=>{const A=__app,o={};A.loop=()=>{};A.save.d.settings.hints=false;
  A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true});const g=A.game;g.sb.god=true;g.sb.nospawn=true;g.t=100;
  const boss=()=>{const id=Object.keys(BOSSES)[0];g.spawnBoss(id);const e=g.en.find(x=>x.boss&&!x.dead);e.x=g.p.x+300;e.y=g.p.y;return e;};
  const fire=e=>{g.jbeams.push({x:e.x,y:e.y,a:Math.PI,t:1.2,charge:1.2,fire:.6,w:30,len:1200,col:'#ff4fa0',dmg:20,e,hcd:0});const rn=Math.random;Math.random=()=>0;g.updateBeams(1/60);Math.random=rn;};
  const e=boss();fire(e);o.started=!!g.clash;o.frozen=(()=>{const x=e.x,t=g.t;for(let i=0;i<10;i++)g.update(1/60);return g.t===t&&e.x===x;})();
  for(let i=0;i<90;i++){g.update(1/60);if(i%2===0)window.dispatchEvent(new KeyboardEvent('keydown',{key:'a'}));A.renderer.draw(g,1/60);}
o.won=g.run.clashes===1;o.hp=e.hp/e.max;o.stun=e.stun>3;for(let i=0;i<60;i++)g.update(1/60);o.over=!g.clash;
  /* no second clash before the cooldown */
  const b2={x:e.x,y:e.y,a:Math.PI,t:1.2,charge:1.2,fire:.6,w:30,len:1200,col:'#ff4fa0',dmg:20,e,hcd:0};g.jbeams=[b2];const rn=Math.random;Math.random=()=>0;g.updateBeams(1/60);Math.random=rn;o.cd=!g.clash;
  /* losing: no taps */
  g.kcNext=0;const b3={x:e.x,y:e.y,a:Math.PI,t:1.2,charge:1.2,fire:.6,w:30,len:1200,col:'#ff4fa0',dmg:20,e,hcd:0};g.jbeams=[b3];Math.random=()=>0;g.updateBeams(1/60);Math.random=rn;
  for(let i=0;i<60*6;i++)g.update(1/60);o.lost=b3.dmg===30&&!g.clash;
  return o;});
ok(r.started&&r.frozen,'a charged boss beam can start a Ki Clash; the world waits');
ok(r.won&&r.hp<.95&&r.stun&&r.over,'mashing wins it: the boss is stunned and loses '+Math.round((1-r.hp)*100)+'% HP');
ok(r.cd,'no second clash before the cooldown');
ok(r.lost,'without pressing anything it is lost and the beam lands 50% harder');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();})();
