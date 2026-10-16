const pp=require('/opt/npm-tools/node_modules/puppeteer');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const TH=['plains','namek','waste','other','void','beach','redrock','arena','sky','hell'];
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1100,height:700});const errs=[];pg.on('pageerror',e=>errs.push('PE '+e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(800);
const shot=process.argv[2]==='shot';
for(let i=0;i<10;i++){
  await pg.evaluate((i)=>{if(window.__app.game)window.__app.endRun&&0;window.__app.startGame({stage:i,char:'goku',diff:'normal',x2:false,sandbox:true,pet:'dende'});const g=window.__app.game;g.sb.god=true;g.sb.nospawn=true;Ambient.auto=false;Ambient.lod=1;g.p.x=1500+i*40;g.p.y=900;},i);
  await wait(1500);
  const r=await pg.evaluate(()=>{const A=Ambient;return{ps:A.ps.length,cr:A.cr.length,lod:A.lod,kinds:Object.keys(A.cnt).filter(k=>A.cnt[k]>0).join(',')};});
  console.log(TH[i],JSON.stringify(r));
  if(shot)await pg.screenshot({path:'/tmp/o/amb_'+i+'_'+TH[i]+'.png'});
}
// toggle off must not throw and must clear drawing
await pg.evaluate(()=>{window.__app.save.d.settings.ambient=false;});await wait(500);
await pg.evaluate(()=>{window.__app.save.d.settings.ambient=true;});await wait(300);
console.log(errs.join('\n')||'noerr');await b.close();})();
