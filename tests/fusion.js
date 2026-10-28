/* v115: double evolutions - two fully evolved partner weapons fuse from a chest, hit harder and faster, and free a slot */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const r=await pg.evaluate(()=>{const A=__app,o={};A.loop=()=>{};
  const ids=new Set();for(const f of FUSIONS){ids.add(f.a);ids.add(f.b);}o.cover=ids.size===FUSIONS.length*2&&Object.keys(WEAPONS).every(id=>ids.has(id));
  A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false});const g=A.game;g.sb.god=true;
  g.weapons.clear();g.addWeapon('ki');g.addWeapon('homing');const ki=g.weapons.get('ki'),ho=g.weapons.get('homing');
  for(const w of [ki,ho]){w.lv=WMAX;}o.notYet=!g.fuseReady();
  for(const w of [ki,ho]){w.evolve();w.lv=WMAX;}o.ready=g.fuseReady()&&g.fuseReady().id==='ki_homing';
  const d0=ki.dm,c0=ki.e2c,n0=g.wCount();
  const R=g.chestRewards(false,false,false,0);o.chest=R.some(x=>x.k==='fuse'&&x.id==='ki_homing');
  g.modal={type:'chest',rewards:R};A.ui.openModal(g.modal,g);o.card=document.body.textContent.includes('Ki Storm');A.resolveModal(0);
  o.fused=!!ki.fz&&!!ho.fz&&ho.fzB&&g.weapons.has('homing');o.dm=ki.dm/d0;o.cd=ki.e2c/c0;o.slot=g.wCount()===n0-1;
  o.again=!g.fuseReady();A.renderer.draw(g,1/60);
  const before=g.pr.length;for(let i=0;i<240;i++)g.update(1/60);o.fires=g.run&&Object.keys(g.dmgBy||{}).length>=0;
  return o;});
ok(r.cover,'11 pairs cover each of the 22 weapons once');
ok(r.notYet&&r.ready,'ready only when both weapons are fully evolved');
ok(r.chest&&r.card,'the next chest offers the double evolution (Ki Storm)');
ok(r.fused&&Math.abs(r.dm-1.3)<.01&&Math.abs(r.cd-.85)<.01&&r.slot&&r.again,'after it: +30% damage, −15% cooldown, the pair takes one slot ('+r.dm.toFixed(2)+'/'+r.cd.toFixed(2)+')');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();})();
