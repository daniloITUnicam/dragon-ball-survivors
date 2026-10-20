/* end-of-stage screen: compact two columns (weapon stats on the right), unlock notices only as toasts, tickets as chips, Endless button locked until the stage is cleared on Extreme; weapon unlock by winning */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:640}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const run=(diff,win,pre)=>pg.evaluate((diff,win,pre)=>{const A=__app,d=A.save.d;d.settings.sandbox=false;if(pre)pre(d);
  A.startGame({stage:5,char:'goku',diff,x2:false,sandbox:false,pet:'none'});const g=A.game;window.G=g;g.sb.nospawn=true;g.modal=null;g.t=300;g.kills=240;
  g.dmgBy={kame:123456,ki:45000,disc:9800,other:3300};g.run.tk={t1:2,t10:1,l10:0};g.run.tsold=3;
  g.finish(win);return true;},diff,win,null);
await run('normal',true);await wait(500);
let o=await pg.evaluate(()=>({cols:!!document.querySelector('.endcols'),rows:document.querySelectorAll('.wrow').length,names:[...document.querySelectorAll('.wn')].map(x=>x.textContent).join(','),lv:[...document.querySelectorAll('.wlv')].length,
  chips:[...document.querySelectorAll('.tchip')].map(x=>x.textContent),text:document.querySelector('.end').textContent,end:(()=>{const e=document.querySelector('[data-fid="endless"]');return e&&{dis:e.disabled,txt:e.textContent,lk:!!e.querySelector('.lk'),title:e.title+((e.closest('.endwrap')||{querySelector:()=>null}).querySelector('.etip')||{textContent:''}).textContent};})(),
  btns:[...document.querySelectorAll('.end .row .btn')].map(x=>x.textContent),h:document.querySelector('.end').getBoundingClientRect().height,vh:innerHeight}));
ok(o.cols&&o.rows===4&&/Kame/i.test(o.names),'two columns: weapon stats (icon, name, bar, damage) on the right ('+o.rows+' rows: '+o.names+')');
ok(o.lv>=1,'weapon levels are shown beside the names');
ok(o.chips.length===3&&/2×/.test(o.chips[0])&&/💰 3/.test(o.chips[2]),'tickets and sold trinkets as compact chips ('+o.chips.join(' | ')+')');
ok(!/Collega|completa tutti|Complete all|unlock it|Ticket trovati|Tickets found|Sbloccat|unlocked/i.test(o.text),'no unlock / endless / tickets sentences on the screen');
ok(o.end&&o.end.dis&&o.end.lk&&/Extrem|Extreme/i.test(o.end.title),'Endless button is next to Retry / Menu and locked until Extreme ('+o.btns.join(' | ')+')');
ok(o.h<=o.vh,'the whole screen fits the window ('+Math.round(o.h)+' <= '+o.vh+')');
await pg.screenshot({path:'/tmp/end_new.png'});
/* clearing on Extreme records the stage and unlocks the button */
await run('extreme',true);await wait(500);
o=await pg.evaluate(()=>({xc:__app.save.d.xc[5]||__app.save.d.xc.some(x=>x),end:(()=>{const e=document.querySelector('[data-fid="endless"]');return e&&{dis:e.disabled,txt:e.textContent};})()}));
ok(o.xc&&o.end&&!o.end.dis&&/∞/.test(o.end.txt),'winning on Extreme records the stage and unlocks the Endless button');
const cl=await pg.evaluate(()=>{document.querySelector('[data-fid="endless"]').click();return{st:__app.state,cont:G.continued,ended:G.ended};});
ok(cl.st==='play'&&cl.cont,'the Endless button continues the run');
/* a later defeat on the same stage: still locked (win needed), other stage unaffected */
await run('normal',false);await wait(500);
o=await pg.evaluate(()=>{const e=document.querySelector('[data-fid="endless"]');return{dis:e.disabled,title:e.title+((e.closest('.endwrap')||{querySelector:()=>null}).querySelector('.etip')||{textContent:''}).textContent};});
ok(o.dis&&/Vinci|Win/i.test(o.title),'after a defeat the button says to win the stage first ('+o.title+')');
/* the stage cleared on Extreme belongs to that stage only */
const other=await pg.evaluate(()=>{const d=__app.save.d;return d.xc.filter(x=>x).length;});
ok(other===1,'only the stage cleared on Extreme is marked');
/* weapon unlock: simply winning with the owner, once per weapon, any difficulty */
const wu=await pg.evaluate(()=>{const A=__app,d=A.save.d;d.wu={ki:1};d.settings.sandbox=false;
  const seen=[];A.progress.notify=n=>{if(n.type==='weapon')seen.push(n.id+(n.evo2?'*':''));};
  const go=(char,win,diff)=>{A.startGame({stage:5,char,diff,x2:false,sandbox:false,pet:'none'});const g=A.game;g.sb.nospawn=true;g.modal=null;g.finish(win);};
  go('goku',false,'normal');const lost=Object.keys(d.wu).join();
  go('goku',true,'easy');const afterEasy=Object.keys(d.wu).join();
  go('goku',true,'normal');const again=seen.join();
  return{lost,afterEasy,again};});
ok(wu.lost==='ki','losing unlocks nothing ('+wu.lost+')');
ok(/kame/.test(wu.afterEasy),'winning a map with the owner unlocks the weapon (even on Easy) ('+wu.afterEasy+')');
ok(wu.again==='kame','and it is announced only once ('+wu.again+')');
const ac=await pg.evaluate(()=>{const a=ACHIEVEMENTS.find(x=>x.id==='wu_javelin');return a&&[a.d.it,a.d.en];});
ok(ac&&!/livello 50|level 50/i.test(ac[0]+ac[1]),'achievement text no longer mentions level 50 ('+ac[1]+')');
console.log(errs.length?errs.slice(0,4):'no errors');await b.close();process.exit(errs.length||process.exitCode?1:0);})();
