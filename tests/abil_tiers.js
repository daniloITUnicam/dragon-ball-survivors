/* ability tiers (middle form passive / final form empowered), cooldown curve, Broly berserk, enemy escalation steps, progress-bar milestones */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:640}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const mk=(ch,diff)=>pg.evaluate((ch,diff)=>{__app.startGame({stage:5,char:ch,diff:diff||'normal',x2:false,sandbox:true});const g=__app.game;g.sb.god=true;window.G=g;g.setLevel(20);g.modal=null;return true;},ch,diff);
const use=(idx,prep)=>pg.evaluate((idx,prep)=>{const g=G;g.modal=null;g.xform=null;g.formIdx=idx;g.recalc();g.abCd=0;g.en=[];g.eb=[];g.fx=[];if(prep)eval(prep);const r=g.useAbility();return{r,tier:g.abTier,cd:g.abCd,max:g.abCdMax,shield:g.shieldT,buf:g.abBuf?JSON.stringify(g.abBuf):null,clones:g.clones?g.clones.length:0,cloneT:g.cloneT,critT:g.critT,critDmg:g.S.critDmg,ts:g.tsT,beams:g.fx.filter(f=>f.beam).map(f=>f.w),regen:g.regenT,rate:g.regenRate,inv:g.p.inv,dashWave:!!g.dashWave,enHp:g.en.map(e=>e.hp/e.max),stun:g.en.map(e=>e.stun)};},idx,prep);
/* tiers */
await mk('goku');
const t=await pg.evaluate(()=>{const g=G,o=[];for(const i of[-1,0,2,3,6,7]){g.formIdx=i;o.push(g.abTier);}return o;});
ok(t.join()==='0,0,0,1,1,2','tier by form index on an 8-form line: '+t.join());
await mk('kale');
const t3=await pg.evaluate(()=>{const g=G,o=[];for(const i of[-1,0,1,2]){g.formIdx=i;o.push(g.abTier);}return o;});
ok(t3.join()==='0,0,1,2','tier on a 3-form line: '+t3.join());
/* cooldown curve: x0.7, -0.2 s per level, max -10 s */
await mk('c18');
const cd=await pg.evaluate(()=>{const g=G,o={};for(const l of[1,11,26,51,120]){g.lvl=l;o[l]=g.abCdMax;}return o;});
ok(cd[1]===35&&cd[11]===33&&cd[26]===30&&cd[51]===25&&cd[120]===25,'barrier cooldown 50 -> '+JSON.stringify(cd)+' (never more than -10 s)');
const u0=await use(-1);ok(u0.cd===u0.max&&u0.shield===1.5,'base barrier: 1.5 s, cooldown set to the level-based value ('+u0.cd+')');
const u2=await use(7);ok(u2.tier===2&&u2.shield===3.5&&u2.inv>=3.4,'final form barrier lasts 3.5 s');
/* beam */
await mk('vegeta');
const b0=await use(-1);const b2=await use(7);
ok(b0.beams.length===1&&b0.beams[0]===64,'base beam: 1 x 64 wide ('+b0.beams+')');
ok(b2.beams.length===2&&b2.beams[0]>=160,'final form: huge beam + one behind you ('+b2.beams+')');
/* nova: an enemy far away is only hit by the huge wave */
await mk('trunks');
const prep="const e=g.mkEnemy(ENEMIES.saiba||Object.values(ENEMIES)[0],g.p.x+330,g.p.y);e.hp=e.max=9999;g.en.push(e);";
const n0=await use(-1,prep),n2=await use(7,prep);
ok(n0.enHp[0]===1&&n2.enHp[0]<1,'nova: enemy at 330 px untouched by the base wave, hit by the final one ('+n0.enHp[0]+' vs '+n2.enHp[0].toFixed(4)+')');
/* buff, clones, crit, timestop, dash, regen, blind */
await mk('kale');const k2=await use(2);ok(k2.buf&&!/tk/.test(k2.buf)&&/"t":14/.test(k2.buf),'Kale final form: stronger buff, no damage-taken drawback ('+k2.buf+')');
await mk('tien');const c2=await use(7);ok(c2.clones===6&&c2.cloneT===14,'Tien final form: 6 clones for 14 s');
await mk('gohan');const g2=await use(7);ok(g2.critT===12&&g2.critDmg===2.5,'Gohan final form: 12 s of crits, x2.5 crit damage');
await mk('hit');const h2=await use(7);ok(h2.ts===3.6,'Hit final form: time stops for 3.6 s');
await mk('yamcha');const y2=await use(7);ok(y2.dashWave,'Yamcha final form: dash ends with a shockwave');
await mk('piccolo');const p0=await use(-1),p2=await use(7);ok(p2.rate>p0.rate*1.6&&p2.inv>=1.9,'Piccolo final form: stronger regeneration + invulnerability ('+p0.rate.toFixed(2)+' -> '+p2.rate.toFixed(2)+')');
await mk('krillin');const kp="const e=g.mkEnemy(Object.values(ENEMIES)[0],g.p.x+520,g.p.y);e.hp=e.max=9999;g.en.push(e);";
const kb0=await use(-1,kp),kb2=await use(7,kp);ok(kb0.stun[0]===0&&kb2.stun[0]>2.5,'Krillin: the final flash reaches far enemies ('+kb0.stun[0]+' vs '+kb2.stun[0]+')');
/* passives from the middle form */
await mk('piccolo');
const rg=await pg.evaluate(()=>{const g=G;g.formIdx=-1;g.recalc();const a=g.S.regen;g.formIdx=3;g.recalc();return[a,g.S.regen];});
const fr=await pg.evaluate(()=>FORM_TIERS[3].regen);ok(Math.abs(rg[1]-rg[0]-(fr+.6))<1e-6,'middle form passive: +0.6 regen on top of the form\'s own '+fr+' (Piccolo '+rg[0].toFixed(2)+' -> '+rg[1].toFixed(2)+')');
/* kaioken */
await mk('goku');
const ka=await pg.evaluate(()=>{const g=G,o=[];g.kai=1;for(const i of[-1,3,7]){g.formIdx=i;g.recalc();o.push(g.kaiDrain);}g.kai=0;return o;});
ok(Math.abs(ka[0]-4)<1e-9&&ka[1]<ka[0]&&ka[2]<ka[1],'Kaioken drain shrinks with the transformations: '+ka.map(x=>x.toFixed(2)).join(' > '));
/* berserk */
await mk('broly');
const bs=await pg.evaluate(()=>{const g=G;g.xform=null;g.modal=null;g.formIdx=-1;g.recalc();const m0=g.S.might,a0=g.S.armor,tk0=g.S.taken;g.bersCd=0;g.bers=0;g.useAbility();const m1=g.S.might,a1=g.S.armor,tk1=g.S.taken,mx=g.bersMax;g.bers=0;g.bv=null;g.recalc();g.formIdx=5;g.recalc();g.bersCd=0;g.useAbility();return{m0,m1,a0,a1,tk0,tk1,mx,mx2:g.bersMax,a2:g.S.armor,cd:g.bersCdMax};});
ok(bs.m1>bs.m0*1.7&&bs.a1-bs.a0>=5&&bs.tk1<bs.tk0,'Broly berserk: damage x'+(bs.m1/bs.m0).toFixed(2)+', armor +'+(bs.a1-bs.a0)+', damage taken x'+(bs.tk1/bs.tk0).toFixed(2));
ok(bs.mx===10&&bs.mx2===13&&bs.a2-bs.a0>=8,'final form berserk lasts '+bs.mx2+' s with +'+(bs.a2-bs.a0)+' armor (cooldown '+bs.cd+' s)');
/* enemy escalation every 90 s */
const esc=async(diff)=>{await mk('goku',diff);return pg.evaluate(()=>{const g=G,r={};g.t=0;const e0=g.mkEnemy(Object.values(ENEMIES)[1],0,0);g.t=90*4;const e4=g.mkEnemy(Object.values(ENEMIES)[1],0,0);r.F=g.escF;r.steps=g.escSteps();r.xpm=e4.xpm;r.xpm0=e0.xpm;r.arm0=e0.armor;r.arm4=e4.armor;r.dmgRatio=e4.dmg/e0.dmg;r.hpRatio=e4.max/e0.max;return r;});};
const en=await esc('normal'),ex=await esc('extreme');
ok(en.F.hp===.1&&en.F.dmg===.02&&en.F.xp===.05&&en.steps===4&&Math.abs(en.xpm-1.2)<1e-9,'normal: +10% HP, +2% damage, +5% XP per 90 s (xpm after 4 steps '+en.xpm+')');
ok(ex.F.hp===.15&&ex.F.dmg===.05&&ex.F.arm===.15&&Math.abs(ex.xpm-1.32)<1e-9&&ex.arm4>ex.arm0&&en.arm4===0,'extreme: +15% HP, +5% damage, +15% armor, +8% XP per 90 s (xpm '+ex.xpm+', armor '+ex.arm0.toFixed(2)+' -> '+ex.arm4.toFixed(2)+')');
/* milestones on the progress bar */
await mk('goku');
const ms=await pg.evaluate(()=>{const g=G;return{hordes:g.hordePlan.length,bosses:g.bossQ.length,finals:g.bossQ.filter(b=>b.final).length,dur:g.dur};});
ok(ms.hordes>=3&&ms.bosses>=2&&ms.finals===1,'bar milestones: '+ms.hordes+' hordes, '+ms.bosses+' bosses, '+ms.finals+' final boss');
await pg.evaluate(()=>{const g=G;g.t=g.dur*.45;g.en=[];__app.renderer.draw(g,1/60);});await wait(300);
await pg.screenshot({path:'/tmp/milestones.png',clip:{x:300,y:0,width:500,height:90}});
console.log(errs.length?errs.slice(0,4):'no errors');await b.close();process.exit(errs.length||process.exitCode?1:0);})();
