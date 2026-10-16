/* Character select keeps its scroll position when a pet is picked; the grimoire uses the wide layout.
   node tests/ui_scroll.js   (HTML=<build>, SHOTS=<dir>) */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=process.env.SHOTS||'/tmp/o';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const pg=await b.newPage();await pg.setViewport({width:1100,height:600});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1800);
  const ev=(f,...a)=>pg.evaluate(f,...a);
  await ev(()=>{const u=__app.ui;u.show('main');u.push('chars');});await wait(500);
  const r=await ev(()=>{const el=__app.ui.top.el;el.scrollTop=9999;return[el.scrollTop,el.scrollHeight,el.clientHeight];});
  ok(r[0]>50,'character select is scrollable ('+r.join('/')+')');
  await ev(()=>{const el=__app.ui.top.el;[...el.querySelectorAll('.pet')].filter(e=>!e.classList.contains('sel'))[0].click();});await wait(300);
  const s2=await ev(()=>__app.ui.top.el.scrollTop);
  ok(Math.abs(s2-r[0])<=2,'scroll kept after choosing a pet ('+r[0]+' -> '+s2+')');
  await ev(()=>{const el=__app.ui.top.el;el.scrollTop=60;[...el.querySelectorAll('.char:not(.locked)')][1]&&[...el.querySelectorAll('.char:not(.locked)')][1].click();});await wait(300);
  ok(await ev(()=>Math.abs(__app.ui.top.el.scrollTop-60)<=2),'scroll kept after choosing a character');
  await ev(()=>{const u=__app.ui;u.show('main');u.push('grimoire');});await wait(500);
  const g=await ev(()=>{const w=document.querySelector('.wgrid'),d=document.querySelector('.grimdetail');return{w:w.getBoundingClientRect().width,wh:w.getBoundingClientRect().height,sh:w.scrollHeight,ch:w.clientHeight,ov:getComputedStyle(w).overflowY,dw:d.getBoundingClientRect().width};});
  console.log(JSON.stringify(g));
  ok(g.sh<=g.ch+1&&g.ov!=='auto','grimoire grid shows all the weapons without its own scroll box');
  ok(g.w+g.dw>1000,'grimoire uses the wide layout ('+Math.round(g.w+g.dw)+' px)');
  await pg.screenshot({path:OUT+'/grimoire.png'});
  ok(errs.length===0,'no JS errors '+errs.join('|'));
  console.log(fails?'FAILED '+fails:'ALL OK');await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
