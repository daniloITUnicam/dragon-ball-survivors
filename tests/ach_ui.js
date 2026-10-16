/* achievements screen (search / hide completed / closest-first / progress bars), main menu without grimoire+glossary, WIP badge, chars header buttons */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:760}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const ev=f=>pg.evaluate(f);
/* main menu */
await ev(()=>{__app.ui.show('main');});await wait(600);
const m=await ev(()=>{const el=__app.ui.top.el,t=el.innerText;return{grim:/grimorio|grimoire/i.test(t),gloss:/glossario|glossary/i.test(t),wip:!!el.querySelector('.wip img'),wipOk:(()=>{const i=el.querySelector('.wip img');return !!i&&i.naturalWidth>50;})()}});
ok(!m.grim&&!m.gloss,'main menu no longer shows Grimoire / Glossary');
ok(m.wip&&m.wipOk,'main menu has the W.I.P. badge (image loaded)');
await pg.screenshot({path:'/tmp/menu_wip.png'});
/* the badge moves */
const xs=[],ys=[];for(let i=0;i<8;i++){const r=await ev(()=>{const e=document.querySelector('.wipin');const q=e.getBoundingClientRect();return[q.left,q.top];});xs.push(r[0]);ys.push(r[1]);await wait(450);}
const rg=a=>Math.max(...a)-Math.min(...a);
ok(rg(xs)>30&&rg(ys)>8,'the W.I.P. badge bounces back and forth ('+Math.round(rg(xs))+' px horizontally, '+Math.round(rg(ys))+' px vertically)');
/* chars header */
await ev(()=>{__app.ui.push('chars');});await wait(600);
const c=await ev(()=>{const el=__app.ui.top.el;const r=[...el.querySelectorAll('.hdr button')].map(x=>x.textContent.trim());return r;});
ok(c.some(x=>/📚/.test(x))&&c.some(x=>/📖|grim/i.test(x)),'character select has Glossary + Grimoire buttons in the header ('+c.join(' | ')+')');
await pg.screenshot({path:'/tmp/chars_hdr.png'});
/* achievements */
await ev(()=>{__app.ui.show('main');__app.ui.push('ach');});await wait(600);
const a0=await ev(()=>{const el=__app.ui.top.el;return{n:el.querySelectorAll('.card.achi').length,bars:el.querySelectorAll('.achbar').length,search:!!el.querySelector('.achsearch'),txt:el.querySelector('.achshown').textContent};});
ok(a0.n>=100&&a0.bars===a0.n&&a0.search,'achievements: '+a0.n+' cards, each with a progress bar, search box present ('+a0.txt+')');
/* progress bar reflects real progress: fake 250 kills in the save -> "Cacciatore" 1000 shows 25% */
await ev(()=>{__app.save.d.stats.kills=250;__app.ui.rebuild(true);});await wait(300);
const p1=await ev(()=>{const cards=[...__app.ui.top.el.querySelectorAll('.card.achi')];const c=cards.find(x=>/Cacciatore|Hunter/.test(x.querySelector('.cn').textContent)&&!/boss/i.test(x.querySelector('.cn').textContent));return c?{w:c.querySelector('.achbar i').style.width,t:c.querySelector('.achprog').textContent}:null;});
ok(p1&&p1.w==='25%','progress bar: 250/1000 kills -> '+(p1&&p1.w)+' ('+(p1&&p1.t)+')');
/* search */
await ev(()=>{const i=document.querySelector('.achsearch');i.value='shenron';i.dispatchEvent(new Event('input',{bubbles:true}));});await wait(200);
const s1=await ev(()=>[...document.querySelectorAll('.card.achi .cn')].map(e=>e.textContent));
ok(s1.length>=1&&s1.length<10,'search "shenron" filters the list ('+s1.length+': '+s1.slice(0,3).join(', ')+')');
await ev(()=>{const i=document.querySelector('.achsearch');i.value='';i.dispatchEvent(new Event('input',{bubbles:true}));});await wait(150);
/* hide completed */
await ev(()=>{const d=__app.save.d;d.ach.k100=Date.now();d.ach.b1=Date.now();__app.ui.rebuild(true);});await wait(300);
const h0=await ev(()=>document.querySelectorAll('.card.achi').length);
await ev(()=>document.querySelector('[data-fid="achhide"]').click());await wait(200);
const h1=await ev(()=>({n:document.querySelectorAll('.card.achi').length,done:document.querySelectorAll('.card.achi.done').length}));
ok(h1.done===0&&h1.n===h0-2,'hide completed removes the 2 obtained ('+h0+' -> '+h1.n+')');
/* closest first: with 250/1000 kills (25%) the first incomplete card must be the highest ratio */
await ev(()=>document.querySelector('[data-fid="achnear"]').click());await wait(200);
const n1=await ev(()=>[...document.querySelectorAll('.card.achi')].slice(0,3).map(c=>{const w=parseFloat(c.querySelector('.achbar i').style.width);return w;}));
ok(n1.length===3&&n1[0]>=n1[1]&&n1[1]>=n1[2],'closest-first sorting is non-increasing ('+n1.join('%, ')+'%)');
await pg.screenshot({path:'/tmp/ach.png'});
/* reward sanity */
const rw=await ev(()=>{const m={};for(const a of ACHIEVEMENTS)m[a.id]=a.reward;return m;});
ok(rw.k1k===200&&rw.k10k===500&&rw.l10===50&&rw.l25===100&&rw.l50===500&&rw.l70===800&&rw.wish===500&&rw.st1===1000,'rewards raised as requested (cacciatore 200, sterminatore 500, lv10 50, lv25 100, leggenda 500, lv70 800, shenron 500, stage 1000)');
/* old save (no new stat fields) must not break statsView */
const old=await ev(()=>{const s=__app.save.d.stats;delete s.rec;delete s.zeno;delete s.zbuys;delete s.extremeClears;try{const v=__app.progress.statsView(null);return !!v.rec&&v.zeno===0;}catch(e){return String(e);}});
ok(old===true,'old saves without the new stat fields still work ('+old+')');
console.log(errs.length?errs.slice(0,4):'no errors');await b.close();process.exit(errs.length||process.exitCode?1:0);})();
