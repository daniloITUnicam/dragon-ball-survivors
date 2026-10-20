/* v52 interface: settings gear, character search + sorting, Quick Start, unlock toast retreat, modal animations. Screenshots: node tests/ui52.js [prefix] */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const pre=process.argv[2]||'/tmp/u52_';
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:760}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
let bad=0;const ok=(c,m)=>{console.log((c?'  ok  ':'FAIL  ')+m);if(!c)bad++;};
const ev=(f,...a)=>pg.evaluate(f,...a);
/* main menu */
await ev(()=>{__app.ui.show('main');});await wait(400);
ok(await ev(()=>!!document.querySelector('.menu .quickbtn')),'the main menu has Quick Start');
await pg.screenshot({path:pre+'main.png'});
/* stages: gear */
await ev(()=>{__app.ui.push('stages');});await wait(500);
ok(await ev(()=>!!document.querySelector('.hdr .gear')),'the stage screen has the settings gear');
await ev(()=>document.querySelector('.hdr .gear').click());await wait(300);
ok(await ev(()=>__app.ui.top.name==='settings'),'the gear opens the settings');
await ev(()=>__app.ui.pop());await wait(300);
/* characters: gear, toolbar, search, sort */
await ev(()=>{__app.ui.push('chars');});await wait(600);
ok(await ev(()=>!!document.querySelector('.hdr .gear')),'the character screen has the settings gear');
const n0=await ev(()=>document.querySelectorAll('.grid.chars .char').length);
ok(n0===await ev(()=>CHARS.length),'all characters are listed ('+n0+')');
await ev(()=>{const i=document.querySelector('.chsearch');i.value='saiyan';i.dispatchEvent(new Event('input'));});await wait(200);
const n1=await ev(()=>document.querySelectorAll('.grid.chars .char').length);
ok(n1>3&&n1<n0,'search by race: "saiyan" -> '+n1+' characters');
await ev(()=>{const i=document.querySelector('.chsearch');i.value='zarbon';i.dispatchEvent(new Event('input'));});await wait(150);
ok(await ev(()=>document.querySelectorAll('.grid.chars .char').length)===1,'search by name finds one character');
await ev(()=>{const i=document.querySelector('.chsearch');i.value='disc';i.dispatchEvent(new Event('input'));});await wait(150);
ok(await ev(()=>document.querySelectorAll('.grid.chars .char').length)>=1,'search by starting weapon ("disco")');
await ev(()=>{const i=document.querySelector('.chsearch');i.value='zzzzzz';i.dispatchEvent(new Event('input'));});await wait(150);
ok(await ev(()=>document.querySelectorAll('.grid.chars .char').length)===0,'a search with no result shows an empty grid');
await ev(()=>{const i=document.querySelector('.chsearch');i.value='';i.dispatchEvent(new Event('input'));});await wait(150);
const names=async(s)=>{await ev((s)=>{const e=document.querySelector('select.chsort');e.value=s;e.dispatchEvent(new Event('change'));},s);await wait(200);return await ev(()=>[...document.querySelectorAll('.grid.chars .char')].map(e=>e.dataset.fid.slice(1)));};
const byName=await names('name');
const tr=id=>ev((id)=>__app.ui.tr(CHARS.find(c=>c.id===id).n),id);
ok(byName.length===n0,'sort by name keeps everyone');
const f0=await tr(byName[0]),f1=await tr(byName[1]);
ok(f0.localeCompare(f1,'it')<=0,'sorted by name: '+f0+' <= '+f1);
const byHp=await names('hp');const hps=await ev((ids)=>ids.map(id=>CHARS.find(c=>c.id===id).hp),byHp);
ok(hps.every((v,i)=>i===0||hps[i-1]>=v),'sorted by health, highest first');
const byUni=await names('universe');const unis=await ev((ids)=>ids.map(id=>chMeta(id).uni[0]),byUni);
ok(unis.every((v,i)=>i===0||unis[i-1]<=v)&&unis[unis.length-1]===99,'sorted by universe (alternate timeline last)');
await ev(()=>document.querySelector('.chdir').click());await wait(200);
const rev=await ev(()=>[...document.querySelectorAll('.grid.chars .char')].map(e=>e.dataset.fid.slice(1)));
ok(rev[0]===byUni[byUni.length-1],'the direction button reverses the list');
ok(await ev(()=>__app.save.d.settings.charSort==='universe'&&__app.save.d.settings.charDesc===true),'the sorting choice is saved');
await ev(()=>{const e=document.querySelector('select.chsort');e.value='default';e.dispatchEvent(new Event('change'));document.querySelector('.chdir').click();});await wait(300);
await pg.screenshot({path:pre+'chars.png'});
ok(await ev(()=>CHARS.every(c=>CHAR_META[c.id])),'every character has race / universe / series data');
/* quick start from the character screen */
await ev(()=>document.querySelector('[data-fid="cquick"]').click());await wait(700);
ok(await ev(()=>__app.ui.top.name==='quick'),'Quick Start opens');
ok(await ev(()=>!!document.querySelector('.qsscr .tslot')&&!!document.querySelector('.qsscr canvas.stprev')&&!!document.querySelector('.qsgoal')),'it shows the character with the trinket slot, the stage and the missing unlock');
await pg.screenshot({path:pre+'quick.png'});
const t0=await ev(()=>document.querySelector('.qsgoal .cn').textContent);
if(await ev(()=>!!document.querySelector('[data-fid="qsnext"]'))){await ev(()=>document.querySelector('[data-fid="qsnext"]').click());await wait(300);ok(await ev((t0)=>document.querySelector('.qsgoal .cn').textContent!==t0,t0),'"Another suggestion" shows a different target');}
await ev(()=>{__app.ui.pop();__app.ui.pop();__app.ui.pop();});
await ev(()=>__app.ui.quickStart());await wait(500);
ok(await ev(()=>__app.ui.top.name==='quick'),'Quick Start from the main menu');
/* start it */
await ev(()=>document.querySelector('[data-fid="qsgo"]').click());await wait(800);
ok(await ev(()=>!!__app.game&&__app.game.stage!==undefined),'Quick Start launches the run');
/* toast retreat */
await ev(()=>{__app.ui.toast({type:'unlock',c:CHARS[5]});});await wait(300);
ok(await ev(()=>!!document.querySelector('.toast.unlock')),'the unlock notification appears');
await wait(3700);
ok(await ev(()=>{const t=document.querySelector('.toast.unlock');return !!t&&t.classList.contains('retire');}),'after a pause it starts retreating upward');
await wait(1500);
const mid=await ev(()=>{const t=document.querySelector('.toast.unlock');if(!t)return null;const o=+getComputedStyle(t).opacity;return o;});
ok(mid!==null&&mid>0&&mid<.95,'it is still there while fading ('+(mid&&mid.toFixed(2))+')');
await wait(2400);
ok(await ev(()=>!document.querySelector('.toast.unlock')),'and it is gone after about 3 seconds of retreat');
console.log(errs.length?errs.slice(0,3):'no page errors');await b.close();process.exit(bad||errs.length?1:0);})();
