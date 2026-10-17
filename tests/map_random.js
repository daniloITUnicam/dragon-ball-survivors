/* maps are laid out differently every run: seeds change the layout, a seed replays it, the start is always clear, the Snake Way stays valid */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:900,height:520}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const r=await pg.evaluate(()=>{const o=[],bad=[];const ok=(c,m)=>{(c?o:bad).push((c?'PASS ':'FAIL ')+m);};
 const themes=[...new Set(STAGES.map(s=>s.theme))];
 const sig=(th)=>{World.setTheme(th);const v=World.visible(th,-3000,-3000,3000,3000);let h=0;for(const b of v)h=(h*31+Math.round(b.x)*7+Math.round(b.y)*13+b.t)|0;return {h,n:v.length};};
 for(const th of themes){
  MAP.roll(0);const c0=sig(th);MAP.roll(111);const a=sig(th);MAP.roll(111);const a2=sig(th);MAP.roll(222);const b2=sig(th);
  ok(a.h===a2.h,th+': the same seed replays the same layout');
  if(th==='snake'){MAP.roll(111);const f1=Snake.f(6000);MAP.roll(222);const f2=Snake.f(6000);MAP.roll(0);const f0=Snake.f(6000);ok(Math.abs(f1-f2)>20&&Math.abs(f1-f0)>20,'snake: different seeds wind the body differently ('+Math.round(f1)+' / '+Math.round(f2)+' / '+Math.round(f0)+')');}
  else ok(a.h!==b2.h&&a.h!==c0.h,th+': different seeds give different layouts ('+a.n+'/'+b2.n+' props)');
  /* the start is clear for many seeds */
  let free=true,dry=true;
  for(let s=1;s<=40;s++){MAP.roll(s*977);World.setTheme(th);for(const ob of World.visible(th,-300,-300,300,300))if(Math.hypot(ob.x,ob.y)<250)free=false;if(th!=='snake'&&Sea.has(th)){for(let a=0;a<12;a++)if(Sea.wet(th,Math.cos(a)*250,Math.sin(a)*250)>-.01)dry=false;}}
  ok(free,th+': no prop within 250 px of the start, 40 seeds');
  if(Sea.has(th))ok(dry,th+': the start is dry, 40 seeds');
 }
 /* snake way */
 let sn=true,isl=true,kinds=true;
 for(let s=1;s<=25;s++){MAP.roll(s*1237);const L=Snake.islandsIn(-Snake.XMAX,Snake.XMAX);
  if(L.length<10)isl=false;if(new Set(L.map(i=>i.kind)).size!==9)kinds=false;
  if(!L.every(i=>Math.abs(i.x)>=800&&Math.abs(i.x)<=Snake.XMAX-400))isl=false;
  const p={x:0,y:Snake.f(0)};Snake.clamp(p,10);if(Math.hypot(p.x,p.y-Snake.f(0))>1)sn=false;
  for(let x=-Snake.XMAX;x<Snake.XMAX;x+=300)if(Math.abs(Snake.f(x+300)-Snake.f(x))>420)sn=false;}
 ok(sn,'snake: the start is walkable and the body has no jumps, 25 seeds');ok(isl,'snake: 10+ islands, none near the ends, 25 seeds');ok(kinds,'snake: all 9 island kinds, 25 seeds');
 /* a run rolls its own seed unless fixed */
 delete window.__MAPSEED;const idx=STAGES.findIndex(s=>s.theme==='beach');
 const seeds=new Set();for(let i=0;i<5;i++){__app.startGame({stage:idx,char:'goku',diff:'normal',x2:false,sandbox:true});seeds.add(MAP.seed);}
 ok(seeds.size===5,'every new run rolls a new map seed ('+[...seeds].join(',')+')');
 window.__MAPSEED=0;__app.startGame({stage:idx,char:'goku',diff:'normal',x2:false,sandbox:true});ok(MAP.seed===0,'__MAPSEED=0 restores the classic layout');
 return {o,bad};});
console.log(r.o.join('\n'));console.log(r.bad.join('\n')||'ALL PASS');console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
