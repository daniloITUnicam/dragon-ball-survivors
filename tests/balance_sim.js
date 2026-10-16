/* node tests/balance_sim.js <stageIdx> <diff> [char] : autoplay with a kiting bot and every shop upgrade maxed; prints one line per minute */
const pp=require('/opt/npm-tools/node_modules/puppeteer');
const [,, si='9', diff='extreme', ch='goku']=process.argv;
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await new Promise(r=>setTimeout(r,1500));
pg.setDefaultTimeout(0);
const res=await pg.evaluate((si,diff,ch)=>{const o=[];const d=__app.save.d;for(const it of SHOP)d.shop[it.id]=it.max;
 __app.startGame({stage:+si,char:ch,diff,x2:false,sandbox:false});const g=__app.game;g.vw=1000;g.vh=560;
 let minHp=1,kills0=0,lastMin=0,bossDone=0;
 const DT=1/30;
 for(let f=0;f<30*2400;f++){
   if(g.ended)break;
   if(g.modal){try{__app.resolveModal(0);}catch(e){}if(g.modal)g.modal=null;continue;}
   // kite: move away from enemy centroid within 260, else slight circle
   let ax=0,ay=0,n=0;for(const e of g.en){if(e.dead)continue;const dx=g.p.x-e.x,dy=g.p.y-e.y,dd=Math.hypot(dx,dy);if(dd<300){const w=1/(dd+30);ax+=dx*w;ay+=dy*w;n++;}}
   if(n){const l=Math.hypot(ax,ay)||1;g.input.x=ax/l;g.input.y=ay/l;}else{g.input.x=Math.cos(f/200);g.input.y=Math.sin(f/200);}
   g.update(DT);
   minHp=Math.min(minHp,g.p.hp/g.p.maxHp);
   if(f%(30*60)===0&&f>0){o.push('min '+Math.round(g.t/60)+' lvl '+g.lvl+' hp '+Math.round(g.p.hp)+'/'+Math.round(g.p.maxHp)+' minHp '+minHp.toFixed(2)+' kills '+g.kills+' en '+g.en.length+' boss '+g.bossAlive+' dur '+g.dur);minHp=1;}
 }
 o.push('END ended='+g.ended+' t='+g.t.toFixed(0)+'/'+g.dur+' lvl '+g.lvl+' kills '+g.kills+' bossKills '+g.run.bossKills+' win '+(g.res&&g.res.win));
 return o;},si,diff,ch);
console.log(res.join('\n'));console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
