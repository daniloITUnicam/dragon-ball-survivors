/* Pack-sprite characters walk normally while a beam charges; the arm extends (frame 6) only while it fires. */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const pg=await b.newPage();await pg.setViewport({width:900,height:600});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1800);
  const ev=(f,...a)=>pg.evaluate(f,...a);
  await ev(()=>{window.__app.startGame({stage:5,char:'goku',diff:'normal',x2:false,sandbox:true});const g=window.__app.game;g.sb.god=true;
    g.addWeapon('kame');g.weapons.get('kame').cd=0;const e=g.mkEnemy(Object.values(ENEMIES)[0],g.p.x+200,g.p.y);e.hp=1e9;e.max=1e9;e.spd=0;g.en.push(e);
    window.__frames=[];const o=Sprites.player;Sprites.player=function(k,c,f,...r){if(k&&k.startsWith('goku'))window.__frames.push({f,cast:!!g.cast,fire:g.fireT>0,mv:g.p.mv});return o.call(Sprites,k,c,f,...r);};
    });
  await pg.keyboard.down('KeyA');
  await wait(2200);
  const fr=await ev(()=>window.__frames);
  const charging=fr.filter(x=>x.cast&&!x.fire),firing=fr.filter(x=>x.fire);
  ok(charging.length>5,'charge frames sampled: '+charging.length);
  console.log(JSON.stringify([...new Set(charging.map(x=>x.f+'/'+x.mv))]));
  ok(charging.filter(x=>x.mv).every(x=>(x.f>=1&&x.f<=4)||(x.f>=10&&x.f<=13)),'while charging and walking only walk-cycle frames (1-4, 10-13) are drawn');
  ok(firing.length>3&&firing.every(x=>x.f===6),'while the beam fires the thrust frame (6) is drawn: '+firing.length);
  ok(errs.length===0,'no JS errors '+errs.join('|'));
  await b.close();console.log(fails?'FAILED':'ALL OK');process.exit(fails?1:0);
})().catch(e=>{console.log('ERR',e);process.exit(2)});
