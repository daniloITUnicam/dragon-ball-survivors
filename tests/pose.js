/* weapon animations (src/js/pose.js): composite frames, arms IK, Kamehameha / Ki Blast poses, generic poses, rate of fire unchanged: node tests/pose.js */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const ok=(c,m)=>{console.log((c?'  ok  ':'FAIL  ')+m);if(!c)fails++;};
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:900,height:600}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const start=(ws)=>pg.evaluate((ws)=>{window.__MAPSEED=0;__app.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;window.G=g;g.sb.nospawn=true;g.p.hp=g.p.maxHp=1e7;
  g.weapons.clear();for(const id of ws)g.addWeapon(id);g.en.length=0;g.modal=null;return true;},ws);
const foe=(dx,dy)=>pg.evaluate((dx,dy)=>{const g=G,e=g.mkEnemy(ENEMIES.saibaman||Object.values(ENEMIES)[0],g.p.x+dx,g.p.y+dy);e.hp=e.max=1e9;e.spd=0;g.en.push(e);return g.en.length;},dx,dy);

await start(['kame']);
/* 1. composite frames */
const f=await pg.evaluate(()=>{const P=Sprites.pose,a=P(0),b=P(21),c=P(34),d=P(6),e=P(5);const cfg=G.pc;
  const px=(fr)=>{const s=Sprites.player('goku',cfg,fr,false,null),d=s.c.getContext('2d').getImageData(0,0,s.c.width,s.c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>40)n++;return n;};
  const hs=(fr)=>{const s=Sprites.player('goku',cfg,fr,false,null);return s.c.toDataURL().length+':'+s.c.toDataURL().slice(-60);};
  return{a:[a.na,a.ang,a.atk],b:[b.na,b.ang,b.atk,b.l],c:[c.na,c.ang,c.atk,c.sw],d:[d.na,d.ang,d.atk],e:[e.atk],p0:px(0),p20:px(20),p30:px(30),p1:px(1),p21:px(21),h20:hs(20),h30:hs(30)};});
ok(!f.a[0]&&!f.a[1]&&f.a[2]===0,'frame 0 is the normal idle');
ok(f.b[0]&&!f.b[1]&&f.b[2]===0&&f.b[3]===1.6,'frame 21 = walk frame 1 without arms (legs keep walking)');
ok(f.c[0]&&f.c[1]&&f.c[2]===0,'frame 34 = walk frame 4 without arms and with a fierce face');
ok(f.d[2]===2&&f.e[0]===1,'legacy attack frames 5 / 6 unchanged');
ok(f.p20<f.p0&&f.p21<f.p1,'the "no arms" body has fewer painted pixels than the normal one ('+f.p20+' < '+f.p0+')');
ok(f.h30!==f.h20,'the fierce face is a different painting');

/* 2. IK */
const ik=await pg.evaluate(()=>{const o=[];for(const [tx,ty] of [[8,-14],[0,0],[14,-10],[30,-30],[6.6,-14.1],[-5,-20],[7,-6]]){const r=Pose.ik(6.5,-14.2,tx,ty,1,1);
  const l1=Math.hypot(r.E[0]-6.5,r.E[1]+14.2),l2=Math.hypot(r.W[0]-r.E[0],r.W[1]-r.E[1]);o.push([l1,l2]);}return o;});
ok(ik.every(([a,b])=>Math.abs(a-4.4)<1e-6&&Math.abs(b-3.8)<1e-6),'IK keeps the bones at their length for every target, reachable or not');
ok(await pg.evaluate(()=>{const r=Pose.ik(6.5,-14.2,6.5+8.1,-14.2,1,1);return Math.hypot(r.W[0]-6.5,r.W[1]+14.2)<=POSE_L1+POSE_L2;}),'the wrist never goes beyond the reach of the arm');

