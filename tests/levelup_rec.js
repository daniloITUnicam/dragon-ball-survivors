/* Level-up recommendation star. node tests/levelup_rec.js (HTML=<build>, SHOTS=<dir>) */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=process.env.SHOTS||'/tmp/o';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const pg=await b.newPage();await pg.setViewport({width:1000,height:640});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1800);
  const ev=(f,...a)=>pg.evaluate(f,...a);
  await ev(()=>{__app.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false});const g=__app.game;g.sb&&(g.sb.god=true);});await wait(400);
  const R=await ev(()=>{const g=__app.game,out={};
    const P=(type,id,lv=0)=>({type,id,lv});
    g.t=100*g.TS;g.p.hp=g.p.maxHp;g.pass={};
    out.none=g.recommend([P('p','speed'),P('p','magnet'),P('p','growth')]);
    g.p.hp=g.p.maxHp*.3;
    out.hp=g.recommend([P('p','speed'),P('p','regen'),P('p','growth')]);
    out.senzu=g.recommend([P('p','speed'),{type:'h'},P('p','growth')]);
    g.p.hp=g.p.maxHp;g.S.armor=0;
    out.armor=g.recommend([P('p','speed'),P('p','armor'),P('p','growth')]);
    g.S.armor=5;
    // kame needs 'might' for its first evolution
    const w=g.weapons.get('kame')||g.addWeapon('kame');w.lv=4;
    out.wevo=g.recommend([P('p','speed'),P('w','kame',4),P('p','growth')]);
    out.evo=g.recommend([P('p','speed'),P('p','growth'),P('p','might')]);
    g.p.hp=g.p.maxHp*.2;
    out.evoBeatsHp=g.recommend([P('p','vit'),P('p','might'),{type:'h'}]);
    return out;});
  console.log(JSON.stringify(R));
  ok(R.none===null,'no star when nothing is needed');
  ok(R.hp&&R.hp.i===1&&R.hp.why==='hp','low health: regeneration starred');
  ok(R.senzu&&R.senzu.i===1,'low health: Senzu bean starred');
  ok(R.armor&&R.armor.i===1&&R.armor.why==='armor','low armor: armor starred');
  ok(R.wevo&&R.wevo.i===1&&R.wevo.why==='wevo','weapon close to evolving: weapon starred');
  ok(R.evo&&R.evo.i===2&&R.evo.why==='evo','passive that evolves an owned weapon starred');
  ok(R.evoBeatsHp&&R.evoBeatsHp.i===1,'evolution beats low health');
  // real card in the UI
  await ev(()=>{const g=__app.game;g.p.hp=g.p.maxHp;g.pass={};g.addWeapon('kame');g.weapons.get('kame').lv=5;g.modal={type:'level',options:[{type:'p',id:'speed',lv:0},{type:'p',id:'might',lv:0},{type:'p',id:'growth',lv:0}],rec:1,recWhy:'evo'};__app.ui.openModal(g.modal,g);});
  await wait(900);
  ok(await ev(()=>document.querySelectorAll('.card.recd .recstar').length===1),'star shown on exactly one card');
  await pg.screenshot({path:OUT+'/levelup_rec.png'});
  ok(errs.length===0,'no JS errors '+errs.join('|'));
  console.log(fails?'FAILED '+fails:'ALL OK');await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
