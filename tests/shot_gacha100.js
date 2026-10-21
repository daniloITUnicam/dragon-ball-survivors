/* 100 pulls: every pull is a tile, the grid fits the window, hovering a tile shows its stats */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
let bad=0;const ok=(c,m)=>{console.log((c?'  ok  ':'  FAIL ')+m);if(!c)bad++;};
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const errs=[];
for(const [W,H] of [[1280,720],[1920,1080],[390,844]]){
  const pg=await b.newPage();await pg.setViewport({width:W,height:H});pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1500);
  await pg.evaluate(()=>{const A=__app;A.save.d.tickets.t1=150;A.ui.push('gacha');});await wait(700);
  await pg.evaluate(()=>{document.querySelector('[data-fid="pullt1x100"]').click();});await wait(300);
  await pg.evaluate(()=>{const s=document.querySelector('.gskip');s&&s.click();});await wait(2200);
  const r=await pg.evaluate(()=>{const t=[...document.querySelectorAll('.gtile')],g=document.querySelector('.gtiles'),gr=g.getBoundingClientRect(),sum=document.querySelector('.gsum').getBoundingClientRect(),foot=document.querySelector('.gov .row').getBoundingClientRect();
    return{n:t.length,s:getComputedStyle(g).getPropertyValue('--s'),cols:getComputedStyle(g).getPropertyValue('--cols'),scroll:g.scrollHeight>g.clientHeight+1,gBottom:gr.bottom,sumTop:sum.top,footBottom:foot.bottom,vh:innerHeight,vw:innerWidth,gRight:gr.right,gLeft:gr.left};});
  console.log(W+'x'+H,JSON.stringify(r));
  ok(r.n===100,W+': 100 tiles shown');
  ok(!r.scroll||W<500,W+': the grid fits without scrolling (tile '+r.s+', '+r.cols+' cols)');
  ok(r.footBottom<=r.vh+1&&r.gLeft>=0&&r.gRight<=r.vw+1,W+': summary and buttons inside the window');
  /* hover over the best tile and over a tile in the middle */
  const box=await pg.evaluate(()=>{const e=document.querySelectorAll('.gtile')[0].getBoundingClientRect();return{x:e.left+e.width/2,y:e.top+e.height/2};});
  await pg.mouse.move(box.x,box.y);await wait(250);
  const tp=await pg.evaluate(()=>{const t=document.querySelector('.gtip');const r=t.getBoundingClientRect();return{on:t.classList.contains('on'),txt:t.textContent.slice(0,120),inside:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight};});
  ok(tp.on&&tp.txt.length>10&&tp.inside,W+': tooltip with stats on hover -> '+tp.txt.replace(/\s+/g,' '));
  if(W===1280||W===390)await pg.screenshot({path:'/tmp/o/g100_'+W+'.png'});
  await pg.mouse.move(2,2);await wait(150);
  ok(!(await pg.evaluate(()=>document.querySelector('.gtip').classList.contains('on'))),W+': tooltip hides on leave');
  await pg.close();
}
ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
console.log(bad?'FAILED '+bad:'ALL OK');await b.close();process.exit(bad?1:0);})();
