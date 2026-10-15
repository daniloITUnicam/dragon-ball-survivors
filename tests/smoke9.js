const pp=require('/opt/npm-tools/node_modules/puppeteer');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const pg=await b.newPage();await pg.setViewport({width:1200,height:760});const errs=[];pg.on('pageerror',e=>errs.push('PE '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('CE '+m.text());});
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
for(let i=0;i<5;i++){await pg.screenshot({path:'/tmp/o/s9_menu'+i+'.png'});await wait(2600);}
// grimoire from main menu
await pg.evaluate(()=>{window.__app.ui.push('grimoire');});await wait(400);await pg.screenshot({path:'/tmp/o/s9_grim_menu.png'});
// choose kame in grimoire
await pg.evaluate(()=>{window.__app.ui.grimSel='kame';window.__app.ui.rebuild();});await wait(300);await pg.screenshot({path:'/tmp/o/s9_grim_kame.png'});
// in-game
await pg.evaluate(()=>{window.__app.ui.show('main');window.__app.startGame({stage:1,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'dende'});});await wait(1500);
const aud=await pg.evaluate(()=>{const a=window.__app.audio;return{files:Object.keys(a.files||{}),on:Object.entries(a.files||{}).map(([k,f])=>[k,f.on,!f.el.paused,f.el.loop])};});console.log('audio',JSON.stringify(aud));
await pg.evaluate(()=>{const g=window.__app.game;g.addWeapon('kame');const w=g.weapons.get('kame');w.lv=5;g.recalc();});
await pg.evaluate(()=>{const g=window.__app;g.game.pass.might=0;});
await pg.evaluate(()=>{const g=window.__app.game;g.modal={type:'level',options:[{type:'p',id:'might',lv:0},{type:'w',id:'kame',lv:5},{type:'h'}]};});await wait(900);await pg.screenshot({path:'/tmp/o/s9_levelup.png'});
await pg.evaluate(()=>{const g=window.__app.game;window.__app.ui.closeModal();window.__app.state='play';g.modal=null;});
// evo gating
const r=await pg.evaluate(()=>{const g=window.__app.game;const w=g.weapons.get('kame');const a=g.evoReady(w);g.pass.might=1;const b=g.evoReady(w);return{a,b,max:g.maxEvo('kame'),needed:g.neededPass()};});console.log('evo',JSON.stringify(r));
await pg.evaluate(()=>{window.__app.pause();});await wait(300);await pg.screenshot({path:'/tmp/o/s9_pause.png'});
await pg.evaluate(()=>{window.__app.ui.lastPauseTab='grim';window.__app.ui.top.args={tab:'grim'};window.__app.ui.rebuild();});await wait(300);await pg.screenshot({path:'/tmp/o/s9_pause_grim.png'});
// chars screen
await pg.evaluate(()=>{window.__app.toMenu();window.__app.ui.push('stages');});await wait(200);await pg.evaluate(()=>{window.__app.ui.push('chars');});await wait(500);await pg.screenshot({path:'/tmp/o/s9_chars.png'});
console.log(errs.filter(e=>!/ERR_TUNNEL|Failed to load resource/.test(e)).join('\n')||'noerr');await b.close();})();
