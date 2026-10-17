/* screenshot of the newest patch-notes card: node tests/shot_patch.js [out] [lang] */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const out=process.argv[2]||'/tmp/patch_new.png',lang=process.argv[3]||'it';
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:900}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
await pg.evaluate((l)=>{__app.save.d.settings.lang=l;__app.applySettings();__app.ui.rebuild();document.querySelector('.patchbtn').click();},lang);await wait(400);
const h=await pg.evaluate(()=>{const c=document.querySelector('.pncard');return c.getBoundingClientRect().height;});
await pg.setViewport({width:1100,height:Math.min(6000,Math.ceil(h)+160)});await wait(300);
await pg.screenshot({path:out,fullPage:false});
console.log('card height',Math.round(h),errs.length?errs.slice(0,3):'no errors');await b.close();})();
