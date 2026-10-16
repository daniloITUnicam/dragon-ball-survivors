/* kill streak: counter, 4 s window, milestones pay XP, HUD, run record + achievements */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:640,deviceScaleFactor:2}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
await pg.evaluate(()=>{__app.startGame({stage:5,char:'goku',diff:'normal',x2:false,sandbox:false});const g=__app.game;g.sb&&(g.sb.god=true);window.G=g;g.modal=null;g.en=[];g.eb=[];g.loot=[];});
await wait(300);
/* counting + window */
const a=await pg.evaluate(()=>{const g=G;g.streak=0;g.xp=0;for(let i=0;i<10;i++)g.bumpStreak();const s10=g.streak,t10=g.streakT;
  let ticks=0;for(let i=0;i<30*3;i++){g.en=[];g.update(1/30);ticks++;}const after3=g.streak;
  for(let i=0;i<30*1.5;i++){g.en=[];g.update(1/30);}return{s10,t10,after3,after45:g.streak,best:g.run.streak};});
ok(a.s10===10&&a.t10===4,'each kill adds to the streak and restarts the 4 s window');
ok(a.after3===10&&a.after45===0&&a.best===10,'still alive after 3 s, broken after 4.5 s without kills; record kept ('+a.best+')');
/* milestones pay XP only at 25, 50, 100... */
const m=await pg.evaluate(()=>{const g=G;g.streak=0;g.xp=0;g.need=100;const xp=[];let last=0,says=0;const say0=g.say.bind(g);g.say=(...a)=>{says++;return say0(...a);};
  for(let i=1;i<=210;i++){g.bumpStreak();if(g.xp!==last){xp.push([i,+(g.xp-last).toFixed(2)]);last=g.xp;}}return{xp,says,streak:g.streak};});
ok(m.xp.map(v=>v[0]).join()==='25,50,100,200','XP awarded exactly at the milestones ('+m.xp.map(v=>v[0]).join(', ')+')');
ok(m.xp[0][1]>0&&m.xp[0][1]<=5&&m.xp[3][1]>m.xp[0][1]&&m.xp[3][1]<=15,'small rewards, growing with the milestone ('+m.xp.map(v=>v[1]).join(', ')+' XP for a 100 XP level, x S.xp)');
ok(m.says===4,'one banner per milestone ('+m.says+')');
/* HUD */
await pg.evaluate(()=>{const g=G;g.streak=137;g.streakT=2.2;g.streakPop=.2;__app.renderer.draw(g,0);});
await pg.screenshot({path:'/tmp/streak_hud.png',clip:{x:800,y:0,width:300,height:200}});
/* record + achievements (regular run) */
const r=await pg.evaluate(()=>{const g=G;g.streak=0;g.run.streak=0;for(let i=0;i<60;i++)g.bumpStreak();const d=__app.save.d;for(const k of['ks50','ks200','ks500','ks1000'])delete d.ach[k];const before=!!d.ach.ks50;__app.progress.live(g);const got50=!!d.ach.ks50,got200=!!d.ach.ks200;
  g.endRunManually&&0;g.finish(false);return{before,got50,got200,rec:d.stats.rec.streak,ids:ACHIEVEMENTS.filter(a=>/^ks/.test(a.id)).map(a=>a.id+':'+a.reward)};});
ok(!r.before&&r.got50&&!r.got200,'achievement "On Fire" at 50 in a row, not the 200 one ('+r.ids.join(' ')+')');
ok(r.rec===60,'the best streak is stored with the personal records ('+r.rec+')');
console.log(errs.length?errs.slice(0,4):'no page errors');await b.close();process.exit(errs.length||process.exitCode?1:0);})();
