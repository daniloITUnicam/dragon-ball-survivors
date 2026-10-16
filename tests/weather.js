const pp=require('/opt/npm-tools/node_modules/puppeteer');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1100,height:700});const errs=[];pg.on('pageerror',e=>errs.push('PE '+e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(800);
const shot=process.argv[2]==='shot';
// every weather-capable theme must produce its kinds somewhere in 40 minutes and a night/day cycle
const cov=await pg.evaluate(()=>{const out={};for(const th of ['plains','namek','waste','other','beach','redrock','arena','sky','hell','void']){
  window.__app.startGame({stage:STAGES.findIndex(s=>s.theme===th),char:'goku',diff:'normal',x2:false,sandbox:true,pet:'dende'});
  const A=Ambient;A.setCfg({ambient:true,weather:true,dayNight:true,dnDay:60,dnLen:300});A.cfg=AMB[th];const kinds={};let nmin=1,nmax=0;
  for(let t=0;t<2400;t+=2){A.state(th,t,0);if(A.evI>.9)kinds[A.evK]=(kinds[A.evK]||0)+1;nmin=Math.min(nmin,A.nt);nmax=Math.max(nmax,A.nt);}
  out[th]={kinds:Object.keys(kinds).join('/'),night:[+nmin.toFixed(2),+nmax.toFixed(2)]};}return out;});
console.log(JSON.stringify(cov));
const cases=[['plains','rain',0],['plains','fog',0],['plains','storm',0],['namek','storm',0],['beach','storm',0],['redrock','sand',0],['arena','wind',0],['arena','storm',0],['plains',null,1],['namek',null,1],['beach',null,1],['arena',null,1]];
let n=0;
for(const [th,kind,night] of cases){
  const r=await pg.evaluate(({th,kind,night})=>{
    const st=window.__app.save.d.settings;st.dayNight=!!night;st.dnDay=night?0:100;st.weather=!!kind;
    window.__app.startGame({stage:STAGES.findIndex(s=>s.theme===th),char:'goku',diff:'normal',x2:false,sandbox:true,pet:'dende'});
    const g=window.__app.game;g.sb.god=true;g.sb.nospawn=true;g.p.x=1500;g.p.y=900;
    let T=null;if(kind){const A=Ambient;for(let t=0;t<4000;t++){A.setCfg({ambient:true,weather:true,dayNight:false});A.cfg=AMB[th];A.state(th,t,0);if(A.evK===kind&&A.evI>.95){T=t;break;}}A.cfg=null;g.t=T===null?0:T;}
    return{T};},{th,kind,night});
  await wait(1400);
  const ev=await pg.evaluate(()=>({k:Ambient.evK,i:+Ambient.evI.toFixed(2),nt:+Ambient.nt.toFixed(2)}));
  console.log(th,kind||'-',night?'night':'day',JSON.stringify(r),JSON.stringify(ev));
  if(shot)await pg.screenshot({path:'/tmp/o/wx_'+(n++)+'_'+th+'_'+(kind||'clear')+(night?'_night':'')+'.png'});
}
console.log(errs.join('\n')||'noerr');await b.close();})();
