/* ability electricity grows with the transformation; the player is drawn above every effect; Kaioken aura; test mode gives no rewards */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:640}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const r=await pg.evaluate(async()=>{const o={};
 __app.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.god=true;window.G=g;
 window.step=(n,dr)=>{for(let f=0;f<n;f++){if(dr)__app.renderer.draw(g,1/60);if(g.modal){try{__app.resolveModal(0);}catch(e){}if(g.modal)g.modal=null;}g.update(1/60);if(g.p.hp<g.p.maxHp*.6)g.p.hp=g.p.maxHp;}};
 for(const id of Object.keys(WEAPONS)){const w=g.addWeapon(id);w.lv=5;w.evo=1;}
 for(let i=0;i<12;i++)g.spawnEnemy&&0;
 o.calls=[];const orig=ELEC.pt;
 for(const lvl of [0,3,6]){g.formIdx=lvl-1;g.formColor=lvl?'#ffd23f':null;ELEC.n=0;let cnt=0;const oz=ELEC.zig;ELEC.zig=function(){cnt++;return oz.apply(this,arguments);};step(120,true);ELEC.zig=oz;o.calls.push([lvl,cnt]);}
 return o;});
console.log(JSON.stringify(r.calls));
ok(r.calls[0][1]===0,'no electricity in base form');ok(r.calls[1][1]>0&&r.calls[2][1]>r.calls[1][1],'more arcs with higher transformations');
await pg.evaluate(()=>{const g=G;g.formIdx=5;g.formColor='#ffd23f';g.kai=2;g.recalc&&g.recalc();step(60,true);__app.renderer.draw(g,1/60);});await wait(200);await pg.screenshot({path:'/tmp/kai2.png'});
await pg.evaluate(()=>{const g=G;g.kai=1;step(30,true);__app.renderer.draw(g,1/60);});await wait(100);await pg.screenshot({path:'/tmp/kai1.png'});
/* player drawn after projectiles/fx */
const order=await pg.evaluate(()=>{const g=G;g.kai=0;const seq=[];const R=__app.renderer;if(!R)return 'norenderer';const op=R.drawPlayer.bind(R);R.drawPlayer=function(a,b){seq.push('P');return op(a,b);};step(2,true);R.drawPlayer=op;return seq.length;});
console.log('drawPlayer calls per 2 frames',order);
/* test mode (settings.sandbox) must not give zenny / achievements */
const t=await pg.evaluate(()=>{const A=__app;const d=A.save.d||A.save.data||A.save;const pr=A.progress||A.game.progress;
 const dd=pr.d;dd.settings.sandbox=true;const z0=dd.zenny,a0=Object.keys(dd.ach).length;
 A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false});const g=A.game;g.run.coins=999;g.kills=5000;g.t=400;
 const res=pr.finishRun(g,true);pr.live(g);pr.checkAch(g);
 return {z0,z1:dd.zenny,a0,a1:Object.keys(dd.ach).length,sb:res.sandbox,total:res.total};});
console.log(JSON.stringify(t));ok(t.z0===t.z1&&t.a0===t.a1&&t.sb&&t.total===0,'test mode: no zenny, no achievements');
console.log(errs.length?errs.slice(0,4):'no errors');await b.close();process.exit(errs.length?1:process.exitCode||0);})();
