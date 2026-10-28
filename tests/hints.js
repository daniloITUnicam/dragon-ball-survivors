/* v115: guided first run - contextual hints shown once each, saved, off for veterans, back from Settings */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const r=await pg.evaluate(()=>{const A=__app,o={};A.loop=()=>{};A.save.d.hints={};A.save.d.settings.hints=true;
  A.startGame({stage:0,char:'goku',diff:'normal',x2:false});const g=A.game;g.sb.god=true;
  const step=n=>{for(let i=0;i<n;i++){g.update(1/60);if(g.modal)A.resolveModal(0);}};
  step(90);o.move=g.hintS&&g.hintS.cur&&g.hintS.cur.id==='move';A.renderer.draw(g,1/60);
  o.txt=A.ui.tr(Hints.text('move',A.renderer.keyHints));o.saved=A.save.d.hints.move===1;
  step(60*8);o.cleared=!g.hintS.cur||g.hintS.cur.id!=='move';
  step(60*40);o.seen=Object.keys(A.save.d.hints).length;
  A.endRunManually();A.startGame({stage:0,char:'goku',diff:'normal',x2:false});const g2=A.game;for(let i=0;i<120;i++)g2.update(1/60);o.once=!g2.hintS||!g2.hintS.cur||g2.hintS.cur.id!=='move';
  A.endRunManually();A.save.d.settings.hints=false;Hints.reset(A.save.d);A.startGame({stage:0,char:'goku',diff:'normal',x2:false});const g3=A.game;for(let i=0;i<120;i++)g3.update(1/60);o.off=!g3.hintS.cur;
  A.endRunManually();A.save.d.settings.hints=true;A.startGame({stage:0,char:'goku',diff:'normal',x2:false});const g4=A.game;for(let i=0;i<120;i++)g4.update(1/60);o.reset=g4.hintS.cur&&g4.hintS.cur.id==='move';
  const v=A.save.normalize({stats:{runs:5}});o.vet=!!(v.hints&&v.hints._vet);const n=A.save.normalize({});o.fresh=!n.hints._vet&&n.settings.hints===true;
  return o;});
ok(r.move&&/WASD|stick/.test(r.txt)&&r.saved,'the first hint (move) shows at the start and is saved: '+r.txt);
ok(r.cleared&&r.seen>=3,'it goes away by itself and others follow ('+r.seen+' seen in 50 s)');
ok(r.once,'a hint already seen does not come back');
ok(r.off&&r.reset,'off from Settings, and "Show hints again" brings them back');
ok(r.vet&&r.fresh,'old saves with 3+ runs skip them, a new save has them');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();})();
