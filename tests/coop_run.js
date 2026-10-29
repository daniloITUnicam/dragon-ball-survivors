/* v120: co-op run - two pages in one browser (host Alpha, client Beta), WebRTC data channels signalled through BroadcastChannel (?coopLocal=1).
   Checks: both sides start, snapshots reach the client, the client's stick moves its hero on the host, shared level-up windows (the world keeps going, 6 s to choose),
   a fallen hero gets up next to a teammate, the end reaches the client, nothing throws while drawing. */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--disable-features=WebRtcHideLocalIpsWithMdns','--autoplay-policy=no-user-gesture-required']});
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const OUT=process.env.SHOTS||'/tmp/o',URL='file:///home/claude/dbs/dist/dragon-ball-survivors.html?coopLocal=1';
const errs=[];
const open=async nick=>{const pg=await b.newPage();await pg.setViewport({width:1280,height:720});
  pg.on('pageerror',e=>errs.push(nick+': '+e.message));pg.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|Failed to load resource/.test(m.text()))errs.push(nick+' console: '+m.text());});
  await pg.goto(URL);await wait(1500);
  await pg.evaluate(n=>{const A=__app,cl=A.cloud;A.save.d.settings.hints=false;window.__calls=[];
    cl.enabled=true;Object.defineProperty(cl,'uid',{get:()=>'u-'+n,configurable:true});cl.nick=n;
    cl.rpc=async(name,a)=>{window.__calls.push([name,a]);return null;};},nick);
  return pg;};
