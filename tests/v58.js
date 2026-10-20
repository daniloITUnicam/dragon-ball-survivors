/* v58: "Quantità" (+projectiles) shop upgrade and trinket stat, 128 new stat-trinket combinations, pools */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:760}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1500);
let bad=0;let SHOP_LEN=0;const ok=(c,m)=>{console.log((c?'  ok  ':'FAIL  ')+m);if(!c)bad++;};
const ev=(f,...a)=>pg.evaluate(f,...a);
let r=await ev(()=>{const sh=SHOP.find(s=>s.id==='proj');
  const stat=t=>t.m&&!t.sp||t.m&&t.x,pool=[0,1,2,3,4].map(i=>gachaPool(i)),X=TRINKETS.filter(t=>t.id.startsWith('cx_'));
  const sets=new Set(X.map(t=>Object.keys(t.m).sort().join('+')));
  return{sh:sh&&{max:sh.max,c0:shopCost(sh,0),c1:shopCost(sh,1),n:sh.n.it+'/'+sh.n.en},nX:X.length,sets:sets.size,
    stat:pool.map(p=>p.filter(stat).length),projAt:pool.map(p=>p.filter(t=>t.m&&t.m.proj).length),
    names:new Set(TRINKETS.map(t=>t.n.it)).size,total:TRINKETS.length,ids:new Set(TRINKETS.map(t=>t.id)).size,
    tbl:[[2,0],[3,0],[3,100],[4,0],[4,49],[4,50],[4,99],[4,100]].map(([r,p])=>trinProj(r,p)),
    txt:trinStats(TRINKETS.find(t=>t.id==='cx_proj_might'),4,100).map(x=>x.t.en).join(', ')};});
ok(r.sh&&r.sh.max===2&&r.sh.c0===2000&&r.sh.c1===6000&&r.sh.n==='Quantità/Amount','shop "Quantità": max 2, 2000 then 6000 ('+JSON.stringify(r.sh)+')');
ok(r.nX>=100&&r.sets===r.nX,'new trinkets: '+r.nX+' different stat combinations ('+r.sets+' distinct sets)');
ok(r.stat.every(n=>n>=100),'at every rarity the pool has 100+ stat trinkets: '+r.stat.join('/'));
ok(r.projAt[0]===0&&r.projAt[1]===0&&r.projAt[2]===0&&r.projAt[3]===10&&r.projAt[4]===10,'only 10 combos carry Quantità, at Legendary and Mythic only: '+r.projAt.join('/'));
ok(r.tbl.join()==='0,2,3,3,3,4,4,5','Quantità by rarity and roll: '+r.tbl.join()+' (Mythic reaches 5 only with a perfect roll)');
ok(r.names===r.total&&r.ids===r.total,'all '+r.total+' trinket names and ids are unique');
ok(/\+5 amount/.test(r.txt),'stat text: '+r.txt);
/* effect-only trinkets are not buried by the bigger pool */
r=await ev(()=>{const n={fx:0,all:0};for(let i=0;i<6000;i++){const t=pickTrinket(2);n.all++;if(!(t.m&&!t.sp||t.m&&t.x))n.fx++;}return n.fx/n.all;});
ok(r>.08&&r<.4,'effect-only trinkets still come out at Epic ('+Math.round(r*100)+'% of the picks)');
/* in a run */
await ev(()=>{const A=__app,d=A.save.d;d.settings.sandbox=false;d.shop.proj=2;A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;g.sb.nospawn=true;g.sb.god=true;window.G=g;});
r=await ev(()=>{const g=G;g.recalc();const a=g.S.proj;
  g.trinkets=['cx_proj_might'];g.tRar['cx_proj_might']=4;g.tPf['cx_proj_might']=100;g.recalc();const b2=g.S.proj;
  g.tPf['cx_proj_might']=60;g.recalc();const c=g.S.proj;g.trinkets=[];g.recalc();
  const rar={},ids=g.rollTrinketList(40),rs=ids.map(id=>g.rarOf(id));
  return{a,b2,c,rs:[...new Set(rs)].sort().join(),n:ids.length,tm:g.tMods().proj};});
