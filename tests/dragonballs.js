/* Dragon Balls: sprite sheet (1..7 stars), bouncing + glow drawing, tiny pick-up radius (no magnet), pick-up sound from assets/sphere_sound.mp3, HUD */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required'],defaultViewport:{width:1100,height:640,deviceScaleFactor:2}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
await pg.mouse.click(5,5);await wait(800);       /* a click unlocks the audio and starts decoding the sound */
/* ---- sheet + sound ---- */
const sh=await pg.evaluate(()=>{const im=__app.renderer.ballSheet();return im?{w:im.naturalWidth,h:im.naturalHeight}:null;});
await wait(500);
const sh2=await pg.evaluate(()=>{const im=__app.renderer.ballSheet();return im?{w:im.naturalWidth,h:im.naturalHeight}:null;});
ok(sh2&&sh2.w===448&&sh2.h===64,'sprite sheet loaded: 7 frames of 64x64 ('+JSON.stringify(sh2)+')');
const snd=await pg.evaluate(async()=>{const a=__app.audio;for(let i=0;i<30&&!(a.bufs&&a.bufs.sphere);i++)await new Promise(r=>setTimeout(r,100));return{ctx:!!a.ctx,dur:a.bufs&&a.bufs.sphere?a.bufs.sphere.duration:0,file:Object.keys(FILE_SFX),play:a.bufs&&a.bufs.sphere?a.playBuf('sphere',.0):false};});
const linkedSfx=await pg.evaluate(()=>String(FILE_SFX.sphere).startsWith('assets/'));   /* link build: the page only points at the file (and a page opened from disk cannot fetch it) */
if(linkedSfx)ok(snd.file.includes('sphere')&&require('fs').existsSync(require('path').join(__dirname,'..','assets','sphere_sound.mp3')),'assets/sphere_sound.mp3 is linked (link build) and the file exists');
else if(!snd.file.includes('sphere'))console.log('SKIP the pick-up sound: this build has no assets/sphere_sound.mp3');   /* (a checkout without the audio files) */
else ok(snd.ctx&&snd.dur>1.9&&snd.dur<2.1&&snd.play,'assets/sphere_sound.mp3 embedded, decoded ('+snd.dur.toFixed(2)+' s) and playable');
/* ---- bounce ---- */
const hop=await pg.evaluate(()=>{const R=__app.renderer,o=[];let bad=0;for(let t=0;t<12;t+=.005){const q=R.ballHop(t);if(!(q.h>=-1e-9)||!isFinite(q.h)||!isFinite(q.since))bad++;o.push([t,q.h,q.since,q.lv]);}
  const peaks=[];for(let i=1;i<o.length-1;i++)if(o[i][1]>o[i-1][1]&&o[i][1]>=o[i+1][1]&&o[i][1]>2)peaks.push(+o[i][1].toFixed(1));
  const land=[];for(let i=1;i<o.length;i++)if(o[i-1][1]>0&&o[i][1]<=0)land.push(+o[i][0].toFixed(2));
  return{bad,peaks:peaks.slice(0,8),land:land.slice(0,8),end:R.ballHop(30)};});
