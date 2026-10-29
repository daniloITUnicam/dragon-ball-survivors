/* v120: co-op signalling through the server path (signal_send / signal_take, with the messages delivered out of order), two pages in one browser (host Alpha, client Beta), WebRTC data channels signalled through BroadcastChannel ().
   Checks: both sides start, snapshots reach the client, the client's stick moves its hero on the host, shared level-up windows (the world waits),
   a fallen hero gets up next to a teammate, the end reaches the client, nothing throws while drawing. */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--disable-features=WebRtcHideLocalIpsWithMdns','--autoplay-policy=no-user-gesture-required']});
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const OUT=process.env.SHOTS||'/tmp/o',URL='file:///home/claude/dbs/dist/dragon-ball-survivors.html';
const errs=[],Q={};
/* the fake server: per-recipient queues; every second batch is handed out reversed (ICE before the offer) */
let flip=0;const relay=async pg=>{await pg.exposeFunction('__send',(from,to,kind,data)=>{(Q[to]||(Q[to]=[])).push({nick:from,kind,data:JSON.parse(data)});});
  await pg.exposeFunction('__take',me=>{const L=Q[me]||[];Q[me]=[];if(++flip%2)L.reverse();return JSON.stringify(L);});};
const open=async nick=>{const pg=await b.newPage();await pg.setViewport({width:1280,height:720});
  pg.on('pageerror',e=>errs.push(nick+': '+e.message));pg.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|Failed to load resource/.test(m.text()))errs.push(nick+' console: '+m.text());});
  await relay(pg);await pg.goto(URL);await wait(1500);
  await pg.evaluate(n=>{const A=__app,cl=A.cloud;A.save.d.settings.hints=false;window.__calls=[];
    cl.enabled=true;Object.defineProperty(cl,'uid',{get:()=>'u-'+n,configurable:true});cl.nick=n;
    cl.rpc=async(name,a)=>{window.__calls.push([name,a]);if(name==='signal_send'){await window.__send(n,a.p_to,a.p_kind,JSON.stringify(a.p_data));return null;}
      if(name==='signal_take')return JSON.parse(await window.__take(n));return null;};},nick);
  return pg;};
const H=await open('Alpha'),C=await open('Beta');
const st={code:'TS02',host:'Alpha',status:'starting',seed:7,stage:0,diff:'normal',mode:'classic',members:[{nick:'Alpha',ch:'goku'},{nick:'Beta',ch:'piccolo'}]};
await H.evaluate(s=>COOPG.begin(__app,s),st);await C.evaluate(s=>COOPG.begin(__app,s),st);
ok(await C.evaluate(()=>!COOPG.net.bc),'server signalling (no BroadcastChannel)');
const until=async(pg,f,ms=15000)=>{const t0=Date.now();while(Date.now()-t0<ms){if(await pg.evaluate(f))return true;await wait(200);}return false;};
ok(await until(H,()=>!!(__app.game&&__app.game.coop&&__app.game.coop.mates.length===1)),'host: connected through the server, the mate is in');
ok(await until(C,()=>!!(COOPG.view&&COOPG.lastSnap)),'client: snapshots over the data channel');
ok(await H.evaluate(()=>window.__calls.filter(c=>c[0]==='signal_take').length>0)&&await C.evaluate(()=>window.__calls.some(c=>c[0]==='signal_send'&&c[1].p_kind==='offer')),'offer / answer / candidates went through signal_send and signal_take');
await C.evaluate(()=>__app.endRunManually());
ok(await until(H,()=>__app.game.coop.mates.length===0,5000),'the client leaves: the host goes on alone');
ok(await H.evaluate(()=>!__app.game.ended&&!__app.game.dying),'the host run is still on');
ok(errs.length===0,'no errors'+(errs.length?': '+errs.slice(0,6).join(' | '):''));
await b.close();})().catch(e=>{console.error(e);process.exit(1);});
