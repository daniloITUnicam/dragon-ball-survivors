/* Music files mapped to stages by name, looping with a crossfade. Build: DBS_OUT=/tmp/o/music_small.html DBS_AUDIO_BUDGET_MB=8.6 python3 build.py */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const HTML=process.env.HTML||'/tmp/o/music_small.html';
if(!require('fs').existsSync(HTML)||!require('fs').readdirSync(require('path').join(__dirname,'..','assets')).some(f=>/\.mp3$/i.test(f))){console.log('SKIP no music files in assets/ (or no '+HTML+')');process.exit(0);}   /* a checkout without the audio files */
(async()=>{
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+HTML);await wait(1500);
  const ev=(f,...a)=>pg.evaluate(f,...a);
  const keys=await ev(()=>Object.keys(FILE_TRACKS).sort().join());
  ok(/menu/.test(keys)&&/stage\d/.test(keys),'tracks mapped by name (those that fit the 8.6 MB budget): '+keys);
  ok(await ev(()=>Object.values(FILE_TRACKS).every(u=>u.startsWith('data:audio/mpeg;base64,'))),'embedded as data URIs');
  await ev(()=>{const a=window.__app.audio;a.unlock();a.play('stage3');});await wait(1500);
  const st=await ev(()=>{const f=window.__app.audio.files.stage3;return{on:f.on,dur:f.a.el.duration,paused:f.a.el.paused,t:f.a.el.currentTime};});
  console.log(JSON.stringify(st));
  ok(st.on&&st.dur>150,'stage3 file loaded, duration '+Math.round(st.dur)+'s');
  if(st.dur>150){
    await ev(()=>{const f=window.__app.audio.files.stage3;f.a.el.currentTime=f.a.el.duration-4;});await wait(1500);
    const x=await ev(()=>{const f=window.__app.audio.files.stage3;return{cur:f.cur,xf:f.xf,bt:f.b.el.currentTime,bp:f.b.el.paused};});
    ok(x.cur==='b'&&x.bt>0&&!x.bp,'crossfade started: second element playing from the start '+JSON.stringify(x));
    await wait(3500);
    const y=await ev(()=>{const f=window.__app.audio.files.stage3;return{xf:f.xf,ap:f.a.el.paused};});
    ok(!y.xf&&y.ap,'crossfade finished, first element parked '+JSON.stringify(y));
  }
  await ev(()=>window.__app.audio.play('stage4'));await wait(1300);
  ok(await ev(()=>window.__app.audio.files.stage3.on===false&&window.__app.audio.files.stage4.on===true),'switching stage fades the previous file out');
  ok(errs.length===0,'no JS errors '+errs.join('|'));
  await b.close();console.log(fails?'FAILED':'ALL OK');process.exit(fails?1:0);
})().catch(e=>{console.log('ERR',e);process.exit(2)});
