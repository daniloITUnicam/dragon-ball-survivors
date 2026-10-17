/* patch notes (📜 button, red dot, screen) + automatic update (version.json watcher, 10 s notice, run ended with every coin kept, reload) */
const pp=require('/opt/npm-tools/node_modules/puppeteer'),http=require('http'),fs=require('fs'),path=require('path'),os=require('os');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const DIST=path.join(__dirname,'..','dist');
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
(async()=>{
  /* tiny static server: index.html = the build, version.json = whatever the test writes */
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'upd-'));
  fs.copyFileSync(path.join(DIST,'dragon-ball-survivors.html'),path.join(dir,'index.html'));
  const cur=JSON.parse(fs.readFileSync(path.join(DIST,'version.json'),'utf8')).id;
  const setVer=id=>fs.writeFileSync(path.join(dir,'version.json'),JSON.stringify({id})+'\n');
  setVer(cur);
  const srv=http.createServer((rq,rs)=>{const f=rq.url.split('?')[0]==='/version.json'?'version.json':'index.html';
    rs.writeHead(200,{'Content-Type':f==='index.html'?'text/html':'application/json','Cache-Control':'max-age=600'});rs.end(fs.readFileSync(path.join(dir,f)));});
  await new Promise(r=>srv.listen(0,'127.0.0.1',r));const URL='http://127.0.0.1:'+srv.address().port+'/index.html';

  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:640}});
  const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  /* ---------- patch notes ---------- */
  await pg.goto(URL);await wait(1500);
  await pg.evaluate(()=>{__app.save.d.settings.lang='it';__app.applySettings();__app.ui.rebuild();});
  const p0=await pg.evaluate(()=>({btn:!!document.querySelector('.mtop .patchbtn'),dot:!!document.querySelector('.patchbtn .pdot'),seen:__app.save.d.patchSeen,latest:PATCHES[0].id,n:PATCHES.length}));
  ok(p0.btn,'the 📜 button is in the top right of the main menu');
  ok(!p0.dot&&p0.seen===p0.latest,'a brand-new player has nothing to catch up on: no red dot');
  await pg.evaluate(()=>{__app.save.d.patchSeen='';__app.ui.rebuild();});
  ok(await pg.evaluate(()=>!!document.querySelector('.patchbtn .pdot')),'red dot while the newest release is unread');
  await pg.screenshot({path:'/tmp/patch_menu.png'});
  await pg.click('.patchbtn');await wait(300);
  const PATCHES_N=await pg.evaluate(()=>PATCHES.length);
  const s=await pg.evaluate(()=>{const cards=[...document.querySelectorAll('.pncard')];return{n:cards.length,top:__app.ui.top.name,
    secs0:[...cards[1].querySelectorAll('.pnsec h4')].map(x=>x.textContent),secs1:[...cards[2].querySelectorAll('.pnsec h4')].map(x=>x.textContent),secs2:[...cards[4].querySelectorAll('.pnsec h4')].map(x=>x.textContent),secs3:[...cards[5].querySelectorAll('.pnsec h4')].map(x=>x.textContent),secsTop:[...cards[0].querySelectorAll('.pnsec h4')].map(x=>x.textContent),grp:cards[0].querySelectorAll('.pngrp h5').length,name:(cards[0].querySelector('.pnname')||{}).textContent||'',sum:(cards[0].querySelector('.pnsum')||{}).textContent||'',plain:cards[1].querySelectorAll('.pngrp').length,
    date:cards[0].querySelector('.pndate').textContent,tags:[...cards[0].querySelectorAll('.pntag')].map(x=>x.textContent),items:cards[0].querySelectorAll('li').length,
    seen:__app.save.d.patchSeen,latest:PATCHES[0].id,order:[...cards].map(c=>c.dataset.patch)};});
  ok(s.top==='patch'&&s.n===PATCHES_N,'the patch notes screen lists every release ('+s.n+')');
  ok(s.order[0]>s.order[1]&&s.order[1]>s.order[2]&&s.order[2]>s.order[3]&&s.order[3]>s.order[4]&&s.order[4]>s.order[5],'newest first ('+s.order.join(' > ')+')');
  ok(s.secs2.length===3&&/Novit/.test(s.secs2[0])&&/Correzioni/.test(s.secs2[1])&&/Bilanciamento/.test(s.secs2[2]),'sections in order: news, then fixes, then balance ('+s.secs2.join(' | ')+')');
  ok(s.secs0.length===2&&/Novit/.test(s.secs0[0])&&/Bilanciamento/.test(s.secs0[1])&&s.secs1.length===2,'empty sections are hidden (the newest releases have no fixes: '+s.secs0.join(' | ')+')');
  ok(s.secs3.length===1&&/Novit/.test(s.secs3[0]),'oldest release: only the news');
  ok(s.secsTop.length===3&&s.grp>=10&&s.name.length>5&&s.sum.length>40&&s.plain===0,'the newest release has a title ('+s.name+'), a summary and its lines grouped under headings ('+s.grp+' groups); older ones stay plain');
  ok(/2026/.test(s.date)&&s.items>=4,'date shown in the player language: "'+s.date+'", '+s.items+' changes listed');
  ok(s.tags.length===2,'latest + NEW tags on the unread release ('+s.tags.join(', ')+')');
  ok(s.seen===s.latest,'opening the list marks it as read');
  await pg.screenshot({path:'/tmp/patch_screen.png'});
  await pg.evaluate(()=>__app.ui.pop());await wait(200);
  ok(await pg.evaluate(()=>!document.querySelector('.patchbtn .pdot')),'the red dot is gone after reading');
  await pg.evaluate(()=>{__app.save.d.settings.lang='en';__app.applySettings();__app.ui.rebuild();});
  await pg.click('.patchbtn');await wait(200);
  const en=await pg.evaluate(()=>({h:[...document.querySelectorAll('.pncard')[4].querySelectorAll('.pnsec h4')].map(x=>x.textContent),d:document.querySelector('.pndate').textContent}));
  ok(/What's new/.test(en.h[0])&&/Bug fixes/.test(en.h[1])&&/Balance/.test(en.h[2])&&/October/.test(en.d),'English: '+en.h.join(' | ')+' · '+en.d);
  await pg.evaluate(()=>{__app.ui.pop();__app.save.d.settings.lang='it';__app.applySettings();__app.ui.rebuild();});

  /* ---------- the watcher does nothing while the build is current ---------- */
  ok(await pg.evaluate(()=>__app.updater.live),'watcher active on http(s)');
  ok(!(await pg.evaluate(()=>__app.updater.check(true)))&&!(await pg.evaluate(()=>!!document.getElementById('upd'))),'same build id: no notice');
  /* ---------- a new release while a run is in progress ---------- */
  await pg.evaluate(()=>{window.__marker=1;localStorage.setItem('__mk','1');__app.startGame({stage:5,char:'goku',diff:'normal',x2:false,sandbox:false});const g=__app.game;g.sb&&(g.sb.god=true);window.G=g;g.modal=null;g.run.coins=400;g.kills=120;window.__z0=__app.save.d.zenny;window.__a0=Object.keys(__app.save.d.ach);});
  await wait(500);
  const NEW='deadbeef0123';setVer(NEW);
  const t0=await pg.evaluate(()=>G.t);
  ok(await pg.evaluate(()=>__app.updater.check(true)),'new build id detected');
  await wait(1200);
  const n1=await pg.evaluate(()=>({txt:document.querySelector('#upd .utitle').textContent,num:+document.querySelector('#upd .unum').textContent,sub:document.querySelector('#upd .usub').textContent,pe:getComputedStyle(document.getElementById('upd')).pointerEvents,fs:parseFloat(getComputedStyle(document.querySelector('#upd .utitle')).fontSize),t:G.t,state:__app.state}));
  ok(/AGGIORNAMENTO/.test(n1.txt)&&n1.fs>=40,'big title: "'+n1.txt+'" ('+Math.round(n1.fs)+' px)');
  ok(n1.num===9||n1.num===8,'countdown running from 10 ('+n1.num+' after 1.2 s)');
  ok(/partita in corso termina/.test(n1.sub),'text for a run in progress');
  ok(n1.pe==='none'&&n1.t>t0&&n1.state==='play','the run keeps going during the countdown (t '+t0.toFixed(1)+' -> '+n1.t.toFixed(1)+'), the notice never blocks clicks');
  await pg.screenshot({path:'/tmp/upd_run.png'});
  /* wait for the end of the run: result must keep every coin */
  let res=null;for(let i=0;i<80&&!res;i++){await wait(200);res=await pg.evaluate(()=>__app.lastRes&&G.ended?({total:__app.lastRes.total,mult:__app.lastRes.mult,win:__app.lastRes.win,exp:STAGES[G.stageIdx].zenny*G.S.gold*G.D.zenny*(G.x2?2:1),cls:document.getElementById('upd').className,msg:document.querySelector('#upd .umsg').textContent,state:__app.state,z:__app.save.d.zenny,z0:__z0,ach:Object.keys(__app.save.d.ach).filter(id=>!__a0.includes(id)).reduce((s,id)=>s+(ACHIEVEMENTS.find(a=>a.id===id)||{reward:0}).reward,0)}):null).catch(()=>null);}
  ok(!!res,'the run was ended when the countdown reached 0');
  if(res){
    ok(Math.abs(res.mult-res.exp)<1e-9&&!res.win,'no defeat penalty: multiplier '+res.mult.toFixed(3)+' = full ('+res.exp.toFixed(3)+', not x0.75)');
    ok(res.total>0&&res.z-res.z0===res.total+res.ach,'coins saved: +'+res.total+(res.ach?' (+'+res.ach+' achievement rewards)':'')+' (zenny '+res.z0+' -> '+res.z+')');
    ok(/done/.test(res.cls)&&/Partita salvata/.test(res.msg)&&res.state==='end','message "'+res.msg+'" shown over the end screen');
    await pg.screenshot({path:'/tmp/upd_saved.png'});
  }
  await wait(3200);
  const after=await pg.evaluate(()=>({mk:window.__marker,z:JSON.parse(localStorage.getItem('dragonball-survivors-v2')).zenny,url:location.href,n:JSON.parse(sessionStorage.getItem('dbs-upd')||'null'),upd:!!document.getElementById('upd'),state:__app.state})).catch(e=>({err:e.message}));
  ok(after.mk===undefined&&!after.upd&&after.state==='menu','the page reloaded by itself and is back on the menu');
  ok(res&&after.z===res.z,'the saved coins survived the reload ('+after.z+')');
  ok(!/[?&]u=/.test(after.url)&&after.n&&after.n.id===NEW&&after.n.n===1,'cache-buster removed from the address bar; reload attempt recorded: '+JSON.stringify(after.n));
  /* ---------- second release seen from the menu (no run): shorter text, nothing to end ---------- */
  await pg.evaluate(()=>{__app.updater.secs=2;});
  ok(await pg.evaluate(()=>__app.updater.check(true)),'the (still stale) page sees the new build again');
  await wait(600);
  const m=await pg.evaluate(()=>document.querySelector('#upd .usub').textContent);
  ok(/ricarica/.test(m)&&!/partita in corso/.test(m),'menu text: "'+m.slice(0,50)+'..."');
  await wait(4300);
  const a2=await pg.evaluate(()=>({n:JSON.parse(sessionStorage.getItem('dbs-upd')||'null'),mk:window.__marker})).catch(e=>({err:e.message}));
  ok(a2.n&&a2.n.n===2,'second automatic reload recorded ('+JSON.stringify(a2.n)+')');
  /* ---------- the build is still stale after two reloads: stop insisting ---------- */
  ok(!(await pg.evaluate(()=>__app.updater.check(true))),'after two reloads without effect the watcher stops insisting (no endless loop)');
  /* a *different* newer build is still announced */
  setVer('feedface9999');
  ok(await pg.evaluate(()=>__app.updater.check(true)),'a different newer build is announced again');
  console.log(errs.length?errs.slice(0,4):'no page errors');
  await b.close();srv.close();process.exit(errs.length||process.exitCode?1:0);
})();
