/* arcade menu sounds: every UI sound must play without errors, and hover / click / back / start must trigger the right ones */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push('PE '+e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(900);
await pg.mouse.click(5,5);await wait(200);
const R=await pg.evaluate(async()=>{
  const a=window.__app.audio,log=[];const orig=a.sfx.bind(a);a.sfx=n=>{log.push(n);return orig(n);};
  const out={ctx:!!a.ctx};
  /* every UI sound plays without throwing */
  for(const n of['uiMove','uiClick','uiBack','uiStart','uiBuy','uiErr','uiTab','click','buy']){try{a.last={};orig(n);}catch(e){out['ERR_'+n]=e.message;}}
  /* the UI hooks */
  log.length=0;
  const btn=[...document.querySelectorAll('#ui button')].find(x=>x.offsetParent);
  btn.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}));
  out.hover=log.slice();log.length=0;a.last={};a.lastUi=0;
  btn.click();out.click=log.slice();
  return out;});
console.log(JSON.stringify(R));
/* walk: Play -> stages -> chars -> back, record sounds */
const seq=await pg.evaluate(async()=>{
  const a=window.__app.audio,log=[];const orig=a.sfx.bind(a);a.sfx=n=>{log.push(n);return orig(n);};
  const ui=window.__app.ui;const clickText=t=>{const x=[...document.querySelectorAll('#ui button')].find(e=>e.offsetParent&&e.textContent.trim().toLowerCase().includes(t));if(x){a.last={};a.lastUi=0;x.click();return true;}return false;};
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const res={};
  res.play=clickText('gioca')||clickText('play');await wait(150);
  res.next=clickText('avanti')||clickText('next');await wait(150);
  const back=document.querySelector('#ui [data-back]');a.last={};a.lastUi=0;if(back)back.click();await wait(100);
  res.log=log.slice();return res;});
console.log(JSON.stringify(seq));
console.log(errs.join('\n')||'noerr');await b.close();})();
