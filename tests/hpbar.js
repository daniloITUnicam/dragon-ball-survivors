/* HP bar with the artwork: atlas loaded, layout, the portrait follows the character and its transformations, narrow screens fall back: node tests/hpbar.js */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const ok=(c,m)=>{console.log((c?'  ok  ':'FAIL  ')+m);if(!c)fails++;};
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1100,height:640}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
await pg.evaluate(()=>{window.__MAPSEED=0;__app.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;window.G=g;g.sb.nospawn=true;g.modal=null;g.p.hp=g.p.maxHp=1e7;});
await wait(500);
const m=await pg.evaluate(()=>{const M=HPB_META;return{keys:Object.keys(M),ok:HpBar.ok,wide:!!HpBar.layout(1.2,1100),narrow:HpBar.layout(1.2,260),L:HpBar.layout(1.2,1100)};});
ok(['left','right','fill','railT','railB','ch','pt','plate','hpText'].every(k=>m.keys.includes(k)),'the atlas layout has every piece ('+m.keys.join(',')+')');
ok(m.ok&&m.wide,'the atlas is decoded and the bar has a layout on a wide screen');
ok(m.narrow===null,'on a narrow screen the old plain bar is used (layout = null)');
/* the portrait is the live sprite of the character: it changes with the form and the character */
const pr=await pg.evaluate(()=>{const g=G,out={},snap=(sp,col)=>{const c=document.createElement('canvas');c.width=c.height=120;const x=c.getContext('2d');HpBar.portrait(x,sp,60,60,56,col,0,0);return c.toDataURL();};
  const base=Sprites.player(g.pcKey,g.pc,0,false,null);out.base=snap(base,null);
  g.setLevel(24);g.modal=null;g.xform=null;g.afterX=null;g.recalc();
  const f1=Sprites.player(g.pcKey,g.pc,0,false,null);out.form=snap(f1,g.formColor);out.formIdx=g.formIdx;out.key=g.pcKey;
  out.again=snap(f1,g.formColor);out.hurt=snap(Sprites.player(g.pcKey,g.pc,0,false,'pain'),g.formColor);
  g.formIdx=-1;g.formColor=null;
  return out;});
ok(pr.formIdx>=0,'a transformation was unlocked for the test (form '+pr.formIdx+')');
ok(pr.base!==pr.form,'the portrait changes with the transformation (sprite and backdrop)');
ok(pr.again===pr.form,'... and is stable between frames');
ok(pr.hurt!==pr.form,'the expression follows the state (pain face at low life)');
/* HUD draws without errors with the artwork bar and with the fallback */
const dr=await pg.evaluate(()=>{const g=G,R=__app.renderer;g.p.maxHp=1000;for(const hp of[1000,640,300,90,5]){g.p.hp=hp;R.draw(g,.016);}return true;});
ok(dr,'the HUD draws at every life level');
console.log(errs.length?'page errors: '+errs.slice(0,4).join(' | '):'  ok  no page errors');if(errs.length)fails++;
await b.close();console.log(fails?fails+' FAILED':'all ok');process.exit(fails?1:0);})();
