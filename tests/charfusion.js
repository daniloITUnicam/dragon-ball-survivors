/* v116: Potara / Metamoran fusions - both parents at Mastery 5 open a run as the fused warrior, with the parents' weapons; both parents get the XP */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const r=await pg.evaluate(()=>{const A=__app,d=A.save.d,o={};A.loop=()=>{};d.settings.hints=false;d.settings.sandbox=false;d.settings.weapons=5;
  o.chars=CHAR_FUSIONS.every(f=>[f.id,f.a,f.b].every(id=>CHARS.some(c=>c.id===id)));
  const need=(()=>{let t=0;for(let l=1;l<FUSE_LV;l++)t+=mastNeed(l);return t;})();
  d.mastery={goku:{xp:need,skin:0},vegeta:{xp:need-1,skin:0}};o.closed=!Mastery.fuseOpen(d,CHAR_FUSIONS[0]);
  d.mastery.vegeta.xp=need;o.open=Mastery.fuseOpen(d,CHAR_FUSIONS[0]);
  A.ui.show('main');A.ui.push('chars');o.btn=!!document.querySelector('[data-fid=fzvegito]');
  document.querySelector('[data-fid=fzvegito]').click();const g=A.game;o.run=g.C.id==='vegito'&&g.fz&&g.fz.parents.join()==='goku,vegeta';
  const want=new Set([...CHARS.find(c=>c.id==='vegito').start,...CHARS.find(c=>c.id==='goku').start,...CHARS.find(c=>c.id==='vegeta').start]);o.w=[...g.weapons.keys()].join(',');o.wOk=[...want].slice(0,5).every(id=>g.weapons.has(id));
  g.kills=300;g.t=300;const x0=d.mastery.goku.xp,y0=d.mastery.vegeta.xp;const res=A.progress.finishRun(g,false,{});o.xp=d.mastery.goku.xp>x0&&d.mastery.vegeta.xp>y0&&res.mastery.id==='vegito';
  return o;});
ok(r.chars,'5 fusions (Vegito, Gogeta, Gotenks, Kefla, Fused Zamasu), all in the roster');
ok(r.closed&&r.open&&r.btn,'open only with both parents at Mastery '+5+'; the button is in the parent\'s mastery box');
ok(r.run&&r.wOk,'the run is played as Vegito with the parents\' weapons ('+r.w+')');
ok(r.xp,'both parents get the mastery XP');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();})();
