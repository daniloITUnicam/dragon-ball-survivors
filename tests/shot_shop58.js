const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:900}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1500);
await pg.evaluate(()=>{const A=__app;A.save.d.zenny=50000;A.ui.push('shop');});await wait(900);
await pg.evaluate(()=>{const el=[...document.querySelectorAll('.shopi')].find(e=>/Vitality|Vitalit/.test(e.textContent));if(el)el.scrollIntoView({block:'center'});});await wait(400);
await pg.screenshot({path:'/tmp/o/shop58.png'});console.log(errs.join('|')||'no errors');await b.close();})();
