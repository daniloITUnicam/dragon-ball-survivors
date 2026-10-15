/* enemy/boss sprite viewer: node tests/sheet_hd.js <en|boss|keys,comma> out.png [zoom] */
const puppeteer=require('/opt/npm-tools/node_modules/puppeteer');
const which=process.argv[2]||'en',out=process.argv[3]||'/tmp/o/hd.png',zoom=+(process.argv[4]||2.2);
(async()=>{
 const b=await puppeteer.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
 const pg=await b.newPage();await pg.setViewport({width:1500,height:1000,deviceScaleFactor:1});
 pg.on('pageerror',e=>console.log('ERR',e.message));
 await pg.goto('file://'+process.cwd()+'/dist/dragon-ball-survivors.html');await new Promise(r=>setTimeout(r,800));
 const info=await pg.evaluate((which,zoom,rowh)=>{window.__rowh=rowh;
  document.body.innerHTML='';const c=document.createElement('canvas');c.width=1500;c.height=1000;c.style.cssText='position:fixed;left:0;top:0;background:#4a6a44;z-index:9999';document.body.appendChild(c);const g=c.getContext('2d');
  const frames=[0,2,6];let items=[];
  const pick=which==='en'||which==='boss'?null:which.split(',');
  if(which==='en'||pick)for(const k in ENEMIES){if(pick&&!pick.includes(k))continue;const d=ENEMIES[k];items.push({name:k,sp:d.sp,u:d.sp.u||1.6});}
  if(which==='boss'||pick)for(const k in BOSSES){if(pick&&!pick.includes(k))continue;const d=BOSSES[k];items.push({name:k,sp:d.sp,u:(d.sp.u||d.u)});}
  const colW=zoom*100,rowH=zoom*(+(window.__rowh||100));const perRow=Math.max(1,Math.floor(1500/(colW*frames.length*.8)));
  const cw=1500/perRow;
  items.forEach((it,i)=>{const bx=(i%perRow)*cw,by=Math.floor(i/perRow)*rowH;
   g.fillStyle='#fff';g.font='11px sans-serif';g.fillText(it.name,bx+4,by+12);
   frames.forEach((f,j)=>{const sp=Sprites.forSp(it.sp,f,false),k=it.u/(sp.s||Sprites.S)*zoom;g.save();g.translate(bx+50*zoom/2+j*(cw/frames.length),by+rowH-12);g.scale(k,k);g.drawImage(sp.c,-sp.ox,-sp.oy);g.restore();});});
  return items.length;
 },which,zoom,+(process.env.ROWH||100));
 await pg.screenshot({path:out});await b.close();console.log('items',info);
})();
