const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const r=await pg.evaluate(()=>{const o=[];const idx=STAGES.findIndex(s=>s.theme==='snake');o.push('idx '+idx+' no '+STAGES[idx].no);
 __app.startGame({stage:idx,char:'goku',diff:'hard',x2:false,sandbox:true});const g=__app.game;g.sb.god=true;g.vw=1000;g.vh=560;
 o.push('dur '+g.dur+' TS '+g.TS.toFixed(2)+' bossQ '+JSON.stringify(g.bossQ.map(b=>b.id+'@'+b.t)));
 let maxOff=0,maxEn=0,badGround=0,tiers={};
 for(let f=0;f<60*900;f++){
   g.input.x=Math.sin(f/90)>0?1:-1;g.input.y=Math.cos(f/37);
   g.update(1/60);
   if(f%30===0){const k=Math.sqrt(1+Snake.df(g.p.x)**2),off=Math.abs(g.p.y-Snake.f(g.p.x))/k;maxOff=Math.max(maxOff,off);
     for(const e of g.en){if(e.dead||e.boss||e.def.fly||e.ai==='hover')continue;const kk=Math.sqrt(1+Snake.df(e.x)**2);if(Math.abs(e.y-Snake.f(e.x))/kk>Snake.HW+40)badGround++;}
     maxEn=Math.max(maxEn,g.en.length);
     const key=Math.floor(g.nt/150);const ids=new Set(g.en.filter(e=>!e.dead&&!e.boss).map(e=>e.def===undefined?'?':Object.keys(ENEMIES).find(k=>ENEMIES[k]===e.def)));
     tiers[key]=tiers[key]||new Set();ids.forEach(i=>tiers[key].add(i));}
   if(g.ended)break;
   if(g.modal){try{__app.resolveModal(0);}catch(e){g.modal=null;}}
   if(g.p.hp<g.p.maxHp*.5)g.p.hp=g.p.maxHp;
 }
 o.push('maxOff '+maxOff.toFixed(1)+' (HW '+Snake.HW+') maxEn '+maxEn+' badGround '+badGround+' t '+g.t.toFixed(0)+' lvl '+g.lvl+' bossAlive '+g.bossAlive);
 for(const k of Object.keys(tiers))o.push('tier'+k+': '+[...tiers[k]].join(','));
 return o;});
console.log(r.join('\n'));console.log(errs.length?errs.slice(0,4):'no errors');await b.close();process.exit(errs.length?1:0);})();
