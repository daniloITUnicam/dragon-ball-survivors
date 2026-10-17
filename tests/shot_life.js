/* zoomed shots of the living props: node tests/shot_life.js <theme> [prefix] — finds a few props of each kind near the start and screenshots them at two instants */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const th=process.argv[2]||'beach',pre=process.argv[3]||'/tmp/life_'+th;
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:520,height:360,deviceScaleFactor:3}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const picks=await pg.evaluate((th)=>{const idx=STAGES.findIndex(s=>s.theme===th);window.__MAPSEED=0;__app.startGame({stage:idx,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.god=true;window.G=g;g.en=[];
 const os=__app.renderer.getObst(th),seen={},out=[];
 for(const o of World.visible(th,-6000,-6000,6000,6000)){const sp=os[o.t];if(!sp||!sp.kind)continue;const hb=hash(Math.round(o.x),Math.round(o.y));const key=sp.kind+':'+(hb<.32?0:hb<.5?1:hb<.68?2:hb<.84?3:4);if(seen[key])continue;seen[key]=1;out.push({kind:sp.kind,v:key,x:o.x,y:o.y});}
 return out;},th);
console.log(picks.map(p=>p.v).join(' '));
let n=0;for(const p of picks){
 for(let s=0;s<2;s++){
  const clip=await pg.evaluate((p,s)=>{const g=window.G;g.p.x=p.x+170;g.p.y=p.y+20;g.en=[];for(let i=0;i<(s?70:20);i++){g.en=[];g.update(1/60);}
   const r=document.querySelector('canvas').getBoundingClientRect(),k=r.width/g.vw,sx=r.left+(p.x-(g.p.x-g.vw/2))*k,sy=r.top+(p.y-(g.p.y-14-g.vh/2))*k;
   const W=Math.min(150*k,sx*2,(innerWidth-sx)*2),x0=Math.max(0,sx-W/2),y0=Math.max(0,sy-W*.85);return{x:x0,y:y0,width:W,height:Math.min(W*.95,innerHeight-y0)};},p,s);
  await wait(120);
  await pg.screenshot({path:pre+'_'+(n)+'_'+p.v.replace(':','-')+'_'+s+'.png',clip});
 }
 n++;}
console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
