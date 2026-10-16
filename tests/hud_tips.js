/* HUD: upgrade list under the weapons (with level dots), hover tooltips (also while paused), loot director. node tests/hud_tips.js */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=process.env.SHOTS||'/tmp/o';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const pg=await b.newPage();await pg.setViewport({width:1100,height:700});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1800);
  const ev=(f,...a)=>pg.evaluate(f,...a);
  await ev(()=>{__app.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false});const g=__app.game;g.addWeapon('ki');g.pass.might=3;g.pass.armor=1;g.pass.regen=5;g.recalc();});await wait(700);
  const Z=await ev(()=>{const R=__app.renderer,k=innerWidth/R.W;return R.zones.map(z=>({k:z.k,id:z.id,x:(z.x+z.w/2)*k,y:(z.y+z.h/2)*k}));});
  console.log(Z.map(z=>z.k+':'+(z.id||'')).join(' '));
  ok(Z.filter(z=>z.k==='pass').length===3,'3 upgrade boxes listed under the weapons');
  ok(Z.some(z=>z.k==='weapon')&&Z.some(z=>z.k==='ability')&&Z.some(z=>z.k==='dash')&&Z.some(z=>z.k==='senzu'),'weapon / ability / dash / senzu hover zones');
  const tip=async z=>{await pg.mouse.move(z.x,z.y);await wait(120);return ev(()=>{const t=document.getElementById('tip');return t.style.display==='block'?t.innerText:null;});};
  const tp=await tip(Z.find(z=>z.k==='pass'));console.log(JSON.stringify(tp));
  ok(tp&&/Lv 3\/5/.test(tp),'hover on an upgrade explains it with its level');
  const ta=await tip(Z.find(z=>z.k==='ability'));ok(ta&&/Kaioken/i.test(ta),'hover on the ability explains it');
  const td=await tip(Z.find(z=>z.k==='dash'));ok(td&&/dash|scatto/i.test(td),'hover on the dash explains it');
  await pg.screenshot({path:OUT+'/hud_tip.png',clip:{x:0,y:0,width:520,height:360}});
  await pg.mouse.move(600,400);await wait(100);ok(await ev(()=>document.getElementById('tip').style.display==='none'),'tooltip hides away from the HUD');
  // paused
  await ev(()=>__app.pause());await wait(500);
  const tw=await tip(Z.find(z=>z.k==='weapon'));ok(tw&&/Lv \d\/5/.test(tw),'tooltips also work while paused ('+JSON.stringify(tw)+')');
  ok(await ev(()=>/Senzu/i.test(document.querySelector('.pausescr').innerText)&&/Dash/i.test(document.querySelector('.pausescr').innerText)),'the pause screen lists the abilities (dash, Senzu...) with their explanation');
  await pg.screenshot({path:OUT+'/hud_pause.png'});
  await ev(()=>__app.resume());await wait(300);
  // loot director
  const L=await ev(()=>{const g=__app.game;g.sb&&(g.sb.god=true);g.en.length=0;g.loot.length=0;g.lootCd={};g.t=300*g.TS/ g.TS*1;g.t=400;
    const cnt={};g.p.hp=g.p.maxHp;for(let i=0;i<3000;i++){const k=g.pickLoot();if(k)cnt[k]=(cnt[k]||0)+1;}
    g.p.hp=g.p.maxHp*.2;const low={};for(let i=0;i<3000;i++){const k=g.pickLoot();if(k)low[k]=(low[k]||0)+1;}
    g.lootCd={};g.spawnLoot('magnet',0,0);const w=g.lootWeights();
    return{cnt,low,magnetCd:w.magnet};});
  console.log(JSON.stringify(L));
  ok((L.low.heal||0)>(L.cnt.heal||0)*2.5,'low health makes the health item much more likely');
  ok((L.cnt.magnet||0)<(L.cnt.heal||1)*.4&&(L.cnt.magnet||0)>0,'magnet is rarer than health but not absent');
  ok(L.magnetCd===0,'a magnet that just appeared is on cooldown');
  const H=await ev(()=>{const g=__app.game;g.loot.length=0;g.lootCd={};g.gm.length=0;for(let i=0;i<70;i++)g.gm.push({x:i,y:0,v:1,att:false,dead:false});g.p.hp=g.p.maxHp*.2;
    const d=g.dir||null;const D=g.director||g.dr||null;return Object.keys(g).filter(k=>g[k]&&g[k].needHelp).join(',');});
  console.log('director prop:',H);
  ok(errs.length===0,'no JS errors '+errs.join('|'));
  console.log(fails?'FAILED '+fails:'ALL OK');await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
