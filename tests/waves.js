/* wave rhythm (calm -> surge 15 s -> rest 12 s with gems), elite enemies with a guaranteed chest, guaranteed Dragon Ball */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:640,deviceScaleFactor:1}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const start=(stage,diff)=>pg.evaluate((stage,diff)=>{__app.save.d.settings.reduceFx=false;__app.applySettings();__app.startGame({stage,char:'goku',diff,x2:false,sandbox:false});const g=__app.game;g.sb.god=true;window.G=g;g.modal=null;g.en=[];g.eb=[];g.loot=[];g.gm=[];for(const q of g.bossQ)q.done=true;return{dur:g.dur,TS:g.TS,eliteN:g.elitePlan.length};},stage,diff);
/* ---------- wave rhythm ---------- */
const s1=await start(5,'normal');await wait(300);
const w=await pg.evaluate(()=>{const g=G;g.hordeT=1e9;g.packT=1e9;g.wave.until=5;
  const log=[];let ph=g.wave.ph,t0=g.t,spawns=0,ph0=ph;const so=g.spawnOne.bind(g);g.spawnOne=()=>{spawns++;return so();};
  const per={calm:{n:0,t:0},surge:{n:0,t:0},rest:{n:0,t:0}};let gemJump=null,gemV=0,need=0;
  for(let i=0;i<30*330;i++){
    g.en=g.en.filter(e=>e.boss||e.elite);g.t=g.t;const s0=spawns,gm0=g.gm.length,ph1=g.wave.ph;g.modal=null;const exp=g.spawnRate()/30*(ph1==='surge'?1:ph1==='rest'?1:1);
    g.update(1/30);
    per[ph1].n+=spawns-s0;per[ph1].t+=exp;
    if(g.wave.ph!==ph1){log.push([ph1,g.wave.ph,+(g.t-t0).toFixed(1)]);if(g.wave.ph==='rest'){gemJump=g.gm.length-gm0;gemV=g.gm.reduce((a,x)=>a+x.v,0);need=g.need;}}
    g.gm=[];   // collected
  }
  return{log,per,gemJump,gemV,need};});
const L=w.log;
const durs={};let prev=0;for(const [a,bb,t] of L){(durs[a]=durs[a]||[]).push(+(t-prev).toFixed(1));prev=t;}
console.log('phase log',JSON.stringify(L),'\ndurations',JSON.stringify(durs));
ok(L.some(x=>x[0]==='calm'&&x[1]==='surge')&&L.some(x=>x[0]==='surge'&&x[1]==='rest')&&L.some(x=>x[0]==='rest'&&x[1]==='calm'),'calm -> surge -> rest -> calm cycle runs');
ok((durs.surge||[]).every(d=>d>=14.9&&d<=15.2),'surge lasts about 15 s ('+(durs.surge||[]).join(', ')+')');
ok((durs.rest||[]).every(d=>d>=11.9&&d<=12.2),'rest lasts about 12 s ('+(durs.rest||[]).join(', ')+')');
ok((durs.calm||[]).slice(1).every(d=>d>=27),'calm stretches between waves are long enough ('+(durs.calm||[]).join(', ')+')');
const rate=k=>w.per[k].n/Math.max(.01,w.per[k].t);   /* spawns per 'base' spawn: normalised, because the base rate grows over the run */
ok(rate('surge')>rate('calm')*1.5,'enemies spawn much faster in the surge (x'+rate('surge').toFixed(2)+' vs x'+rate('calm').toFixed(2)+' of the base rate)');
ok(rate('rest')<rate('calm')*.5,'and much slower in the breather (x'+rate('rest').toFixed(2)+')');
ok(w.gemJump>=10&&Math.abs(w.gemV/w.need-.09)<.02,'the breather opens with a shower of gems ('+w.gemJump+' gems worth '+(w.gemV/w.need*100).toFixed(1)+'% of a level)');
const bonus=await pg.evaluate(()=>{const g=G,mk=()=>({x:g.p.x+900,y:g.p.y,def:ENEMIES[g.stage.roster[0][0]],xpm:1,boss:false});
  g.wave.ph='calm';g.gm=[];g.dropLoot(mk());const a=g.gm[0].v;g.wave.ph='rest';g.gm=[];g.dropLoot(mk());const r=g.gm[0].v;g.wave.ph='calm';return r/a;});
