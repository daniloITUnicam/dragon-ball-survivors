/* trinkets carried to the end of the run join the Bag (the one equipped from the bag is not duplicated; a copy the bag already has is sold; better perfection upgrades it) */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:640}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const o=await pg.evaluate(()=>{const A=__app,d=A.save.d;d.settings.sandbox=false;d.shop.tslot=2;d.bag=[{id:'boots',r:0,at:1,p:40}];
  A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;window.G=g;g.sb.nospawn=true;g.modal=null;
  g.lvAuto=true;const out={};
  g.addTrinket('cape',2,{pf:70});g.modal&&g.resolveModal(0);g.addTrinket('boots',0,{pf:90});g.modal&&g.resolveModal(0);
  out.held=g.trinkets.slice();out.src=g.trinkets.map(i=>g.tSrc[i]).join();const n0=d.bag.length,c0=g.run.coins;
  g.finish(true);
  out.bag=d.bag.map(b=>b.id+'@'+b.r+':'+b.p).join();out.n=d.bag.length-n0;out.kept=(g.run.tkept||[]).map(k=>k.id+(k.up?'↑':'')).join();out.sold=g.run.tsold||0;return out;});
console.log(JSON.stringify(o));
ok(o.held.length===2,'two trinkets carried');
ok(/cape@2:70/.test(o.bag)&&o.n===1,'the new trinket is in the Bag ('+o.bag+')');
ok(/boots@0:90/.test(o.bag)&&/boots↑/.test(o.kept),'a copy the Bag already has upgrades its perfection');
await wait(600);
const u=await pg.evaluate(()=>[...document.querySelectorAll('.tkept')].map(x=>x.textContent));
ok(u.length===2,'the end screen lists them ('+u.join(' | ')+')');
/* every pick-up on the ground is drawn in by the player's pick-up range (not the Dragon Balls) */
const m=await pg.evaluate(()=>{const A=__app;A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;window.G=g;g.sb.nospawn=true;g.modal=null;g.p.x=0;g.p.y=0;g.S.magnet=300;
  const ks=['coin','bag','heal','magnet','dmg','haste','xp','capsule','luck','ball'];g.loot=ks.map((k,i)=>({k,x:200,y:i*4,v:0,t:1,star:0}));g.updatePickups(.05);
  const o={};for(const k of ks){const l=g.loot.find(x=>x.k===k);o[k]=l&&!l.dead?Math.round(200-l.x):-1;}
  g.loot=[{k:'luck',x:420,y:0,v:0,t:1,star:0}];g.updatePickups(.05);o.far=Math.round(420-g.loot[0].x);return o;});
console.log(JSON.stringify(m));
ok(['coin','bag','heal','magnet','dmg','haste','xp','capsule','luck'].every(k=>m[k]>0)&&m.ball===0&&m.far===0,'coins, hearts, Fortune, Magnet, capsules and the timed power-ups are pulled in by the pick-up range, the Dragon Ball is not');
ok(!errs.length,'no JS errors '+errs.join(';'));await b.close();})();
