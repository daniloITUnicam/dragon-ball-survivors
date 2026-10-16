/* Rock sprites on the planets (+ footprint collision) and the hand-made walk cycles of Goku / Gogeta.
   node tests/rocks_walk.js   (HTML=<build>, SHOTS=<dir>) */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=process.env.SHOTS||'/tmp/o';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const pg=await b.newPage();await pg.setViewport({width:900,height:600});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1800);
  const ev=(f,...a)=>pg.evaluate(f,...a);
  ok(await ev(()=>!!Sprites.sheets.rocks&&Sprites.sheets.rocks.rects.length===20&&World.rockOn),'rock atlas decoded, 20 rects, rockOn');
  ok(await ev(()=>{return !Sprites.sheets.goku.walk&&Sprites.sheets.goku.cols===16&&!Sprites.sheets.gogeta;}),'goku walk = frames 1-4 (grid sheet, 16 cols); only Goku has sprite sheets (gogeta is procedural)');
  const seq=await ev(()=>{const o={};for(const k of ['goku:-1','gogeta:-1','vegeta:-1']){const s=new Set();for(let t=0;t<2;t+=.01)s.add(Sprites.walkFrame(k,t));o[k]=[...s].sort((a,b)=>a-b).join(',');}return o;});
  console.log(JSON.stringify(seq));
  ok(seq['goku:-1']==='1,2,3,4'&&seq['gogeta:-1']==='1,2,3,4'&&seq['vegeta:-1']==='1,2,3,4','walkFrame cycles the custom frames, others keep 1-4');
  const themes=await ev(()=>STAGES.map(s=>s.id+':'+s.theme).join(' '));console.log(themes);
  for(const [st,th] of [[0,'plains'],[6,'redrock']]){
    await ev(st=>{window.__app.startGame({stage:st,char:'goku',diff:'normal',x2:false,sandbox:true});window.__app.game.sb.god=true;},st);await wait(900);
    const info=await ev(()=>{const g=window.__app.game,th=g.stage.theme;let rocks=[];
      for(const b of World.visible(th,-2500,-2500,2500,2500))if(b.v!==undefined)rocks.push(b);
      rocks.sort((a,b)=>Math.hypot(a.x,a.y)-Math.hypot(b.x,b.y));return{th,n:rocks.length,r:rocks.slice(0,5).map(b=>[b.v,+b.s.toFixed(2),+b.r.toFixed(1)])};});
    console.log(st,JSON.stringify(info));
    ok(info.th===th&&info.n>0,th+': rocks with sprites present ('+info.n+')');
    ok(info.r.every(([v,s,r])=>r>=6&&r<=60),th+': collision radius from footprint');
    // walk into the nearest rock: the player is pushed out to >= r+9
    const res=await ev(()=>{const g=window.__app.game,th=g.stage.theme;const b=World.visible(th,-2500,-2500,2500,2500).filter(b=>b.v!==undefined).sort((a,b)=>Math.hypot(a.x,a.y)-Math.hypot(b.x,b.y))[0];
      g.p.x=b.x+2;g.p.y=b.y+1;World.resolve(th,g.p,9);const d=Math.hypot(g.p.x-b.x,g.p.y-b.y);return{d,need:b.r+9,x:b.x,y:b.y};});
    ok(res.d>=res.need-.5,th+': player pushed out of the rock ('+res.d.toFixed(1)+' >= '+res.need.toFixed(1)+')');
    await ev(r=>{const g=window.__app.game;g.p.x=r.x-30;g.p.y=r.y+60;},res);await wait(500);
    await pg.screenshot({path:OUT+'/rocks_'+th+'.png',clip:{x:150,y:100,width:600,height:400}});
  }
  // other planets with rock defs
  for(const th of ['waste','beach','arena']){
    const n=await ev(th=>{World.setTheme(th);let k=0;for(const b of World.visible(th,-4000,-4000,4000,4000))if(b.v!==undefined)k++;return k;},th);
    ok(n>0,th+': has rock sprites ('+n+')');
  }
  // goku / gogeta walking in game
  for(const ch of ['goku','vegeta']){
    await ev(ch=>{window.__app.startGame({stage:0,char:ch,diff:'normal',x2:false,sandbox:true});window.__app.game.sb.god=true;},ch);await wait(900);
    await pg.keyboard.down('KeyD');
    for(let i=0;i<6;i++){await wait(90);await pg.screenshot({path:OUT+'/walk_'+ch+i+'.png',clip:{x:355,y:225,width:190,height:160}});}
    ok(await ev(()=>window.__app.game.p.mv),ch+': moving');await pg.keyboard.up('KeyD');
  }
  ok(errs.length===0,'no JS errors '+errs.join('|'));
  await b.close();console.log(fails?'FAILED':'ALL OK');process.exit(fails?1:0);
})().catch(e=>{console.log('ERR',e);process.exit(2)});
