const pp=require('/opt/npm-tools/node_modules/puppeteer');
const ws=(process.argv[2]||'kame,disc,slash,aura,ki,dbeam').split(',');const evo=+(process.argv[3]||0);
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:800,height:480});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load/.test(m.text()))errs.push(m.text().slice(0,300));});
for(const w of ws){
 await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await new Promise(r=>setTimeout(r,500));
 await pg.evaluate((w,evo)=>{const a=window.__app;a.startGame({stage:0,char:'goku',diff:'easy',x2:false,sandbox:true});const g=a.game;g.weapons.clear();const wp=g.addWeapon(w);wp.lv=5;if(evo)for(let i=0;i<evo;i++)g.evolveWeapon(w);g.p.inv=999;g.p.maxHp=g.p.hp=99999;
  for(let i=0;i<26;i++){const an=i/26*6.28,d=110+(i%4)*55;const e=g.mkEnemy(ENEMIES.sol,g.p.x+Math.cos(an)*d,g.p.y+Math.sin(an)*d*.7);e.hp=e.max=99999;e.spd=0;g.en.push(e);} g.spawnRate=()=>0;g.spawnCap=()=>0;},w,evo);
 const T=process.env.T?process.env.T.split(',').map(Number):[w==='kame'?1550:1100];
 let el=0;for(const t of T){await new Promise(r=>setTimeout(r,t-el));el=t;await pg.screenshot({path:'/tmp/vfx_'+w+(T.length>1?'_'+t:'')+'.png'});}
}
console.log([...new Set(errs)].join('|')||'noerr');await b.close();})();
