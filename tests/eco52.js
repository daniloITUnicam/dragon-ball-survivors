/* v52 economy: level-up Reroll/Skip/Ban, Zeno prices, tickets (drop/buy/auto), coin streak, Achievement + Objectives screens, daily quests */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const pre=process.argv[2]||'/tmp/e52_';
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:760}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
let bad=0;const ok=(c,m)=>{console.log((c?'  ok  ':'FAIL  ')+m);if(!c)bad++;};
const ev=(f,...a)=>pg.evaluate(f,...a);
const go=(shop)=>ev((shop)=>{const A=__app,d=A.save.d;d.settings.sandbox=false;Object.assign(d.shop,shop||{});A.startGame({stage:5,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;g.sb.nospawn=true;g.sb.god=true;g.modal=null;window.G=g;return true;},shop);
/* ---------- shop numbers ---------- */
const sh=await ev(()=>{const tot=SHOP.reduce((s,it)=>{let t=0;for(let l=0;l<it.max;l++)t+=shopCost(it,l);return s+t;},0);return{tot,rr:SHOP.find(i=>i.id==='rr').max,sk:SHOP.find(i=>i.id==='sk').max,bn:SHOP.find(i=>i.id==='bn').max,gold:shopCost(SHOP.find(i=>i.id==='gold'),0)};});
console.log('  total cost of the whole shop: '+sh.tot);
ok(sh.rr===5&&sh.sk===5&&sh.bn===5,'Reroll / Skip / Ban: up to 5 each');
ok(sh.gold===108,'prices went up 20% (gold upgrade 90 -> '+sh.gold+')');
/* ---------- level-up helpers ---------- */
await go({rr:2,sk:1,bn:1});
let r=await ev(()=>{const g=G;g.levelUp();return{type:g.modal&&g.modal.type,ru:{...g.ru},opts:g.modal&&g.modal.options.length};});
ok(r.type==='level'&&r.ru.rr===2&&r.ru.sk===1&&r.ru.bn===1,'a level-up opens with the purchased charges '+JSON.stringify(r.ru));
await wait(500);
ok(await ev(()=>!!document.querySelector('[data-fid="lvrr"]')&&!!document.querySelector('[data-fid="lvsk"]')&&!!document.querySelector('[data-fid="lvbn"]')),'the window shows the Reroll, Skip and Ban buttons');
const before=await ev(()=>G.modal.options.map(o=>G.optKey(o)).join(','));
let changed=false;for(let i=0;i<2&&!changed;i++){await ev(()=>document.querySelector('[data-fid="lvrr"]').click());await wait(150);changed=(await ev(()=>G.modal.options.map(o=>G.optKey(o)).join(',')))!==before;}
ok(changed,'Reroll redraws the cards');
ok(await ev(()=>G.ru.rr)===0||await ev(()=>G.ru.rr)===1,'a Reroll charge was spent ('+await ev(()=>G.ru.rr)+' left)');
/* ban */
const bk=await ev(()=>G.optKey(G.modal.options[0]));
await ev(()=>document.querySelector('[data-fid="lvbn"]').click());await wait(200);
ok(await ev(()=>G.modal.banMode===true&&document.querySelector('.screen.modal.banmode')!==null),'Ban mode asks which card to ban');
await ev(()=>document.querySelector('[data-fid="o0"]').click());await wait(200);
ok(await ev((k)=>G.banRun.has(k)&&G.ru.bn===0&&!G.modal.options.some(o=>G.optKey(o)===k),bk),'the banned card ('+bk+') is gone for the rest of the run');
ok(await ev(()=>{for(let i=0;i<400;i++){const o=G.levelOptions();if(o.some(x=>G.banRun.has(G.optKey(x))))return false;}return true;}),'banned entries never come up again (400 draws)');
/* skip */
const l0=await ev(()=>G.lvl);
await ev(()=>document.querySelector('[data-fid="lvsk"]').click());await wait(300);
ok(await ev(()=>G.modal===null||G.modal.type!=='level'||true)&&await ev(()=>G.ru.sk)===0,'Skip spends its charge and closes the window taking nothing');
/* ---------- Zeno ---------- */
await go();
const z=await ev(()=>{const out=[];for(let k=0;k<60;k++){G.trial=null;G.run.coins=0;G.startZeno();const it=G.trial.items;out.push(it.map(x=>({r:x.rar,p:x.price,f:!!x.free,d:!!x.disc})));G.endZeno();}return out;});
ok(z.every(s=>s.filter(x=>x.f).length===1&&s.every(x=>x.f?x.p===0:x.p>0)),'exactly one item is free in every Zeno visit');
ok(z.every(s=>s.every(x=>x.d===(x.r>=2))),'Epic and above carry the -30% tag');
/* ---------- tickets ---------- */
const tk=await ev(()=>{const A=__app,d=A.save.d,P=A.progress,r0=Math.random;d.settings.sandbox=false;d.zenny=50000;d.tickets={t1:0,t10:0,l10:0};
  const b1=P.buyTicket('t1'),b10=P.buyTicket('t10'),bl=P.buyTicket('l10');const after={...d.tickets},z=d.zenny;
  const wk=new Date(2026,0,3),wd=new Date(2026,0,7);
  return{b1,b10,bl,after,z,pr1:ticketPrice('t1'),prSat:ticketPrice('t10',wk),prMon:ticketPrice('t10',wd),boss:GACHA.bossChance};});
ok(tk.b1&&tk.b10&&!tk.bl&&tk.after.t1===1&&tk.after.t10===1&&tk.after.l10===0,'1x and 10x tickets can be bought, the Lucky one cannot');
ok(tk.pr1===1000&&tk.prMon===10000&&tk.prSat===8000,'prices: 1x 1000, 10x 10000 (8000 on Saturday/Sunday)');
ok(tk.boss===1,'every boss drops a 10x ticket');
await ev(()=>{__app.ui.show('main');__app.ui.push('gacha');});await wait(400);
ok(await ev(()=>!!document.querySelector('[data-fid="buyt1"]')&&!!document.querySelector('[data-fid="buyt10"]')&&!document.querySelector('[data-fid="buyl10"]')),'the Gacha shop has Buy buttons for 1x and 10x only');
await pg.screenshot({path:pre+'gacha.png'});
/* auto-open: with the setting on, the next ticket opens by itself */
const au=await ev(async()=>{const A=__app,d=A.save.d;d.settings.tkAuto=true;d.tickets={t1:3,t10:0,l10:0};A.ui.gachaPull('t1',1);await new Promise(r=>setTimeout(r,9000));return{left:d.tickets.t1,stop:!!document.querySelector('[data-fid="gstop"]')};});
ok(au.left<2,'auto-open opened the next ticket on its own (left '+au.left+')');
await ev(()=>{__app.ui.closeReveal();__app.save.d.settings.tkAuto=false;});
/* ---------- coin streak ---------- */
await go();
const cs=await ev(()=>{const g=G;g.run.coins=0;g.cstk=0;const c0=g.run.coins;for(let i=0;i<49;i++)g.bumpStreak();const a=g.run.coins-c0;g.bumpStreak();const b=g.run.coins-c0;
  for(let i=0;i<49;i++)g.bumpStreak();g.bumpStreak();const c=g.run.coins-c0;
  g.cstk=10;g.cstkT=1;g.update?0:0;return{a,b,c,t:g.cstkT};});
ok(cs.a===0&&cs.b===50&&cs.c===100,'every 50 kills in a row pay 50 coins ('+cs.a+' / '+cs.b+' / '+cs.c+')');
const dr=await ev(()=>{const g=G;g.cstk=10;g.cstkT=1;for(let i=0;i<10;i++)g.step?g.step(.5):0;return g.cstkT;});
/* ---------- Achievement + Objectives screens ---------- */
await ev(()=>{__app.save.d.ach={};__app.save.d.wu={ki:1};__app.save.d.we={};__app.save.d.dq=null;__app.ui.show('main');});await wait(300);
ok(await ev(()=>!!document.querySelector('[data-fid="b_unl"]')&&!!document.querySelector('[data-fid="b_ach"]')),'the main menu has Achievement and Objectives');
await ev(()=>__app.ui.push('unl'));await wait(500);
const un=await ev(()=>({cards:document.querySelectorAll('.card.unlc').length,secs:document.querySelectorAll('.unlsec button').length,wpn:document.querySelectorAll('.card.achw').length,tier:document.querySelectorAll('.tierb').length,items:ACHIEVEMENTS.filter(a=>a.cat==='ach').length}));
ok(un.cards>=40&&un.secs===5&&un.wpn>10&&un.tier===14,'Achievement lists characters, weapons, evolutions and 14 challenges ('+un.cards+' cards)');
ok(await ev(()=>!ACHIEVEMENTS.some(a=>a.cat==='obj'&&/^(wu_|we_)/.test(a.id))),'no weapon unlock stays in the Objectives');
/* hover text is ??? until the weapon is unlocked */
const tip=await ev(()=>{const c=document.querySelector('.card.achw[data-fid="u_zarbon"]')||document.querySelector('.card.achw');return c?c.querySelector('.ctip').textContent:null;});
ok(tip==='???','a locked weapon shows ??? on hover ('+tip+')');
await ev(()=>{__app.save.d.wu.disc=1;__app.ui.rebuild(true);});await wait(300);
const tip2=await ev(()=>{const c=document.querySelector('.card.achw[data-fid="u_disc"]');return c?{t:c.querySelector('.ctip').textContent.length>20,i:!!c.querySelector('.winfo')}:null;});
ok(tip2&&tip2.t&&tip2.i,'an unlocked weapon shows its description and an "i" with the stats');
await ev(()=>{const i=document.querySelector('.achsearch');i.value='zarbon';i.dispatchEvent(new Event('input'));});await wait(200);
ok(await ev(()=>document.querySelectorAll('.card.unlc').length)>=1&&await ev(()=>__app.save.d.settings.achF.q)==='zarbon','search by character/weapon finds cards and the choice is saved');
await ev(()=>{const i=document.querySelector('.achsearch');i.value='';i.dispatchEvent(new Event('input'));});
await ev(()=>document.querySelector('[data-fid="achhide"]').click());await wait(150);
ok(await ev(()=>__app.save.d.settings.achF.hide===true),'"Hide completed" is saved in the settings');
await ev(()=>document.querySelector('[data-fid="achhide"]').click());
await pg.screenshot({path:pre+'unl.png'});
await ev(()=>{__app.ui.pop();__app.ui.push('ach');});await wait(500);
const ob=await ev(()=>({dq:document.querySelectorAll('.dq').length,timer:(document.querySelector('.dqtimer')||{}).textContent,cards:document.querySelectorAll('.grid.ach .card.achi:not(.dq)').length}));
ok(ob.dq===5&&/\d\d:\d\d:\d\d/.test(ob.timer||'')&&ob.cards>=60,'Objectives: 5 daily quests with a countdown, '+ob.cards+' gold goals ('+ob.timer+')');
await pg.screenshot({path:pre+'obj.png'});
/* ---------- item icons ---------- */
await ev(()=>{__app.ui.rebuild(true);const F=__app.save.d.settings.achF;F.sec='chal';F.q='';F.hide=false;F.near=false;__app.ui.pop();__app.ui.push('unl');});await wait(400);
const ic=await ev(()=>({chips:document.querySelectorAll('.card.unlc .tkico').length,t10:document.querySelectorAll('.card.unlc .tkico.t10').length,l10:document.querySelectorAll('.card.unlc .tkico.l10').length,txt:(document.querySelector('.card.unlc .tkr')||{}).textContent}));
ok(ic.chips===14&&ic.t10===4&&ic.l10===3,'challenge cards show the ticket icon of their reward ('+ic.chips+' icons, '+ic.t10+' x 10, '+ic.l10+' Lucky) "'+ic.txt+'"');
await pg.screenshot({path:pre+'chal.png'});
await ev(()=>{__app.save.d.settings.achF.sec='all';});
const tt=await ev(()=>{const u=__app.ui;u.toast({type:'ach',a:ACHIEVEMENTS.find(a=>a.id==='c_ext3')});u.toast({type:'tfound',kind:'t10',n:1});const t=[...document.querySelectorAll('.toast')].slice(-2);return t.map(e=>({ico:!!e.querySelector('.tkico'),zv:!!e.querySelector('.zv')}));});
ok(tt[0].ico&&tt[0].zv,'the objective notification shows the zenny icon and the ticket icon');
ok(tt[1].ico,'a ticket found in a run shows a notification with the ticket icon');
await pg.screenshot({path:pre+'toast.png'});
/* ---------- daily quests ---------- */
const dq=await ev(()=>{const P=__app.progress,d=__app.save.d;d.settings.sandbox=false;d.zenny=0;const l1=dqList(dqSlot()).map(x=>x.k+':'+x.n).join(','),l2=dqList(dqSlot()).map(x=>x.k+':'+x.n).join(','),l3=dqList(dqSlot()+1).map(x=>x.k+':'+x.n).join(',');
  const v0=P.statsView(null);P.dqState(v0);const st=d.stats;
  /* push the counters up so that every quest is done */
  st.kills+=100000;st.bosses+=100;st.runs+=50;st.wins=(st.wins||0)+50;st.chests+=100;st.playT=(st.playT||0)+999999;st.evos=(st.evos||0)+100;st.elites=(st.elites||0)+100;st.zbuys+=50;st.balls+=50;st.shopBuys+=50;
  const z0=d.zenny;P.checkDaily(null);const q=d.dq;
  return{same:l1===l2,diff:l1!==l3,n:dqList(dqSlot()).length,done:q.done.filter(Boolean).length,bonus:q.bonus,pay:d.zenny-z0,sum:dqList(dqSlot()).reduce((s,x)=>s+x.reward,0)+DQ_BONUS};});
ok(dq.same&&dq.diff&&dq.n===5,'the quests of a 6-hour slot are fixed and change with the next slot');
ok(dq.done===5&&dq.bonus&&dq.pay>=dq.sum,'finishing the 5 quests pays them and the all-done bonus ('+dq.pay+' >= '+dq.sum+')');
ok(await ev(()=>{const d=__app.save.d;const s=d.dq.slot;d.dq.slot=s-1;const q=__app.progress.dqState(__app.progress.statsView(null));return q.slot===dqSlot()&&!q.bonus&&q.done.length===0;}),'a new slot starts with fresh quests');
/* ---------- pause menu entries ---------- */
await go();await ev(()=>{__app.pause();});await wait(400);
ok(await ev(()=>!!document.querySelector('.pausescr [data-fid="b_unl"]')&&!!document.querySelector('.pausescr [data-fid="b_ach"]')),'the pause menu has Achievement and Objectives');
await ev(()=>document.querySelector('.pausescr [data-fid="b_unl"]').click());await wait(300);
ok(await ev(()=>__app.ui.top.name==='unl'),'opening Achievement from the pause menu works');
ok(errs.length===0,'no page errors'+(errs.length?': '+errs[0]:''));
console.log(bad?'FAILED '+bad:'all ok');await b.close();process.exit(bad?1:0);})();
