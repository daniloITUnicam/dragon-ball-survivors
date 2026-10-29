/* v121: dynamic resolution - slow frames lower the canvas size step by step (not under 60%), a step that brings no gain is undone,
   fast frames bring it back to 100%, the setting turns it off. */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const r=await pg.evaluate(()=>{const R=__app.renderer,s=__app.save.d.settings,out={};s.dynRes=true;R.dyn=1;R.dd=null;R.resize();const W0=R.cv.width;out.W0=W0;
  const feed=(fps,sec)=>{for(let i=0;i<fps*sec;i++){R.dynTick(1/fps);if(R.dynPend){R.dynPend=false;R.resize();}}};
  /* slow, and lowering helps: 40 fps -> 47 fps -> ... */
  feed(36,1.6);out.d1=R.dyn;feed(40,1.6);out.d2=R.dyn;feed(44,1.6);out.d3=R.dyn;out.W3=R.cv.width;
  feed(48,1.6);feed(52,1.6);out.dmin=R.dyn;feed(45,1.6);feed(45,1.6);out.dmin2=R.dyn;
  /* smooth again: back up to 100% */
  for(let k=0;k<30;k++)feed(60,1.6);out.dup=R.dyn;out.Wup=R.cv.width;
  /* a 30 Hz screen: lowering gives nothing -> undone, and after two tries it stops */
  R.dd=null;for(let k=0;k<20;k++)feed(30,1.6);out.d30=R.dyn;out.fail=R.dd.fail;
  /* off */
  s.dynRes=false;R.dyn=.7;R.dynTick(1/60);if(R.dynPend){R.dynPend=false;R.resize();}out.off=R.dyn;out.Woff=R.cv.width;s.dynRes=true;
  return out;});
ok(r.d1===.9&&r.d2===.8&&r.d3<=.8&&r.W3<r.W0,'slow frames lower the resolution step by step ('+[r.d1,r.d2,r.d3].join(' → ')+', '+r.W0+' → '+r.W3+' px)');
ok(r.dmin===.6&&r.dmin2>=.6,'never under 60% ('+r.dmin+', '+r.dmin2+')');
ok(r.dup===1&&r.Wup===r.W0,'smooth again: back to 100%');
ok(r.d30===1&&r.fail>=2,'a step that does not help is undone, and it stops trying (30 Hz screen: '+r.d30+', tries '+r.fail+')');
ok(r.off===1&&r.Woff===r.W0,'the setting turns it off');
ok(await pg.evaluate(()=>{__app.ui.show('settings',{tab:'video'});return !!document.querySelector('[data-fid=tdynRes]');}),'Settings > Video has the switch');
ok(!errs.length,'no errors '+errs.slice(0,2).join('|'));
await b.close();})();
