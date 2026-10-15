const pp=require('/opt/npm-tools/node_modules/puppeteer');
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1100,height:760});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await new Promise(r=>setTimeout(r,800));
await pg.evaluate(()=>{const a=window.__app;a.save.d.settings.lang='de';a.save.d.unlocked=['goku'];a.applySettings();a.ui.show('chars'||'main');});
await new Promise(r=>setTimeout(r,500));await pg.screenshot({path:'/tmp/s_chars.png'});
await pg.evaluate(()=>{const a=window.__app;a.ui.show('settings',{tab:'general'});});await new Promise(r=>setTimeout(r,400));await pg.screenshot({path:'/tmp/s_set.png'});
console.log(errs.join('|')||'noerr');await b.close();})();
