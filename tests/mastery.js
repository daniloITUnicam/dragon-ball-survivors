/* v115: character mastery - XP per run, Lv 5 passive; shown on the character and end screens */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const r=await pg.evaluate(()=>{const A=__app,d=A.save.d,o={};A.loop=()=>{};d.settings.sandbox=false;d.mastery={};
  o.every=CHARS.every(c=>Mastery.passiveText(c.id));
  A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false});let g=A.game;g.kills=400;g.t=600;g.run.bossKills=2;
  const res=A.progress.finishRun(g,true,{});o.gain=res.mastery;o.xp=d.mastery.goku.xp;
  A.ui.show('end',res);o.endLine=!!document.querySelector('.mline');
  d.mastery.goku.xp=0;const p0=new Game({stage:0,char:'goku',diff:'normal',x2:false},g.env).S.might;
  let tot=0;for(let l=1;l<MAST_MAX;l++)tot+=mastNeed(l);o.tot=tot;
  d.mastery.goku.xp=tot;const g2=new Game({stage:0,char:'goku',diff:'normal',x2:false},g.env);o.p=g2.S.might/p0;o.lv=g2.mastLv;
  d.mastery.goku.xp=mastNeed(1)+mastNeed(2);const g3=new Game({stage:0,char:'goku',diff:'normal',x2:false},g.env);o.noP=!g3.mastP;
  o.noSkin=typeof Mastery.skinOf==='undefined'&&typeof Mastery.title==='undefined'&&typeof TITLES==='undefined';
  d.mastery.goku.xp=tot;U=A.ui;U.show('main');U.push('chars');o.box=document.querySelector('.mastbox')?.textContent||'';
  return o;});
ok(r.every,'every character has a mastery passive');
ok(r.gain&&r.gain.xp>200&&r.xp===r.gain.xp&&r.endLine,'a won 10-minute run gives '+(r.gain&&r.gain.xp)+' XP, shown on the end screen');
ok(r.lv===10&&Math.abs(r.p-1.05)<.01,'Lv 10: Goku gets +5% power ('+r.p.toFixed(3)+')');
ok(r.noP,'Lv 3: no passive yet');
ok(r.noSkin,'character skins and titles are gone');
ok(/Master/.test(r.box)&&/10/.test(r.box),'the character screen shows the level and the rewards');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();})();
