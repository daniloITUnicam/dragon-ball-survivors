/* screenshot of the end-of-stage screen at the size of the mock-up (1024x572), with unlock notices: node tests/shot_end.js [out.png] [W] [H] */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const out=process.argv[2]||'/tmp/end_cmp.png',W=+process.argv[3]||1024,H=+process.argv[4]||572;
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:W,height:H,deviceScaleFactor:+process.env.DSF||1}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
await pg.evaluate(()=>{const A=__app,d=A.save.d;d.settings.sandbox=false;
  A.startGame({stage:5,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;window.G=g;g.sb.nospawn=true;g.modal=null;g.t=300;g.kills=240;
  g.dmgBy={kame:123456,ki:45000,disc:9800,other:3300};g.run.tk={t1:2,t10:1,l10:0};g.run.tsold=3;g.finish(true);
  const ui=A.ui;ui.toast({type:'weapon',id:'kame'});ui.toast({type:'unlock',c:CHARS.find(c=>c.id==='trunks')});ui.toast({type:'unlock',c:CHARS.find(c=>c.id==='caulifla')||CHARS[5]});
  ACHIEVEMENTS.slice(0,4).forEach(a=>ui.toast({type:'ach',a}));});
await wait(900);if(process.argv[5]==='notoast')await pg.evaluate(()=>{document.getElementById('toasts').style.display='none';});
const clip=process.argv[6]?JSON.parse(process.argv[6]):null;await pg.screenshot(Object.assign({path:out},clip?{clip}:{}));console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
