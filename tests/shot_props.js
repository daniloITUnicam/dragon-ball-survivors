/* a gallery of one theme's obstacles and ground decor, at game scale: node tests/shot_props.js <theme> [out] */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const th=process.argv[2]||'beach',out=process.argv[3]||'/tmp/props_'+th+'.png';
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:520,deviceScaleFactor:1.5}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
await pg.evaluate((th)=>{const R=__app.renderer,os=R.getObst(th),dc=R.getDecor(th),tl=R.getTiles(th);
 const c=document.createElement('canvas');c.width=1100;c.height=520;c.style.cssText='position:fixed;left:0;top:0;z-index:99999;background:#888';document.body.appendChild(c);const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 for(let y=0;y<520;y+=64)for(let x=0;x<1100;x+=64)g.drawImage(tl.ground[((x/64+y/64)|0)%tl.ground.length],x,y);
 const k0=3.1/Sprites.S;let x=60;
 const row=(list,y,sc0)=>{let x=50;for(const sp of list){const k=(sc0?k0:2/Sprites.S)*(sp.sc||1);g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(x,y,sp.c.width*k*.28,sp.c.width*k*.1,0,0,Math.PI*2);g.fill();g.drawImage(sp.c,x-sp.ox*k,y-sp.oy*k,sp.c.width*k,sp.c.height*k);x+=Math.max(70,sp.c.width*k+16);}};
 row(os,200,true);row(dc,430,false);
 // a character-sized reference box
 g.fillStyle='rgba(255,255,255,.5)';g.fillRect(1040,110,30,90);g.fillStyle='#000';g.font='11px sans-serif';g.fillText('char',1040,105);
},th);
await pg.screenshot({path:out});
console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
