/* trinket roll bar (0-100): bag, character slots, chest card, pause list, gacha tile */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:760}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1500);
await pg.evaluate(()=>{const A=__app,d=A.save.d,P=A.progress;d.shop.tslot=2;d.bag=[{id:'scouter',r:0,at:1,p:12},{id:'boots',r:1,at:2,p:47},{id:'radar',r:2,at:3,p:73},{id:'potara',r:3,at:4,p:96},{id:'kaiomask',r:4,at:5,p:100}].filter(x=>TRINKETS.some(t=>t.id===x.id));
  d.bag.forEach((x,i)=>P.equipTrinket(x.id,x.r,i%3));A.ui.push('chars');});
await wait(900);await pg.screenshot({path:'/tmp/o/perf_chars.png'});
await pg.evaluate(()=>{const A=__app;A.ui.push('bag');});await wait(900);await pg.screenshot({path:'/tmp/o/perf_bag.png'});
console.log(await pg.evaluate(()=>[...document.querySelectorAll('.perf')].map(e=>e.className+':'+e.textContent).slice(0,8).join(' | ')),errs.join('|'));
await b.close();})();
