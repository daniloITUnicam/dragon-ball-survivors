/* Zeno-sama as a playable character: in game, with an ability, and in the character select:  node tests/shot_zeno.js [prefix] */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const pre=process.argv[2]||'/tmp/zeno_';
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:760}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
await pg.evaluate(()=>{const A=__app,d=A.save.d;if(!d.unlocked.includes('zeno'))d.unlocked.push('zeno');window.__MAPSEED=0;A.startGame({stage:0,char:'zeno',diff:'normal',x2:false,sandbox:true});const g=A.game;window.G=g;g.modal=null;for(let i=0;i<120;i++)g.update(.016);});
await wait(300);await pg.screenshot({path:pre+'game.png',clip:{x:240,y:100,width:800,height:560}});
await pg.evaluate(()=>{const g=G;g.useAbility&&g.useAbility();for(let i=0;i<30;i++)g.update(.016);});
await pg.evaluate(()=>{const g=G;if(!g.__u)g.__u=g.update.bind(g);g.update=()=>{};});await wait(250);await pg.screenshot({path:pre+'abil.png',clip:{x:240,y:100,width:800,height:560}});
await pg.evaluate(()=>{const g=G;g.update=g.__u;});
// character select
await pg.evaluate(()=>{const A=__app;A.state='menu';A.ui.clear&&A.ui.clear();A.game=null;A.ui.show('chars');});await wait(600);
await pg.evaluate(()=>{const A=__app;const els=[...document.querySelectorAll('[data-fid]')];const z=els.find(e=>e.getAttribute('data-fid')==='czeno'||/Zeno/.test(e.textContent));if(z)z.click();});await wait(500);
await pg.screenshot({path:pre+'select.png'});
console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
