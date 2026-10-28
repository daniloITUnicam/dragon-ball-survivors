/* Snake Way: floating islands (walkable ground, three power-ups each, once), a screenshot of one, and the calmer enemy fire / bullet cutting */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:640}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const r=await pg.evaluate(()=>{const o=[],bad=[];const ok=(c,m)=>{(c?o:bad).push((c?'PASS ':'FAIL ')+m);};
 const idx=STAGES.findIndex(s=>s.theme==='snake');
 __app.startGame({stage:idx,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.god=true;window.G=g;
 window.step=(n,fn)=>{for(let f=0;f<n;f++){if(g.modal){try{__app.resolveModal(0);}catch(e){}if(g.modal)g.modal=null;}g.update(1/60);if(g.p.hp<g.p.maxHp*.6)g.p.hp=g.p.maxHp;if(fn)fn(f);}};
 /* geometry */
 const L=Snake.islandsIn(-Snake.XMAX,Snake.XMAX);
 ok(L.length>=10,'islands along the snake ('+L.length+', all kinds '+new Set(L.map(i=>i.kind)).size+'/9)');
 ok(new Set(L.map(i=>i.kind)).size===9,'every island kind appears');
 ok(L.every(i=>Math.abs(i.x)<=Snake.XMAX-400&&Math.abs(i.x)>=800),'none near the start nor past the end');
 const I=L.find(i=>i.x>0&&i.side>0)||L[0];
 /* v112: depth of a point inside the footprints (> -rad = blocked) */
 const deep=(J,x,y)=>{let d=-1e9;for(const s of Snake.objs(J))for(const qq of s.P){let mx=-1e9;for(let j=0;j<qq.n.length;j+=3)mx=Math.max(mx,qq.n[j]*x+qq.n[j+1]*y-qq.n[j+2]);d=Math.max(d,-mx);}return d;};
 let fp=null;for(let a=0;a<64&&!fp;a++){const u=.15+(a%8)*.09,an=a*.7,x=I.x+Math.cos(an)*u*I.r,y=I.y+Math.sin(an)*u*I.ry;if(deep(I,x,y)<-40)fp=[x,y];}
 const q={x:fp[0],y:fp[1]};Snake.clamp(q,10);
 ok(Math.hypot(q.x-fp[0],q.y-fp[1])<1,'a free point on the island is walkable (not pushed back)');
 /* v112: buildings, trees and rocks on the islands */
 ok(L.every(J=>J.kind==='nimbus'||Snake.objs(J).length>=3),'v112: every island but the cloud has its structures ('+L.slice(0,9).map(J=>J.kind+' '+Snake.objs(J).length).join(', ')+')');
 let stuck=0,tot=0;
 for(const J of L)for(const s of Snake.objs(J))for(const qq of s.P){let mx=0,my=0;const n=qq.p.length/2;for(let j=0;j<qq.p.length;j+=2){mx+=qq.p[j]/n;my+=qq.p[j+1]/n;}if(Snake.inIsle(J,mx,my,14)>.95)continue;   /* on the rim: the island's edge holds it there */
   const o={x:mx,y:my};Snake.clamp(o,14);tot++;if(deep(J,o.x,o.y)>-10)stuck++;}
 ok(tot>80&&stuck===0,'v112: whoever lands inside a footprint is pushed out of it, his radius clear within 4 px ('+tot+' footprints, '+stuck+' left inside)');
 const H=L.find(J=>J.kind==='kame')||L.find(J=>Snake.objs(J).length),big=Snake.objs(H).reduce((a,b)=>(b.x1-b.x0)>(a.x1-a.x0)?b:a);
 g.en=[];g.p.x=(big.P[0].bx0+big.P[0].bx1)/2;g.p.y=(big.P[0].by0+big.P[0].by1)/2;step(3);
 ok(deep(H,g.p.x,g.p.y)<-5,'v112: the hero cannot stand inside a building ('+H.kind+')');
 const fy=Snake.front(big,(big.fx0+big.fx1)/2),cx=(big.fx0+big.fx1)/2;
 ok(fy>big.y0&&fy<=big.y1+1,'v112: the front edge of a structure lies inside its picture');
 const occN=E=>{let n=0;const c={save(){},restore(){},beginPath(){},rect(){},clip(){},translate(){},drawImage(){n++;},fillRect(){},ellipse(){},fill(){},arc(){},set fillStyle(v){},set globalAlpha(v){},set imageSmoothingEnabled(v){},set globalCompositeOperation(v){}};SnakeArt.occlude(c,[H],E,0,null);return n;};
 const sh=Sprites.sheets&&Sprites.sheets['isleo'+H.kind]&&Sprites.sheets['isleo'+H.kind].img;
 /* v112: Shenron's Altar: up the stairs onto its top, its back wall holds, the 7 balls are picked up there */
 {const J=L.find(q=>q.kind==='shrine'),G=ISLE_GEO.shrine,k=J.r/G[2],W=(sx,sy)=>[J.x+(sx-G[0])*k,J.y+(sy-G[1])*k],S=(x,y)=>[G[0]+(x-J.x)/k,G[1]+(y-J.y)/k];
  const walk=(sx,sy,dx,dy,n)=>{const o={};[o.x,o.y]=W(sx,sy);for(let j=0;j<n;j++){o.x+=dx;o.y+=dy;World.resolve('snake',o,9);}return S(o.x,o.y);};
  const up=walk(378,345,0,-3,120),back=walk(380,150,0,3,120);
  ok(up[1]<205&&Math.abs(up[0]-378)<6,'v112: up the stairs you reach the top of the altar ('+up.map(v=>v.toFixed(0))+')');
  ok(back[1]<175,'v112: from behind the altar\'s wall holds you back ('+back.map(v=>v.toFixed(0))+')');
  const M2=Object.values(g).find(v=>v&&v.constructor&&v.constructor.name==='MapDirector');g.p.x=J.x;g.p.y=J.y+J.ry*.9;M2.isT=0;M2.isSeen=null;M2.update(.6);
  const A=J.alt||[];ok(A.length===7&&A.every(l=>g.loot.includes(l)&&l.k==='ball')&&A.map(l=>l.star).sort().join('')==='1234567','v112: the 7 Dragon Balls (1-7 stars) lie on the altar');
  g.balls=0;g.ballSet=[];g.en=[];for(const l of A){g.p.x=l.x+6;g.p.y=l.y;step(1);}
  ok(g.balls>=7||A.every(l=>l.dead),'v112: walking over them on the altar picks them all up ('+A.filter(l=>l.dead).length+'/7)');
  }
 ok(!sh||(occN([{x:cx,y:big.y0+30,w:40,h:120}])>=1&&occN([{x:cx,y:fy+40,w:40,h:120}])===0),'v112: a structure is painted over who stands behind it, not over who stands in front');
 const far={x:I.x,y:I.y+I.side*(I.r*2.6)};Snake.clamp(far,10);
 ok(Math.hypot(far.x-I.x,far.y-I.y)<=I.r+1||Math.abs(far.y-Snake.f(far.x))<=Snake.HW*1.2,'a point far outside is pulled back to the ground');
 /* rewards */
 g.loot=[];const m=g.dir||g.map||g.director;
 const md=g.mapDirector||g.md||Object.values(g).find(v=>v&&v.constructor&&v.constructor.name==='MapDirector');
 ok(!!md,'MapDirector found');
 g.p.x=I.x-300;g.p.y=Snake.f(g.p.x);md.isT=0;md.update(.6);
 const here=g.loot.filter(l=>l.isle===I.id);
 ok(here.length===3,'3 power-ups on the island ('+here.map(l=>l.k).join(',')+')');
 ok(here.every(l=>Snake.inIsle(I,l.x,l.y,0)<=.8),'they lie inside the island');   /* v110: the island is an ellipse (I.r x I.ry) */
 ok(I.road&&I.road.length>2&&I.road.every(([x,y])=>{const q={x,y};Snake.clamp(q,6);return Math.hypot(q.x-x,q.y-y)<1;}),'v110: the road from the body to the island is walkable all the way');
 ok(L.every(J=>{for(let k=-10;k<=10;k++){const xx=J.x+k/10*J.r;if(Math.abs(Snake.f(xx)-J.y)<Snake.HW+J.ry*Math.sqrt(1-(k/10)**2))return false;}return true;}),'v110: no island overlaps the body');
 const n0=g.loot.length;md.isT=0;md.update(.6);ok(g.loot.length===n0,'they are laid only once');
 /* walk onto it and pick everything up */
 const kinds=here.map(l=>l.k).join(',');
 g.p.x=here[0].x;g.p.y=here[0].y;g.gm=[];step(30);
 g.p.x=here[1].x;g.p.y=here[1].y;step(30);g.p.x=here[2].x;g.p.y=here[2].y;step(30);
 ok(here.every(l=>l.dead||!g.loot.includes(l)),'walking over them collects them all ('+kinds+')');
 /* screenshot of the island */
 g.loot=[];g.en=[];g.p.x=I.x;g.p.y=I.y+I.side*-60;g.cam&&0;
 window.__shot=I.kind;
 /* enemy fire */
 g.en=[];g.eb=[];g.sbk=null;
 const shooters=[];for(let i=0;i<40;i++){const e=g.mkEnemy(ENEMIES.swspit,g.p.x+rnd(-300,300),g.p.y+rnd(-200,200));e.sh=0;g.en.push(e);shooters.push(e);}
 let mx=0,fired=0;const sbk0=[];
 const ebAdd=[];let prev=0;
 step(60*10,()=>{g.p.hp=g.p.maxHp;const n=g.eb.length;mx=Math.max(mx,n);});
 ok(mx<=EB_CAP,'enemy bullets on screen never exceed the cap (max '+mx+' with 40 shooters, cap '+EB_CAP+')');
 /* fire rate: bullets created per second with 40 shooters */
 g.eb=[];g.sbk=null;let made=0;const sub=g.eb;
 const push0=Array.prototype.push;
 g.eb=[];let cnt=0;const oShot=g.shotOK.bind(g);g.shotOK=function(n){const r=oShot(n);if(r)cnt+=n;return r;};
 g.en=[];step(60*10,(f)=>{g.p.hp=g.p.maxHp;if(f%20===0)while(g.en.length<40){const e=g.mkEnemy(ENEMIES.swspit,g.p.x+rnd(-300,300),g.p.y+rnd(-200,200));e.sh=0;g.en.push(e);}});   /* keep 40 alive: the player's weapons kill them */
 ok(cnt/10<=SHOT_RATE_SNAKE+SHOT_BANK_SNAKE/10+.2&&cnt/10>=SHOT_RATE_SNAKE*.6,'with 40 shooters the whole map spends '+(cnt/10).toFixed(1)+' shots/s (budget '+SHOT_RATE_SNAKE+'/s plus the '+SHOT_BANK_SNAKE+' shot reserve over 10 s)');
 /* cutting */
 g.en=[];g.eb=[];g.pr=[];
 const px=g.p.x,py=g.p.y;
 g.eb.push({x:px+60,y:py-14,vx:0,vy:0,r:6,dmg:5,life:5,c:'#fff'});g.eb.push({x:px+500,y:py-14,vx:0,vy:0,r:6,dmg:5,life:5,c:'#fff'});
 g.pr.push({x:px+50,y:py-14,vx:300,vy:0,r:7,dmg:1,pi:0,life:1,hit:[],c:'#fff'});
 g.updateProjectiles(1/60);
 ok(g.eb[0].dead&&!g.eb[1].dead,'a ki shot destroys the enemy bullet it touches');
 g.eb=[{x:px+200,y:py-14,vx:0,vy:0,r:6,dmg:5,life:5,c:'#fff'},{x:px+200,y:py+300,vx:0,vy:0,r:6,dmg:5,life:5,c:'#fff'}];
 g.cutBeam(px,py-14,1,0,400,60);ok(g.eb[0].dead&&!g.eb[1].dead,'a beam destroys the bullets inside it only');
 g.eb=[{x:px+30,y:py,vx:0,vy:0,r:6,dmg:5,life:5,c:'#fff'},{x:px-120,y:py,vx:0,vy:0,r:6,dmg:5,life:5,c:'#fff'}];
 g.cutArc(px,py,150,0,.8);ok(g.eb[0].dead&&!g.eb[1].dead,'a slash destroys the bullets inside its arc');
 g.eb=[{x:px+50,y:py,vx:0,vy:0,r:6,dmg:5,life:5,c:'#fff'}];
 const w=KiWeapon&&null;
 return o.concat(bad);});
console.log(r.join('\n'));
await pg.evaluate(()=>{const g=G;const I=Snake.islandsIn(-Snake.XMAX,Snake.XMAX).find(i=>i.kind===window.__shot);g.en=[];g.eb=[];g.p.x=I.x;g.p.y=I.y+I.side*-70;for(let i=0;i<30;i++)g.update(1/60);});
await pg.screenshot({path:'/tmp/snake_isle.png'});
console.log(errs.length?errs.slice(0,4):'no errors');await b.close();process.exit((errs.length||r.some(x=>x.startsWith('FAIL')))?1:0);})();
