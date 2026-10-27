/* "reduced effects" setting: toggle in Settings > Video (6 languages), fewer particles, no electric arcs / pillars / flame tongues, softer glows and flashes */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:640,deviceScaleFactor:1}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
/* ---- settings UI ---- */
const ui=await pg.evaluate(async()=>{const s=__app.save.d.settings,out={};out.def=s.reduceFx;
  __app.ui.show('main');__app.ui.push('settings',{tab:'video'});
  const q=()=>document.querySelector('[data-fid="treduceFx"]');
  out.has=!!q();out.label=q()&&q().closest('.srow').querySelector('b').textContent;out.desc=q()&&q().closest('.srow').querySelector('small').textContent.length;out.btn0=q()&&q().textContent;
  q().click();out.on=s.reduceFx;out.fxl=FXL.on;out.btn1=q().textContent;
  q().click();out.off=s.reduceFx;out.fxl2=FXL.on;
  q().click();out.on2=s.reduceFx;
  out.langs={};for(const l of['it','en','es','fr','de','pt']){s.lang=l;__app.applySettings();__app.ui.rebuild(true);const b2=q();out.langs[l]=b2?b2.closest('.srow').querySelector('b').textContent:null;}
  s.lang='en';__app.applySettings();
  return out;});
ok(ui.def===false,'off by default');
ok(ui.has&&ui.btn0==='Off'&&ui.on===true&&ui.fxl===true&&ui.btn1==='On','the toggle in Settings > Video switches it on ('+ui.label+')');
ok(ui.off===false&&ui.fxl2===false&&ui.on2===true,'and off again');
ok(ui.desc>40,'with an explanation under it');
ok(Object.values(ui.langs).every(v=>v&&v.length>3)&&new Set(Object.values(ui.langs)).size===6,'translated in all six languages ('+Object.values(ui.langs).join(' / ')+')');
/* ---- game effects ---- */
const start=()=>pg.evaluate(()=>{__app.ui.clear&&__app.ui.clear();__app.startGame({stage:5,char:'goku',diff:'normal',x2:false,sandbox:false});const g=__app.game;g.sb.god=true;g.sb.nospawn=true;window.G=g;g.modal=null;g.en=[];g.eb=[];g.loot=[];return FXL.on;});
const fxl=await start();ok(fxl===true,'a new run starts with the setting applied');
const fx=await pg.evaluate(()=>{const g=G,out={};
  const cnt=(on,f)=>{FXL.on=on;g.fx=[];f();return g.fx.length;};
  out.burstOn=cnt(true,()=>g.burst(0,0,100,'#fff'));out.burstOff=cnt(false,()=>g.burst(0,0,100,'#fff'));
  out.boltOn=cnt(true,()=>g.bolt(0,0,100,'#fff',10));out.boltOff=cnt(false,()=>g.bolt(0,0,100,'#fff',10));
  out.pillarOn=cnt(true,()=>g.pillar(0,0,'#fff',1));out.pillarOff=cnt(false,()=>g.pillar(0,0,'#fff',1));
  out.ringOn=cnt(true,()=>g.ring(0,0,50,'#fff',.5));
  const fi0=g.formIdx;g.formIdx=4;FXL.on=true;out.elecOn=ELEC.lvl(g);FXL.on=false;out.elecOff=ELEC.lvl(g);g.formIdx=fi0;
  /* glows: the alpha reaching the canvas */
  const al=[];const st={save(){},restore(){},drawImage(){},set globalAlpha(v){al.push(v);},set globalCompositeOperation(v){}};
  FXL.on=false;GLOW.at(st,0,0,10,'#ff0000',.8);FXL.on=true;GLOW.at(st,0,0,10,"#ff0000",.8);out.glow=al.filter((v,i)=>i%2===0);   /* v109: GLOW.at puts the alpha back by hand (every other value) */
  FXL.on=true;return out;});
