/* Dende (pet): restores 30% of max HP every 30 s */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:640}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const r=await pg.evaluate(()=>{const d=PETS.find(x=>x.id==='dende');const out={cd:d.cd,it:d.d.it||d.d[0]||JSON.stringify(d.d)};
  __app.startGame({stage:5,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'dende'});const g=__app.game;g.sb.god=true;g.sb.nospawn=true;g.modal=null;window.G=g;
  g.pet.cd=0;g.p.hp=5;const h0=g.p.hp;const ok1=g.usePet();out.used=ok1;out.gain=(g.p.hp-h0)/g.p.maxHp;out.cdAfter=g.pet.cd;
  /* the cooldown really is 30 s */
  let t=0;while(g.pet.cd>0&&t<60){g.update(1/30);t+=1/30;}out.wait=+t.toFixed(1);
  /* capped at max HP */
  g.p.hp=g.p.maxHp-3;g.pet.cd=0;g.usePet();out.cap=g.p.hp<=g.p.maxHp;
  return out;});
ok(r.cd===30,'cooldown is 30 s ('+r.cd+')');
ok(r.used&&Math.abs(r.gain-.30)<.01,'one use restores 30% of max HP ('+(r.gain*100).toFixed(1)+'%)');
ok(r.wait>=29&&r.wait<=31.5,'and he is ready again after 30 s ('+r.wait+' s)');
ok(r.cap,'never above the maximum');
ok(/30%/.test(r.it),'the description says 30% ('+r.it+')');
console.log(errs.length?errs.slice(0,3):'no page errors');await b.close();process.exit(errs.length||process.exitCode?1:0);})();
