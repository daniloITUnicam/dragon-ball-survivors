const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const id=process.argv[2]||'vegeta',idxs=(process.argv[3]||'-1,0,1,6,7').split(',').map(Number);
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:520,height:380,deviceScaleFactor:2}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
await pg.evaluate((id)=>{window.__MAPSEED=0;__app.startGame({stage:0,char:id,diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.god=true;window.G=g;g.en=[];g.setLevel(140);let n=0;while(g.formsUnlocked<g.formMax&&n<3000){g.update(1/30);if(g.modal)g.modal=null;n++;}g.xform=null;},id);
let k=0;for(const i of idxs){await pg.evaluate((i)=>{const g=G;g.xform=null;g.formIdx=i;g.recalc();g.en=[];g.modal=null;for(let k=0;k<20;k++)g.update(1/60);},i);await wait(200);await pg.screenshot({path:'/tmp/form_'+id+'_'+(k++)+'.png',clip:{x:180,y:120,width:160,height:140}});}
console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