ok(fx.burstOn<=fx.burstOff*.5&&fx.burstOn>0,'bursts use far fewer particles ('+fx.burstOn+' vs '+fx.burstOff+')');
ok(fx.boltOn<fx.boltOff&&fx.boltOn>0,'fewer lightning bolts ('+fx.boltOn+' vs '+fx.boltOff+')');
ok(fx.pillarOn===0&&fx.pillarOff===1,'no pillars of light');
ok(fx.ringOn===1,'shock rings (they carry information) stay');
ok(fx.elecOn===0&&fx.elecOff===5,'no electric arcs ('+fx.elecOn+' vs '+fx.elecOff+')');
ok(fx.glow[1]<fx.glow[0]*.7&&fx.glow[1]>0,'glows are softer ('+fx.glow.map(v=>+v.toFixed(2)).join(' -> ')+')');
/* ambient particle level follows the setting (it is applied while a run is drawn) */
const amb=await pg.evaluate(()=>{const s=__app.save.d.settings,out={};s.reduceFx=true;__app.renderer.draw(G,0);out.on=[Ambient.auto,Ambient.lod];s.reduceFx=false;__app.renderer.draw(G,0);out.off=[Ambient.auto,Ambient.lod];s.reduceFx=true;FXL.on=true;return out;});
ok(amb.on[0]===false&&amb.on[1]<=.5&&amb.off[0]===true&&amb.off[1]===1,'the ambient particle level drops with it and comes back ('+JSON.stringify(amb)+')');
/* flash: mean brightness of a frame with a white flash */
const lum=()=>pg.evaluate(()=>{const g=G,c=__app.renderer.ctx.canvas;g.flash=.5;g.flashC='#ffffff';g.shake=0;__app.renderer.draw(g,0);const d=__app.renderer.ctx.getImageData(c.width/2,c.height/2,40,40).data;let s=0;for(let i=0;i<d.length;i+=4)s+=d[i]+d[i+1]+d[i+2];g.flash=0;return s/(d.length/4*3);});
await pg.evaluate(()=>{FXL.on=false;__app.save.d.settings.reduceFx=false;});const lumOff=await lum();
await pg.evaluate(()=>{__app.save.d.settings.reduceFx=true;});const lumOn=await lum();
ok(lumOn<lumOff-25,'screen flashes are much dimmer ('+Math.round(lumOn)+' vs '+Math.round(lumOff)+' brightness)');
/* ---- opacity slider: the player's own effects fade, enemy attacks and the character itself do not ---- */
const op=await pg.evaluate(()=>{const g=G,r=__app.renderer,p=g.p,s=__app.save.d.settings,out={};
  s.reduceFx=false;FXL.on=false;g.en=[];g.pr=[];g.eb=[];g.fx=[];g.shake=0;g.flash=0;g.formIdx=-1;g.kai=0;g.bers=0;g.cast=null;g.xform=null;g.t=30;
  const sc=(x,y)=>[Math.round((x-p.x)*r.Z+r.W/2),Math.round((y-(p.y-14))*r.Z+r.H/2)];
  const pos={pr:[p.x+170,p.y-60],eb:[p.x-170,p.y-60],fxp:[p.x,p.y+110]};
  g.pr.push({x:pos.pr[0],y:pos.pr[1],vx:0,vy:0,r:16,c:'#ff00ff',life:9,dmg:1});
  g.eb.push({x:pos.eb[0],y:pos.eb[1],vx:0,vy:0,r:16,c:'#ff00ff',dmg:1,life:9});
  g.fx.push({x:pos.fxp[0],y:pos.fxp[1],vx:0,vy:0,l:9,m:9,c:'#ff00ff',s:30});
  let base=null;const grab=(x,y)=>{const[cx,cy]=sc(x,y);return r.ctx.getImageData(cx-24,cy-24,49,49).data;};
  const mag=(x,y)=>{const d=grab(x,y),b=base[x+','+y];let m=0;for(let i=0;i<d.length;i++)m+=Math.abs(d[i]-b[i]);return m/d.length;};   /* how much the pixels around the object differ from the same frame without it */
  {const sv=[g.pr,g.eb,g.fx];g.pr=[];g.eb=[];g.fx=[];r.draw(g,0);base={};for(const k in pos)base[pos[k][0]+','+pos[k][1]]=grab(...pos[k]);[g.pr,g.eb,g.fx]=sv;}
  const shot=a=>{s.fxAlpha=a;r.draw(g,0);return{pr:mag(...pos.pr),eb:mag(...pos.eb),fx:mag(...pos.fxp),m:FXL.m,al:r.ctx.globalAlpha};};
  out.a100=shot(100);out.a50=shot(50);out.a0=shot(0);out.a100b=shot(100);
  /* the character stays opaque: compare pixels over the sprite at 0% and 100% */
  const body=a=>{s.fxAlpha=a;r.draw(g,0);const d=r.ctx.getImageData(r.W/2-6,r.H/2-20,12,24).data;let h=0;for(let i=0;i<d.length;i++)h=(h*31+d[i])>>>0;return h;};
  g.pr=[];g.eb=[];g.fx=[];out.body=body(100)===body(0);
  s.fxAlpha=100;return out;});
