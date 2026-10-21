/* zoomed shots of single rocks of a theme (grounding + animation frames): node tests/shot_rocks_zoom.js <theme> [prefix] — one shot per rock kind near the origin, 4 instants for the animated ones */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const th=process.argv[2]||'hell',pre=process.argv[3]||'/tmp/rz_'+th;
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:520,height:360,deviceScaleFactor:3}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1800);
const picks=await pg.evaluate((th)=>{const idx=STAGES.findIndex(s=>s.theme===th);window.__MAPSEED=0;__app.startGame({stage:idx,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.god=true;window.G=g;g.en=[];
 const seen={},out=[];for(const o of World.visible(th,-9000,-9000,9000,9000)){if(o.v===undefined||seen[o.v])continue;seen[o.v]=1;out.push({v:o.v,x:o.x,y:o.y,anim:!!(Sprites.sheets[th==='hell'?'lavarocks':'rocks'].anim||{})[o.v]});}
 return out;},th);
console.log(picks.map(p=>p.v+(p.anim?'*':'')).join(' '));
let n=0;for(const p of picks.slice(0,+process.argv[4]||40)){
 for(let s=0;s<(p.anim?4:1);s++){
  const clip=await pg.evaluate((p,s)=>{const g=window.G;g.p.x=p.x+120;g.p.y=p.y+20;g.en=[];g.t=s*.2;g.update(1/60);g.en=[];
   const r=document.querySelector('canvas').getBoundingClientRect(),k=r.width/g.vw,sx=r.left+(p.x-(g.p.x-g.vw/2))*k,sy=r.top+(p.y-(g.p.y-14-g.vh/2))*k;
   const W=Math.min(150*k,sx*2,(innerWidth-sx)*2),x0=Math.max(0,sx-W/2),y0=Math.max(0,sy-W*.85);return{x:x0,y:y0,width:W,height:Math.min(W*.95,innerHeight-y0)};},p,s);
  await wait(100);
  await pg.screenshot({path:pre+'_'+String(p.v).padStart(2,'0')+'_'+s+'.png',clip});
 }n++;}
console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
