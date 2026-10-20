/* v55: enemy transformations (+50% health, +20% stats), Freezer / Cell cycling all forms, final boss death sequence, Dodoria / Gero / Super Buu moves, Piccolo / Toppo / Gotenks, Android Ruins, Realm of the Gods, Room of Spirit and Time */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:760}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
let bad=0;const ok=(c,m)=>{console.log((c?'  ok  ':'FAIL  ')+m);if(!c)bad++;};
const ev=(f,...a)=>pg.evaluate(f,...a);
const go=(o)=>ev((o)=>{const A=__app,d=A.save.d;d.settings.sandbox=false;d.settings.weapons=(o&&o.weapons)||5;A.startGame(Object.assign({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'},o||{}));const g=A.game;g.sb.nospawn=true;g.sb.god=true;window.G=g;return 1;},o);
/* ---------- transformation rule ---------- */
await go();
let r=await ev(()=>{const g=G;g.en=[];g.eb=[];g.bossAlive=0;g.spawnBoss('beerus',false,{x:g.p.x+400,y:g.p.y,k:1});const e=g.en[0];e.sh=99;
  const a={max:e.max,dmg:e.dmg,spd:e.spd,arm:e.armor};e.hp=e.max*.4;const hp0=e.hp;for(let i=0;i<4;i++)g.updateEnemies(.016);
  return{a,max:e.max,hp:e.hp,hp0,dmg:e.dmg,spd:e.spd,arm:e.armor,pf:e.pf,name:e.bd.n};});
ok(r.pf===1&&Math.abs(r.max/r.a.max-1.2)<1e-9&&Math.abs(r.dmg/r.a.dmg-1.2)<1e-9&&Math.abs(r.spd/r.a.spd-1.2)<1e-9&&Math.abs(r.arm/r.a.arm-1.2)<1e-9,'a transformation: max health, damage, speed and armor all x1.2 ('+r.name+')');
ok(Math.abs(r.hp-Math.min(r.max,r.hp0*1.2+r.max*.5))<1e-6&&r.hp>r.hp0*1.6,'a transformation recovers 50% of the (new) maximum health: '+Math.round(r.hp0)+' -> '+Math.round(r.hp)+' / '+Math.round(r.max));
/* ---------- Freezer on Namek: cycles all forms, speed +2.5% ---------- */
r=await ev(()=>{const g=G;g.en=[];g.eb=[];g.bossAlive=0;g.spawnBoss('freezer',true,{x:g.p.x+500,y:g.p.y,k:1});const e=g.en[0];e.sh=99;const names=[e.bd.n.it||e.bd.n],spd=[e.spd];let guard=0,last=e.pf||0;
  while(guard++<4000&&e.bd.p2){e.hp=Math.min(e.hp,e.max*.5);g.updateEnemies(.016);if((e.pf||0)!==last){last=e.pf;names.push(e.bd.n.it||e.bd.n);spd.push(e.spd);}}
  const st=STAGES.find(s=>s.id===2);return{names,spd,ratio:spd.slice(1).map((x,i)=>x/spd[i]),pf:e.pf,final:st.bosses.find(b=>b[2])[0],hasP2:!!e.bd.p2};});
ok(r.pf===4&&!r.hasP2&&r.names.length===5,'Freezer (Namek final boss) goes through all 5 forms: '+r.names.join(' > '));
ok(r.ratio.every(x=>Math.abs(x-1.025)<1e-9),'Freezer speed grows only 2.5% per transformation ('+r.ratio.map(x=>x.toFixed(3)).join(' ')+')');
ok(r.final==='freezer','the Namek final boss is the Freezer line');
/* ---------- Cell: Cell Games final, three forms ---------- */
r=await ev(()=>{const g=G;g.en=[];g.eb=[];g.bossAlive=0;g.spawnBoss('cell',true,{x:g.p.x+500,y:g.p.y,k:1});const e=g.en[0];e.sh=99;const names=[e.bd.n.it||e.bd.n];let guard=0,last=0;
  while(guard++<3000&&e.bd.p2){e.hp=Math.min(e.hp,e.max*.5);g.updateEnemies(.016);if((e.pf||0)!==last){last=e.pf;names.push(e.bd.n.it||e.bd.n);}}
  const arena=STAGES.find(s=>s.theme==='arena'),ruins=STAGES.find(s=>s.theme==='waste');
  return{names,arena:arena.bosses.map(b=>b[0]).join(),arenaFinal:arena.bosses.find(b=>b[2])[0],ruinsHasCell:ruins.bosses.some(b=>/cell/.test(b[0]))};});
ok(r.names.length===3&&/Perfetto/.test(r.names[2]),'Cell cycles Imperfect > Semi-Perfect > Perfect: '+r.names.join(' > '));
ok(r.arenaFinal==='cell'&&!r.ruinsHasCell,'Cell is the final boss of the Cell Games arena ('+r.arena+') and not of the Android Ruins');
/* ---------- final boss death sequence ---------- */
await go({stage:4});
r=await ev(()=>{const g=G;g.en=[];g.eb=[];g.bossAlive=0;g.spawnBoss('beerus',true,{x:g.p.x+260,y:g.p.y,k:1});const e=g.en.find(x=>x.final);e.sh=99;g.eb.push({x:g.p.x+50,y:g.p.y,vx:0,vy:0,r:7,dmg:5,life:5});
  g.damageEnemy(e,1e12,0,0,false);const s0={vic:!!g.vic,ended:g.ended,cleared:g.cleared,eb:g.eb.length};
  let steps=0,boomAt=-1,maxShake=0;for(;steps<900&&!g.ended;steps++){g.update(.016);if(g.vic&&g.vic.boom&&boomAt<0)boomAt=steps;if(g.shake>maxShake)maxShake=g.shake;}
  return{s0,steps,boomAt,ended:g.ended,vicLeft:!!g.vic,maxShake,sec:steps*.016};});
ok(r.s0.vic&&!r.s0.ended&&r.s0.cleared&&r.s0.eb===0,'the final boss dies: the death sequence starts, the stage is not over yet and enemy bullets are cleared');
ok(r.ended&&!r.vicLeft&&r.sec>3.9&&r.sec<5,'the stage-complete menu opens after the sequence (~'+r.sec.toFixed(1)+' s, blast at step '+r.boomAt+')');
ok(r.maxShake>.5,'the screen shakes during the sequence ('+r.maxShake.toFixed(2)+')');
/* ---------- block b: weapon Aura, Piccolo (Hellzone Grenade + Special Beam Cannon), Toppo, Gotenks ---------- */
r=await ev(()=>{const ow=id=>CHARS.filter(c=>c.start.includes(id)).map(c=>c.id);
  return{aura:WEAPONS.aura.n,aurOw:ow('aura'),hz:ow('hellzone'),pic:CHARS.find(c=>c.id==='piccolo').start,desc:CHARS.filter(c=>/Kaioken/.test(JSON.stringify(c.d))).map(c=>c.id),ab:{p:ABIL.piccolo.m,t:ABIL.toppo.m,g:ABIL.gotenks.m}};});
ok(r.aura.en==='Aura'&&r.aura.it==='Aura','the weapon formerly called Kaioken is now "Aura"');
ok(r.pic.join()==='hellzone'&&r.hz.includes('piccolo')&&r.aurOw.includes('jiren')&&!r.aurOw.includes('piccolo'),'Piccolo starts with the Hellzone Grenade; Aura owners: '+r.aurOw.join());
ok(r.desc.length===0,'no character description still mentions the Kaioken weapon'+(r.desc.length?' ('+r.desc+')':''));
ok(r.ab.p==='sbc'&&r.ab.t==='sphere'&&r.ab.g==='ghosts','abilities: Piccolo = Special Beam Cannon, Toppo = Sphere of Justice (dark sphere), Gotenks = ghosts');
/* Hellzone Grenade: a shell of spheres around one enemy, all strike together after ~2.2 s */
await go({char:'piccolo',weapons:3});
r=await ev(()=>{const g=G;g.en=[];g.eb=[];const w=g.weapons.get('hellzone');w.cd=0;
  const mk=(x,y)=>{const e=g.mkEnemy(Object.values(ENEMIES)[0],x,y);e.hp=e.max=4000;e.armor=0;g.en.push(e);return e;};
  const near=[mk(g.p.x+200,g.p.y),mk(g.p.x+215,g.p.y+20),mk(g.p.x+190,g.p.y-15),mk(g.p.x+225,g.p.y-10)],far=mk(g.p.x-340,g.p.y+240);
  w.update(.016);const spawned=w.gs.length,n=w.gs[0]&&w.gs[0].n,cdAfter=w.cd;
  let t=0;while(t<1.2){g.update(.016);t+=.016;}const mid=near.map(e=>e.hp/e.max);
  while(t<2.6){g.update(.016);t+=.016;}
  return{spawned,n,cdAfter,mid,end:near.map(e=>e.hp/e.max),far:far.hp/far.max,left:w.gs.length,dmg:w.st.dmg[0]};});
ok(r.spawned===1&&r.n===16&&r.cdAfter>=6.5,'level 1: one shell of 16 spheres, very slow attack (next cast in '+r.cdAfter.toFixed(1)+' s)');
ok(r.mid.every(x=>x===1)&&r.end.every(x=>x<1)&&r.far===1&&r.left===0,'the spheres only strike at the end, all together, and only the surrounded cluster is hit (end hp '+r.end.map(x=>x.toFixed(2)).join(' ')+')');
r=await ev(()=>{const g=G;const w=g.weapons.get('hellzone');const out={};
  for(const [evo,lv] of [[0,1],[1,1],[2,1]]){w.evo=evo;w.lv=lv;g.en=[];for(let i=0;i<3;i++)for(let j=0;j<4;j++){const e=g.mkEnemy(Object.values(ENEMIES)[0],g.p.x+(i-1)*330+rnd(-15,15),g.p.y+(i%2?160:-160)+rnd(-15,15)+j*6);e.hp=e.max=9e5;g.en.push(e);}
    w.gs=[];w.cd=0;w.update(.016);out[evo]={targets:w.gs.length,n:w.gs[0]&&w.gs[0].n,c:w.cdv()};}
  w.evo=0;w.lv=1;w.gs=[];return out;});
ok(r[0].targets===1&&r[1].targets===2&&r[2].targets===3&&r[2].n===r[1].n+8,'evolutions: 1 -> 2 -> 3 surrounded enemies ('+[0,1,2].map(i=>r[i].targets).join(' > ')+'), +8 spheres in the second one');
r=await ev(()=>({n:WEAPONS.hellzone.n.en,e1:WEAPONS.hellzone.evo.en,e2:WEAPONS.hellzone.evo2.en}));
ok(r.n==='Hellzone Grenade'&&r.e2==='Divine Hellzone Grenade','names: '+r.n+' > '+r.e1+' > '+r.e2);
/* Special Beam Cannon */
await go({char:'piccolo',weapons:3});
r=await ev(()=>{const g=G;g.setLevel(10);g.modal=null;g.en=[];g.eb=[];const line=g.mkEnemy(Object.values(ENEMIES)[0],g.p.x+300,g.p.y-8),line2=g.mkEnemy(Object.values(ENEMIES)[0],g.p.x+520,g.p.y-8),off=g.mkEnemy(Object.values(ENEMIES)[0],g.p.x+300,g.p.y+150);
  for(const e of[line,line2,off]){e.hp=e.max=5000;e.armor=0;g.en.push(e);}
  g.weapons.clear();g.abCd=0;g.formIdx=-1;g.recalc();const used=g.useAbility();
  const sb0=!!g.sbc;let t=0,firedAt=-1;while(t<2.4){g.update(.016);t+=.016;if(firedAt<0&&line.hp<line.max)firedAt=t;}
  return{used,sb0,firedAt,l1:line.hp/line.max,l2:line2.hp/line2.max,off:off.hp/off.max,done:!g.sbc};});
ok(r.used&&r.sb0&&r.firedAt>1&&r.firedAt<1.4,'Special Beam Cannon: ~1.1 s of charge before it fires (hit at '+r.firedAt.toFixed(2)+' s)');
ok(r.l1<1&&r.l2<1&&r.off===1&&r.done,'it pierces the whole line (both enemies in line hit, the one off the line untouched)');
r=await ev(()=>{const g=G;g.en=[];const e=g.mkEnemy(Object.values(ENEMIES)[0],g.p.x+300,g.p.y-8);e.hp=e.max=1e7;e.armor=0;g.en.push(e);g.formIdx=LINES[g.C.line].length-1;g.recalc();g.abCd=0;g.fx=[];g.useAbility();
  let t=0,beams=0;while(t<2.8){g.update(.016);t+=.016;beams=Math.max(beams,g.fx.filter(f=>f.beam&&f.sbc).length);}return{beams,tier:g.abTier,hit:1-e.hp/e.max};});
ok(r.tier===2&&r.beams===2,'final form: twin cannon, two consecutive beams');
/* Sphere of Justice */
await go({char:'toppo',weapons:3});
r=await ev(()=>{const g=G;g.setLevel(10);g.modal=null;g.en=[];g.eb=[];g.weapons.clear();const tg=g.mkEnemy(Object.values(ENEMIES)[0],g.p.x+330,g.p.y),side=g.mkEnemy(Object.values(ENEMIES)[0],g.p.x+330,g.p.y+90),far=g.mkEnemy(Object.values(ENEMIES)[0],g.p.x-500,g.p.y);
  for(const e of[tg,side,far]){e.hp=e.max=6000;e.armor=0;g.en.push(e);}
  g.abCd=0;g.formIdx=-1;g.recalc();const used=g.useAbility();const n0=g.spheres.length;let t=0,phase1=-1,peak=0,sx0=side.x;
  while(t<4&&g.spheres.length){g.update(.016);t+=.016;const s=g.spheres[0];if(s&&s.ph===1){if(phase1<0)phase1=t;peak=Math.max(peak,s.rr);}}
  return{used,n0,t,phase1,peak,tg:tg.hp/tg.max,side:side.hp/side.max,far:far.hp/far.max,pulled:Math.abs(side.x-sx0)>1||Math.abs(side.y-(g.p.y+90))>1,left:g.spheres.length};});
ok(r.used&&r.n0===1&&r.phase1>0&&r.phase1<1.2&&r.peak>30,'Toppo: the dark sphere flies to the enemy ('+r.phase1.toFixed(2)+' s), then grows (radius '+Math.round(r.peak)+')');
ok(r.tg<1&&r.side<1&&r.far===1&&r.left===0,'it explodes after ~1.5 s: the targets are hit, the far enemy is not (hp '+r.tg.toFixed(2)+' / '+r.side.toFixed(2)+' / '+r.far+')');
/* Gotenks */
await go({char:'gotenks',weapons:5});
r=await ev(()=>({line:LINES[CHARS.find(c=>c.id==='gotenks').line].map(f=>f.n.en)}));
ok(r.line.join()==='Super Saiyan,Super Saiyan 2,Super Saiyan 3,Super Saiyan God,Super Saiyan Blue','Gotenks: SSJ > SSJ2 > SSJ3 > SSJ God > SSJ Blue ('+r.line.length+' forms, no Saiyan Fury)');
r=await ev(()=>{const g=G;g.modal=null;g.en=[];g.eb=[];g.lvl=1;const iv1=g.ghostIv;g.lvl=21;const iv21=g.ghostIv;g.lvl=31;const iv31=g.ghostIv;g.lvl=99;const iv99=g.ghostIv;g.lvl=5;g.setLevel(5);
  for(const id of['kame','dbeam','spirit','chain'])if(!g.weapons.has(id))g.addWeapon&&g.addWeapon(id);
  const tg=g.mkEnemy(Object.values(ENEMIES)[0],g.p.x+240,g.p.y);tg.hp=tg.max=1e7;tg.armor=0;g.en.push(tg);
  const w=[...g.weapons.keys()];g.abCd=0;g.formIdx=-1;g.recalc();g.useAbility();const n=g.ghosts.length;
  let strikes=0;const orig=g.ghostStrike.bind(g);g.ghostStrike=(k,t,f)=>{strikes++;return orig(k,t,f);};
  let t=0;const hit0=tg.hp;while(t<12){g.update(.016);t+=.016;}
  const hp1=tg.hp;
  return{iv:[iv1,iv21,iv31,iv99],n,w,strikes,dist:g.ghosts?Math.min(...g.ghosts.map(k=>Math.hypot(k.x-tg.x,k.y-tg.y))):-1,dealt:hit0-hp1};});
ok(r.iv[0]===10&&Math.abs(r.iv[1]-6)<1e-9&&r.iv[2]===4&&r.iv[3]===4,'ghost attack interval: 10 s at level 1, improving to 4 s ('+r.iv.join(' / ')+')');
ok(r.n===3&&r.strikes>=3&&r.strikes<=6&&r.dist<190&&r.dealt>0,'3 ghosts fly at the nearest enemy and copy '+r.w.length+' weapons ('+r.w.join()+'); '+r.strikes+' attacks in 12 s, damage '+Math.round(r.dealt));
r=await ev(()=>{const g=G;const tg=g.en[0];g.ghostT=0.01;let t=0;const h0=tg.hp;while(t<3&&g.ghosts){g.update(.016);t+=.016;}return{gone:!g.ghosts,boom:h0-tg.hp};});
ok(r.gone&&r.boom>0,'when their time is up the ghosts explode on the enemy (kamikaze)');
/* ---------- block c: Dodoria's body hurl, Dr. Gero's hold, Super Buu's rain ---------- */
const boss=(id,dx,diffId)=>ev((id,dx)=>{const g=G;g.en=[];g.eb=[];g.bossAlive=0;g.spawnBoss(id,false,{x:g.p.x+dx,y:g.p.y,k:1});const e=g.en[0];e.sh=999;e.sgT=.01;e.hp=e.max=1e8;e.armor=0;g.p.hp=g.p.maxHp=1000;g.sb.god=false;g.p.inv=0;return{sig:e.bd.sig,r:e.r};},id,dx);
await go({stage:0});
let info=await boss('dodoria',320);
ok(info.sig==='dtoss','Dodoria has the body-hurl move');
r=await ev(()=>{const g=G,e=g.en[0];let t=0,t0=-1,t1=-1,ang0=null;
  while(t<8){g.update(.016);t+=.016;if(e.bm&&t0<0){t0=t;ang0=e.bm.a;}if(e.bm&&e.bm.st===1&&t1<0)t1=t;if(t1>0&&!e.bm)break;}
  return{warn:t1-t0,w:e.r*2,hp:g.p.hp,max:g.p.maxHp,dmg:e.dmg,stun:e.stun>0,banner:!!g.banner};});
ok(Math.abs(r.warn-3)<.1,'Dodoria warns for 3 seconds before hurling himself ('+r.warn.toFixed(2)+' s)');
ok(r.hp<r.max-r.dmg*2&&r.stun,'standing on the path hurts a lot ('+Math.round(r.max-r.hp)+' damage) and leaves him stunned afterwards');
await boss('dodoria',320);
r=await ev(()=>{const g=G,e=g.en[0];let t=0;while(t<8&&!(e.bm&&e.bm.t>2.2&&e.bm.st===0)){g.update(.016);t+=.016;}
  const w=e.r*2,locked=e.bm&&e.bm.t>=e.bm.lock;g.p.y+=w*2.4;   /* the player steps aside by more than the width of the body, after the aim has locked */
  while(t<10&&e.bm){g.update(.016);t+=.016;}
  return{locked,hp:g.p.hp,max:g.p.maxHp,w};});
ok(r.locked&&r.hp===r.max,'the path is locked in the last second: stepping out of it (more than the body width) avoids all damage');
/* Dr. Gero */
const gero=async(diff)=>{await go({stage:0,diff});await boss('gero',250);
  return ev(()=>{const g=G,e=g.en[0];let t=0,tHeld=-1,tFree=-1;const st=g.p.hp;
    while(t<12){g.update(.016);t+=.016;if(g.held&&tHeld<0){tHeld=t;}if(tHeld>0&&!g.held){tFree=t;break;}}
    return{held:tHeld>0,dur:tFree-tHeld,lost:st-g.p.hp,max:g.p.maxHp,heal:e.hp>1e8-1?0:1};});};
for(const [d,pc] of [['easy',5],['normal',15],['hard',25],['extreme',35]]){
  r=await gero(d);
  ok(r.held&&Math.abs(r.dur-3)<.12&&Math.abs(r.lost/r.max*100-pc)<.6,'Gero '+d+': held for '+r.dur.toFixed(2)+' s, drains '+(r.lost/r.max*100).toFixed(1)+'% of the maximum health (expected '+pc+'%)');
}
await go({stage:0});await boss('gero',250);
r=await ev(()=>{const g=G,e=g.en[0];let t=0;while(t<12&&!g.held){g.update(.016);t+=.016;}const was=!!g.held;g.update(.016);g.startDash(1,0,1,.3,'#fff');return{was,free:!g.held,stun:e.stun>0};});
ok(r.was&&r.free,'a dash breaks the hold');
await go({stage:0});await boss('gero',250);
r=await ev(()=>{const g=G,e=g.en[0];let t=0;while(t<12&&!g.held){g.update(.016);t+=.016;}const was=!!g.held;e.stun=1;g.update(.016);return{was,free:!g.held};});
ok(r.was&&r.free,'stunning Gero breaks the hold');
/* Super Buu */
await go({stage:0});info=await boss('superbu',260);
ok(info.sig==='rain','Super Buu has the rain-of-ki move');
r=await ev(()=>{const g=G,e=g.en[0];g.p.hp=g.p.maxHp=1e6;let t=0,fired=0,first=-1,last=-1,peak=0,hits=0,hp0=g.p.hp,maxMk=0;
  while(t<14){g.update(.016);t+=.016;if(e.bm&&e.bm.k==='rain')fired=Math.max(fired,e.bm.fired);peak=Math.max(peak,g.rain.length);maxMk=Math.max(maxMk,g.rain.filter(x=>x.mk).length);if(!e.bm&&fired>0&&!g.rain.length)break;}
  return{fired,peak,maxMk,left:g.rain.length,lost:hp0-g.p.hp,t,n:BM_RAIN_N[1]};});
ok(r.fired>=50&&r.fired===r.n,'Super Buu fires '+r.fired+' balls (at least 50, one every 0.1 s)');
r=await ev(()=>{const g=G;g.rain=[];g.S.armor=60;g.p.inv=0;g.p.hp=g.p.maxHp=1000;g.rain.push({t:2.99,hx:g.p.x,hy:g.p.y-300,lx:g.p.x,ly:g.p.y,mk:true,done:false});g.update(.02);g.update(.02);return{lost:g.p.maxHp-g.p.hp};});
ok(r.lost===20,'each ball that lands on you takes 2% of your maximum health even with armor ('+r.lost+' of 1000)');
r=await ev(()=>{const g=G;g.en=[];g.rain=[];const p=g.p;for(let i=0;i<5;i++)g.rain.push({t:0,hx:p.x,hy:p.y-300,mk:false,done:false});let t=0,mkAt=-1,doneAt=-1;while(t<3.3){g.update(.01);t+=.01;if(mkAt<0&&g.rain.length&&g.rain[0].mk)mkAt=t;if(doneAt<0&&!g.rain.length)doneAt=t;}return{mkAt,doneAt};});
ok(Math.abs(r.mkAt-2)<.05&&Math.abs(r.doneAt-3)<.05,'the ball is marked on the ground 1 s before and lands 3 s after it was fired ('+r.mkAt.toFixed(2)+' / '+r.doneAt.toFixed(2)+' s)');
/* ---------- block d: Android Ruins (real-time androids), Realm of the Gods, Zeno-sama, Room of Spirit and Time ---------- */
const sched=(stage,diff)=>go({stage,diff}).then(()=>ev(()=>G.bossQ.map(b=>b.id+'@'+Math.round(b.t)+(b.final?'F':'')+(b.k!==1?'x'+b.k:'')).join(' ')));
const RU=2;   // index of the Android Ruins in STAGES
let sc=await sched(RU,'easy');   ok(sc==='gero@150 c13@300F','Ruins Easy (5 min): '+sc);
sc=await sched(RU,'normal');     ok(sc==='gero@150 c13@300 c14@600F','Ruins Normal (10 min): '+sc);
sc=await sched(RU,'hard');       ok(sc==='gero@150 c13@300 c14@600 c15@900F','Ruins Hard (15 min): '+sc);
sc=await sched(RU,'extreme');    ok(sc==='gero@150 c13@300 c14@600 c15@900 c16@1200x1.5 c17@1500x2 c18@1800F','Ruins Extreme (30 min): '+sc);
r=await ev(()=>{const st=STAGES[2];return{note:!!st.endNote,others:STAGES.filter(s=>s!==st&&s.endNote).length,has21:stageHasBoss(st,'c21'),has19:stageHasBoss(st,'c19'),cell:st.bosses.some(b=>/cell/.test(b[0]))};});
ok(r.note&&r.others===0&&r.has21&&r.has19&&!r.cell,'the red Endless note exists only for the Android Ruins; 19 and 21 belong to its bestiary list; no Cell');
/* Endless goes on: 19 at 35:00, 21 at 40:00, then the list starts over */
await go({stage:2,diff:'extreme'});
r=await ev(()=>{const g=G;g.t=1800+5;for(const b of g.bossQ)b.done=true;g.continueAfterWin();return g.bossQ.filter(b=>!b.done).slice(0,10).map(b=>b.id+'@'+Math.round(b.t/60)+'m'+(b.k!==1?'x'+b.k:'')).join(' ');});
ok(/^c19@35m c21@40m c13@45mx1\.35 c14@50mx1\.35 c15@55mx1\.35 c16@60mx2\.02/.test(r),'Endless (Extreme): '+r);
await go({stage:2,diff:'easy'});
r=await ev(()=>{const g=G;g.t=305;for(const b of g.bossQ)b.done=true;g.continueAfterWin();return g.bossQ.filter(b=>!b.done).slice(0,4).map(b=>b.id+'@'+Math.round(b.t/60)+'m').join(' ');});
ok(/^c14@10m c15@15m c16@20m c17@25m/.test(r),'Endless after an Easy win continues with the next android: '+r);
/* health of C-16 / C-17 in the Ruins (more) than elsewhere */
r=await ev(()=>{const g=G;g.en=[];g.bossAlive=0;g.spawnBoss('c16',false,{x:g.p.x+400,y:g.p.y,k:1});const a=g.en[0].max;g.en=[];g.bossAlive=0;g.spawnBoss('c16',false,{x:g.p.x+400,y:g.p.y,k:1},1.5);return{a,b:g.en[0].max};});
ok(Math.abs(r.b/r.a-1.5)<1e-9,'a health factor can be given to a boss (C-16 in the Ruins has x1.5)');
/* every move of every new boss exists (it produces something) and nothing breaks */
const NEW=['c13','c13s','c14','c15','c16','c17','c18','c19','c21','c21m','shin','daikai','champa'];
r=await ev((NEW)=>{const g=G;const miss=[];let n=0;g.p.hp=g.p.maxHp=1e6;
  for(const id of NEW){const bd0=BOSSES[id];const set=new Set([...bd0.pats,...(bd0.ext||[])]);
    for(const pt of set){g.en=[];g.eb=[];g.bz=[];g.jbeams=[];g.bossAlive=0;g.spawnBoss(id,false,{x:g.p.x+380,y:g.p.y,k:1});const e=g.en[0];
      e.bd=Object.assign({},bd0,{pats:[pt],rnd:false,ext:[pt],sig:null});e.tf=0;e.phase=0;e.hp=e.max*.3;   /* low health so the self-destruct is allowed */
      const before=g.eb.length+g.bz.length+g.jbeams.length;
      for(let i=0;i<12&&!(g.eb.length+g.bz.length+g.jbeams.length>before||e.bar>0);i++)g.bossAttack(e);
      n++;if(!(g.eb.length+g.bz.length+g.jbeams.length>before||e.bar>0))miss.push(id+':'+pt);}}
  return{miss,n};},NEW);
ok(r.miss.length===0,'all '+r.n+' (boss, move) pairs of the new bosses do something'+(r.miss.length?' - missing: '+r.miss.join(','):''));
/* barrier absorbs damage */
r=await ev(()=>{const g=G;g.en=[];g.bossAlive=0;g.spawnBoss('c15',false,{x:g.p.x+400,y:g.p.y,k:1});const e=g.en[0];e.armor=0;const h0=e.hp;g.damageEnemy(e,1000,0,0,false);const a=h0-e.hp;e.hp=h0;e.bar=2;g.damageEnemy(e,1000,0,0,false);const b=h0-e.hp;
  e.sh=99;e.bar=.05;e.barCd=0;g.updateEnemies(.1);return{a,b,bar:e.bar};});
ok(Math.abs(r.a-1000)<1e-6&&Math.abs(r.b-120)<1e-6&&r.bar<=0,'the barrier absorbs 88% of the damage ('+r.b+' instead of '+r.a+') and runs out');
r=await ev(()=>{const g=G;g.en=[];g.bz=[];g.eb=[];g.bossAlive=0;g.spawnBoss('c16',false,{x:g.p.x+400,y:g.p.y,k:1});const e=g.en[0];e.bd=Object.assign({},BOSSES.c16,{pats:['selfd'],rnd:false,ext:['selfd']});e.hp=e.max;g.bossAttack(e);const a=g.bz.length;e.hp=e.max*.3;e.sdCd=0;g.bossAttack(e);const big=g.bz.some(z=>z.r>=330&&z.dur>=3);const st=e.stun;g.bossAttack(e);return{a,big,st,second:g.bz.length};});
ok(r.a===0&&r.big&&r.st>=3.4,'C-16 self-destructs only when badly hurt (large 3.4 s zone, he is stunned) and not twice in a row');
/* transformations */
r=await ev(()=>{const g=G,out={};for(const [id,to] of [['c13','c13s'],['c21','c21m']]){g.en=[];g.eb=[];g.bossAlive=0;g.spawnBoss(id,false,{x:g.p.x+400,y:g.p.y,k:1});const e=g.en[0];e.sh=99;e.hp=e.max*.45;for(let i=0;i<4;i++)g.updateEnemies(.016);out[id]=e.pf===1&&e.bd.n.en===BOSSES[to].n.en;}return out;});
ok(r.c13&&r.c21,'Android 13 becomes Super 13 and Android 21 becomes her Majin form at half health');
ok(await ev(()=>BOSSES.c19.sig==='grab'),'Android 19 absorbs energy with the hold move');
/* Realm of the Gods */
r=await ev(()=>{const st=STAGES.find(s=>s.theme==='sky');return{ids:st.bosses.map(b=>b[0]).join(),plans:['easy','normal','hard','extreme'].map(d=>bossPlan(st,DIFF[d].dur,d).map(b=>b[0]+(b[2]?'F':'')).join(' '))};});
ok(r.ids==='shin,daikai,champa,beerus'&&!/zarbon|cooler|janemba/.test(r.ids),'Realm of the Gods: no Zarbon; Kaioshin, Grand Supreme Kai, a God of Destruction and Beerus ('+r.ids+')');
ok(r.plans.every(x=>x==='shin daikai champa beerusF'),'Beerus is the final boss on every difficulty (Zeno-sama is not a boss): '+r.plans[3]);
/* Zeno-sama is a playable character, not a boss */
r=await ev(()=>({boss:!!BOSSES.zeno,desc:!!BOSS_DESC.zeno,final:STAGES.some(st=>st.finalBy)}));
ok(!r.boss&&!r.desc&&!r.final,'Zeno-sama is no longer a boss');
r=await ev(()=>{const z=CHARS.find(c=>c.id==='zeno'),ref=CHARS.filter(c=>c.id!=='zeno');const mx=k=>Math.max(...ref.map(c=>c[k]||0));
  return{z:!!z,price:z&&z.price,hp:z.hp,might:z.might,armor:z.armor,cd:z.cd,regen:z.regen,lv:z.lvMight,maxHp:mx('hp'),maxMight:mx('might'),maxArmor:mx('armor'),minCd:Math.min(...ref.map(c=>c.cd||1)),maxRegen:mx('regen'),start:z.start,line:(LINES[z.line]||[]).length,abil:!!ABIL.zeno};});
ok(r.z&&!r.price&&r.hp>=333&&r.armor>=3&&r.might>=1.5&&r.cd<=.75&&r.lv>=.01,'Zeno-sama: not for sale, at least Queen Sigma\'s numbers (health '+r.hp+', armor '+r.armor+', damage x'+r.might+', cooldown x'+r.cd+', +'+(r.lv*100)+'% damage per level)');
ok(r.hp>r.maxHp*2&&r.might>r.maxMight&&r.armor>r.maxArmor&&r.cd<r.minCd&&r.regen>r.maxRegen,'... and stronger than every other character in each of those stats');
ok(r.line===4&&r.abil&&r.start.join()==='hakai,spirit','he has his 4 forms, the Erase ability and starts with Sphere of Destruction + Spirit Bomb');
/* unlock: every stage cleared on Extreme AND every weapon unlocked */
r=await ev(()=>{const A=__app,d=A.save.d,P=A.progress||A.prog||null;const pr=A.save&&A.progress?A.progress:null;return{has:!!pr};});
await go({stage:0,char:'goku'});
r=await ev(()=>{const A=__app,g=G,d=A.save.d,pr=g.progress,c=CHARS.find(x=>x.id==='zeno');
  const xc0=d.xc.slice(),wu0=Object.assign({},d.wu),un0=d.unlocked.slice();
  const ctx=()=>pr.runCtx(g,true);const out={};
  d.xc=d.xc.map(()=>0);d.wu={};out.none=c.ul(ctx());
  d.xc=d.xc.map(()=>1);out.onlyX=c.ul(ctx());
  d.xc=d.xc.map(()=>0);for(const id in WEAPONS)d.wu[id]=1;out.onlyW=c.ul(ctx());
  d.xc=d.xc.map((v,i)=>i===0?0:1);out.missingStage=c.ul(ctx());
  d.xc=d.xc.map(()=>1);delete d.wu.hakai;out.missingWeapon=c.ul(ctx());
  d.wu.hakai=1;out.both=c.ul(ctx());
  d.xc=xc0;d.wu=wu0;d.unlocked=un0;return out;});
ok(!r.none&&!r.onlyX&&!r.onlyW&&!r.missingStage&&!r.missingWeapon&&r.both,'Zeno-sama unlocks only with all '+11+' stages cleared on Extreme and all weapons unlocked ('+JSON.stringify(r)+')');
/* playing as Zeno: his picture is the character sprite */
await ev(()=>{const A=__app,d=A.save.d;if(!d.unlocked.includes('zeno'))d.unlocked.push('zeno');});
await go({stage:0,char:'zeno'});
await wait(300);
r=await ev(()=>{const g=G;for(let i=0;i<30;i++)g.update(.016);const sp=Sprites.player(g.pcKey,g.pc,1,false,null);const sh=Sprites.sheetFor(g.pcKey);
  return{name:g.C.id,maxHp:g.p.maxHp,might:g.S.might,cd:g.S.cd,armor:g.S.armor,sheet:sh,w:sp&&sp.c.width,h:sp&&sp.c.height,weapons:[...g.weapons.keys()].join(),forms:(LINES[g.C.line]||[]).length};});
ok(r.name==='zeno'&&r.sheet==='zeno'&&r.w>20&&r.h>50&&r.maxHp>=360&&r.weapons==='hakai,spirit','playing as Zeno-sama: his picture is the sprite ('+r.w+'x'+r.h+'), '+r.maxHp+' health, weapons '+r.weapons);
/* Room of Spirit and Time: the Master imitates the player */
await go({stage:0,char:'goku'});
r=await ev(()=>{const g=G;g.p.hp=g.p.maxHp=1e6;for(const id of['ki','homing','disc','spirit','chain'])g.addWeapon(id);g.startTrial();const e=g.trial.boss;e.sh=99;const names=new Set(),dm=[];let n=0,copies=0;
  const orig=g.floatText.bind(g);g.floatText=(x,y,t,k)=>{if(typeof t==='string'&&/!$/.test(t))names.add(t);return orig(x,y,t,k);};
  for(let i=0;i<200;i++){g.eb=[];g.bz=[];g.jbeams=[];g.bossAttack(e);n++;}
  g.floatText=orig;return{names:[...names],weapons:[...g.weapons.keys()],ab:ABIL[g.C.id]&&ABIL[g.C.id].n.en,zd:Math.max(e.dmg*1.1,g.p.maxHp*(.2+.05*Math.min(2,g.trialN)))};});
ok(r.names.length>=3,'the Master uses abilities with your names: '+r.names.slice(0,6).join(' '));
r=await ev(()=>{const g=G;g.p.hp=g.p.maxHp=1e6;g.startTrial();const e=g.trial.boss;const zd=Math.max(e.dmg*1.1,g.p.maxHp*(.2+.05*Math.min(2,g.trialN)));let found=0,wrong=0;
  for(let i=0;i<300;i++){g.eb=[];g.bz=[];g.jbeams=[];const before=Math.random;g.bossAttack(e);
    for(const b of g.eb)if(Math.abs(b.dmg-zd*.6)<1e-6)found++;for(const z of g.bz)if(Math.abs(z.dmg-zd*.6)<1e-6||Math.abs(z.dmg-zd*.6*1.1)<1e-6||Math.abs(z.dmg-zd*.6*1.3)<1e-6||Math.abs(z.dmg-zd*.6*1.4)<1e-6)found++;}
  return{found,mul:SPAR_COPY_MUL};});
ok(r.mul===.6&&r.found>20,'copied attacks deal 40% less damage than the Master\'s own ('+r.found+' attacks checked)');
ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
console.log(bad?'FAILED '+bad:'ALL OK');await b.close();process.exit(bad?1:0);})();
