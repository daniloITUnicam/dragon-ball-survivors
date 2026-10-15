const pp=require('/opt/npm-tools/node_modules/puppeteer');
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],headless:'shell'});
const pg=await b.newPage();await pg.setViewport({width:1100,height:700});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await new Promise(r=>setTimeout(r,1200));
await pg.screenshot({path:'/tmp/s_main.png'});
const clickText=async t=>{await pg.evaluate(t=>{const bs=[...document.querySelectorAll('button')];const b=bs.find(x=>x.textContent.trim().toLowerCase().startsWith(t));b&&b.click();},t);await new Promise(r=>setTimeout(r,500));};
await clickText('play');await pg.screenshot({path:'/tmp/s_stage.png'});
console.log(errs.join('|')||'noerr');await b.close();})();
