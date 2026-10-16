/* Imported Goku sheets: forms, power-up pose while transforming, dash pose + streak. Build first:
   DBS_SPRITES=<dir with the generated sheets> DBS_OUT=/tmp/o/pack.html python3 build.py ; then node tests/sprites_goku.js */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=process.env.SHOTS||'/tmp/o';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const pg=await b.newPage();await pg.setViewport({width:900,height:600});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+(process.env.HTML||'/tmp/o/pack.html'));await wait(1500);
  const ev=(f,...a)=>pg.evaluate(f,...a);
  ok((await ev(()=>Object.keys(Sprites.sheets))).length>=9,'goku sheets decoded');
  ok(await ev(()=>Sprites.sheetHas('goku:1',7)&&Sprites.sheetHas('goku:1',8)&&Sprites.sheetHas('goku:1',9)),'SSJ sheet has power/dash/streak frames');
  ok(await ev(()=>!Sprites.sheetHas('goku:0',7)),'kaioken sheet has no power frame (falls back)');
  await ev(()=>{window.__app.startGame({stage:5,char:'goku',diff:'normal',x2:false,sandbox:true});const g=window.__app.game;g.sb.god=true;});
  await wait(1200);
  const clip=async(n)=>{const c=await ev(()=>{const g=window.__app.game,r=window.__app.renderer||{};return{x:innerWidth/2,y:innerHeight/2}});await pg.screenshot({path:OUT+'/gk_'+n+'.png',clip:{x:c.x-170,y:c.y-190,width:340,height:260}});};
  await clip('base');
  for(let f=0;f<8;f++){
    await ev(f=>{const g=window.__app.game;g.formsUnlocked=f+1;g.formIdx=f;g.recalc&&g.recalc();},f);
    await wait(400);await clip('f'+f);console.log(f,await ev(()=>{const g=window.__app.game;return g.pcKey+' '+Sprites.sheetFor(g.pcKey)+' '+g.formIdx;}));
  }
  // transformation charge into Super Saiyan, then Blue (the big burst frame)
  for(const [fi,nm] of [[2,'ssj'],[6,'blue']]){
    await ev(()=>{window.__app.startGame({stage:5,char:'goku',diff:'normal',x2:false,sandbox:true});const g=window.__app.game;g.sb.god=true;});await wait(900);
    await ev(fi=>{const g=window.__app.game;g.formsUnlocked=fi;g.formIdx=fi-1;g.recalc();},fi);await wait(300);
    await ev(()=>{window.__app.game.unlockForm();});await wait(900);await clip(nm+'_x1');
    ok(await ev(()=>window.__app.game.xform&&!window.__app.game.xform.released),nm+': charging');
    await wait(1100);await clip(nm+'_x2');await wait(2500);await clip(nm+'_x3');
  }
  // dash
  await ev(()=>{window.__app.startGame({stage:5,char:'goku',diff:'normal',x2:false,sandbox:true});const g=window.__app.game;g.sb.god=true;g.formsUnlocked=2;g.formIdx=1;g.recalc();});await wait(900);
  await ev(()=>{const g=window.__app.game;g.dashT=.26;g.bv={x:1050,y:0,t:.2};g.p.face=1;});await wait(40);await clip('dash');
  ok(errs.length===0,'no JS errors '+errs.join('|'));
  await b.close();console.log(fails?'FAILED':'ALL OK');process.exit(fails?1:0);
})().catch(e=>{console.log('ERR',e);process.exit(2)});
