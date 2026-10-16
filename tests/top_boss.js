const pp=require('/opt/npm-tools/node_modules/puppeteer');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1200,height:760});const errs=[];pg.on('pageerror',e=>errs.push('PE '+e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(800);
// stage order in the data + unlock chain
const o=await pg.evaluate(()=>({order:STAGE_ORDER.map(i=>STAGES[i].no+':'+STAGES[i].id+':'+STAGES[i].theme),topBosses:STAGES[4].bosses.map(b=>b[0]).join(','),topTime:STAGES[4].time}));
console.log(JSON.stringify(o));
// unlock chain on a fresh save: only Muten (idx5) open
const u=await pg.evaluate(()=>{const ui=window.__app.ui;const sv=window.__app.save;const old=sv.d.clears.slice();sv.d.clears.fill(0);const r=STAGE_ORDER.map(i=>ui.stageOpen(i)?1:0).join('');sv.d.clears[5]=1;const r2=STAGE_ORDER.map(i=>ui.stageOpen(i)?1:0).join('');sv.d.clears.fill(0);sv.d.clears[0]=1;const r3=STAGE_ORDER.map(i=>ui.stageOpen(i)?1:0).join('');sv.d.clears=old;return[r,r2,r3];});
console.log('open fresh/after-muten/legacy-plains-only',JSON.stringify(u));
// render the stages screen
await pg.evaluate(()=>{window.__app.save.d.clears.fill(1);window.__app.ui.show('stages');});await wait(500);await pg.screenshot({path:'/tmp/o/stages_order.png'});
// boss chain
const r=await pg.evaluate(async()=>{
  window.__app.startGame({stage:4,char:'goku',diff:'normal',x2:false,sandbox:true,pet:'dende'});const g=window.__app.game;g.sb.god=true;g.sb.nospawn=true;
  g.spawnBoss('jiren',true);const e=g.en.find(x=>x.boss);const seen=[e.bd.n.en||e.bd.n];
  for(const ratio of[.65,.38,.15,.05]){e.hp=e.max*ratio;for(let k=0;k<30;k++)g.update(1/30);e.xf=null;e.stun=0;const n=e.bd.n.en||e.bd.n;if(seen[seen.length-1]!==n)seen.push(n);}
  return{forms:seen,hp:Math.round(e.max),dmg:Math.round(e.dmg),spd:Math.round(e.spd)};});
console.log(JSON.stringify(r));
console.log(errs.join('\n')||'noerr');await b.close();})();
