/* Hell: Freezer and Cell come back as evolving minibosses (one form per 1/N of their life) */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:640}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const r=await pg.evaluate(()=>{const o=[];
 const idx=STAGES.findIndex(s=>s.theme==='hell');o.push('hell stage no '+STAGES[idx].no+' (after cell games '+STAGES.find(s=>s.theme==='arena').no+', before '+STAGES.find(s=>s.theme==='other').no+')');
 __app.startGame({stage:idx,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.god=true;window.G=g;
 window.step=(n,fn)=>{for(let f=0;f<n;f++){if(g.modal){try{__app.resolveModal(0);}catch(e){}if(g.modal)g.modal=null;}g.update(1/60);if(g.p.hp<g.p.maxHp*.6)g.p.hp=g.p.maxHp;if(fn)fn(f);}};
 for(const [first,N] of [['hfz1',7],['hcell1',6]]){
  g.en=g.en.filter(e=>!e.boss);g.bossAlive=0;g.eb=[];g.bz=[];g.jbeams=[];
  g.spawnBoss(first,false);const e=g.en.find(e=>e.boss);e.stun=0;
  const seen=[e.bd.n.en],pats={},arm=[e.armor.toFixed(1)];let morphs=0;
  const orig=g.bossAttack.bind(g);g.bossAttack=function(x){const before=g.bz.length+g.jbeams.length+g.eb.length+g.en.length;orig(x);pats[x.bd.n.en]=(pats[x.bd.n.en]||0)+1;};
  for(let i=1;i<N;i++){
   e.hp=e.max*(1-i/N)-5;let sawXf=false;
   step(60*14,()=>{g.p.x=e.x-240;g.p.y=e.y;if(e.xf&&e.xf.morph)sawXf=true;});
   if(sawXf)morphs++;seen.push(e.bd.n.en);arm.push(e.armor.toFixed(1));
  }
  g.bossAttack=orig;
  o.push(first+': forms '+seen.join(' > ')+' | morph anims '+morphs+'/'+(N-1)+' | armor '+arm.join(',')+' | attacks per form '+JSON.stringify(pats));
 }
 return o;});
console.log(r.join('\n'));await pg.screenshot({path:'/tmp/hell1.png'});
console.log(errs.length?errs.slice(0,4):'no errors');await b.close();process.exit(errs.length?1:0);})();