const H=await open('Alpha'),C=await open('Beta');
const st={code:'TS01',host:'Alpha',status:'starting',seed:424242,stage:0,diff:'normal',mode:'classic',members:[{nick:'Alpha',ch:'goku'},{nick:'Beta',ch:'vegeta'}]};
await H.evaluate(s=>COOPG.begin(__app,s),st);await C.evaluate(s=>COOPG.begin(__app,s),st);
ok(await C.evaluate(()=>!!document.getElementById('coopconn')),'connecting overlay while the peers meet');
const until=async(pg,f,ms=12000)=>{const t0=Date.now();while(Date.now()-t0<ms){if(await pg.evaluate(f))return true;await wait(150);}return false;};
ok(await until(H,()=>!!(__app.game&&__app.game.coop&&__app.game.coop.mates.length===1)),'host: the run starts with the client as a mate');
ok(await until(C,()=>!!(COOPG.view&&COOPG.lastSnap)),'client: view game created, snapshots arriving');
ok(await C.evaluate(()=>!document.getElementById('coopconn')),'connecting overlay gone once playing');
const s0=await C.evaluate(()=>({ch:__app.game.C.id,others:[...COOPG.others.keys()],state:__app.state}));
ok(s0.ch==='vegeta'&&s0.others.includes('Alpha')&&s0.state==='play','client plays Vegeta and sees Alpha ('+JSON.stringify(s0)+')');
await H.evaluate(()=>{__app.game.sb.god=true;});
/* enemies appear on the client */
ok(await until(C,()=>__app.game.en.length>0,15000),'client: enemies from the host snapshots');
/* the client's stick */
const x0=await H.evaluate(()=>__app.game.coop.mates[0].h.p.x);
await C.bringToFront();await C.keyboard.down('KeyD');await wait(1200);await C.keyboard.up('KeyD');
const x1=await H.evaluate(()=>__app.game.coop.mates[0].h.p.x);
ok(x1>x0+40,'client input moves its hero on the host ('+Math.round(x0)+' → '+Math.round(x1)+')');
const cx=await C.evaluate(()=>__app.game.p.x);
ok(Math.abs(cx-x1)<120,'client hero follows the host position ('+Math.round(cx)+')');
await H.bringToFront();await H.screenshot({path:OUT+'/coop_run_host.png'});await C.bringToFront();await C.screenshot({path:OUT+'/coop_run_client.png'});
/* shared level-up */
await H.evaluate(()=>{const g=__app.game;g.coop.mates[0].h.ru.rr=1;g.addXp(g.need+1);});
ok(await until(C,()=>!!(__app.game.modal&&__app.ui.modalEl)),'client: own level-up window');
const hp=await H.evaluate(()=>{const g=__app.game,t0=g.t;return{mq:g.coop.mq.length,modal:!!g.modal,paused:g.coopPaused(),t0};});
await wait(700);
const hp2=await H.evaluate(()=>{const g=__app.game,m=g.coop.mates[0];return{t:g.t,inv:m.h.p.inv>0&&g.p.inv>0,ch:g.coopChoosing('Beta')&&g.coopChoosing('Alpha')};});
ok(hp.mq===1&&hp.modal&&!hp.paused&&hp2.t>hp.t0+.12,'both windows open and the world keeps going ('+JSON.stringify(hp)+' → t '+hp2.t.toFixed(2)+')');
ok(hp2.inv&&hp2.ch,'whoever is choosing is invulnerable');
ok(await C.evaluate(()=>!!document.querySelector('.screen.modal .ctimer'))&&await H.evaluate(()=>!!document.querySelector('.screen.modal .ctimer')),'the 6-second bar in both windows');
ok(await C.evaluate(()=>document.querySelector('.screen.modal h2').textContent.includes(String(__app.game.lvl))),'client window shows the shared level');
await C.evaluate(()=>{__app.game.rerollLevel();});
ok(await until(H,()=>__app.game.coop.mates[0].h.ru.rr===0,3000)&&await until(C,()=>__app.game.ru.rr===0&&!!__app.ui.modalEl,3000),'client reroll: done on the host, the window comes back redrawn');
const wl=()=>H.evaluate(()=>{const m=__app.game.coop.mates[0];return [...m.h.weapons.values()].reduce((s,w)=>s+w.lv,0)+Object.values(m.h.pass).reduce((s,v)=>s+v,0)+m.h.trinkets.length;});
const wl0=await wl();
await H.evaluate(()=>__app.resolveModal(0));
await C.screenshot({path:OUT+'/coop_run_level.png'});
/* Beta does not answer: after 6 s a card is taken for them */
ok(await until(H,()=>__app.game.coop.mq.length===0,9000),'time up: a card is taken for the client');
ok(await until(C,()=>__app.state==='play'&&!__app.ui.modalEl,3000),'client window closed by the host');
const wl1=await wl();ok(wl1>wl0,'the random card went to the client\'s hero ('+wl0+' → '+wl1+')');
/* Beta answers at once this time; the host lets its own window run out */
await H.evaluate(()=>{const g=__app.game;g.addXp(g.need+1);});
ok(await until(C,()=>!!(__app.game.modal&&__app.ui.modalEl)),'second level-up reaches the client');
await C.evaluate(()=>__app.resolveModal(0));
ok(await until(H,()=>__app.game.coop.mq.length===0,3000),'client chose in time');
const lv2=await H.evaluate(()=>__app.game.lvl);
ok(await until(H,()=>!__app.game.modal&&__app.state==='play',9000),'host window: a card is taken when the time is up');
ok(await C.evaluate(()=>__app.state==='play'&&!__app.ui.modalEl),'client back in play');
/* down + revive */
await H.evaluate(()=>{const g=__app.game,m=g.coop.mates[0];m.h.revives=0;g.withHero(m,()=>g.coopLethal());g.p.x=m.h.p.x+10;g.p.y=m.h.p.y;});
ok(await H.evaluate(()=>__app.game.coop.mates[0].h.p.down===true&&!__app.game.dying),'mate down, the run goes on');
ok(await until(C,()=>__app.game.p.down===true,3000),'client sees itself down');
await H.evaluate(()=>{const g=__app.game,m=g.coop.mates[0];g.p.x=m.h.p.x+10;g.p.y=m.h.p.y;});
ok(await until(H,()=>{const g=__app.game,m=g.coop.mates[0];g.p.x=m.h.p.x+10;g.p.y=m.h.p.y;return !m.h.p.down;},8000),'revived after standing next to the teammate');
/* the end */
await H.evaluate(()=>{__app.game.cleared=true;__app.game.finish(true);});
ok(await until(C,()=>__app.state==='end',6000),'client: the end screen');
ok(await H.evaluate(()=>window.__calls.some(c=>c[0]==='coop_post')&&window.__calls.some(c=>c[0]==='room_playing')),'host posts the team score');
await wait(1800);
ok(await H.evaluate(()=>!COOPG.net)&&await C.evaluate(()=>!COOPG.net),'connections closed');
await C.screenshot({path:OUT+'/coop_run_end.png'});
ok(errs.length===0,'no errors'+(errs.length?': '+errs.slice(0,6).join(' | '):''));
await b.close();})().catch(e=>{console.error(e);process.exit(1);});