ok(hop.bad===0,'bounce height never below the ground, no NaN');
ok(hop.peaks[0]>hop.peaks[1]&&hop.peaks[1]>hop.peaks[2]&&hop.peaks[0]>25,'real bounces: each hop lower than the one before ('+hop.peaks.slice(0,4).join(' > ')+' px)');
ok(hop.peaks.length>=8&&Math.abs(hop.peaks[hop.peaks.length-1]-hop.peaks[hop.peaks.length-2])<.6,'then a steady lively hop every 1.6 s ('+hop.peaks.slice(-3).join(', ')+' px, landings '+hop.land.slice(-3).join(', ')+')');
/* ---- pick-up: no magnet, tiny radius ---- */
await pg.evaluate(()=>{__app.startGame({stage:5,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.god=true;window.G=g;g.modal=null;g.en=[];g.loot=[];g.balls=0;g.ballSet=[];});
await wait(300);
const t1=await pg.evaluate(()=>{const g=G,p=g.p;g.loot=[];g.spawnLoot('ball',p.x+40,p.y);const l=g.loot[0];const star=l.star;
  let sfx=[];const o=g.audio.sfx.bind(g.audio);g.audio.sfx=n=>{sfx.push(n);o(n);};window.__sfx=sfx;
  for(let i=0;i<300;i++){g.p.x=p.x;g.updatePickups(1/60);}   /* 5 s next to it */
  return{still:!l.dead,dist:Math.hypot(l.x-p.x,l.y-p.y),balls:g.balls,star};});
ok(t1.still&&t1.balls===0&&Math.abs(t1.dist-40)<1e-6,'a ball 40 px away is NOT attracted and not collected (distance still '+t1.dist.toFixed(1)+')');
const t2=await pg.evaluate(()=>{const g=G,p=g.p,l=g.loot[0];p.x=l.x-18;p.y=l.y;g.updatePickups(1/60);const far=!l.dead;p.x=l.x-9;g.updatePickups(1/60);return{far,got:l.dead,balls:g.balls,owned:[...g.ballOwned()],sfx:window.__sfx.filter(n=>n==='sphere').length};});
ok(t2.far&&t2.got&&t2.balls===1,'18 px away: nothing; walking over it (9 px): collected ('+t2.balls+'/7)');
ok(t2.sfx===1&&t2.owned.length===1,'the pick-up plays the "sphere" sound ('+t2.sfx+'x) and records the star number '+t2.owned);
/* ---- star numbers: all different until you have all seven ---- */
const t3=await pg.evaluate(()=>{const g=G,got=[];g.loot=g.loot.filter(l=>!l.dead);g.loot=[];for(let i=0;i<6;i++){g.spawnLoot('ball',g.p.x+30*i,g.p.y);}
  const stars=g.loot.map(l=>l.star);const set=new Set([...stars,...g.ballOwned()]);
  for(const l of g.loot){g.p.x=l.x;g.p.y=l.y;g.updatePickups(1/60);}
  const sm=g.summon&&g.summon.kind;g.summon=null;SUMMON.unbindSkip();return{stars,all:set.size,balls:g.balls,modal:g.modal&&g.modal.type,summon:sm,owned:[...g.ballOwned()].sort()};});
ok(t3.all===7&&t3.balls===7,'every ball has a different number of stars ('+t3.stars.join(',')+' + the one already owned)');
ok(t3.summon==='shenron','the seventh ball calls Shenron (v113: the wish window opens after the cinematic, tests/summon.js)');
const t4=await pg.evaluate(()=>{const g=G;g.modal=null;g.balls=0;g.ballSet=[];g.loot=[];return g.ballOwned().size;});
ok(t4===0,'counter reset after the wish');
/* ---- pictures ---- */
await pg.evaluate(()=>{const g=G,p=g.p;__app.ui.closeModal();__app.state='play';g.modal=null;g.en=[];g.loot=[];for(const [i,dx] of [[5,-120],[2,-50],[7,30],[4,110]].entries()){g.spawnLoot('ball',p.x+dx[1],p.y+20+(i%2)*14);g.loot[g.loot.length-1].star=dx[0];g.loot[g.loot.length-1].t=[.18,.5,1.4,2.4][i];}
  g.ballSet=[1,3,6];g.balls=3;g.tick&&0;__app.renderer.draw(g,1/60);});
await wait(200);
await pg.evaluate(()=>{const g=G;for(let i=0;i<4;i++){g.loot[i].t+=0;}__app.renderer.draw(g,0);});
await pg.screenshot({path:'/tmp/balls_field.png'});
await pg.evaluate(()=>{const g=G;g.loot[0].t=1.745+.35;g.loot[1].t=.34+.02;__app.renderer.draw(g,0);});   /* around landings */
await pg.screenshot({path:'/tmp/balls_field2.png',clip:{x:230,y:250,width:640,height:230}});
const hud=await pg.evaluate(()=>{const g=G;g.balls=7;g.ballSet=[1,2,3,4,5,6,7];__app.renderer.draw(g,0);return true;});
await pg.screenshot({path:'/tmp/balls_hud.png',clip:{x:700,y:540,width:400,height:100}});
console.log(errs.length?errs.slice(0,4):'no page errors');await b.close();process.exit(errs.length||process.exitCode?1:0);})();