/* 3. Ki Blast: the wind-up ends with the shot, the ball leaves the hand, the rate of fire is the one of the stat */
await start(['ki']);await foe(220,0);
const ki=await pg.evaluate(()=>{const g=G,w=g.weapons.get('ki'),dt=1/60;let shots=0,seenWind=false,ball=false,tipOk=true,first=null,n0=0,t=0;const times=[];
  for(let i=0;i<60*12;i++){g.modal=null;g.p.hp=1e7;const pn=g.pr.length;g.update(dt);t+=dt;
    if(g.pa&&g.pa.st==='shoot'&&g.pa.w>0&&g.rt-g.pa.t0<g.pa.w){seenWind=true;const s=Pose.cur(g);if(s&&s.ball)ball=true;}
    if(g.pr.length>pn){shots++;times.push(t);const pr=g.pr[g.pr.length-1];const d=Math.hypot(pr.x-g.p.x,pr.y-(g.p.y-14*1.95));if(!first)first={d,x:pr.x-g.p.x,y:pr.y-g.p.y,pa:g.pa&&g.pa.st};}
    for(const q of g.pr)q.life=Math.min(q.life,.05);}
  return{shots,seenWind,ball,first,times,cdMax:w.cdMax};});
ok(ki.seenWind&&ki.ball,'Ki Blast: while the cooldown runs out the pose has a wind-up with a ball on the palm');
ok(ki.first&&ki.first.d>=18&&ki.first.pa==='shoot','Ki Blast: the first blast leaves the hand, not the chest (distance from the shoulder: '+(ki.first&&ki.first.d.toFixed(1))+' px)');
const gaps=ki.times.slice(1).map((v,i)=>v-ki.times[i]);const avg=gaps.reduce((a,v)=>a+v,0)/Math.max(1,gaps.length);
ok(ki.shots>=8&&Math.abs(avg-ki.cdMax)<.05,'Ki Blast: the rate of fire is unchanged ('+ki.shots+' shots in 12 s, one every '+avg.toFixed(2)+' s, cooldown '+ki.cdMax.toFixed(2)+' s)');

/* 4. Kamehameha: charge pose (g.cast) while walking, extended pose while the beam is out */
await start(['kame']);await foe(260,0);
const km=await pg.evaluate(()=>{const g=G,dt=1/60;let charge=0,fire=0,walkOk=true,chargeKK=[],aimSeen=false;g.p.mv=true;g.p.x+=0;
  for(let i=0;i<60*8;i++){g.modal=null;g.p.hp=1e7;g.p.mv=true;g.update(dt);const s=Pose.cur(g);
    if(s&&s.st==='kamec'){charge++;chargeKK.push(s.kk);}
    if(s&&s.st==='kamef')fire++;}
  return{charge,fire,mono:chargeKK.every((v,i)=>i===0||v>=chargeKK[i-1]-1e-9||v<.1),last:Math.max(...chargeKK)};});
ok(km.charge>10&&km.mono&&km.last>.9,'Kamehameha: charge pose while charging, growing with the charge ('+km.charge+' frames)');
ok(km.fire>10,'Kamehameha: extended arms while the beam is out ('+km.fire+' frames)');

/* 5. generic poses of the other weapons */
for(const [id,st] of [['homing','shoot'],['spirit','raise2'],['chain','sky'],['flare','face'],['shock','slam'],['breaker','both']]){
  await start([id]);await foe(160,40);
  const r=await pg.evaluate((id)=>{const g=G,dt=1/60;let seen=null,ang=null;for(let i=0;i<60*14&&!seen;i++){g.modal=null;g.p.hp=1e7;g.update(dt);if(g.pa&&g.weapons.get(id)){seen=g.pa.st;ang=g.pa.a;}}return{seen,ang};},id);
  ok(r.seen===st,id+': plays the "'+st+'" pose when it fires (got '+r.seen+')');
}
/* 6. facing: the character looks toward the target while acting; drawing works with every pose, walking, without errors */
await start(['kame','ki']);
const dr=await pg.evaluate(()=>{const g=G,R=__app.renderer;let n=0;const sts=['shoot','kamec','kamef','both','sky','slam','raise2','face'];
  for(const st of sts)for(const mv of[false,true])for(const a of[0,Math.PI,-1.2,2.4]){g.cast=null;g.pa={st,a,t0:g.rt-.1,w:st==='shoot'||st==='kamec'?.3:.1,h:.5,r:.2,col:'#ffd24a',ball:1,ballR:7,alt:0};g.p.mv=mv;g.p.face=1;R.draw(g,.016);n++;}
  return n;});
