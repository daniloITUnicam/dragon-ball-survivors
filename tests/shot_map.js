/* screenshot of a map: node tests/shot_map.js <theme> [out] [W] [H] [px] [py] */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const th=process.argv[2]||'beach',out=process.argv[3]||'/tmp/map_'+th+'.png',W=+process.argv[4]||1024,H=+process.argv[5]||576,px=process.argv[6],py=process.argv[7];
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:W,height:H}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
await pg.evaluate((th,px,py)=>{const idx=STAGES.findIndex(s=>s.theme===th);__app.startGame({stage:idx,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.god=true;window.G=g;g.en=[];
 if(px==='water'){let best=null;for(let r=300;r<9000&&!best;r+=150)for(let a=0;a<64;a++){const x=Math.cos(a/64*6.283)*r,y=Math.sin(a/64*6.283)*r;if(Sea.wet(th,x,y)>.07&&Sea.wet(th,x+120,y)<.02||Sea.wet(th,x,y)>.07&&Sea.wet(th,x-120,y)<.02){best={x,y};break;}}if(best){g.p.x=best.x;g.p.y=best.y;}window.__best=best;}
 else if(px!==undefined&&px!==null){g.p.x=+px;g.p.y=+py;}
 for(let i=0;i<120;i++){g.en=[];g.update(1/60);}},th,px,py);
await wait(300);
await pg.screenshot({path:out});
console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