console.log('opacity probe',JSON.stringify(op,(k,v)=>typeof v==='number'?+v.toFixed(1):v));
ok(op.a100.pr>8&&op.a50.pr<op.a100.pr*.8&&op.a50.pr>op.a0.pr*1.5&&op.a0.pr<op.a100.pr*.12,'player projectiles fade with the slider ('+[op.a100.pr,op.a50.pr,op.a0.pr].map(v=>Math.round(v)).join(' > ')+')');
ok(op.a100.fx>8&&op.a0.fx<op.a100.fx*.12&&op.a50.fx<op.a100.fx*.8,'particles and effects fade too ('+[op.a100.fx,op.a50.fx,op.a0.fx].map(v=>Math.round(v)).join(' > ')+')');
ok(op.a0.eb>8&&Math.abs(op.a0.eb-op.a100.eb)<op.a100.eb*.1,'enemy attacks stay fully visible even at 0% ('+Math.round(op.a0.eb)+' vs '+Math.round(op.a100.eb)+')');
ok(op.body,'the character itself is not affected');
ok(op.a100b.m===1&&op.a0.m===1&&Math.abs(op.a100b.al-1)<1e-6,'the canvas alpha is back to normal after the frame');
/* the slider in Settings > Video */
const sl=await pg.evaluate(()=>{__app.ui.clear&&__app.ui.clear();__app.ui.show('main');__app.ui.push('settings',{tab:'video'});const s=__app.save.d.settings,out={def:s.fxAlpha};
  const inp=document.querySelector('[data-fid="sfxAlpha"]');out.has=!!inp;out.min=inp&&inp.min;out.max=inp&&inp.max;out.step=inp&&inp.step;out.val=inp&&inp.value;
  inp.value=35;inp.dispatchEvent(new Event('input'));out.set=s.fxAlpha;out.txt=inp.parentNode.querySelector('.val').textContent;
  inp.value=0;inp.dispatchEvent(new Event('input'));out.zero=s.fxAlpha;
  out.langs={};for(const l of['it','en','es','fr','de','pt']){s.lang=l;__app.applySettings();__app.ui.rebuild(true);const i2=document.querySelector('[data-fid="sfxAlpha"]');out.langs[l]=i2?i2.closest('.srow').querySelector('b').textContent:null;}
  s.lang='en';s.fxAlpha=100;__app.applySettings();return out;});
ok(sl.def===100&&sl.has&&sl.min==='0'&&sl.max==='100','slider 0-100% in Settings > Video, default 100% ('+JSON.stringify([sl.min,sl.max,sl.step,sl.def])+')');
ok(sl.set===35&&sl.txt==='35%'&&sl.zero===0,'it saves the value and shows it ('+sl.txt+')');
ok(Object.values(sl.langs).every(v=>v&&v.length>3)&&new Set(Object.values(sl.langs)).size===6,'translated in six languages ('+Object.values(sl.langs).join(' / ')+')');
await start();
/* ---- heavy scene: renders without errors and not slower ---- */
const heavy=await pg.evaluate(()=>{const g=G,r=__app.renderer;g.formIdx=5;g.formMax=7;g.formColor='#9fe8ff';g.kai=2;g.kaiAvail=true;g.formsUnlocked=6;
  g.spawnBoss&&0;g.en=[];g.t=g.elitePlan[0].t+1;g.sb.nospawn=false;g.hordeT=1e9;g.packT=1e9;g.wave.ph='calm';g.wave.until=1e9;g.update(1/30);g.sb.nospawn=true;
  for(let i=0;i<30;i++){const a=i/30*TAU;g.en.push(g.mkEnemy(ENEMIES[g.stage.roster[0][0]],g.p.x+Math.cos(a)*(80+i*6),g.p.y+Math.sin(a)*(80+i*6)));}
  g.balls=0;g.ballSet=[];g.spawnLoot('ball',g.p.x-100,g.p.y-20);
  for(let i=0;i<20;i++){g.burst(g.p.x+rnd(-80,80),g.p.y+rnd(-80,80),30,'#9fe8ff');g.bolt(g.p.x,g.p.y,150,'#ffe066',3);g.pillar(g.p.x,g.p.y,'#fff',1);g.ring(g.p.x,g.p.y,100,'#fff',.5);}
  const time=on=>{FXL.on=on;__app.save.d.settings.reduceFx=on;const t0=performance.now();for(let i=0;i<40;i++){g.update(1/60);g.kai=2;r.draw(g,1/60);}return(performance.now()-t0)/40;};
  time(false);time(true);const best=on=>{let m=1e9;for(let k=0;k<5;k++)m=Math.min(m,time(on));return m;};   /* best of 5: a timer in a shared container is noisy */
  const off=best(false),on=best(true);return{off:+off.toFixed(2),on:+on.toFixed(2),elite:g.en.some(e=>e.elite)};});
console.log('frame ms: normal '+heavy.off+' / reduced '+heavy.on);
ok(heavy.elite,'elite, kaioken aura, ball and 30 enemies drawn in the reduced mode with no errors');
ok(heavy.on<=heavy.off*1.15,'the reduced mode is not slower ('+heavy.on+' ms vs '+heavy.off+' ms)');
await pg.screenshot({path:'/tmp/reducefx_on.png'});
await pg.evaluate(()=>{FXL.on=false;__app.save.d.settings.reduceFx=false;__app.renderer.draw(G,0);});
await pg.screenshot({path:'/tmp/reducefx_off.png'});
console.log(errs.length?errs.slice(0,4):'no page errors');await b.close();process.exit(errs.length||process.exitCode?1:0);})();
