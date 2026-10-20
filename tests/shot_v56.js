/* screenshots for v56: damage numbers (normal / critical / other texts), spider contact sheet, bird shadows over sand.  node tests/shot_v56.js [prefix] */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const pre=process.argv[2]||'/tmp/v56_';
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:760,deviceScaleFactor:2}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
/* 1. damage numbers in a real fight */
await pg.evaluate(()=>{const A=__app;A.save.d.settings.dmgNum=true;A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true,pet:'none'});window.G=A.game;});
await wait(500);
await pg.evaluate(()=>{const g=G;g.showNums=true;g.sb.god=true;g.sb.nospawn=true;g.tx.length=0;
  for(let i=0;i<9;i++){const v=[12,48,137,260,999,1450,3820,12400,87650][i];g.floatText(g.p.x-210+i*52,g.p.y-90+(i%3)*18,v,0);}
  for(let i=0;i<5;i++){const v=[96,274,520,2900,18400][i];g.floatText(g.p.x-150+i*70,g.p.y-150+(i%2)*22,v,6);}
  g.floatText(g.p.x,g.p.y-205,'+Z 120',1);g.floatText(g.p.x-110,g.p.y-205,'Senzu!',2);g.floatText(g.p.x+110,g.p.y-205,'Schivata!',3);
  g.update=()=>{};});
await wait(200);
await pg.screenshot({path:pre+'dmg.png',clip:{x:300,y:120,width:680,height:380}});
/* 2. spider contact sheet + shadows, drawn on a test canvas */
await pg.evaluate(()=>{
  const cv=document.createElement('canvas');cv.id='ts';cv.width=1200;cv.height=560;cv.style.cssText='position:fixed;left:0;top:0;z-index:99999;width:1200px;height:560px;background:#d8c890';document.body.appendChild(cv);
  const c=cv.getContext('2d');c.fillStyle='#d8c890';c.fillRect(0,0,1200,560);c.imageSmoothingEnabled=false;
  const U=3.1;let n=0;
  for(let row=0;row<2;row++)for(let col=0;col<12;col++){
    const t=0.2+(row*12+col)*1.05,ox=50+col*98,oy=150+row*190;
    /* the barrel */
    c.save();c.translate(ox,oy);c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.ellipse(0,0,20,8,0,0,Math.PI*2);c.fill();
    c.fillStyle='#8a5a30';c.fillRect(-15.5,-50,31,48);c.fillStyle='#5a3a1c';c.fillRect(-15.5,-40,31,3);c.fillRect(-15.5,-14,31,3);c.restore();
    c.save();c.translate(0,0);
    if(row===0){const o=ObjLife.crawl(t,Math.round(77),5,-13,-2.5);ObjLife.spider(c,ox+o.x*U,oy+2+o.y*U,Math.atan2(Math.sin(o.h),Math.cos(o.h)),2.7,o);}
    else{const o=ObjLife.dangle(t*1.3,Math.round(77)),wx=ox+1.5*U,wy0=oy+2-15.5*U,L=o.L*U*.55,sw=Math.sin(o.sw)*1.4,wy=wy0+L+6,sx=wx+sw*2;
      c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=.7;c.beginPath();c.moveTo(wx,wy0);c.lineTo(sx,wy);c.stroke();ObjLife.spider(c,sx,wy,o.h+o.sw*.5,2.5,o);}
    c.restore();
  }
  /* shadows */
  const sc=document.createElement('canvas');sc.id='ts2';sc.width=1200;sc.height=300;sc.style.cssText='position:fixed;left:0;top:570px;z-index:99999;width:1200px;height:300px';document.body.appendChild(sc);
  const s=sc.getContext('2d');s.fillStyle='#e6d4a0';s.fillRect(0,0,1200,300);
  let tt=0;for(let t=0;t<6000;t+=1){let hit=false;const o=Ambient.birdShadow;Ambient.birdShadow=function(cc,bx,by){if(bx>60&&bx<1140&&by>40&&by<260)hit=true;};Ambient.flockShadows(s,0,0,1200,300,t,3,1,.1);Ambient.birdShadow=o;if(hit){tt=t;break;}}
  Ambient.flockShadows(s,0,0,1200,300,tt,3,1,.1);
  /* a few single birds at different wing phases */
  for(let i=0;i<8;i++)Ambient.birdShadow(s,60+i*70,250,0,i*.9,0.3,1.35,.12);
  window.__tt=tt;
});
await wait(200);
await pg.screenshot({path:pre+'spiders.png',clip:{x:0,y:0,width:1200,height:560}});
await pg.screenshot({path:pre+'shadows.png',clip:{x:0,y:570,width:1200,height:300}});
console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
