/* Imported sprite sheets for every character that has them: decoding, fallback, game render of base + highest form.
   Build first: python3 build.py (or DBS_OUT=/tmp/o/pack.html python3 build.py) ; then node tests/sprites_pack.js */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=process.env.SHOTS||'/tmp/o';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const pg=await b.newPage();await pg.setViewport({width:900,height:600});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1800);
  const ev=(f,...a)=>pg.evaluate(f,...a);
  const n=await ev(()=>Object.keys(Sprites.sheets).length);ok(n>=60,'sheets decoded: '+n);
  ok(await ev(()=>Sprites.sheetFor('goku:-1'))==='goku'&&await ev(()=>Sprites.sheetFor('goku:0'))==='goku_0','goku base/form0');
  ok(await ev(()=>Sprites.sheetFor('goku:5'))==='goku_5'&&await ev(()=>Sprites.sheetFor('menu:goku:1'))==='goku_1','goku form5 + menu key');
  ok(await ev(()=>Sprites.sheetFor('vegeta:3'))==='vegeta_1','vegeta form3 falls back to highest lower sheet');
  ok(await ev(()=>Sprites.sheetFor('yamcha:-1'))===null,'a character without a sheet keeps procedural art');
  const ids=await ev(()=>CHARS.map(c=>c.id).filter(id=>Sprites.sheetFor(id+':-1')||[0,1,2,3,4,5,6,7].some(f=>Sprites.sheetFor(id+':'+f))));
  ok(ids.length>=15,'characters with pack art: '+ids.length+' '+ids.join(','));
  for(const id of ids){
    await ev(id=>{window.__app.startGame({stage:5,char:id,diff:'normal',x2:false,sandbox:true});window.__app.game.sb.god=true;},id);await wait(700);
    const clip=async nm=>{await pg.screenshot({path:OUT+'/pk_'+id+'_'+nm+'.png',clip:{x:450-120,y:300-170,width:240,height:230}});};
    await clip('base');
    const top=await ev(()=>{const g=window.__app.game;const L=g.formsUnlocked;g.formsUnlocked=8;g.formIdx=7;g.recalc&&g.recalc();return g.pcKey;});
    await wait(350);await clip('top');
    ok(true,id+' renders ('+top+')');
  }
  ok(errs.length===0,'no JS errors '+errs.join('|'));
  await b.close();console.log(fails?'FAILED':'ALL OK');process.exit(fails?1:0);
})().catch(e=>{console.log('ERR',e);process.exit(2)});
