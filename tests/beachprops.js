/* Isola di Muten props: the sheet art is used, spawn weights/density hold, nothing stands in the water. node tests/beachprops.js [shot-prefix] */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const pre=process.argv[2]||'';
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1000,height:640,deviceScaleFactor:1}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(2500);
const r=await pg.evaluate(()=>{const th='beach',idx=STAGES.findIndex(s=>s.theme===th);window.__MAPSEED=0;__app.startGame({stage:idx,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.god=true;window.G=g;g.en=[];
 const os=__app.renderer.getObst(th),defs=OBSTACLES[th],n=defs.length,cnt=new Array(n).fill(0),all=World.visible(th,-9000,-9000,9000,9000);let wet=0,cells=0;
 for(const o of all){cnt[o.t]++;if(Sea.wet(th,o.x,o.y)>-.05)wet++;}
 const tot=defs.reduce((a,d)=>a+d.w,0);
 return{rdy:os.rdy,sheet:!!(Sprites.sheets.beachprops&&Sprites.sheets.beachprops.anch),sm:os.every(s=>s.sm===1),n:all.length,wet,
  share:cnt.map((c,i)=>[(c/all.length*100).toFixed(1),(defs[i].w/tot*100).toFixed(1)]),dens:(all.length/(18000/230*18000/230)).toFixed(3),mirror:all.filter(o=>defs[o.t].nf&&o.f!==1).length};});
console.log(JSON.stringify(r));
if(!r.rdy||!r.sheet||!r.sm)console.log('FAIL sheet not used');
if(r.wet)console.log('FAIL props in water',r.wet);
if(r.mirror)console.log('FAIL mirrored lettering',r.mirror);
if(pre){   /* a shot where the most props are in view */
 const at=await pg.evaluate(()=>{const g=window.G,th='beach',all=World.visible(th,-3000,-3000,3000,3000);let best=null,bn=0;
  for(const o of all){if(o.x*o.x+o.y*o.y<300*300)continue;let c=0;for(const q of all)if(Math.abs(q.x-o.x)<420&&Math.abs(q.y-o.y)<260)c++;if(c>bn){bn=c;best=o;}}
  g.p.x=best.x;g.p.y=best.y;for(let i=0;i<30;i++){g.en=[];g.update(1/60);}return{x:g.p.x,y:g.p.y,c:bn};});
 console.log('densest view',JSON.stringify(at));await wait(300);await pg.screenshot({path:pre+'_view.png'});
 const kk=await pg.evaluate(()=>{const th='beach',defs=OBSTACLES[th],all=World.visible(th,-9000,-9000,9000,9000),out={};for(const o of all)if(!out[o.t]&&o.x*o.x+o.y*o.y>300*300)out[o.t]=[o.x,o.y];return out;});
 for(const k of Object.keys(kk)){await pg.evaluate((p)=>{const g=window.G;g.p.x=p[0]+90;g.p.y=p[1]+10;for(let i=0;i<20;i++){g.en=[];g.update(1/60);}},kk[k]);await wait(150);
  const c=await pg.evaluate((p)=>{const g=window.G,r=document.querySelector('canvas').getBoundingClientRect(),k=r.width/g.vw,sx=r.left+(p[0]-(g.p.x-g.vw/2))*k,sy=r.top+(p[1]-(g.p.y-g.vh/2))*k;return{x:Math.max(0,sx-110),y:Math.max(0,sy-170),width:220,height:200};},kk[k]);
  await pg.screenshot({path:pre+'_k'+String(k).padStart(2,'0')+'.png',clip:c});}
}
console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
