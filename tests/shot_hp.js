/* screenshots of the HUD with the artwork HP bar: base form, transformations, low life, other characters, small screens: node tests/shot_hp.js [prefix] */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const pre=process.argv[2]||'/tmp/hp_';
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:720,deviceScaleFactor:2}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const start=(ch)=>pg.evaluate((ch)=>{window.__MAPSEED=0;__app.startGame({stage:0,char:ch,diff:'normal',x2:false,sandbox:true});const g=__app.game;window.G=g;return g.C.id;},ch);
await start('goku');
const clip={x:0,y:0,width:520,height:330};
const shot=async(nm,fn)=>{if(fn)await pg.evaluate(fn);await wait(350);await pg.screenshot({path:pre+nm+'.png',clip});};
await shot('a_full',()=>{const g=window.G;g.setLevel(5);g.p.hp=g.p.maxHp;});
await shot('b_70',()=>{const g=window.G;g.p.hp=g.p.maxHp*.7;});
await shot('c_35',()=>{const g=window.G;g.p.hp=g.p.maxHp*.35;});
await shot('d_low',()=>{const g=window.G;g.p.hp=g.p.maxHp*.12;});
await shot('e_ssj',()=>{const g=window.G;g.p.hp=g.p.maxHp;g.setLevel(24);});
await pg.evaluate(()=>{window.G.setLevel(66);});await wait(5200);
await shot('f_blue',()=>{const g=window.G;g.p.hp=g.p.maxHp*.8;});
for(const ch of['vegeta','piccolo','krillin','bu']){await start(ch);await shot('g_'+ch,()=>{const g=window.G;g.setLevel(5);g.p.hp=g.p.maxHp*.9;});}
await start('goku');
await pg.setViewport({width:844,height:390,deviceScaleFactor:2});await wait(400);
await pg.screenshot({path:pre+'h_small.png',clip:{x:0,y:0,width:420,height:300}});
await pg.setViewport({width:390,height:760,deviceScaleFactor:2});await wait(400);
await pg.screenshot({path:pre+'i_portrait.png',clip:{x:0,y:0,width:390,height:260}});
console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
