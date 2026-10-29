/* v116: map moments - training circle (5 s inside = timed buff), Capsule Corp pod (10 s next to it = pick 1 of 3 trinkets), the Supreme Kai's 60 s mission (= a weapon level) */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1280,height:720});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const r=await pg.evaluate(()=>{const A=__app,o={};A.loop=()=>{};A.save.d.settings.hints=false;
  A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true});const g=A.game,p=g.p,M=g.mx;g.sb.god=true;g.sb.nospawn=true;
  const step=(n,f)=>{for(let i=0;i<n;i++){if(f)f();g.update(1/60);if(g.modal&&g.modal.type!=='pick')A.resolveModal(0);}};
  /* training circle */
  M.trT=0;step(2);o.tr=!!M.tr;const T=M.tr;step(60*3,()=>{p.x=T.x;p.y=T.y;});o.half=M.tr&&M.tr.prog>2.5;step(60*3,()=>{if(M.tr){p.x=T.x;p.y=T.y;}});o.buff=!M.tr&&(g.buffs.dmg>20||g.buffs.haste>20);A.renderer.draw(g,1/60);
  /* pod */
  M.podT=g.t;step(2);o.pod=!!M.pod;const P=M.pod;step(90);step(60*10.5,()=>{p.x=P.x+20;p.y=P.y;});o.pick=g.modal&&g.modal.type==='pick'&&g.modal.opts.length===3;o.once=M.podDone;
  if(g.modal){const id=g.modal.opts[0];A.resolveModal(0);o.got=g.trinkets.includes(id);}
  /* Supreme Kai */
  g.en=[];M.ksT=g.t;step(2);o.ks=!!M.ks;const K=M.ks;p.x=K.x;p.y=K.y;step(2);o.mis=!!M.mis;
  if(M.mis){M.mis.m=KS_MISSIONS[1];M.mis.k0=g.kills;const ws=[...g.weapons.values()];ws.forEach(x=>x.lv=WMAX);const w=ws[0];w.lv=1;g.kills+=260;step(20);o.win=!M.mis&&w.lv===2;}
  M.mis={m:KS_MISSIONS[0],t:60,k0:g.kills,e0:0,hit:0};g.sb.god=false;p.inv=0;g.hurt(1);step(20);o.fail=!M.mis;
  A.renderer.draw(g,1/60);return o;});
ok(r.tr&&r.half&&r.buff,'training circle: 5 s inside gives a 30 s buff');
ok(r.pod&&r.pick&&r.once&&r.got,'Capsule Corp pod: 10 s next to it, then 1 of 3 trinkets');
ok(r.ks&&r.mis&&r.win,'the Supreme Kai gives a mission; completing it levels up a weapon');
ok(r.fail,'"without being hit" fails at the first hit');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();})();
