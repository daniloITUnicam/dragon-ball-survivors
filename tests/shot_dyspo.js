/* the Universe 11 / 7 faces side by side: Dyspo (playable + boss forms) next to Beerus.  node tests/shot_dyspo.js [out.png] */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const out=process.argv[2]||'/tmp/dyspo.png';
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:900,height:360,deviceScaleFactor:2}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
await pg.evaluate(()=>{
  const cv=document.createElement('canvas');cv.width=900;cv.height=360;cv.style.cssText='position:fixed;left:0;top:0;z-index:99999;background:#7a9a5a';document.body.appendChild(cv);
  const c=cv.getContext('2d');c.fillStyle='#7a9a5a';c.fillRect(0,0,900,360);c.imageSmoothingEnabled=false;
  const list=[['dyspo',CHARS.find(x=>x.id==='dyspo').cfg],['boss dyspo',BOSSES.dyspo.sp.cfg],['boss dyspo2',BOSSES.dyspo2.sp.cfg],['beerus',CHARS.find(x=>x.id==='beerus').cfg],['boss beerus2',BOSSES.beerus2.sp.cfg]];
  list.forEach(([n,cfg],i)=>{const sp=Sprites.player('t_'+n+i,cfg,0,false),sc=170/sp.c.height;c.drawImage(sp.c,20+i*170,50,sp.c.width*sc,sp.c.height*sc);c.fillStyle='#fff';c.font='12px sans-serif';c.fillText(n,20+i*170,30);});
  for(let f=0;f<5;f++){const sp=Sprites.player('t_dyspo_walk',CHARS.find(x=>x.id==='dyspo').cfg,f,false),sc=110/sp.c.height;c.drawImage(sp.c,20+f*110,240,sp.c.width*sc,sp.c.height*sc);}
});
await wait(200);await pg.screenshot({path:out});console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
