/* v56: natural spiders on barrels, bird shadows instead of gulls, red critical hits + arcade lettering for damage numbers (+0.3 s)  node tests/v56.js */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:760}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
let bad=0;const ok=(c,m)=>{console.log((c?'  ok  ':'FAIL  ')+m);if(!c)bad++;};
const ev=(f,...a)=>pg.evaluate(f,...a);
/* ---------- spiders: smooth, wandering, with idle fidgets ---------- */
let r=await ev(()=>{
  const out={maxStep:0,maxTurn:0,maxUp:0,outside:0,walk:0,n:0,up:0,gr:0,tw:0,look:0,xs:new Set(),ys:new Set()};
  const hw=5,yt=-13,yb=-2.5;
  for(let sd=0;sd<12;sd++){
    let prev=null;
    for(let t=0;t<90;t+=1/60){
      const o=ObjLife.crawl(t,sd*37+5,hw,yt,yb);
      if(prev){const st=Math.hypot(o.x-prev.x,o.y-prev.y);out.maxStep=Math.max(out.maxStep,st);let dh=o.h-prev.h;dh-=Math.PI*2*Math.round(dh/(Math.PI*2));out.maxTurn=Math.max(out.maxTurn,Math.abs(dh));out.maxUp=Math.max(out.maxUp,Math.abs(o.up-prev.up),Math.abs(o.gr-prev.gr),Math.abs(o.tw-prev.tw));}
      if(Math.abs(o.x)>hw||o.y<yt||o.y>yb)out.outside++;
      out.n++;if(o.amp>.05)out.walk++;if(o.up>.5)out.up++;if(o.gr>.5)out.gr++;if(o.tw>.5)out.tw++;
      out.xs.add(Math.round(o.x));out.ys.add(Math.round(o.y));
      prev=o;
    }
  }
  return{maxStep:out.maxStep,maxTurn:out.maxTurn,maxUp:out.maxUp,outside:out.outside,walk:out.walk/out.n,up:out.up/out.n,gr:out.gr/out.n,tw:out.tw/out.n,xs:out.xs.size,ys:out.ys.size};});
ok(r.maxStep<.12,'spider on a barrel moves smoothly: max step per frame '+r.maxStep.toFixed(3)+' (no jumps)');
ok(r.maxTurn<.2&&r.maxUp<.2,'its heading and its fidgets change smoothly (turn '+r.maxTurn.toFixed(3)+', pose '+r.maxUp.toFixed(3)+' per frame)');
ok(r.outside===0,'it never leaves the face of the barrel');
ok(r.walk>.15&&r.walk<.6,'it spends '+Math.round(r.walk*100)+'% of its time walking and the rest stopped');
ok(r.up>.04&&r.gr>.02&&r.tw>.01,'while stopped it rears up ('+Math.round(r.up*100)+'%), grooms ('+Math.round(r.gr*100)+'%) and twitches a leg ('+Math.round(r.tw*100)+'%)');
ok(r.xs>=6&&r.ys>=8,'it wanders over the whole face, up and down ('+r.xs+' x '+r.ys+' spots)');
r=await ev(()=>{
  let maxL=0,maxD=0,minL=9,up=0,dn=0,n=0,mxh=0;
  for(let sd=0;sd<8;sd++){let prev=null;for(let t=0;t<120;t+=1/60){const o=ObjLife.dangle(t,sd*13+1);
    if(prev){maxD=Math.max(maxD,Math.abs(o.L-prev.L));let dh=o.h-prev.h;dh-=Math.PI*2*Math.round(dh/(Math.PI*2));mxh=Math.max(mxh,Math.abs(dh));}
    maxL=Math.max(maxL,o.L);minL=Math.min(minL,o.L);n++;if(o.h>0)dn++;else up++;prev=o;}}
  return{maxL,maxD,minL,mxh,dn:dn/n,up:up/n};});
