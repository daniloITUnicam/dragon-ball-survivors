/* map events (src/js/events.js): one set piece per stage - scheduled, announced, markers, enemies, transformations, clean end. Screenshots: node tests/events.js [prefix] */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const ok=(c,m)=>{console.log((c?'  ok  ':'FAIL  ')+m);if(!c)fails++;};
(async()=>{const pre=process.argv[2]||'/tmp/ev_';
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:640}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
/* data: every stage theme has an event, 6 languages, steps that make sense */
const d=await pg.evaluate(()=>{const out=[];for(const s of STAGES){const D=MAP_EVENTS[s.theme];if(!D){out.push({th:s.theme,missing:true});continue;}
  const langs=['it','en','es','fr','de','pt'];const txt=[D.n,D.sub,...D.steps.filter(x=>x.l).map(x=>x.l)];
  out.push({th:s.theme,l6:txt.every(o=>langs.every(l=>o&&o[l])),ids:D.steps.every(x=>!x.mix||x.mix.every(m=>ENEMIES[m[0]])&&(!x.map||Object.entries(x.map).every(([a,b])=>ENEMIES[a]&&ENEMIES[b]))),inRoster:D.steps.filter(x=>x.mix).every(x=>true),dur:D.dur});}
  return out;});
ok(d.length===11&&d.every(x=>!x.missing),'every one of the 11 stages has its own event ('+d.map(x=>x.th).join(',')+')');
ok(d.every(x=>x.l6),'event names, subtitles and transformation labels exist in 6 languages');
ok(d.every(x=>x.ids),'every enemy named by an event exists');
const themeNames=[];
for(let si=0;si<11;si++){
  await pg.evaluate((si)=>{window.__MAPSEED=0;__app.startGame({stage:si,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;window.G=g;g.sb=g.sb||{};g.sb.nospawn=true;g.p.maxHp=g.p.hp=1e7;g.t=g.nt=240;g.en=[];g.modal=null;g.bossQ.forEach(b=>{b.done=true;});g.bossAlive=0;g.wave.ph='calm';g.wave.until=1e9;g.__calls=[];const o=g.say.bind(g);g.say=(a,b,c,d)=>{g.__calls.push([a,d]);return o(a,b,c,d);};g.bombT=0;},si);
  const th=await pg.evaluate(()=>G.stage.theme);themeNames.push(th);
  /* the first update starts the event and announces it */
  const st=await pg.evaluate(()=>{const g=G;g.update(1/30);const D=MAP_EVENTS[g.stage.theme],n=g.env.tr(D.n),sub=g.env.tr(D.sub);
    return{on:g.bombOn,ev:!!g.ev,named:g.__calls.some(c=>c[0]===n&&c[1]===sub),n};});
  ok(st.on&&st.ev&&st.named,th+': the event starts and is announced ('+st.n+')');
  /* run it: sample markers, spawned enemies, morphs */
  const run=await pg.evaluate(async()=>{const g=G,D=g.ev.D,dt=1/30;const ids=new Set(),morphed=new Set();let maxSpots=0,kinds=new Set(),spawned=0,bzMax=0,t=0,shot=null;
    const src=new Set();for(const s of D.steps)if(s.a==='morph')for(const k in s.map)src.add(k);
    const tos=new Set();for(const s of D.steps)if(s.a==='morph')for(const k in s.map)tos.add(s.map[k]);
    const seen=new Set();let tint=false,morphSteps=0;
    while(g.bombOn&&t<D.dur+14){g.modal=null;g.p.hp=g.p.maxHp=1e7;g.en=g.en.filter(e=>!e.dead);for(const e of g.en){if(!seen.has(e)){seen.add(e);ids.add(e.def.id);}if(!e.big){e.big=1;e.hp*=200;e.max*=200;}for(const to of tos)if(e.def===ENEMIES[to]&&e.enr)morphed.add(to);}
      g.p.x=g.p.x;g.update(dt);t+=dt;if(g.ev){maxSpots=Math.max(maxSpots,g.ev.spots.length);for(const s of g.ev.spots)kinds.add(s.kind);if(g.ev.tint)tint=true;}bzMax=Math.max(bzMax,g.bz.length);
    }
    return{ended:!g.bombOn&&!g.ev,t:+t.toFixed(1),dur:D.dur,ids:[...ids],morphed:[...morphed],tos:[...tos],maxSpots,kinds:[...kinds],bzMax,tint,nextIn:g.bombT};});
  ok(run.ended&&run.t<=run.dur+12,th+': the event runs and ends by itself ('+run.t+' s of '+run.dur+')');
  ok(run.maxSpots>=4&&run.kinds.length>=1,th+': markers appear ('+run.kinds.join('/')+', up to '+run.maxSpots+' at once)');
  ok(run.ids.length>=1,th+': enemies come out of the markers ('+run.ids.join(',')+')');
  if(run.tos.length)ok(run.morphed.length===run.tos.length||run.morphed.length>=1,th+': enemies transform ('+run.morphed.join(',')+' <- '+run.tos.join(',')+')');
  ok(run.nextIn>=150,th+': the next one is scheduled several minutes later ('+Math.round(run.nextIn)+' s)');
}
/* screenshots: a few moments of some events (markers + a transformation + the Full Moon) */
const shots=[[0,'seed',2.4],[1,'pod',1.6],[2,'capsule',2],[3,'portal',2],[4,'march',1.2],[5,'chute',1.8],[6,'moon',12],[7,'egg',2.2],[8,'pillar',2],[9,'fissure',2],[10,'march',1.2]];
for(const [si,nm,at] of shots){
  await pg.evaluate((si,at)=>{window.__MAPSEED=0;__app.startGame({stage:si,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;window.G=g;g.sb=g.sb||{};g.sb.nospawn=true;g.p.maxHp=g.p.hp=1e7;g.t=g.nt=240;g.en=[];g.modal=null;g.bossQ.forEach(b=>{b.done=true;});g.bossAlive=0;g.bombT=0;g.wave.ph='calm';g.wave.until=1e9;g.update(1/30);
    g.p.x=g.p.x;for(let i=0;i<at*30;i++){g.modal=null;g.p.hp=g.p.maxHp=1e7;g.update(1/30);for(const e of g.en)if(!e.big){e.big=1;e.hp*=200;e.max*=200;}}},si,at);
  await wait(120);await pg.screenshot({path:pre+String(si).padStart(2,'0')+'_'+nm+'.png'});
}
console.log(errs.length?errs.slice(0,3):'no page errors');if(errs.length)fails++;
console.log(fails?fails+' FAILED':'all ok');await b.close();process.exit(fails?1:0);})();
