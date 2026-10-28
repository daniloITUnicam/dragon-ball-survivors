/* v115: character mastery - XP per run, Lv 3/7 colours, Lv 5 passive, Lv 10 title; shown on the character and end screens */
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
  d.mastery.goku.xp=tot;d.mastery.goku.skin=2;const g2=new Game({stage:0,char:'goku',diff:'normal',x2:false},g.env);o.p=g2.S.might/p0;o.skin=g2.skin;o.lv=g2.mastLv;
  d.mastery.goku.xp=mastNeed(1)+mastNeed(2);const g3=new Game({stage:0,char:'goku',diff:'normal',x2:false},g.env);o.skin3=g3.skin;o.noP=!g3.mastP;
  const sp=Sprites.player('goku',CHARS[0].cfg,0,false,null),c2=Mastery.skinned(sp.c,1);o.recol=c2!==sp.c&&Mastery.skinned(sp.c,1)===c2;
  d.mastery.goku.xp=tot;U=A.ui;U.show('main');U.push('chars');o.box=document.querySelector('.mastbox')?.textContent||'';
  return o;});
ok(r.every,'every character has a mastery passive');
ok(r.gain&&r.gain.xp>200&&r.xp===r.gain.xp&&r.endLine,'a won 10-minute run gives '+(r.gain&&r.gain.xp)+' XP, shown on the end screen');
ok(r.lv===10&&Math.abs(r.p-1.05)<.01&&r.skin===2,'Lv 10: Goku gets +5% power and colours B ('+r.p.toFixed(3)+')');
ok(r.skin3===0&&r.noP,'Lv 3: colours B not open yet (falls back to base), no passive');
ok(r.recol,'recoloured sprite frames are cached');
ok(/Master/.test(r.box)&&/10/.test(r.box),'the character screen shows the level, rewards and the title');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();})();
