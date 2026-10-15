const puppeteer=require('/opt/npm-tools/node_modules/puppeteer');
const path=require('path');
(async()=>{
  const b=await puppeteer.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',headless:'shell',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const p=await b.newPage();await p.setViewport({width:1280,height:720});
  const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' @ '+(e.stack||'').split('\n').slice(1,3).join(' | ')));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_|net::/i.test(m.text()))errs.push('CONSOLE '+m.text());});
  await p.goto('file://'+path.resolve('dist/dragon-ball-survivors.html'));await new Promise(r=>setTimeout(r,600));
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const shot=n=>p.screenshot({path:'tests/s2_'+n+'.png'});
  await p.evaluate(()=>{__app.save.d.unlocked=CHARS.map(c=>c.id);__app.ui.show('main');__app.ui.push('stages');__app.ui.push('chars');});await sleep(300);await shot('chars');
  await p.evaluate(()=>{__app.save.d.settings.sandbox=true;__app.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.god=true;g.spawnEnemyById('bomb',5);g.spawnEnemyById('sai',10);g.spawnEnemyById('sol',4);});
  await sleep(2600);await shot('cast');
  await sleep(700);await shot('beam');
  await p.evaluate(()=>{const g=__app.game;g.setLevel(16);g.addTrinket('cape');g.addTrinket('kaioh');g.luckBonus=.06;g.recalc();g.wishLog.push('power');});
  for(let i=0;i<4;i++){await sleep(300);if(await p.evaluate(()=>__app.state)==='modal')await p.evaluate(()=>__app.resolveModal(0));}
  await sleep(500);await shot('form');
  await p.evaluate(()=>__app.pause());await sleep(300);await shot('pause');
  // Esc toggle test through the real key pipeline
  await p.keyboard.press('Escape');await sleep(250);const st1=await p.evaluate(()=>__app.state);
  await p.keyboard.press('Escape');await sleep(250);const st2=await p.evaluate(()=>__app.state);
  await p.keyboard.press('KeyP');await sleep(250);const st3=await p.evaluate(()=>__app.state);
  console.log('after Esc (pause->?)',st1,'| Esc again',st2,'| P',st3);
  console.log(errs.length?errs.join('\n'):'NO JS ERRORS');
  await b.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1);});
