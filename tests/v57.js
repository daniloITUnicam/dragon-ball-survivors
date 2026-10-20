/* v57: Cooler on Namek (three forms), extra trinket slots equippable before a run, the Master of the Room of Spirit and Time copies your weapons with their own look */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=process.env.SHOTS||'/tmp/o';
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:760}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1500);
let bad=0;const ok=(c,m)=>{console.log((c?'  ok  ':'FAIL  ')+m);if(!c)bad++;};
const ev=(f,...a)=>pg.evaluate(f,...a);
const go=(o)=>ev((o)=>{const A=__app,d=A.save.d;d.settings.sandbox=false;d.settings.weapons=(o&&o.weapons)||5;A.startGame(Object.assign({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'},o||{}));const g=A.game;g.sb.nospawn=true;g.sb.god=true;window.G=g;return 1;},o);
/* ---------- Cooler, late boss of Namek ---------- */
await go({stage:1});
let r=await ev(()=>{const st=STAGES.find(s=>s.id===2),pl=bossPlan(st,600,'normal');
  const g=G;g.en=[];g.eb=[];g.bossAlive=0;g.spawnBoss('cooler',false,{x:g.p.x+500,y:g.p.y,k:1});const e=g.en[0];e.sh=99;const names=[e.bd.n.it||e.bd.n],spd=[e.spd],max=[e.max];let guard=0,last=0;const pats=[];
  while(guard++<4000&&e.bd.p2){e.hp=Math.min(e.hp,e.max*.5);g.updateEnemies(.016);if((e.pf||0)!==last){last=e.pf;names.push(e.bd.n.it||e.bd.n);spd.push(e.spd);max.push(e.max);pats.push(e.bd.pats.join());}}
  return{list:st.bosses.map(b=>b[0]).join(),plan:pl.map(b=>b[0]+'@'+Math.round(b[1])).join(),final:st.bosses.find(b=>b[2])[0],names,pf:e.pf,ratio:spd.slice(1).map((x,i)=>x/spd[i]),max,pats,hp:BOSSES.cooler.hp,fz:BOSSES.freezer.hp};});
ok(r.list==='ginew,dodoria,zarbon,cooler,freezer','Namek bosses: '+r.list+' (plan '+r.plan+')');
ok(r.final==='freezer','Freezer is still the final boss of Namek');
ok(r.pf===2&&r.names.length===3,'Cooler goes through all his forms: '+r.names.join(' > '));
ok(r.ratio.every(x=>Math.abs(x-1.025)<1e-9),'his speed grows only 2.5% per transformation');
ok(r.pats[1].includes('fnova'),'the final form uses the Supernova');
ok(r.hp<r.fz*1.4&&r.hp>=r.fz,'Cooler\'s health sits just above Frieza\'s first form ('+r.hp+' vs '+r.fz+')');
/* ---------- Janemba: fat form in Snake Way (campaign level 2) ---------- */
r=await ev(()=>{const st=STAGES.find(s=>s.id===11);return{pos:st.no,list:st.bosses.map(b=>b[0]).join(),p2:BOSSES.janembaf.p2,morph:BOSSES.janembaf.morph};});
ok(r.pos===2&&r.list==='janembaf'&&r.p2==='janembas'&&r.morph,'Janemba (fat form, then transforms) is the final boss of campaign level '+r.pos);
/* ---------- extra trinket slots ---------- */
await go();
r=await ev(()=>{const A=__app,d=A.save.d,P=A.progress;d.shop.tslot=0;d.bag=[{id:'scouter',r:0,at:1,p:50},{id:'boots',r:1,at:2,p:60},{id:'radar',r:2,at:3,p:70},{id:'potara',r:3,at:4,p:80}];
  const out={};out.n0=P.trinketSlots();out.eq1=P.equipTrinket('scouter',0);out.eq2=P.equipTrinket('boots',1,1);
  d.shop.tslot=1;out.n1=P.trinketSlots();out.eq3=P.equipTrinket('boots',1,1);out.second=d.equips[1]&&d.equips[1].id;
  d.shop.tslot=2;out.n2=P.trinketSlots();out.eq4=P.equipTrinket('radar',2);out.third=d.equips[2]&&d.equips[2].id;out.eq5=P.equipTrinket('potara',3,3);
  /* the same trinket cannot sit in two slots: another rarity of it moves */
  d.bag.push({id:'scouter',r:2,at:5,p:90});P.equipTrinket('scouter',2,2);out.dup=d.equips.map(e=>e?e.id+e.r:'-').join();
  P.equipTrinket('scouter',0,0);P.equipTrinket('radar',2,2);P.equipTrinket('boots',1,1);out.full=d.equips.map(e=>e?e.id:'-').join();out.mirror=d.equip&&d.equip.id;
  A.ui.show('chars');return out;});
ok(r.n0===1&&r.eq1===true&&r.eq2===false,'without the upgrade there is one slot (slot 2 refuses)');
ok(r.n1===2&&r.eq3&&r.second==='boots','1 "Extra Trinket" purchase: 2 slots, the second one equips');
ok(r.n2===3&&r.eq4&&r.third==='radar'&&r.eq5===false,'2 purchases: 3 slots, never a 4th');
ok(r.dup==='-,boots1,scouter2'||r.dup.split(',').filter(x=>/^scouter/.test(x)).length===1,'the same trinket is never carried twice ('+r.dup+')');
await wait(300);
let n=await ev(()=>document.querySelectorAll('.tslot').length);
ok(n===3,'the character screen shows 3 trinket slots ('+n+')');
await pg.screenshot({path:OUT+'/v57_slots.png'});
r=await ev(()=>{const A=__app;A.ui.push('bag',{pick:true,slot:1});return document.querySelector('[data-fid="beq"],[data-fid="bunq"]')?1:0;});await wait(200);
await pg.evaluate(()=>{const A=__app,d=A.save.d;A.ui.pop();});
r=await ev(()=>{const A=__app,d=A.save.d;A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;window.G=g;return{n:g.trinkets.length,ids:g.trinkets.join(),cap:g.tcap,src:Object.values(g.tSrc).join()};});
ok(r.n===3&&r.cap===3&&/^bag,bag,bag$/.test(r.src),'a run starts with the three equipped trinkets ('+r.ids+')');
r=await ev(()=>{const A=__app,d=A.save.d;d.shop.tslot=1;const nd=A.save.normalize(JSON.parse(JSON.stringify(d)));return nd.equips.map(e=>e?e.id:'-').join()+' | '+(nd.equip?nd.equip.id:'-');});
ok(/^[a-z-]+,[a-z-]+,-/.test(r),'losing the upgrade (refund) empties slot 3: '+r);
r=await ev(()=>{const A=__app,d=A.save.d;d.shop.tslot=2;const old=JSON.parse(JSON.stringify(d));delete old.equips;old.equip={id:'scouter',r:0};const nd=A.save.normalize(old);return nd.equips.map(e=>e?e.id:'-').join();});
ok(r.startsWith('scouter,'),'an old save with a single "equip" migrates to slot 1 ('+r+')');
/* ---------- Room of Spirit and Time: the Master copies each weapon with its look ---------- */
await go();
r=await ev(()=>{const g=G;g.p.hp=g.p.maxHp=1e6;g.startTrial();const e=g.trial.boss;e.sh=99;const res={},rn=Math.random;Math.random=()=>.9;   /* .9: never his own attack, never the ability */
  const ids=['ki','kame','disc','spirit','aura','flare','slash','homing','dbeam','javelin','dsunday','breaker','spiral','boomer','hellzone','chrono','shock','hakai','chain','meteor','sweep','dyn'];
  const zd=Math.max(e.dmg*1.1,g.p.maxHp*(.2+.05*Math.min(2,g.trialN)));
  for(const id of ids){g.weapons.clear();g.addWeapon(id);if(!g.weapons.has(id)){res[id]='no';continue;}
    g.eb=[];g.bz=[];g.jbeams=[];e.cpq=null;e.x=g.p.x+190;e.y=g.p.y;
    try{const done=g.sparCopy(e,zd,Math.PI);res[id]={ok:done,eb:g.eb.length,cp:g.eb.filter(b=>b.cp).length,bz:g.bz.length,bzcp:g.bz.filter(z=>z.cp).length,bm:g.jbeams.length,bmcp:g.jbeams.filter(b=>b.cp).length,spear:g.eb.filter(b=>b.spear!==undefined).length};}catch(x){res[id]='ERR '+x.message;}}
  Math.random=rn;return res;});
const bad1=Object.entries(r).filter(([k,v])=>v==='no'||typeof v==='string'||!v.ok||(v.eb+v.bz+v.bm)===0||v.eb!==v.cp||v.bz!==v.bzcp||v.bm!==v.bmcp);
ok(bad1.length===0,'every weapon is copied and the copies carry the "like yours" flag'+(bad1.length?': '+JSON.stringify(bad1):''));
ok(r.kame.bmcp===1&&r.sweep.bmcp===1&&r.dbeam.bmcp===1&&r.breaker.bmcp===1,'beam weapons become a beam with the Kamehameha art');
ok(r.javelin.spear===3,'the javelin is thrown as three spears');
ok(r.spirit.bz===1&&r.meteor.bz===4&&r.hellzone.bz===3&&r.hakai.bz===1,'Spirit Bomb / Meteor / Hellzone / Hakai have their own pattern');
/* his attacks in the real loop: every owned weapon takes a turn */
r=await ev(()=>{const g=G;g.p.hp=g.p.maxHp=1e6;g.weapons.clear();for(const id of['ki','kame','spirit','aura','slash'])g.addWeapon(id);g.startTrial();const e=g.trial.boss;e.sh=99;const names=[],orig=g.floatText.bind(g);
  g.floatText=(x,y,t,k)=>{if(typeof t==='string'&&/!$/.test(t))names.push(t);return orig(x,y,t,k);};
  const abn=ABIL[g.C.id]&&ABIL[g.C.id].n.en,ws=[...g.weapons.values()].map(w=>(WEAPONS[w.id].n.en||WEAPONS[w.id].n));
  for(let i=0;i<120;i++){g.eb=[];g.bz=[];g.jbeams=[];g.bossAttack(e);}g.floatText=orig;return{names,ws};});
const seen=r.ws.filter(w=>r.names.some(n=>n===w+'!'));
ok(seen.length===r.ws.length,'in 120 attacks the Master used all '+r.ws.length+' of your weapons ('+seen.join(', ')+')');
/* look: a Kamehameha copy, in the weapon colour */
await ev(()=>{const g=G;g.weapons.clear();g.addWeapon('kame');g.startTrial();const e=g.trial.boss;g.en=[e];e.x=g.p.x+260;e.y=g.p.y;e.sh=99;e.stun=0;g.eb=[];g.bz=[];g.jbeams=[];const rn=Math.random;Math.random=()=>.9;g.sparCopy(e,50,Math.PI);Math.random=rn;g.sparCopy=()=>false;e.sh=99;});
await wait(1700);await pg.screenshot({path:OUT+'/v57_mimic_beam.png'});
await ev(()=>{const g=G;g.weapons.clear();g.addWeapon('javelin');g.addWeapon('spirit');g.jbeams=[];g.eb=[];g.bz=[];const e=g.trial.boss;e.x=g.p.x+260;e.y=g.p.y;e.stun=0;e.sh=99;});
await wait(150);
await ev(()=>{const g=G,e=g.trial.boss;const rn=Math.random;Math.random=()=>.9;g.weapons.clear();g.addWeapon('javelin');g.sparCopy.call(g,e,50,Math.PI);g.weapons.clear();g.addWeapon('spirit');delete g.sparCopy;g.sparCopy(e,50,Math.PI);Math.random=rn;});
await wait(250);await pg.screenshot({path:OUT+'/v57_mimic_spear.png'});
/* Tamagami: a boss that spawns before its sheet has loaded switches to the pack art once it arrives (the "no art" answer is not cached for good) */
r=await ev(()=>{const sv=Sprites.sheets.tama2;delete Sprites.sheets.tama2;const e={boss:1,bid:'tama2'};const a=Sprites.enemySid(e);Sprites.sheets.tama2=sv;Sprites.nSheets=(Sprites.nSheets||0)+1;const b=Sprites.enemySid(e);const gl=Sprites.packPortrait('tama2',true);return{a,b,gl:!!(gl&&gl.c)};});
ok(r.a===null&&r.b==='tama2'&&r.gl,'Tamagami sheet is picked up after a late load and the glossary uses the pack art ('+JSON.stringify(r)+')');
ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
console.log(bad?'FAILED '+bad:'ALL OK');await b.close();process.exit(bad?1:0);})();
