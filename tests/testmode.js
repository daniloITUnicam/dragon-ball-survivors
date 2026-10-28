const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const r=await pg.evaluate(()=>{const a=__app,o=[];const d=a.save.d;d.zenny=0;d.shop={};d.testBuys={};d.settings.sandbox=false;
 o.push('off buy w/o zenny: '+a.progress.buy(SHOP[0].id));
 d.settings.sandbox=true;o.push('on buy: '+a.progress.buy(SHOP[0].id)+' lvl '+d.shop[SHOP[0].id]+' zenny '+d.zenny);
 a.progress.buy(SHOP[0].id);o.push('lvl2 '+d.shop[SHOP[0].id]);
 d.settings.sandbox=false;const n=a.progress.revertTest();o.push('reverted '+n+' lvl '+(d.shop[SHOP[0].id]||0)+' tb '+JSON.stringify(d.testBuys));return o;});
console.log(r.join('\n'));
// UI flow
await pg.evaluate(()=>{Object.defineProperty(__app.cloud,'canTest',{get:()=>true,configurable:true});__app.ui.show('main');});await wait(300);   /* the switch is shown to testers only (cloud.canTest) */
await pg.evaluate(()=>{__app.ui.push('settings',{tab:'general'});});await wait(300);
const clickT=async()=>{for(let k=0;k<2;k++){await pg.evaluate(()=>document.querySelector('[data-fid="tsandbox"]').click());await wait(250);}};   /* first click arms it, the second confirms */
await clickT();let st=await pg.evaluate(()=>({sb:__app.save.d.settings.sandbox,btn:document.querySelector('[data-fid="tsandbox"]').textContent}));console.log('after 1st click',JSON.stringify(st));
await clickT();st=await pg.evaluate(()=>__app.save.d.settings.sandbox);console.log('after 2nd click sandbox=',st);
await pg.evaluate(()=>{__app.progress.buy(SHOP[1].id);});
await clickT();await clickT();st=await pg.evaluate(()=>({sb:__app.save.d.settings.sandbox,lv:__app.save.d.shop[SHOP[1].id]||0}));console.log('after off',JSON.stringify(st));
console.log(errs.length?errs:'no errors');await b.close();process.exit(errs.length?1:0);})();
