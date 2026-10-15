/* Sprite-sheet import: build with DBS_SPRITES=<dir with goku.png + goku_0.png> DBS_OUT=/tmp/o/sheetpack.html, then run this. */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=process.env.SHOTS||'/tmp/o';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+(process.env.HTML||'/tmp/o/sheetpack.html'));await wait(1200);
  const ev=f=>pg.evaluate(f);
  ok((await ev(()=>Object.keys(Sprites.sheets))).sort().join()==='goku,goku_0','both sheets decoded');
  ok(await ev(()=>Sprites.sheetFor('goku:-1'))==='goku','base form -> goku.png');
  ok(await ev(()=>Sprites.sheetFor('goku:0'))==='goku_0','form 0 -> goku_0.png');
  ok(await ev(()=>Sprites.sheetFor('goku:3'))==='goku_0','form 3 falls back to the highest lower sheet');
  ok(await ev(()=>Sprites.sheetFor('menu:goku:1'))==='goku_0'&&await ev(()=>Sprites.sheetFor('bg:goku:-1'))==='goku','menu/background keys resolve too');
  ok(await ev(()=>Sprites.sheetFor('vegeta:-1'))===null,'a character without a sheet keeps procedural art');
  const info=await ev(()=>{const s=Sprites.player('goku:-1',CHARS.find(c=>c.id==='goku').cfg,1,false,null);const v=Sprites.player('vegeta:-1',CHARS.find(c=>c.id==='vegeta').cfg,1,false,null);return{sheet:s.sheet,px:s.px,w:s.c.width,h:s.c.height,vs:v.s,vpx:!!v.px,vw:v.c.width};});
  ok(info.sheet==='goku'&&info.px&&info.w===64&&info.h===96,'player frame comes from the sheet: '+JSON.stringify(info));
  ok(info.vs===6&&!info.vpx,'other characters use the HD procedural painter (6 px per unit)');
  await ev(()=>{window.__app.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true});const g=window.__app.game;g.sb.god=true;});
  await wait(900);await pg.screenshot({path:OUT+'/sp_game.png'});
  await ev(()=>{const g=window.__app.game;g.formsUnlocked=1;});
  await ev(()=>{window.__app.game.p.mv=true;});await wait(500);
  await ev(()=>{const a=window.__app;a.startGame({stage:0,char:'vegeta',diff:'normal',x2:false,sandbox:true});});await wait(900);
  await pg.screenshot({path:OUT+'/sp_game_proc.png'});
  ok(errs.length===0,'no JS errors '+errs.join('|'));
  await b.close();console.log(fails?'FAILED':'ALL OK');process.exit(fails?1:0);
})().catch(e=>{console.log('ERR',e);process.exit(2)});
