/* v122 fix: after a run ended, the next run drew the TAB target panel hugely zoomed over the whole screen (its pop animation used the old run's clock) */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const r=await pg.evaluate(async()=>{const A=__app,R=A.renderer;A.save.d.settings.hints=false;const pops=[];const D=TgtArt.draw;TgtArt.draw=function(c,m,x,y,w,pop){pops.push(pop);return D.apply(this,arguments);};
  TgtArt.load();await new Promise(r=>setTimeout(r,300));
  A.startGame({stage:0,char:'goku',diff:'normal'});let g=A.game;g.sb.god=true;for(let i=0;i<1800;i++){g.update(1/60);if(g.modal)g.modal=null;}R.draw(g,1/60);
  const rt1=g.rt;g.finish(false);A.toMenu();pops.length=0;
  A.startGame({stage:0,char:'goku',diff:'normal'});g=A.game;for(let i=0;i<3;i++){g.update(1/60);if(g.modal)g.modal=null;R.draw(g,1/60);}
  return{rt1,pops,ok:TgtArt.ok};});
ok(r.ok&&r.pops.length>0,'the panel is drawn in the second run');
ok(r.pops.every(p=>p>=0&&p<=1),'its pop stays between 0 and 1 after a '+Math.round(r.rt1)+' s run ('+r.pops.map(p=>p.toFixed(2)).join(', ')+')');
ok(!errs.length,'no errors '+errs.slice(0,2).join('|'));
await b.close();})();
