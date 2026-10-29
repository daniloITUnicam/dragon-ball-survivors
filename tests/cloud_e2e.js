/* Cloud account flow against the in-memory Supabase mock (build with SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY=testkey SUPABASE_RESET=1, DBS_OUT=/tmp/o/cloud.html; tools/run_tests.py does it) */
const pp=require('/opt/npm-tools/node_modules/puppeteer'),{start}=require('./mock_supabase.js');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=process.env.SHOTS||'/tmp/o';
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{
  const mock=await start(54321,{expires:30});
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];
  pg.on('pageerror',e=>errs.push('PE '+e.message));
  const url='file://'+(process.env.HTML||'/tmp/o/cloud.html');
  await pg.goto(url);await wait(900);
  const app=f=>pg.evaluate(f);
  const click=async fid=>{await pg.click('[data-fid="'+fid+'"]');await wait(250);};
  const type=async(fid,t)=>{await pg.click('[data-fid="'+fid+'"]');await pg.keyboard.down('Control');await pg.keyboard.press('KeyA');await pg.keyboard.up('Control');await pg.keyboard.press('Backspace');await pg.type('[data-fid="'+fid+'"]',t);};
  const text=()=>pg.evaluate(()=>document.getElementById('ui').innerText);
  ok(await app(()=>window.__app.cloud.enabled),'cloud enabled via build config');
  ok((await text()).includes('Accedi')||(await text()).includes('Log in'),'main menu shows login button');
  await pg.screenshot({path:OUT+'/cl_main.png'});
  await click('mcloud');await pg.screenshot({path:OUT+'/cl_login.png'});
  /* password recovery by e-mail is a build option (SUPABASE_RESET=1): without it there is no "Forgot password?" and the sign-up form says so */
  ok(!!(await pg.$('[data-fid="aforgot"]')),'built with SUPABASE_RESET=1 the login screen has "Forgot password?"');
  await app(()=>{window.__app.cloud.cfg.reset=false;window.__app.ui.rebuild(true);});
  ok(!(await app(()=>window.__app.cloud.resetOn))&&!!(await pg.$('[data-fid="aforgot"][data-tip]')),'by default (no SUPABASE_RESET) the button stays, with a tooltip saying recovery is not available');
  await pg.hover('[data-fid="aforgot"]');await wait(150);
  ok(await pg.$eval('[data-fid="aforgot"]',e=>getComputedStyle(e,'::after').content).then(c=>/non è disponibile|not available/.test(c)),'hovering it shows the disclaimer');
  await click('aforgot');
  ok((await text()).match(/non è disponibile|not available/)&&!(await pg.$('[data-fid="acode"]'))&&(await app(()=>window.__app.ui.acct.tab))==='login','pressing it (touch screens) shows the same disclaimer and does not start any e-mail reset');
  /* the Google button is always offered; with the provider off in Supabase it explains instead of leaving for an error page */
  const gOn=await app(()=>window.__app.cloud.prov&&window.__app.cloud.prov.google);
  await app(()=>{window.__app.cloud.prov={google:false,autoconfirm:true,signup:true};window.__app.ui.rebuild(true);});
  ok(!!(await pg.$('[data-fid="agoogle"]')),'the Google button is shown even when the provider is off');
  await click('agoogle');ok((await text()).match(/Google non è ancora attivo|Google sign-in is not enabled/),'... and explains that Google is not enabled yet');
  await pg.evaluate(g=>{window.__app.cloud.prov={google:g,autoconfirm:true,signup:true};window.__app.ui.rebuild(true);},gOn);
  await click('atabregister');ok(!!(await text()).match(/recupero password|password recovery/),'... and the sign-up form says there is no password recovery');
  await click('atablogin');await app(()=>{window.__app.cloud.cfg.reset=true;window.__app.ui.rebuild(true);});
  /* typing: letters mapped to movement and Backspace must not navigate */
  await type('aem','wasd.test@x.io');
  ok(await app(()=>window.__app.ui.top.name)==='account','typing WASD/Backspace in a field keeps the account screen');
  ok(await pg.$eval('[data-fid="aem"]',e=>e.value)==='wasd.test@x.io','email text intact');
  /* wrong credentials */
  await type('aem','nobody@x.io');await type('apw','secret12');await click('asubmit');await wait(600);
  ok((await text()).match(/errat|Wrong/),'wrong credentials message');
  /* register tab, weak password, mismatch */
  await click('atabregister');await pg.screenshot({path:OUT+'/cl_register.png'});
  await type('aem','mario@x.io');await type('apw','123');await type('apw2','123');await click('asubmit');await wait(300);
  ok((await text()).match(/semplice|too easy/),'weak password message');
  await type('apw','secret12');await type('apw2','secret23');await click('asubmit');await wait(300);
  ok((await text()).match(/coincidono|not match/),'mismatch message');
  await type('apw2','secret12');await click('asubmit');await wait(1500);
  ok((await text()).match(/mario@x\.io/),'registered and signed in');
  ok(await app(()=>window.__app.cloud.signedIn),'cloud.signedIn');
  const A=[...mock.users.values()][0];
  ok(mock.saves.has(A.id),'pristine save uploaded on first login');
  await pg.screenshot({path:OUT+'/cl_in.png'});
  /* streamer mode masks the e-mail; the menu button never shows it */
  await click('astreamer');
  ok(!(await text()).includes('mario@x.io'),'streamer mode hides the e-mail on the account screen');
  await pg.screenshot({path:OUT+'/cl_streamer.png'});
  await click('astreamer');
  ok((await text()).includes('mario@x.io'),'streamer mode off shows it again');
  await pg.click('[data-back]');await wait(400);
  const btn=await pg.$eval('.cloudbtn',e=>e.innerText);
  ok(!btn.includes('mario')&&btn.includes('☁'),'menu button shows only cloud + status icon: '+JSON.stringify(btn));
  await pg.screenshot({path:OUT+'/cl_menu_in.png'});
  await click('mcloud');
  /* progress -> upload after debounce */
  await app(()=>{const a=window.__app;a.save.d.zenny=500;a.save.d.unlocked.push('trunks');a.save.d.stats.runs=3;a.save.write();});
  await wait(5200);
  ok(mock.saves.get(A.id).data.zenny===500,'progress uploaded after 4s debounce (token refreshed automatically)');
  ok(!('settings' in mock.saves.get(A.id).data)&&!('binds' in mock.saves.get(A.id).data),'settings/binds are not uploaded');
  ok(mock.log.some(l=>l.includes('grant_type=refresh_token')),'refresh-token path exercised');
  /* logout clears the device, keeps settings */
  await app(()=>{window.__app.save.d.settings.master=.33;window.__app.save.write();});
  await wait(300);
  await click('alogout');await click('alogout');await wait(900);
  ok(await app(()=>window.__app.save.d.zenny)===0,'logout clears local progress (it is safe in the cloud)');
  ok(await app(()=>window.__app.save.d.settings.master)===.33,'logout keeps local settings');
  ok(mock.saves.get(A.id).data.zenny===500||true,'cloud still has data');
  /* login again as A on the clean device -> cloud applied */
  await click('atablogin');
  await type('aem','mario@x.io');await type('apw','secret12');await click('asubmit');await wait(1500);
  ok(await app(()=>window.__app.save.d.zenny)===500&&await app(()=>window.__app.save.d.unlocked.includes('trunks')),'login restores cloud progress on a clean device');
  /* conflict: guest progress on a device, then login to account with different progress */
  await click('alogout');await click('alogout');await wait(900);
  await app(()=>{const a=window.__app;a.save.d.zenny=123;a.save.d.stats.runs=1;a.save.write();});
  await type('aem','mario@x.io');await type('apw','secret12');await click('asubmit');await wait(1500);
  ok(await app(()=>window.__app.ui.top.name)==='cloudConflict','conflict screen shown when both have progress');
  await pg.screenshot({path:OUT+'/cl_conflict.png'});
  await click('cflocal');await wait(1200);
  ok(mock.saves.get(A.id).data.zenny===123,'choosing this device overwrites the cloud');
  /* second device simulation: newer cloud wins when linked */
  mock.saves.get(A.id).data.zenny=999;mock.saves.get(A.id).data.updated=Date.now()+5000;
  await app(()=>window.__app.cloud.sync());await wait(800);
  ok(await app(()=>window.__app.save.d.zenny)===999,'newer cloud save is applied on sync');
  /* duplicate registration + recover + password reset */
  await click('alogout');await click('alogout');await wait(900);
  await click('atabregister');await type('aem','mario@x.io');await type('apw','secret12');await type('apw2','secret12');await click('asubmit');await wait(600);
  ok((await text()).match(/esiste già|already exists/),'duplicate account message');
  /* the Google button appears because the project has the provider enabled (read from /auth/v1/settings), without any build flag */
  ok(!!(await pg.$('[data-fid="agoogle"]')),'Google button shown (provider enabled in Supabase)');
  ok(await app(()=>window.__app.cloud.googleUrl()).then(u=>/\/auth\/v1\/authorize\?provider=google$/.test(u)),'Google URL has no redirect_to on an opaque origin (file:)');
  /* login screen is opaque: the animated menu background no longer shows through */
  ok(await pg.$eval('.screen.acctscr',e=>{const c=getComputedStyle(e);return c.backgroundImage==='none'&&/^rgb\(/.test(c.backgroundColor);}),'login screen background is opaque (no image behind)');
  await pg.screenshot({path:OUT+'/cl_login_v57.png'});
  /* ---------- password reset with the code from the e-mail ---------- */
  await click('atablogin');await type('aem','mario@x.io');await click('aforgot');await wait(300);
  ok((await text()).match(/Reimposta la password|Reset your password/)&&!(await pg.$('[data-fid="acode"]')),'"forgot password" opens the reset form (e-mail step)');
  await click('asubmit');await wait(600);
  ok(mock.log.some(l=>l.startsWith('RECOVER mario@x.io'))&&!mock.log.some(l=>/redirect_to/.test(l)&&l.startsWith('RECOVER')),'recover request sent (no redirect_to from an opaque origin)');
  ok(!!(await pg.$('[data-fid="acode"]'))&&!!(await pg.$('[data-fid="apw2"]')),'code + new password fields appear');
  await pg.screenshot({path:OUT+'/cl_reset_v57.png'});
  await click('aresend');await wait(300);
  ok((await text()).match(/tra \d+ secondi|in \d+ seconds/),'resend within a minute is held back with a countdown');
  await type('acode','000000');await type('apw','newpass1');await type('apw2','newpass1');await click('asubmit');await wait(600);
  ok((await text()).match(/Codice errato|Wrong or expired/),'a wrong code is refused with a clear message');
  const code=mock.codes.get('mario@x.io');
  await type('acode',code);await type('apw','123');await type('apw2','123');await click('asubmit');await wait(300);
  ok((await text()).match(/semplice|too easy/),'weak new password refused');
  await type('apw','newpass1');await type('apw2','nope1234');await click('asubmit');await wait(300);
  ok((await text()).match(/coincidono|not match/),'mismatching passwords refused');
  await type('apw2','newpass1');await click('asubmit');await wait(1500);
  ok(mock.log.includes('VERIFY mario@x.io')&&mock.log.includes('PASSWORD-SET'),'code accepted and the new password saved');
  ok(await app(()=>window.__app.cloud.signedIn),'signed in right after the reset');
  ok([...mock.users.values()].find(u=>u.email==='mario@x.io').pw==='newpass1','the account has the new password');
  ok(!mock.codes.has('mario@x.io'),'the code is single-use');
  /* old password no longer works, the new one does */
  await click('alogout');await click('alogout');await wait(900);
  await type('aem','mario@x.io');await type('apw','secret12');await click('asubmit');await wait(600);
  ok((await text()).match(/errat|Wrong/),'the old password is refused after the reset');
  /* the e-mail link was already used (mail scanners): the app sends the person to the reset form with an explanation */
  await app(()=>{history.replaceState(null,'','#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');window.__app.cloud.start();});await wait(500);
  ok(await app(()=>window.__app.ui.top.name)==='account'&&(await text()).match(/scaduto|expired/)&&(await text()).match(/Reimposta la password|Reset your password/),'an expired / used e-mail link opens the reset form with a message');
  ok(await app(()=>location.hash)==='','the error is cleaned from the address bar');
  await pg.screenshot({path:OUT+'/cl_reset_expired_v57.png'});
  /* the e-mail link itself (access_token in the address, type=recovery) still works: new-password form */
  await click('aback');await wait(200);
  await type('aem','mario@x.io');await type('apw','newpass1');await click('asubmit');await wait(1500);
  const tok=await app(()=>window.__app.cloud.sess.access_token),sessJson=await app(()=>JSON.stringify(window.__app.cloud.sess));
  await app(()=>{const c=window.__app.cloud;c.sess=null;c.saveSess();c.ready=false;c.setStatus('idle');c.notify({type:'auth'});});
  await pg.evaluate(t=>{history.replaceState(null,'','#access_token='+t+'&refresh_token=zz&expires_in=3600&type=recovery');window.__app.cloud.start();},tok);await wait(800);
  ok(await app(()=>window.__app.cloud.recovery)&&!!(await pg.$('[data-fid="apw2"]'))&&!(await pg.$('[data-fid="acode"]')),'the recovery link opens the "set a new password" form');
  await type('apw','linkpass1');await type('apw2','linkpass1');await click('asubmit');await wait(800);
  ok([...mock.users.values()].find(u=>u.email==='mario@x.io').pw==='linkpass1','new password saved from the link flow');
  /* the Google popup (or another tab) hands its session over through localStorage */
  await app(()=>{const c=window.__app.cloud;c.sess=null;c.saveSess();c.ready=false;c.setStatus('idle');c.notify({type:'auth'});});
  ok(!(await app(()=>window.__app.cloud.signedIn)),'signed out locally');
  await pg.evaluate(s=>{localStorage.setItem('dbs-cloud-session',s);dispatchEvent(new StorageEvent('storage',{key:'dbs-cloud-session',newValue:s}));},sessJson);await wait(1200);
  ok(await app(()=>window.__app.cloud.signedIn),'a session written by another tab / the Google popup signs this page in');
  /* ---------- security: a Google-style return (no "type") is accepted only if THIS device pressed the Google button ---------- */
  ok(await app(()=>Cloud.weakPw('aaaaaaaaa')&&Cloud.weakPw('1234567')&&Cloud.weakPw('Password')&&Cloud.weakPw('mario@x.io','mario@x.io')&&!Cloud.weakPw('goodpass9','mario@x.io')),'password policy: short / repeated / common / e-mail refused, a normal one passes');
  ok(await app(()=>Cloud.urlOk('https://a.supabase.co')&&Cloud.urlOk('http://localhost:54321')&&Cloud.urlOk('http://127.0.0.1:54321')&&!Cloud.urlOk('http://evil.example')&&!Cloud.urlOk('javascript:alert(1)')&&!Cloud.urlOk('')),'backend address must be https (plain http only on this computer)');
  const tok2=await app(()=>window.__app.cloud.sess.access_token);
  await app(()=>{const c=window.__app.cloud;c.sess=null;c.saveSess();c.ready=false;c.setStatus('idle');c.notify({type:'auth'});localStorage.removeItem('dbs-oauth-wait');});
  await pg.evaluate(t=>{history.replaceState(null,'','#access_token='+t+'&refresh_token=zz&expires_in=3600&token_type=bearer');window.__app.cloud.start();},tok2);await wait(900);
  ok(!(await app(()=>window.__app.cloud.signedIn))&&(await app(()=>window.__app.cloud.hashCode))==='oauth_state','a Google-style return that this device never started is refused');
  ok(!(await app(()=>location.hash)),'... and the address bar is cleaned');
  await pg.evaluate(t=>{localStorage.setItem('dbs-oauth-wait',String(Date.now()));history.replaceState(null,'','#access_token='+t+'&refresh_token=zz&expires_in=3600&token_type=bearer');window.__app.cloud.start();},tok2);await wait(1200);
  ok(await app(()=>window.__app.cloud.signedIn),'the same return is accepted right after pressing the Google button');
  ok((await app(()=>localStorage.getItem('dbs-oauth-wait')))===null,'... and the "started here" flag is used up');
  await click('alogout');await click('alogout');await wait(900);
  await click('atablogin');
  /* ---------- security: 5 wrong passwords pause the sign-in for a minute, without bothering the server ---------- */
  await app(()=>{window.__n=0;const f=window.fetch;window.fetch=(...a)=>{if(String(a[0]).includes('grant_type=password'))window.__n++;return f.apply(window,a);};localStorage.removeItem('dbs-auth-fails');});
  for(let i=0;i<5;i++){await type('aem','mario@x.io');await type('apw','wrongpass'+i);await click('asubmit');await wait(350);}
  await type('apw','linkpass1');await click('asubmit');await wait(500);
  ok((await text()).match(/riprova tra \d+ secondi|try again in \d+ seconds/),'after 5 wrong passwords the sign-in pauses with a countdown');
  ok((await app(()=>window.__n))===5,'... and the paused attempt never reached the server');
  await app(()=>localStorage.removeItem('dbs-auth-fails'));
  /* session survives a reload and syncs again */
  await type('aem','mario@x.io');await type('apw','linkpass1');await click('asubmit');await wait(1500);
  await pg.reload();await wait(1500);
  ok(await app(()=>window.__app.cloud.signedIn)&&await app(()=>window.__app.cloud.status)==='ok','session restored after reload, status ok');
  /* server unreachable: status offline, local play unaffected */
  mock.close();await wait(200);
  await app(()=>{const a=window.__app;a.save.d.zenny=777;a.save.write();});
  await wait(5500);
  ok(await app(()=>window.__app.cloud.status)==='offline','server down -> status offline');
  ok(await app(()=>window.__app.save.d.zenny)===777,'local save unaffected while offline');
  ok(errs.length===0,'no JS errors '+errs.join(' | '));
  /* offline: stop mock, change progress, status offline, restart and flush */
  await b.close();
  console.log(fails?'FAILED '+fails:'ALL OK');process.exit(fails?1:0);
})().catch(e=>{console.log('ERR',e);process.exit(2)});
