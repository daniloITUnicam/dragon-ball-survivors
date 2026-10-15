// smoke: chars screen (anim+pets), transformation VFX, trap/heal zones, totem, boss pick, spirit room
const pp=require('/opt/npm-tools/node_modules/puppeteer');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const pg=await b.newPage();await pg.setViewport({width:1200,height:800});const errs=[];pg.on('pageerror',e=>errs.push('PE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text());});
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(900);
await pg.screenshot({path:'/tmp/o/m_main.png'});
await pg.evaluate(()=>{const a=window.__app;a.save.d.zenny=123456;a.save.d.maxForm={goku:4};a.ui.show('stages');});await wait(500);await pg.screenshot({path:'/tmp/o/m_stages.png'});
await pg.evaluate(()=>{const a=window.__app;a.ui.show('chars');});await wait(2600);await pg.screenshot({path:'/tmp/o/m_chars.png'});
await pg.evaluate(()=>{const a=window.__app;a.ui.sel.peek='zamasu';a.ui.rebuild();});await wait(900);await pg.screenshot({path:'/tmp/o/m_chars2.png'});
// game
await pg.evaluate(()=>{const a=window.__app;a.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true,pet:'shenron'});});await wait(600);
await pg.evaluate(()=>{const g=window.__app.game;g.setLevel(14);});await wait(450);await pg.screenshot({path:'/tmp/o/x1.png'});
await wait(600);await pg.screenshot({path:'/tmp/o/x2.png'});await wait(350);await pg.screenshot({path:'/tmp/o/x3.png'});await wait(900);await pg.screenshot({path:'/tmp/o/x4.png'});
const r=await pg.evaluate(()=>{const g=window.__app.game;return{f:g.formsUnlocked,xf:!!g.xform,modal:g.modal&&g.modal.type,lvl:g.lvl,pet:g.pet&&g.pet.d.id};});
console.log(JSON.stringify(r));
console.log(errs.join('\n')||'noerr');await b.close();})();