ok(dr>=60,'every pose draws while walking / standing, aiming right / left / up / down ('+dr+' renders)');
const fc=await pg.evaluate(()=>{const g=G;g.pa={st:'shoot',a:Math.PI,t0:g.rt,w:.2,h:.4,r:.2,col:'#fff',ball:1,ballR:7};g.p.face=1;g.p.mv=false;__app.renderer.draw(g,.016);return{pfd:g.pfd,until:g.pfdUntil>g.rt};});
ok(fc.pfd===-1&&fc.until,'aiming left while facing right: the character turns toward the target for the gesture');
/* 7. sprite-sheet characters: no procedural arms; the optional frames 10-15 (when the sheet declares them) show the poses, the hand anchors place the ball and the shot */
await start(['ki']);
const shs=await pg.evaluate(()=>{const g=G,R=__app.renderer,out={};
  const cv=document.createElement('canvas');cv.width=64*16;cv.height=96;const c2=cv.getContext('2d');for(let i=0;i<16;i++){c2.fillStyle='hsl('+i*22+',70%,50%)';c2.fillRect(i*64+16,30,32,60);}
  const key=g.pcKey,m=/(?:^|:)([a-z0-9_]+):(-?\d+)$/i.exec(key),id=m[1];
  Sprites.sheets[id]={img:cv,cols:16,fw:64,fh:96,ax:32,ay:94,ppu:2,has:[10,11,12,13,14,15],walk:null,pw:null,dh:null,rects:null,hand:{10:[44,60],12:[46,58],13:[62,52],14:[32,10]}};
  Sprites.pcache&&Sprites.pcache.clear();
  out.f=['kamec','kamef','both','raise2','sky'].map(st=>Pose.sheetFrame({st}));out.fs=[Pose.sheetFrame({st:'shoot',ph:0}),Pose.sheetFrame({st:'shoot',ph:1})];
  /* the tip of the throw frame: anchor (62,52) in a sheet with ppu 2, feet (32,94): 15 px right, 21 px above the feet (x u/2) */
  g.p.face=1;const u=g.C.u||1.95,tp=Pose.tip(g,0);out.tip=[tp.x-g.p.x,tp.y-g.p.y,(62-32)*u/2,(52-94)*u/2];
  g.p.face=-1;const tl=Pose.tip(g,Math.PI);out.tipL=[tl.x-g.p.x,tl.y-g.p.y];
  /* drawing with every pose: no errors, frames used */
  let n=0;for(const st of['shoot','kamec','kamef','both','sky','raise2']){g.cast=null;g.pa={st,a:0,t0:g.rt-.1,w:.3,h:.5,r:.2,col:'#ffd24a',ball:1,ballR:7,alt:0};R.draw(g,.016);n++;}
  out.n=n;
  const sb=Pose.sheetBall(g,{st:'shoot',ph:0,u:.5,ball:1,ballR:7},12,1,u,0);out.ball=sb&&[sb.x-g.p.x,sb.y-g.p.y,sb.r];
  delete Sprites.sheets[id];Sprites.pcache&&Sprites.pcache.clear();g.pa=null;
  return out;});
ok(shs.f.join()==='10,11,11,14,15'&&shs.fs.join()==='12,13','sheet frames: charge 10, fire / both 11, wind-up 12, throw 13, raised 14, sky 15');
ok(Math.abs(shs.tip[0]-shs.tip[2])<.01&&Math.abs(shs.tip[1]-shs.tip[3])<.01,'the shot leaves the hand anchor of frame 13 ('+shs.tip.map(v=>v.toFixed(1)).join(', ')+')');
ok(shs.tipL[0]<0,'... mirrored when the character looks left');
ok(shs.ball&&shs.ball[2]>1&&shs.ball[0]>0,'the wind-up ball sits on the hand anchor of frame 12');
ok(shs.n===6,'every pose draws with a sheet character');
const nosh=await pg.evaluate(()=>{const g=G;const key=g.pcKey,id=/(?:^|:)([a-z0-9_]+):(-?\d+)$/i.exec(key)[1];
  const cv=document.createElement('canvas');cv.width=64*10;cv.height=96;Sprites.sheets[id]={img:cv,cols:10,fw:64,fh:96,ax:32,ay:94,ppu:2,has:[],walk:null,pw:null,dh:null,rects:null,hand:null};
  const tp=Pose.tip(g,0),d=[tp.x-g.p.x,tp.y-g.p.y];delete Sprites.sheets[id];return d;});
ok(nosh[0]===0&&nosh[1]===-18,'a sheet without the new frames keeps the old origin of the shots (chest)');

console.log(errs.length?'page errors: '+errs.slice(0,4).join(' | '):'  ok  no page errors');if(errs.length)fails++;
await b.close();console.log(fails?fails+' FAILED':'all ok');process.exit(fails?1:0);})();