ok(r.minL>=0&&r.maxL>3&&r.maxL<8&&r.maxD<.15&&r.mxh<.12,'the hanging spider lets itself down ('+r.maxL.toFixed(1)+' max), swings and climbs back smoothly (step '+r.maxD.toFixed(3)+', turn '+r.mxh.toFixed(3)+')');
ok(r.dn>.3&&r.up>.15,'it hangs head-down '+Math.round(r.dn*100)+'% of the time and climbs head-up '+Math.round(r.up*100)+'%');
/* drawing the spider with every pose throws nothing */
r=await ev(()=>{const c=document.createElement('canvas');c.width=c.height=200;const x=c.getContext('2d');let n=0;for(let t=0;t<30;t+=.1){ObjLife.spider(x,100,100,t,2.7,ObjLife.crawl(t,3,5,-13,-2.5));ObjLife.spider(x,100,100,t,2.5,ObjLife.dangle(t,3));n+=2;}return n;});
ok(r===600,'600 spider frames drawn without errors');
/* ---------- gulls: gone; shadows instead ---------- */
r=await ev(()=>{
  const calls=[];const orig=ObjLife.bird;ObjLife.bird=function(c,x,y,face,tt,ph,col){calls.push(col[0]);};
  const stats={};
  for(const th of['beach','plains','arena','hell','waste','namek','redrock','sky','snake']){
    let n=0;calls.length=0;
    for(let i=0;i<400;i++){const kinds=['barrel','crate','crate2','tomb','tomb2','fence'];const k=kinds[i%6];const c=document.createElement('canvas').getContext('2d');
      try{ObjLife.draw(c,{x:i*37+11,y:i*53+7,f:1},{kind:k,sc:1},12.3,th,null);}catch(e){stats.err=String(e);}}
    stats[th]=calls.length;stats[th+'W']=calls.filter(v=>/^#f/.test(v)).length;}
  ObjLife.bird=orig;return stats;});
ok(!r.err,'ObjLife.draw runs on every theme ('+(r.err||'ok')+')');
ok(r.beachW===0&&r.plainsW===0&&r.arenaW===0&&r.hellW===0&&r.skyW===0,'no white gull is perched on any prop any more');
ok(r.beach<r.hell,'beach / plains / arena lose the bird that used to be a gull on crates and graves ('+r.beach+' crows left on fences vs '+r.hell+' elsewhere)');
ok(r.hell>0||r.waste>0||r.namek>0,'crows still sit on props elsewhere ('+r.hell+' / '+r.waste+' / '+r.namek+')');
r=await ev(()=>{
  const log=[];const ctx=new Proxy({},{get:(t,k)=>k==='canvas'?null:(...a)=>{log.push(k);},set:()=>true});
  const q={k:'bird',x:50,y:50,vx:20,vy:0,s:1,ph:1,l:3,m:40,c:'#fff'};Ambient.drawP(ctx,q,3);
  const air=log.length;
  return{hasFlocks:typeof Ambient.flocks,air,shadow:typeof Ambient.birdShadow,fs:typeof Ambient.flockShadows};});
ok(r.hasFlocks==='undefined'&&r.air===0,'the flying birds are no longer drawn in the air layer');
ok(r.shadow==='function'&&r.fs==='function','bird and flock shadows exist');
r=await ev(()=>{
  /* flock shadows: how often one is in view, how dark and how big */
  const c=document.createElement('canvas');c.width=1280;c.height=720;const x=c.getContext('2d');
  let seen=0,tot=0,maxA=0,spans=[];const orig=Ambient.birdShadow;
  Ambient.birdShadow=function(cc,bx,by,dir,t,ph,s,a){maxA=Math.max(maxA,a);spans.push(20*s);};
  for(const th of['beach','plains','sky']){let seenT=0,T=0;for(let t=0;t<3000;t+=2){spans.length=0;Ambient.flockShadows(x,500,400,1280,720,t,{beach:3,plains:2,sky:2}[th],1,(th.length*.173)%1);T++;if(spans.length)seenT++;}seen+=seenT;tot+=T;}
  Ambient.birdShadow=orig;
  return{frac:seen/tot,maxA,size:spans[0]||23};});
ok(r.frac>.12&&r.frac<.6,'a flock shadow is in view '+Math.round(r.frac*100)+'% of the time (not constantly)');
ok(r.maxA<=.11,'the shadows are faint (alpha '+r.maxA.toFixed(2)+')');
r=await ev(()=>{const c=document.createElement('canvas');c.width=300;c.height=300;const x=c.getContext('2d');let ink=0;for(let t=0;t<6;t+=.25){x.clearRect(0,0,300,300);Ambient.birdShadow(x,150,150,1,t,0.5,1.15,.5);const d=x.getImageData(0,0,300,300).data;let mnx=999,mxx=0,mny=999,mxy=0;for(let i=3;i<d.length;i+=4)if(d[i]>0){const p=(i-3)/4,px=p%300,py=(p/300)|0;mnx=Math.min(mnx,px);mxx=Math.max(mxx,px);mny=Math.min(mny,py);mxy=Math.max(mxy,py);}ink=Math.max(ink,mxy-mny);}return{span:ink};});
ok(r.span>=10&&r.span<=28,'a bird shadow spans '+r.span+' px at full flap (small)');
/* ---------- damage numbers ---------- */
await ev(()=>{const A=__app,d=A.save.d;d.settings.dmgNum=true;A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true,pet:'none'});window.G=A.game;});
await wait(300);
r=await ev(()=>{const g=G;g.showNums=true;g.tx.length=0;g.sb.nospawn=true;g.en=[];
  g.floatText(g.p.x,g.p.y-40,123,0);g.floatText(g.p.x,g.p.y-60,456,6);g.floatText(g.p.x,g.p.y-80,'+Z 50',1);g.floatText(g.p.x,g.p.y-100,'Senzu!',2);
  const l=g.tx.map(t=>[t.c,t.l]);
  return{l};});