ok(r.a===2,'shop Quantità x2 gives +2 projectiles ('+r.a+')');
ok(r.b2===7&&r.c===6,'a Mythic "Quantità" trinket adds +5 at roll 100 (total '+r.b2+') and +4 at roll 60 (total '+r.c+')');
ok(r.n>=4&&r.rs.length>=1,'in-run rolls give rarities '+r.rs);
/* the weapon really fires more */
r=await ev(()=>{const g=G;g.weapons.clear();const w=g.addWeapon('ki');const s0=w.st.n[w.L],with2=s0+g.S.proj+w.e2n;return{s0,with2};});
ok(r.with2===r.s0+2,'a Ki Blast fires '+r.s0+' -> '+r.with2+' projectiles');
/* Dragon Ball scanner + Saiyan Armor */
r=await ev(()=>{const sc=SHOP.find(s=>s.id==='scan'),ar=SHOP.find(s=>s.id==='armor');return{sc:sc&&{max:sc.max,c0:shopCost(sc,0),icon:SHOP_IMG.scan.length>500},ar:ar.d.en};});
ok(r.sc&&r.sc.max===2&&r.sc.c0===3000&&r.sc.icon,'shop "Dragon Ball Scanner": max 2, first price 3000, with the pixel-art icon ('+JSON.stringify(r.sc)+')');
ok(/\+2 armor/.test(r.ar),'Saiyan Armor gives +2 per level ('+r.ar+')');
r=await ev(()=>{const A=__app,d=A.save.d;const res={};for(const lv of[0,1,2]){d.shop.scan=lv;d.shop.armor=lv;A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;g.recalc();res[lv]={k:g.scanK,every:Math.round(g.ballEvery*100)/100,armor:g.S.armor};}d.shop.scan=0;d.shop.armor=0;return res;});
ok(r[0].k===1&&Math.abs(r[1].k-1.05)<1e-9&&Math.abs(r[2].k-1.1)<1e-9&&r[1].every<r[0].every&&r[2].every<r[1].every,'the scanner shortens the Dragon Ball interval '+r[0].every+' > '+r[1].every+' > '+r[2].every+' s');
ok(Math.abs((r[2].armor-r[0].armor)-4)<1e-9,'two levels of Saiyan Armor add 4 armor ('+(r[2].armor-r[0].armor)+')');
/* Urlo di Broly! */
r=await ev(()=>{const A=__app,d=A.save.d,sh=SHOP.find(s=>s.id==='broly'),out={sh:sh&&{max:sh.max,c0:shopCost(sh,0),n:sh.n.it,icon:SHOP_IMG.broly.length>500}};
  d.shop.broly=0;A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;const r0=g.spawnRate();d.shop.broly=5;const r5=g.spawnRate();d.shop.broly=0;out.k=r5/r0;return out;});
ok(r.sh&&r.sh.max===5&&r.sh.c0===666&&r.sh.n==='Urlo di Broly!'&&r.sh.icon,'shop "Urlo di Broly!": max 5, first price 666, with the picture icon ('+JSON.stringify(r.sh)+')');
ok(Math.abs(r.k-1.25)<1e-9,'five levels raise the enemy spawn rate by 25% (x'+r.k+')');
/* shop colours + pixel-art icons */
SHOP_LEN=await ev(()=>SHOP.length);
r=await ev(()=>({img:Object.keys(SHOP_IMG).sort().join(),col:SHOP.every(s=>/^#[0-9a-f]{6}$/i.test(s.c)),uniq:new Set(SHOP.map(s=>s.c)).size,n:SHOP.length,
  noImg:SHOP.filter(s=>!SHOP_IMG[s.id]).map(s=>s.id).join(),hp:SHOP.find(s=>s.id==='hp').c,sp:SHOP.find(s=>s.id==='speed').c}));
ok(r.img==='armor,ban,bn,broly,cd,crit,exp,gold,hp,luck,magnet,might,proj,regen,revive,rr,scan,sk,speed,tslot'&&r.noImg==='','pixel-art icons for every upgrade: '+r.img+' (missing: '+r.noImg+')');
ok(r.col&&r.uniq===r.n,'every one of the '+r.n+' upgrades has its own text colour (health '+r.hp+', agility '+r.sp+')');
await ev(()=>{const A=__app;A.save.d.zenny=5000;A.ui.push('shop');});await wait(600);
r=await ev(()=>({cards:document.querySelectorAll('.card.shopi').length,imgs:document.querySelectorAll('.card.shopi .gimg img').length,col:[...document.querySelectorAll('.card.shopi .cn')].every(e=>e.style.color)}));
ok(r.imgs===SHOP_LEN&&r.col&&r.cards===SHOP_LEN,'the shop shows '+r.imgs+' image icons and coloured names on '+r.cards+' cards');
ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
console.log(bad?'FAILED '+bad:'ALL OK');await b.close();process.exit(bad?1:0);})();
