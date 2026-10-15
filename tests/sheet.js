const puppeteer=require('/opt/npm-tools/node_modules/puppeteer');
const which=process.argv[2]||'chars',out=process.argv[3]||'/tmp/o/sheet.png';
(async()=>{
 const b=await puppeteer.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
 const pg=await b.newPage();await pg.setViewport({width:1400,height:900,deviceScaleFactor:+(process.env.DSF||1)});
 pg.on('pageerror',e=>console.log('ERR',e.message));
 await pg.goto('file://'+process.cwd()+'/dist/dragon-ball-survivors.html');await new Promise(r=>setTimeout(r,800));
 await pg.evaluate((which)=>{
  document.body.innerHTML='';const c=document.createElement('canvas');c.width=1400;c.height=900;c.style.cssText='position:fixed;left:0;top:0;background:#3a5a3a;z-index:9999';document.body.appendChild(c);const g=c.getContext('2d');
  const frames=[0,1,3,5,6];let items=[];
  if(which==='chars')for(const ch of CHARS)items.push({name:ch.id,fn:(f)=>Sprites.player('t:'+ch.id,ch.cfg,f,false),u:(ch.u||1.95)});
  else if(which==='en')for(const k in ENEMIES){const d=ENEMIES[k];items.push({name:k,fn:(f)=>Sprites.forSp(d.sp,f,false),u:d.sp.u||1.6});}
  else for(const k in BOSSES){const d=BOSSES[k];items.push({name:k,fn:(f)=>Sprites.forSp(d.sp,f,false),u:(d.sp.u||d.u)*.8});}
  const perRow=which==='chars'?4:4;const cw=1400/perRow,rh=which==='chars'?170:170;
  items.forEach((it,i)=>{const bx=(i%perRow)*cw,by=Math.floor(i/perRow)*rh;
   g.fillStyle='#fff';g.font='11px sans-serif';g.fillText(it.name,bx+4,by+12);
   frames.forEach((f,j)=>{const sp=it.fn(f),k=it.u/Sprites.S*.8;g.save();g.translate(bx+40+j*68,by+rh-16);g.scale(k,k);g.drawImage(sp.c,-sp.ox,-sp.oy);g.restore();});});
 },which);
 await pg.screenshot({path:out,clip:process.env.CLIP?JSON.parse(process.env.CLIP):undefined});await b.close();
})();
