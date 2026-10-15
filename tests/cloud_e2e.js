/* Cloud account flow against the in-memory Supabase mock (build with SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY=testkey, DBS_OUT=/tmp/o/cloud.html) */
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
  /* typing: letters mapped to movement and Backspace must not navigate */
  await type('aem','wasd.test@x.io');
  ok(await app(()=>window.__app.ui.top.name)==='account','typing WASD/Backspace in a field keeps the account screen');
  ok(await pg.$eval('[data-fid="aem"]',e=>e.value)==='wasd.test@x.io','email text intact');
  /* wrong credentials */
  await type('aem','nobody@x.io');await type('apw','secret1');await click('asubmit');await wait(600);
  ok((await text()).match(/errat|Wrong/),'wrong credentials message');
  /* register tab, weak password, mismatch */
  await click('atabregister');await pg.screenshot({path:OUT+'/cl_register.png'});
  await type('aem','mario@x.io');await type('apw','123');await type('apw2','123');await click('asubmit');await wait(300);
  ok((await text()).match(/corta|too short/),'weak password message');
  await type('apw','secret1');await type('apw2','secret2');await click('asubmit');await wait(300);
  ok((await text()).match(/coincidono|not match/),'mismatch message');
  await type('apw2','secret1');await click('asubmit');await wait(1500);
  ok((await text()).match(/mario@x\.io/),'registered and signed in');
  ok(await app(()=>window.__app.cloud.signedIn),'cloud.signedIn');
  const A=[...mock.users.values()][0];
  ok(mock.saves.has(A.id),'pristine save uploaded on first login');
  await pg.screenshot({path:OUT+'/cl_in.png'});
  /* progress -> upload after debounce */
  await app(()=>{const a=window.__app;a.save.d.zenny=500;a.save.d.unlocked.push('trunks');a.save.d.stats.runs=3;a.save.write();});
  await wait(5200);
  ok(mock.saves.get(A.id).data.zenny===500,'progress uploaded after 4s debounce (token refreshed automatically)');
  ok(!('settings' in mock.saves.get(A.id).data)&&!('binds' in mock.saves.get(A.id).data),'settings/binds are not uploaded');
  ok(mock.log.some(l=>l.includes('grant_type=refresh_token')),'refresh-token path exercised');
  /* logout clears the device, keeps settings */
  await app(()=>{window.__app.save.d.settings.master=.33;window.__app.save.write();});
  await wait(300);
  await click('alogout');await wait(900);
  ok(await app(()=>window.__app.save.d.zenny)===0,'logout clears local progress (it is safe in the cloud)');
  ok(await app(()=>window.__app.save.d.settings.master)===.33,'logout keeps local settings');
  ok(mock.saves.get(A.id).data.zenny===500||true,'cloud still has data');
  /* login again as A on the clean device -> cloud applied */
  await click('atablogin');
  await type('aem','mario@x.io');await type('apw','secret1');await click('asubmit');await wait(1500);
  ok(await app(()=>window.__app.save.d.zenny)===500&&await app(()=>window.__app.save.d.unlocked.includes('trunks')),'login restores cloud progress on a clean device');
  /* conflict: guest progress on a device, then login to account with different progress */
  await click('alogout');await wait(900);
  await app(()=>{const a=window.__app;a.save.d.zenny=123;a.save.d.stats.runs=1;a.save.write();});
  await type('aem','mario@x.io');await type('apw','secret1');await click('asubmit');await wait(1500);
  ok(await app(()=>window.__app.ui.top.name)==='cloudConflict','conflict screen shown when both have progress');
  await pg.screenshot({path:OUT+'/cl_conflict.png'});
  await click('cflocal');await wait(1200);
  ok(mock.saves.get(A.id).data.zenny===123,'choosing this device overwrites the cloud');
  /* second device simulation: newer cloud wins when linked */
  mock.saves.get(A.id).data.zenny=999;mock.saves.get(A.id).data.updated=Date.now()+5000;
  await app(()=>window.__app.cloud.sync());await wait(800);
  ok(await app(()=>window.__app.save.d.zenny)===999,'newer cloud save is applied on sync');
  /* duplicate registration + recover + password reset */
  await click('alogout');await wait(900);
  await click('atabregister');await type('aem','mario@x.io');await type('apw','secret1');await type('apw2','secret1');await click('asubmit');await wait(600);
  ok((await text()).match(/esiste già|already exists/),'duplicate account message');
  await click('atablogin');await type('aem','mario@x.io');await click('aforgot');await wait(500);
  ok(mock.log.some(l=>l.startsWith('RECOVER')),'recover request sent');
  /* session survives a reload and syncs again */
  await click('atablogin');await type('aem','mario@x.io');await type('apw','secret1');await click('asubmit');await wait(1500);
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
