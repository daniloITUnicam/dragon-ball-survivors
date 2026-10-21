/* Auto level-up (every mode): Settings > Gameplay > "Priorities" opens its own menu (switch with tooltip + priority list); nothing in the ESC menu or the level-up window;
   the pick follows the list; the old Endless setting is migrated.   node tests/autolevel.js   (HTML=<build>, SHOTS=<dir>) */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=process.env.SHOTS||'/tmp/o';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const pg=await b.newPage();await pg.setViewport({width:1100,height:700});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1800);
  const ev=(f,...a)=>pg.evaluate(f,...a);
  const click=sel=>ev(s=>{const e=document.querySelector(s);if(e)e.click();return !!e;},sel);
  const count=sel=>ev(s=>document.querySelectorAll(s).length,sel);

  /* 0. defaults + migration of the old Endless-only setting */
  const mig=await ev(()=>{const mk=o=>new SaveData({getItem:()=>JSON.stringify(o),setItem(){}}).d.settings;
    const fresh=new SaveData({getItem:()=>null,setItem(){}}).d.settings,old=mk({settings:{endAuto:true,endPrio:['w:kame','p:might']}}),off=mk({settings:{endAuto:false}}),now=mk({settings:{lvAuto:false,endAuto:true}});
    return{fresh:fresh.lvAuto,freshP:fresh.lvPrio.length,oldA:old.lvAuto,oldP:old.lvPrio,gone:old.endAuto===undefined&&old.endPrio===undefined,off:off.lvAuto,now:now.lvAuto};});
  ok(mig.fresh===false&&mig.freshP===0,'a new save has the auto level-up off and an empty priority list');
  ok(mig.oldA===true&&mig.oldP.join()==='w:kame,p:might'&&mig.gone,'an old Endless "auto-select" save keeps its switch and priorities (endAuto/endPrio -> lvAuto/lvPrio)');
  ok(mig.off===false&&mig.now===false,'an old switch that was off stays off; a value already in the new format wins');

  /* 1. normal run: the level-up window has no auto / priority buttons and opens as usual */
  await ev(()=>{const A=__app;A.save.d.settings.sandbox=false;A.save.d.settings.lvAuto=false;A.save.d.settings.lvPrio=[];window.__MAPSEED=0;
    A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;window.G=g;g.sb.nospawn=true;g.en.length=0;g.p.hp=g.p.maxHp=1e7;g.modal=null;
    g.addWeapon('kame');g.pass.might=1;g.pass.speed=2;g.xp=g.need;g.levelUp();});await wait(700);
  ok(await ev(()=>G.modal&&G.modal.type==='level'&&!G.endless),'normal run, auto off: the level-up window opens as usual');
  ok(await count('[data-fid="lvautoon"],[data-fid="lvprio"],.modal .endprio')===0,'the level-up window has no auto level-up / priorities controls');
  await ev(()=>{G.modal=null;__app.ui.closeModal();});

  /* 2. ESC menu: no auto level-up, no priorities */
  await ev(()=>{__app.state='play';__app.pause();});await wait(500);
  ok(await count('.pausescr [data-fid="lvautosw"],.pausescr [data-fid="prioBtn"],.pausescr .endprio')===0,'the ESC menu shows neither the switch nor the priorities');

  /* 3. ESC > Settings > Gameplay: one "Priorities" button, no switch in the list of settings */
  await click('.pausescr [data-fid="b_settings"]');await wait(300);
  await ev(()=>__app.ui.top.name!=='settings'&&__app.ui.push('settings',{tab:'gameplay'}));
  await ev(()=>{const t=document.querySelector('.settings');return t;});
  await click('[data-fid="tabgameplay"]');await wait(400);
  ok(await count('.settings [data-fid="prioOpen"]')===1&&await count('.settings [data-fid="tlvAuto"]')===0,'Settings > Gameplay: a "Priorities" button, no switch among the settings');
  await click('.settings [data-fid="prioOpen"]');await wait(500);
  ok(await ev(()=>__app.ui.top.name==='priority'),'the button opens its own menu');
  ok(await count('[data-fid="lvautosw"]')===1&&await count('.endprio')>=3,'the menu has the switch and the list of what you own ('+await count('.endprio')+' rows)');
  ok(await ev(()=>{const t=document.querySelector('[data-fid="lvautosw"]').dataset.tip;return !!t&&t.length>40&&t===__app.ui.t('lvAutoD');}),'the switch carries the explanation as a tooltip');
  await pg.hover('[data-fid="lvautosw"]');await wait(300);
  await pg.screenshot({path:OUT+'/autolevel_menu.png'});
  /* switch */
  await click('[data-fid="lvautosw"]');await wait(300);
  ok(await ev(()=>__app.save.d.settings.lvAuto===true),'the switch turns the auto level-up on');
  /* reorder */
  const o0=await ev(()=>G.enPrio().slice());
  await click('[data-fid="epd0"]');await wait(300);
  const o1=await ev(()=>({l:G.enPrio().slice(),s:__app.save.d.settings.lvPrio.slice()}));
  ok(o1.l[0]===o0[1]&&o1.l[1]===o0[0]&&o1.s[0]===o0[1],'▼ swaps the first two rows and saves the order');
  ok(await ev(()=>document.querySelector('[data-fid="epu0"]').disabled),'the first row cannot go up');

  /* 4. the pick follows the list (normal mode, no window) */
  const pk=await ev(()=>{const g=G;g.addWeapon('kame');g.pass.might=1;g.pass.speed=2;
    const O=[{type:'p',id:'speed',lv:2},{type:'p',id:'might',lv:1},{type:'w',id:'kame',lv:0},{type:'p',id:'magnet',lv:0}];
    g.setPrio(['p:might','w:kame','p:speed']);const a=g.autoPick(O);g.setPrio(['w:kame','p:speed','p:might']);const b=g.autoPick(O);g.setPrio(['p:speed','p:might','w:kame']);const c=g.autoPick(O);return[a,b,c];});
  ok(pk.join()==='1,2,0','autoPick takes the best-ranked card ('+pk+')');
  const au=await ev(()=>{const g=G,out=[];__app.save.d.settings.lvAuto=true;for(let i=0;i<3;i++){g.modal=null;const l=g.lvl,n0=g.weapons.size+Object.values(g.pass).reduce((s,v)=>s+v,0)+[...g.weapons.values()].reduce((s,w)=>s+w.lv,0);g.xp=g.need;g.levelUp();
    out.push([g.lvl-l,!!g.modal,g.weapons.size+Object.values(g.pass).reduce((s,v)=>s+v,0)+[...g.weapons.values()].reduce((s,w)=>s+w.lv,0)-n0]);}return out;});
  ok(au.every(x=>x[0]===1&&!x[1]&&x[2]>0),'switch on: three level-ups in a row apply a card each and open no window');
  ok(await count('.toast')===0,'no "auto level-up is on" notice');

  /* 5. Settings from the main menu (no run): the switch is there, the list is replaced by a hint */
  await ev(()=>{__app.toMenu();});await wait(500);
  await ev(()=>__app.ui.push('settings',{tab:'gameplay'}));await wait(300);
  await click('.settings [data-fid="prioOpen"]');await wait(400);
  ok(await count('[data-fid="lvautosw"]')===1&&await count('.endprio')===0&&await ev(()=>document.body.textContent.includes(__app.ui.t('prioHint'))),'main menu: the switch and a hint, no list');

  ok(errs.length===0,'no JS errors '+errs.join('|'));
  console.log(fails?'FAILED '+fails:'ALL OK');await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
