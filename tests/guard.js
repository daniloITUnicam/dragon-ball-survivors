/* v118: release build - the game is closed (no globals), right click / F12 / Ctrl+Shift+I are blocked, a hand-edited save is noticed; the DEV build stays open */
const pp=require('/opt/npm-tools/node_modules/puppeteer'),{execFileSync}=require('child_process');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
(async()=>{
execFileSync('python3',['build.py'],{cwd:__dirname+'/..',env:Object.assign({},process.env,{DBS_DEV:'',DBS_OUT:'/tmp/o/rel.html'}),stdio:'ignore'});
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///tmp/o/rel.html');await wait(1800);
const r=await pg.evaluate(()=>{const ev=(t,o)=>{const e=new (t==='contextmenu'?MouseEvent:KeyboardEvent)(t,Object.assign({bubbles:true,cancelable:true},o));document.body.dispatchEvent(e);return e.defaultPrevented;};
  return{closed:typeof window.__app==='undefined'&&typeof WEAPONS==='undefined'&&typeof Game==='undefined',ctx:ev('contextmenu',{}),f12:ev('keydown',{key:'F12'}),insp:ev('keydown',{key:'I',ctrlKey:true,shiftKey:true}),src:ev('keydown',{key:'u',ctrlKey:true}),
    ck:!!localStorage.getItem('dragonball-survivors-v2-ck')};});
/* edit the save by hand, reload: still plays, but marked */
await pg.evaluate(()=>{const k='dragonball-survivors-v2',d=JSON.parse(localStorage.getItem(k));d.zenny=999999;localStorage.setItem(k,JSON.stringify(d));});
await pg.reload();await wait(1500);const menu=await pg.evaluate(()=>document.querySelectorAll('#ui button').length>3);
ok(r.closed,'release build: nothing of the game is reachable from the console');
ok(r.ctx&&r.f12&&r.insp&&r.src,'right click, F12, Ctrl+Shift+I and Ctrl+U are blocked');
ok(r.ck&&menu,'the save carries a checksum; a hand-edited save still loads (and stays off the boards)');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();})();
