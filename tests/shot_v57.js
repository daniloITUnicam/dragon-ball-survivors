/* v57: screenshot of the Master copying a Kamehameha (beam sprite in the weapon colour) */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:760}});
const pg=await b.newPage();await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1500);
await pg.evaluate(()=>{const A=__app,d=A.save.d;d.settings.sandbox=false;A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;window.G=g;g.sb.nospawn=true;g.sb.god=true;
  g.p.hp=g.p.maxHp=1e6;g.weapons.clear();g.addWeapon('kame');g.startTrial();const e=g.trial.boss;g.en=[e];e.x=g.p.x+300;e.y=g.p.y;e.sh=99;e.stun=0;g.eb=[];g.bz=[];g.jbeams=[];
  const rn=Math.random;Math.random=()=>.9;g.sparCopy(e,50,Math.PI);Math.random=rn;g.weapons.clear();g.sparCopy=()=>false;});
await wait(1050);await pg.screenshot({path:'/tmp/o/v57_mimic_beam2.png'});
await b.close();})();