ok(r.l[0][1]===1.1&&r.l[1][1]===1.1&&r.l[2][1]===.8&&r.l[3][1]===.8,'damage numbers and criticals last 1.1 s (0.3 s more), other texts still 0.8 s');
r=await ev(()=>{const g=G;g.tx.length=0;g.floatText(g.p.x,g.p.y,10,0);g.floatText(g.p.x,g.p.y,'+Z 5',1);let alive=[];for(let i=0;i<3;i++){for(let k=0;k<30;k++)g.update(1/60);alive.push(g.tx.map(t=>t.c).join());}return{alive};});
ok(r.alive[0]==='0,1'&&r.alive[1]==='0'&&r.alive[2]==='',"after 0.5 s both are up, after 1.0 s only the damage number, after 1.5 s none: "+JSON.stringify(r.alive));
r=await ev(()=>{const g=G;g.en=[];g.tx.length=0;g.spawnEnemy&&0;
  const e={x:g.p.x+80,y:g.p.y,r:12,hp:1e9,max:1e9,armor:0,dead:false,hit:0,flash:0,kx:0,ky:0,sh:0,id:'bat',spd:0,dmg:1,xp:1,fly:false,def:ENEMIES.bat||Object.values(ENEMIES)[0]};
  g.S.crit=1;g.S.critDmg=2;
  let cs=[];const orig=g.floatText.bind(g);g.floatText=(x,y,s,c)=>{cs.push(c);return orig(x,y,s,c);};
  try{g.damageEnemy(e,50,0,0,true);g.damageEnemy(e,50,0,0,false);}catch(er){cs.push('err '+er.message);}
  g.floatText=orig;return{cs};});
ok(r.cs[0]===6&&r.cs[1]===0,'a critical hit is class 6 (red), a normal hit class 0: '+JSON.stringify(r.cs));
r=await ev(()=>{const R=__app.renderer||window.R;const rr=R||Object.values(window).find(v=>v&&v.dmgSpr);return rr?{has:true}:{has:false};});
ok(r.has,'renderer reachable');
r=await ev(()=>{const R=__app.renderer||window.R||Object.values(window).find(v=>v&&v.dmgSpr);
  const a=R.dmgSpr('1234',false),a2=R.dmgSpr('1234',false),c=R.dmgSpr('1234',true);
  const d=a.cv.getContext('2d').getImageData(0,0,a.w,a.h).data;let mid=0;for(let i=3;i<d.length;i+=4)if(d[i]>0&&d[i]<255)mid++;
  /* the critical sprite is mostly red (outline and shadow excluded: only the lit pixels count) */
  const cnt=(im)=>{let red=0,lit=0;for(let i=0;i<im.length;i+=4)if(im[i+3]===255&&im[i]+im[i+1]+im[i+2]>200){lit++;if(im[i]>150&&im[i+1]<im[i]*.6&&im[i+2]<im[i]*.6)red++;}return{red,lit};};
  const cc=cnt(c.cv.getContext('2d').getImageData(0,0,c.w,c.h).data),nn=cnt(a.cv.getContext('2d').getImageData(0,0,a.w,a.h).data);
  const red=cc.red,other=cc.lit-cc.red,red2=nn.red;
  return{same:a===a2,mid,red,other,red2,aw:a.w,ah:a.h,cw:c.w,ch:c.h};});
ok(r.same,'the lettering of a number is drawn once and reused');
ok(r.mid===0,'edges are hard pixels (no half-transparent pixels)');
ok(r.red>r.other*1.5&&r.red2<r.red*.3,'critical hits are red ('+r.red+' red vs '+r.other+' other lit pixels; a normal hit has '+r.red2+' red)');
ok(r.cw>r.aw&&r.ch>r.ah,'critical numbers are bigger ('+r.cw+'x'+r.ch+' vs '+r.aw+'x'+r.ah+')');
/* the frame renders with all kinds of texts on screen */
r=await ev(()=>{const g=G;g.tx.length=0;for(let i=0;i<60;i++)g.floatText(g.p.x+(i%10)*20-90,g.p.y-30-(i/10|0)*14,Math.round(Math.random()*9999),i%5===0?6:0);g.floatText(g.p.x,g.p.y-130,'+Z 5',1);return{n:g.tx.length};});
ok(r.n<=46+1,'at most 46 damage numbers at once, labels keep room ('+r.n+')');
await wait(400);
ok(errs.length===0,'no page errors '+(errs[0]||''));
console.log(bad?('FAILED '+bad):'ALL OK');await b.close();process.exit(bad?1:0);})();
