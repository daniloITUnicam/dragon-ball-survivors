/* screenshots: Hellzone Grenade, Special Beam Cannon, Sphere of Justice, Gotenks' ghosts:  node tests/shot_v55b.js [prefix] */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const pre=process.argv[2]||'/tmp/v55b_';
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:760,deviceScaleFactor:1}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const start=(ch,w)=>pg.evaluate((ch,w)=>{window.__MAPSEED=0;__app.settings=__app.save.d.settings.weapons=w||5;__app.startGame({stage:0,char:ch,diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.nospawn=true;g.sb.god=true;window.G=g;g.modal=null;g.en=[];return g.C.id;},ch,w);
const clip={x:340,y:120,width:600,height:500};
const shot=async(nm,cl)=>{await pg.evaluate(()=>{const g=G;if(!g.__u){g.__u=g.update.bind(g);}g.update=()=>{};});await wait(250);await pg.screenshot({path:pre+nm+'.png',clip:cl||clip});await pg.evaluate(()=>{const g=G;g.update=g.__u;});};
const step=(t)=>pg.evaluate((t)=>{const g=G;let x=0;while(x<t){g.update(.016);x+=.016;}},t);
const crowd=(n,dx,dy,spread)=>pg.evaluate((n,dx,dy,spread)=>{const g=G;for(let i=0;i<n;i++){const e=g.mkEnemy(Object.values(ENEMIES)[i%4],g.p.x+dx+rnd(-spread,spread),g.p.y+dy+rnd(-spread,spread));e.hp=e.max=1e6;e.armor=0;e.spd=0;g.en.push(e);}},n,dx,dy,spread);
/* Hellzone Grenade */
await start('piccolo',2);await crowd(14,200,-20,60);
await pg.evaluate(()=>{G.setLevel(6);G.modal=null;G.weapons.get('hellzone').cd=0;});
const cz={x:700,y:200,width:420,height:360};await step(.8);await shot('hz_a',cz);await step(.9);await shot('hz_b',cz);await step(.45);await shot('hz_c',cz);await step(.3);await shot('hz_boom',cz);
/* evolution: 3 shells */
await pg.evaluate(()=>{const g=G;g.en=[];const w=g.weapons.get('hellzone');w.evo=2;w.lv=3;for(let i=0;i<3;i++)for(let j=0;j<5;j++){const e=g.mkEnemy(Object.values(ENEMIES)[j%4],g.p.x+(i-1)*210+rnd(-25,25),g.p.y+(i%2?110:-130)+rnd(-25,25));e.hp=e.max=1e6;e.armor=0;e.spd=0;g.en.push(e);}w.cd=0;});
await step(1.7);await shot('hz_evo2',{x:340,y:60,width:700,height:640});
/* Special Beam Cannon */
await start('piccolo',1);await crowd(5,260,-8,10);await crowd(4,450,-8,14);
await pg.evaluate(()=>{const g=G;g.setLevel(8);g.modal=null;g.weapons.clear();g.abCd=0;g.useAbility();});
await step(.6);await shot('sbc_charge');await step(.55);await step(.1);await shot('sbc_fire');
await pg.evaluate(()=>{const g=G;g.en=[];g.fx=[];g.setLevel(60);g.formIdx=LINES[g.C.line].length-1;g.recalc();});
/* Toppo */
await start('toppo',1);await crowd(10,280,0,70);
await pg.evaluate(()=>{const g=G;g.setLevel(8);g.modal=null;g.weapons.clear();g.abCd=0;g.useAbility();});
const cs={x:640,y:200,width:420,height:360};await step(.35);await shot('sph_fly',cs);await step(1.2);await shot('sph_hold',cs);await step(.5);await shot('sph_boom',cs);
/* Gotenks ghosts */
await start('gotenks',5);await crowd(6,250,0,60);
const cg={x:560,y:200,width:480,height:360};
await pg.evaluate(()=>{const g=G;g.setLevel(8);g.modal=null;g.abCd=0;for(const id of['kame','spirit'])g.addWeapon(id);g.weapons.forEach(w=>w.cd=99);g.useAbility();});
await step(.45);await shot('gh_a',cg);await step(.4);await shot('gh_b',cg);await step(.12);await shot('gh_c',cg);
await pg.evaluate(()=>{G.ghostT=.01;});await step(.3);await shot('gh_kami',cg);
console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
