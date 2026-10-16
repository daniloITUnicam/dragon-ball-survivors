/* Kamehameha beam from the pack effect sprite (fxkame): segments found, beam drawn without errors in plain and evolved form. */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=process.env.SHOTS||'/tmp/o';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const pg=await b.newPage();await pg.setViewport({width:900,height:600});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1800);
  const ev=(f,...a)=>pg.evaluate(f,...a);
  const sg=await ev(()=>Sprites.beamSeg());ok(sg&&sg.a>5&&sg.hd>sg.a+20&&sg.hd<sg.w-8,'beam segments found '+JSON.stringify(sg));
  for(const [nm,evo] of [['plain',0],['evo',1]]){
    await ev(evo=>{window.__app.startGame({stage:5,char:'vegito',diff:'normal',x2:false,sandbox:true});const g=window.__app.game;g.sb.god=true;g.p.hp=g.p.maxhp||g.p.hp;
      const w=g.weapons.get('kame');if(evo)w.evo=evo;w.cd=0;
      for(let i=0;i<6;i++)g.en.push({x:g.p.x+150+i*30,y:g.p.y+(i-3)*12,r:14,hp:1e9,mhp:1e9,dead:false,sp:{},t:0,k:'x'});},evo);
    await wait(1100);await pg.screenshot({path:OUT+'/beam_'+nm+'.png'});
  }
  ok(errs.length===0,'no JS errors '+errs.join('|'));
  await b.close();console.log(fails?'FAILED':'ALL OK');process.exit(fails?1:0);
})().catch(e=>{console.log('ERR',e);process.exit(2)});