ok(Math.abs(bonus-1.5)<.01,'gems dropped during the breather are worth +50% ('+bonus.toFixed(2)+'x)');
/* waves never overlap bosses / hordes */
const gate=await pg.evaluate(()=>{const g=G;g.gm=[];g.en=[];g.modal=null;g.bombOn=false;g.shootOn=false;g.hordeT=1e9;g.packT=1e9;g.bossAlive=0;g.finalSpawned=false;g.wave.ph='calm';g.wave.until=0;g.hordeT=1e9;const out={};
  g.bossAlive=1;g.update(1/30);out.boss=g.wave.ph;g.bossAlive=0;g.wave.ph='calm';g.wave.until=0;
  g.hordeT=g.t+10;g.update(1/30);out.horde=g.wave.ph;out.postponed=g.wave.until>g.t;g.hordeT=1e9;
  g.bombOn=true;g.wave.until=0;g.update(1/30);out.bomb=g.wave.ph;g.bombOn=false;
  g.bossQ[0].done=false;g.bossQ[0].t=g.t+15;g.wave.until=0;g.update(1/30);out.bossSoon=g.wave.ph;g.bossQ.forEach(b=>{b.done=true;});    /* every other boss too: where the run clock happens to be decides whether one is within 25 s */
  g.wave.until=0;g.update(1/30);out.free=g.wave.ph;
  g.bossAlive=1;g.update(1/30);out.cut=g.wave.ph;g.bossAlive=0;
  g.sb.nospawn=true;g.wave.ph='calm';g.wave.until=0;g.update(1/30);out.nospawn=g.wave.ph;g.sb.nospawn=false;return out;});
ok(gate.boss==='calm'&&gate.horde==='calm'&&gate.postponed&&gate.bomb==='calm'&&gate.bossSoon==='calm','no surge during a boss fight, right before a horde, a special wave or a boss ('+JSON.stringify(gate)+')');
ok(gate.free==='surge'&&gate.cut==='calm','a surge starts when the field is free and is cut short when a boss appears');
ok(gate.nospawn==='calm','the sandbox "no spawn" mode keeps the director silent');
/* ---------- elite plans ---------- */
const plans=[];for(const [st,df] of [[5,'normal'],[0,'easy'],[10,'hard'],[3,'extreme'],[8,'normal'],[1,'easy']]){
  await pg.evaluate((st,df)=>{__app.startGame({stage:st,char:'goku',diff:df,x2:false,sandbox:false});window.G=__app.game;},st,df);
  plans.push(await pg.evaluate(()=>{const g=G;return{st:g.stage.id,dur:g.dur,el:g.elitePlan.map(e=>Math.round(e.t)),boss:g.bossQ.map(b=>Math.round(b.t)),fin:g.bossQ.filter(b=>b.final).map(b=>Math.round(b.t))[0],ballAt:Math.round(g.ballAt),every:Math.round(g.ballEvery)};}));}
for(const p of plans){
  const apart=p.el.every(t=>p.boss.every(bt=>Math.abs(bt-t)>=28))&&p.el.every((t,i)=>!i||t-p.el[i-1]>=60)&&(!p.fin||p.el.every(t=>t<=p.fin-32));
  ok(p.el.length>=1&&apart,'stage '+p.st+' ('+p.dur+' s): elites at '+p.el.join(', ')+' - bosses '+p.boss.join(', '));
  ok(p.ballAt>=75&&p.ballAt<p.dur*.6&&p.every>=100&&p.every<=270,'  guaranteed ball from '+p.ballAt+' s, then every '+p.every+' s');
}
/* ---------- elite fight ---------- */
await start(5,'normal');await wait(200);
const el=await pg.evaluate(()=>{const g=G;g.en=[];g.hordeT=1e9;g.packT=1e9;const said=[];const say0=g.say.bind(g);g.say=(t,c,d)=>{said.push(t);return say0(t,c,d);};window.said=said;const e0=g.elitePlan[0];g.t=e0.t+1;g.wave.ph='surge';g.wave.until=g.t+100;g.update(1/30);const during=g.en.filter(e=>e.elite).length;
  g.wave.ph='calm';g.update(1/30);const e=g.en.find(e=>e.elite);const base=ENEMIES[e.def.id||g.stage.roster[0][0]];
  const info=e?{hp:e.hp,max:e.max,r:e.r,defr:e.def.r,defhp:e.def.hp,dmgRatio:e.dmg/(e.def.dmg*g.dmgMul()),armor:e.armor,boss:e.boss}:null;
  return{during,info,banner:said.join(' | '),done:e0.done};});
ok(el.during===0,'no elite arrives in the middle of a surge');
ok(el.info&&el.info.max/el.info.defhp>=9&&el.info.r>el.info.defr*1.3&&el.info.dmgRatio>1.3&&el.info.armor>=1&&!el.info.boss,'the elite is big, tough and hits harder ('+JSON.stringify(el.info)+')');
ok(/LITE|ELITE/.test(el.banner||''),'a banner announces it ('+el.banner+')');
const kill=await pg.evaluate(()=>{const g=G;const e=g.en.find(e=>e.elite);g.p.x=e.x+400;const z0=g.zenny!==undefined?g.zenny:null;g.chests=[];g.damageEnemy(e,1e12,0,0,false);
  const c=g.chests[0];const out={chests:g.chests.length,elite:!!(c&&c.elite),boss:!!(c&&c.boss),run:g.run.elites,dead:e.dead};
  g.p.x=c.x;g.p.y=c.y;g.updatePickups(1/30);out.modal=g.modal&&g.modal.type;out.rw=g.modal&&g.modal.rewards.map(r=>r.k);return out;});
