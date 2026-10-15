const puppeteer=require('/opt/npm-tools/node_modules/puppeteer');
const path=require('path');
(async()=>{
  const b=await puppeteer.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',headless:'shell',args:['--no-sandbox','--disable-setuid-sandbox','--autoplay-policy=no-user-gesture-required']});
  const p=await b.newPage();await p.setViewport({width:1280,height:720});
  const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_|net::/i.test(m.text()))errs.push('CONSOLE '+m.text());});
  await p.goto('file://'+path.resolve('dist/dragon-ball-survivors.html'));
  await new Promise(r=>setTimeout(r,800));
  const shot=async n=>p.screenshot({path:'tests/shot_'+n+'.png'});
  await shot('menu');
  const A=()=>p.evaluate(()=>!!window.__app);
  console.log('app',await A());
  // navigate screens via UI API
  for(const sc of ['stages','chars','shop','ach','settings','sandboxCfg']){
    await p.evaluate(s=>{const u=__app.ui;u.show('main');u.push(s,s==='settings'?{tab:'general'}:undefined);},sc);
    await new Promise(r=>setTimeout(r,250));await shot(sc);
  }
  for(const tab of ['audio','video','controls']){
    await p.evaluate(t=>{const u=__app.ui;u.show('main');u.push('settings',{tab:t});},tab);await new Promise(r=>setTimeout(r,200));await shot('set_'+tab);
  }
  // start a game in sandbox, all stages briefly
  for(let st=0;st<5;st++){
    await p.evaluate(s=>{__app.save.d.settings.sandbox=true;__app.startGame({stage:s,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.setLevel(26);g.addWeapon('ki');g.addWeapon('disc');g.addWeapon('spirit');g.addWeapon('dbeam');g.jumpTo(250);for(const id of ['bomb','sai','sol','rap']){}g.spawnEnemyById(__app.game.stage.roster[0][0],12);g.spawnEnemyById('bomb',6);g.spawnEnemyById('bomb2',3);g.addTrinket('dball4');g.loot.push({k:'coin',x:30,y:20,v:5,t:0},{k:'heal',x:-30,y:20,v:0,t:0},{k:'dmg',x:60,y:-30,v:0,t:0});g.feat.push({kind:'altar',x:100,y:40,t:0,ttl:100,used:false,dead:false},{kind:'shrine',x:-120,y:60,t:0,ttl:100,used:false,dead:false});g.chests.push({x:-80,y:-60,final:false,t:0});},st);
    await new Promise(r=>setTimeout(r,2500));
    // resolve level modals if any
    for(let k=0;k<3;k++){const m=await p.evaluate(()=>__app.state);if(m==='modal'){await shot('modal'+st);await p.evaluate(()=>__app.resolveModal(0));}await new Promise(r=>setTimeout(r,500));}
    await shot('game'+st);
  }
  // boss + sandbox panel
  await p.evaluate(()=>{const g=__app.game;g.sb.god=true;g.spawnBoss('jiren',false);__app.ui.toggleSandbox(g);});
  await new Promise(r=>setTimeout(r,2000));await shot('boss');
  console.log('state',await p.evaluate(()=>__app.state));
  // pause, resume, end screen
  await p.evaluate(()=>__app.pause());await new Promise(r=>setTimeout(r,300));await shot('pause');
  await p.evaluate(()=>{__app.resume();__app.game.sandbox=false;__app.game.sb.god=false;__app.game.finish(false);});await new Promise(r=>setTimeout(r,400));await shot('end');
  // english
  await p.evaluate(()=>{__app.save.d.settings.lang='en';__app.applySettings();__app.toMenu();});await new Promise(r=>setTimeout(r,300));await shot('menu_en');
  console.log(errs.length?errs.join('\n'):'NO JS ERRORS');
  await b.close();
})().catch(e=>{console.error('E2E FAIL',e);process.exit(1);});
