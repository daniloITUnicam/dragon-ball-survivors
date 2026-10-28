/* v113: the summoning in the run - the 7th Dragon Ball calls Shenron (dark sky, slow world, then the wish window), the Super Dragon Balls call Porunga, skip, leave */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const r=await pg.evaluate(()=>{const A=__app,o={};A.loop=()=>{};
  A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true});const g=A.game;g.sb.god=true;g.sb.nospawn=true;
  g.balls=6;g.loot=[];g.spawnLoot('ball',g.p.x,g.p.y);g.loot[g.loot.length-1].x=g.p.x;g.loot[g.loot.length-1].y=g.p.y;g.update(1/60);
  o.started=!!g.summon&&g.summon.kind==='shenron'&&!g.modal;
  for(let i=0;i<40;i++)g.update(1/60);const t0=g.t;for(let i=0;i<60;i++){g.update(1/60);A.renderer.draw(g,1/60);}o.slow=(g.t-t0)<.1;o.dark=g.summon&&g.summon.ts<.1;
  let n=0;while(!g.modal&&n<600){g.update(1/60);n++;}o.wishAt=(n+101)/60;o.wish=g.modal&&g.modal.type==='wish';
  A.resolveModal(1);o.leave=g.summon&&g.summon.ph==='leave';for(let i=0;i<150;i++)g.update(1/60);o.gone=!g.summon;o.balls=g.balls;
  /* skip */
  g.balls=6;g.spawnLoot('ball',g.p.x,g.p.y);const l=g.loot[g.loot.length-1];l.x=g.p.x;l.y=g.p.y;g.update(1/60);for(let i=0;i<40;i++)g.update(1/60);
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}));let m=0;while(!g.modal&&m<600){g.update(1/60);m++;}o.skip=m<40&&g.modal&&g.modal.type==='wish';A.resolveModal(0);for(let i=0;i<150;i++)g.update(1/60);
  /* Porunga */
  g.spawnLoot('sball',g.p.x,g.p.y);const s=g.loot[g.loot.length-1];s.x=g.p.x;s.y=g.p.y;s.guard=true;g.update(1/60);o.porunga=!!g.summon&&g.summon.kind==='porunga';
  let k=0;while(!g.modal&&k<600){g.update(1/60);A.renderer.draw(g,1/60);k++;}o.swish=g.modal&&g.modal.type==='swish'&&g.modal.options[0]==='lucky';
  A.ui.openModal(g.modal,g);o.cards=document.querySelectorAll('.screen.modal.wish .card').length;A.resolveModal(0);for(let i=0;i<150;i++)g.update(1/60);o.gone2=!g.summon;
  o.sheets=!!(SPRITE_PACK.shenron&&SPRITE_PACK.porunga&&Sprites._dec&&Sprites._dec.has('porunga'));   /* (decoded on demand, v114) */
  /* ×2: from the settings, and the X key */
  A.save.d.settings.summonX2=true;g.balls=6;g.spawnLoot('ball',g.p.x,g.p.y);const l2=g.loot[g.loot.length-1];l2.x=g.p.x;l2.y=g.p.y;g.update(1/60);
  let q=0;while(!g.modal&&q<900){g.update(1/60);q++;}o.x2At=q/60;A.resolveModal(0);for(let i=0;i<150;i++)g.update(1/60);A.save.d.settings.summonX2=false;
  g.balls=6;g.spawnLoot('ball',g.p.x,g.p.y);const l3=g.loot[g.loot.length-1];l3.x=g.p.x;l3.y=g.p.y;g.update(1/60);window.dispatchEvent(new KeyboardEvent('keydown',{key:'x'}));o.xKey=g.summon&&g.summon.x2;
  let w=0;while(!g.modal&&w<900){g.update(1/60);w++;}o.xKeyAt=w/60;A.resolveModal(0);for(let i=0;i<150;i++)g.update(1/60);
  return o;});
ok(r.started,'the 7th Dragon Ball starts the summoning (no wish window yet)');
ok(r.slow&&r.dark,'the world slows almost to a stop while the dragon comes');
ok(r.wish&&r.wishAt>7&&r.wishAt<8.5,'the wish window opens after the cinematic ('+r.wishAt.toFixed(2)+' s)');
ok(r.leave&&r.gone&&r.balls===0,'after the wish the dragon leaves and the game goes on');
ok(r.skip,'Enter skips to the wish');
ok(r.porunga&&r.swish&&r.cards>=1&&r.gone2,'a Super Dragon Ball (sandbox) calls Porunga, with its own wish window ('+r.cards+' choices)');
ok(r.x2At>3.5&&r.x2At<4.2&&r.xKey&&r.xKeyAt<4.2,'×2 from the settings or the X key: the wish after '+r.x2At.toFixed(2)+' / '+r.xKeyAt.toFixed(2)+' s');
ok(r.sheets,'Shenron and Porunga sprite sheets are in the build');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();})();
