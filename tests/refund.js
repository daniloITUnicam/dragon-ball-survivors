/* shop: "Refund all" gives back 100% of what was spent, and the button shows no percentage */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:640}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const r=await pg.evaluate(()=>{const A=__app,d=A.save.d;d.zenny=1e7;d.shop={};d.testBuys={};
  let spent=0;for(const it of SHOP.slice(0,6)){for(let i=0;i<3;i++){const c=shopCost(it,d.shop[it.id]||0);if(A.progress.buy(it.id))spent+=c;}}   /* (achievement rewards earned on the way are not part of the spending) */
  const z1=d.zenny;const got=A.progress.refundAll();return{spent,got,gain:d.zenny-z1,left:Object.keys(d.shop).length};});
ok(r.spent>0&&r.got===r.spent&&r.gain===r.spent&&r.left===0,'everything spent comes back: spent '+r.spent+', refunded '+r.got+', balance +'+r.gain);
const lab=await pg.evaluate(()=>{const out={};for(const l of ['it','en','es','fr','de','pt']){__app.save.d.settings.lang=l;try{__app.applySettings&&__app.applySettings();}catch(e){}out[l]=__app.ui.t('refund');}return out;});
ok(Object.values(lab).every(s=>s&&!/%/.test(s)&&!/90/.test(s)),'the button has no percentage in any language: '+JSON.stringify(lab));
console.log(errs.length?errs.slice(0,3):'no page errors');await b.close();process.exit(errs.length||process.exitCode?1:0);})();
