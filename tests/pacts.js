/* v115: Pacts - chosen on the stage screen, harder run, more zenny and 1x tickets on a won stage */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const r=await pg.evaluate(()=>{const A=__app,U=A.ui,d=A.save.d,o={};A.loop=()=>{};
  d.clears[0]=0;d.clears.fill(0);d.settings.sandbox=false;d.pacts=[];U.show('main');U.push('stages');o.locked=!!document.querySelector('[data-fid=pacts]')?.disabled;
  d.clears[0]=1;U.rebuild(true);document.querySelector('[data-fid=pacts]').click();o.screen=document.querySelectorAll('.card.pact').length;
  document.querySelector('[data-fid=pkiron]').click();document.querySelector('[data-fid=pkglass]').click();o.sel=d.pacts.join();o.sum=document.querySelector('.pactsum').textContent;
  A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false,pacts:d.pacts});const g=A.game;
  const base=new Game({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false},A.env||g.env);
  o.hp=g.hpMul()/base.hpMul();o.php=g.p.maxHp/base.p.maxHp;
  g.run.coins=1000;g.run.minC=1000;const t0=d.tickets.t1,z0=d.zenny;const res=A.save.constructor&&A.progress.finishRun(g,true,{});
  o.line=res.lines.find(l=>l.k==='pacts');o.dz=d.zenny-z0;o.tk=d.tickets.t1-t0;
  const sb=new Game({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true,pacts:['iron']},g.env);o.sbNone=!sb.pacts.length;
  return o;});
ok(r.locked&&r.screen===7,'Pacts unlock after a cleared stage; the screen lists 7');
ok(r.sel==='iron,glass'&&/60%/.test(r.sum),'picking two pacts: '+r.sum);
ok(Math.abs(r.hp-1.6)<.01&&Math.abs(r.php-.6)<.03,'Iron: enemies x1.6 HP ('+r.hp.toFixed(2)+'), Glass: x0.6 max HP ('+r.php.toFixed(2)+')');
ok(r.line&&r.line.v>0&&r.tk===2,'a won stage pays the Pacts line (+'+(r.line&&r.line.v)+' Z) and 2 1x tickets ('+r.tk+')');
ok(r.sbNone,'no pacts in Test mode');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();})();
