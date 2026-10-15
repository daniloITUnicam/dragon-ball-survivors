const pp=require('/opt/npm-tools/node_modules/puppeteer');
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1200,height:620,deviceScaleFactor:1});pg.on('pageerror',e=>console.log('ERR',e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await new Promise(r=>setTimeout(r,700));
await pg.evaluate((ids)=>{
 document.body.innerHTML='';const c=document.createElement('canvas');c.width=1200;c.height=620;c.style.cssText='position:fixed;left:0;top:0;background:#3a5a3a;z-index:9999';document.body.appendChild(c);const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const frames=[[0,null],[0,'happy'],[1,null],[5,null],[6,null],[0,'pain']];
 ids.forEach((id,i)=>{const ch=CHARS.find(x=>x.id===id),bx=(i%3)*400,by=Math.floor(i/3)*205;g.fillStyle='#fff';g.font='12px sans-serif';g.fillText(id,bx+4,by+13);
  frames.forEach(([f,ex],j)=>{const sp=Sprites.player('t2:'+id,ch.cfg,f,false,ex),k=(ch.u||1.95)/Sprites.S*.95;g.save();g.translate(bx+36+j*62,by+190);g.scale(k,k);g.drawImage(sp.c,-sp.ox,-sp.oy);g.restore();});});
},(process.argv[2]||'broly').split(','));
await pg.screenshot({path:process.argv[3]||'/tmp/o/sheet_new.png'});await b.close();})();