ok(kill.chests===1&&kill.elite&&!kill.boss&&kill.run===1&&kill.dead,'killing an elite always leaves a chest ('+JSON.stringify(kill)+')');
ok(kill.modal==='chest'&&kill.rw.length>=2&&kill.rw.some(k=>k==='trinket'||k==='zenny')&&kill.rw.some(k=>k==='up'||k==='evo'||k==='zenny'),'its chest holds an upgrade plus a sure trinket ('+(kill.rw||[]).join('+')+')');
await pg.evaluate(()=>{G.modal=null;});
/* chest with several elites in a row keeps giving the trinket */
const many=await pg.evaluate(()=>{const g=G;let n=0;for(let i=0;i<20;i++){const r=g.chestRewards(false,false,true);if(r.some(x=>x.k==='trinket'||x.k==='zenny'))n++;}return n;});
ok(many===20,'the sure trinket (or zenny when none is left) comes every time');
/* ---------- guaranteed Dragon Ball ---------- */
await start(5,'normal');await wait(200);
const bl=await pg.evaluate(()=>{const g=G;g.en=[];g.hordeT=1e9;g.packT=1e9;g.wave.until=1e9;const out={};
  g.bossAlive=1;g.t=g.ballAt+1;g.update(1/30);out.boss=g.loot.filter(l=>l.k==='ball').length;g.bossAlive=0;
  g.update(1/30);const b=g.loot.filter(l=>l.k==='ball');out.n=b.length;out.ttl=b[0]&&b[0].ttl;out.guar=b[0]&&b[0].guar;out.dist=Math.round(Math.hypot(b[0].x-g.p.x,b[0].y-g.p.y));out.star=b[0].star;out.next=Math.round(g.ballAt-g.t);out.banner=g.banner&&g.banner.txt;
  g.t=g.ballAt+1;g.update(1/30);out.second=g.loot.filter(l=>l.k==='ball').length;out.delayed=Math.round(g.ballAt-g.t);
  /* walk over it */
  g.balls=0;g.ballSet=[];const bb=g.loot.find(l=>l.k==='ball');g.p.x=bb.x;g.p.y=bb.y;g.updatePickups(1/30);out.balls=g.balls;out.has=[...g.ballOwned()].join();
  /* owning 1-6, the next one is the 7th */
  g.ballSet=[1,2,3,4,5,6];g.balls=6;g.loot=[];g.t=g.ballAt+1;g.update(1/30);const b7=g.loot.find(l=>l.k==='ball');out.star7=b7&&b7.star;
  g.loot=[];g.ballAt=g.t-1;g.t=g.dur-30;g.update(1/30);out.late=g.loot.filter(l=>l.k==='ball').length;
  return out;});
ok(bl.boss===0&&bl.n===1&&bl.guar&&bl.ttl===150&&bl.dist>=270&&bl.dist<=430,'a ball lands on the map (not during a boss fight) at '+bl.dist+' px, lasts 150 s ('+JSON.stringify(bl)+')');
ok(/DRAGON|DRAGO/i.test(bl.banner||''),'with an announcement ('+bl.banner+')');
ok(bl.second===1&&bl.delayed>0,'never two at once: the next one waits ('+bl.second+' on the field)');
ok(bl.balls===1,'walking over it collects it ('+bl.has+')');
ok(bl.star7===7,'the star number is one you do not own yet ('+bl.star7+')');
ok(bl.late===0,'none appear in the last minute of the run');
/* ---------- screenshot of an elite ---------- */
await start(5,'normal');await wait(200);
await pg.evaluate(()=>{const g=G;g.en=[];g.t=g.elitePlan[0].t+1;g.update(1/30);const e=g.en.find(e=>e.elite);e.x=g.p.x+110;e.y=g.p.y-20;e.hp=e.max*.6;g.banner=null;for(let i=0;i<20;i++)g.update(1/60);__app.renderer.draw(g,0);});
await pg.screenshot({path:'/tmp/elite.png'});
await pg.evaluate(()=>{const g=G;g.balls=0;g.ballSet=[];g.spawnLoot('ball',g.p.x-120,g.p.y-30);g.spawnLoot('ball',g.p.x-200,g.p.y+40);for(let i=0;i<30;i++)g.update(1/60);__app.renderer.draw(g,0);});
console.log(errs.length?errs.slice(0,4):'no page errors');await b.close();process.exit(errs.length||process.exitCode?1:0);})();
