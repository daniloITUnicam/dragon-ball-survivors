const pp=require('/opt/npm-tools/node_modules/puppeteer');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1200,height:760});const errs=[];pg.on('pageerror',e=>errs.push('PE '+e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(800);
await pg.evaluate(()=>{const a=window.__app;a.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true,pet:'dende'});});await wait(500);
// zones: find a heal zone and a trap, teleport
const z=await pg.evaluate(()=>{const g=window.__app.game;g.sb.nospawn=true;g.sb.god=true;let heal=null,trap=null;for(let cx=-6;cx<=6;cx++)for(let cy=-6;cy<=6;cy++){const z=World.zone(g.stage.theme,cx,cy);if(!z)continue;if(z.kind==='heal'&&!heal)heal=z;if(z.kind==='trap'&&!trap)trap=z;}return{heal:heal&&[heal.x,heal.y],trap:trap&&[trap.x,trap.y]};});
console.log(JSON.stringify(z));
if(z.trap){await pg.evaluate(t=>{const g=window.__app.game;g.p.x=t[0]+90;g.p.y=t[1]+30;},z.trap);await wait(300);await pg.screenshot({path:'/tmp/o/z_trap.png'});}
if(z.heal){await pg.evaluate(t=>{const g=window.__app.game;g.p.hp=40;g.p.x=t[0]+60;g.p.y=t[1]+20;},z.heal);await wait(500);await pg.screenshot({path:'/tmp/o/z_heal.png'});}
// totem
await pg.evaluate(()=>{const g=window.__app.game;g.p.x=0;g.p.y=0;g.feat.push({kind:'totem',x:70,y:-20,t:0,ttl:110,used:false,dead:false});});await wait(400);await pg.screenshot({path:'/tmp/o/totem.png'});
await pg.evaluate(()=>{const g=window.__app.game;g.modal={type:'totem'};});await wait(700);await pg.screenshot({path:'/tmp/o/totem_modal.png'});
await pg.evaluate(()=>{const a=window.__app;a.resolveModal(1);});await wait(300);
// boss pick
await pg.evaluate(()=>{const g=window.__app.game;g.luckBonus=.45;g.recalc();g.modal={type:'pick',opts:g.rollTrinketList(g.pickCount())};});await wait(800);await pg.screenshot({path:'/tmp/o/pick.png'});
const pc=await pg.evaluate(()=>{const g=window.__app.game;return g.pickCount()+' '+g.modal.opts.join(',');});console.log(pc);
await pg.evaluate(()=>{window.__app.resolveModal(0);});await wait(300);
// spirit room
await pg.evaluate(()=>{const g=window.__app.game;g.startTrial();});await wait(900);await pg.screenshot({path:'/tmp/o/trial1.png'});
await pg.evaluate(()=>{const g=window.__app.game,b=g.trial.btn[0];g.p.x=b.x;g.p.y=b.y;});await wait(900);await pg.screenshot({path:'/tmp/o/trial2.png'});
console.log(errs.join('\n')||'noerr');await b.close();})();
