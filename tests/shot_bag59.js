/* trinket bag: sort icons on the left (with tooltip), rarity chips on the right; dropdown colours; damage numbers */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
let bad=0;const ok=(c,m)=>{console.log((c?'  ok  ':'  FAIL ')+m);if(!c)bad++;};
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:800}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1500);
await pg.evaluate(()=>{const A=__app,d=A.save.d;const ids=TRINKETS.filter(t=>t.m).slice(0,30);d.bag=[];ids.forEach((t,i)=>d.bag.push({id:t.id,r:i%5,p:(i*37)%101,at:Date.now()-i*1000}));A.ui.push('bag',{});});await wait(700);
const r=await pg.evaluate(()=>{const rail=document.querySelector('.bsorts'),grid=document.querySelector('.baggrid'),chips=document.querySelector('.rchips'),det=document.querySelector('.bagdet');
  const rr=e=>e.getBoundingClientRect();return{btns:rail.querySelectorAll('button').length,railX:rr(rail).left,gridX:rr(grid).left,chipsX:rr(chips).left,gridR:rr(grid).right,detX:rr(det).left,sel:!!document.querySelector('.bagsort'),tips:[...rail.querySelectorAll('button')].map(b=>b.dataset.tip)};});
console.log(JSON.stringify(r));
ok(r.btns===5&&!r.sel,'5 sort icons, no drop-down');
ok(r.railX<r.gridX&&r.chipsX>=r.gridR-4,'sort icons are left of the grid, rarity chips are on the right of it');
ok(r.tips.every(t=>t&&t.length>4),'every icon has a tooltip: '+r.tips.join(' | '));
await pg.hover('[data-fid="bs_perf"]');await wait(250);
await pg.screenshot({path:'/tmp/o/bag59.png'});
const before=await pg.evaluate(()=>[...document.querySelectorAll('.baggrid .tcard .ctag')].slice(0,6).map(x=>x.textContent));
await pg.click('[data-fid="bs_perf"]');await wait(300);
const after=await pg.evaluate(()=>[...document.querySelectorAll('.baggrid .tcard .ctag')].slice(0,6).map(x=>(/(\d+)%/.exec(x.textContent)||[])[1]|0));
ok(after.every((v,i)=>i===0||after[i-1]>=v),'sorting by perfection works: '+after.join(','));
ok(await pg.evaluate(()=>document.querySelector('[data-fid="bs_perf"]').classList.contains('on')),'the active sort icon is highlighted');
await pg.click('[data-fid="rc0"]');await wait(300);
ok(await pg.evaluate(()=>document.querySelector('[data-fid="bs_perf"]').classList.contains('on')),'the sort persists after toggling a rarity');
/* dropdown colours */
const oc=await pg.evaluate(()=>{const s=document.createElement('select');s.className='chsort';s.innerHTML='<option>x</option>';document.body.append(s);const o=s.querySelector('option'),cs=getComputedStyle(o);const out={bg:cs.backgroundColor,col:cs.color};s.remove();return out;});
console.log('option colours',JSON.stringify(oc));
ok(oc.bg!=='rgb(255, 255, 255)'&&oc.col==='rgb(255, 255, 255)','drop-down options: dark background, light text ('+oc.bg+' / '+oc.col+')');
ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
console.log(bad?'FAILED '+bad:'ALL OK');await b.close();process.exit(bad?1:0);})();
