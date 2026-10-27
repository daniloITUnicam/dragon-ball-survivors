/* Nothing is ever placed on the water: loot (power-ups, Dragon Balls, coins), gems, chests and map features are moved to the nearest dry spot. node tests/nowater.js */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1800);
  const seas=await pg.evaluate(()=>STAGES.map((s,i)=>({i,th:s.theme,sea:Sea.has(s.theme),lava:!!(Sea.has(s.theme)&&Sea.PAL[s.theme].lava)})).filter(x=>x.sea&&!x.lava));
  ok(seas.length>0,'stages with water: '+seas.map(x=>x.i+':'+x.th).join(', '));
  for(const S of seas.slice(0,3)){
    const r=await pg.evaluate(i=>{window.__MAPSEED=0;const A=__app;A.save.d.settings.sandbox=false;A.startGame({stage:i,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;window.G=g;g.sb.nospawn=true;g.sb.god=true;g.modal=null;g.en.length=0;
      const p=g.p,wet=[];for(let k=0;k<30000&&wet.length<150;k++){const x=p.x+(Math.random()-.5)*8000,y=p.y+(Math.random()-.5)*6000;if(g.waterAt(x,y))wet.push([x,y]);}
      const L0=g.loot.length,C0=g.chests.length,G0=g.gm.length;
      for(const [x,y] of wet.slice(0,60)){g.spawnLoot(['ball','sball','heal','haste','dmg','magnet','bag','coin'][(Math.random()*8)|0],x,y);g.dropGem(x,y,1);}
      const pts=[];for(let k=0;k<40;k++){const [x,y]=g.map.pos(120,600);pts.push([x,y]);}
      const LN=g.loot.slice(L0);for(let k=0;k<1200&&LN.some(l=>l.sx!=null);k++)for(const l of LN)g.drift(l,1/30);   /* v109: loot on the water floats to the shore */
      const lootW=LN.filter(l=>g.waterAt(l.x,l.y)).length,gemW=g.gm.slice(G0).filter(q=>g.waterAt(q.x,q.y)).length,posW=pts.filter(([x,y])=>g.waterAt(x,y)).length;
      /* boss / elite chest spawned over water, features, red gem */
      const [cx,cy]=g.dryPos(wet[0][0],wet[0][1]);
      const moved=wet.slice(0,60).every(([x,y])=>{const [a,b]=g.dryPos(x,y);return !g.waterAt(a,b);});
      return{wet:wet.length,loot:g.loot.length-L0,lootW,gems:g.gm.length-G0,gemW,posW,moved,cw:g.waterAt(cx,cy)};},S.i);
    ok(r.wet>=20,'stage '+S.i+' ('+S.th+'): '+r.wet+' water points sampled');
    ok(r.loot>=50&&r.lootW===0,'loot (Dragon Balls, Super Balls, power-ups, bags, coins) dropped on water ends up on land: '+r.lootW+' of '+r.loot+' on water');
    ok(r.gems>0&&r.gemW===0,'XP gems: '+r.gemW+' of '+r.gems+' on water');
    ok(r.posW===0&&r.moved&&!r.cw,'map spawns (chests, features, help items) and dryPos never return water');
  }
  /* stages without sea: positions untouched */
  const dry=await pg.evaluate(()=>{window.__MAPSEED=0;const A=__app;A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;g.sb.nospawn=true;const a=g.dryPos(123.5,-45.25);return a[0]===123.5&&a[1]===-45.25;});
  ok(dry,'a stage without water leaves positions unchanged');
  ok(errs.length===0,'no JS errors '+errs.join('|'));
  console.log(fails?'FAILED '+fails:'ALL OK');await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
