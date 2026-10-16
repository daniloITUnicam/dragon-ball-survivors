const pp=require('/opt/npm-tools/node_modules/puppeteer');
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await new Promise(r=>setTimeout(r,1500));
const r=await pg.evaluate(()=>{const o=[];const seen={};
for(const st of STAGES){let ex=0,rg=0;for(const [id] of st.roster){const d=ENEMIES[id];if(!d){o.push('missing '+id);continue;}
 if(seen[id]&&seen[id]!==st.id)o.push('dup '+id+' in '+seen[id]+' & '+st.id);seen[id]=st.id;
 if(!ENEMY_DESC[id])o.push('nodesc '+id);
 if(d.ai==='explode')ex++;if(d.ai==='ranged'||d.ai==='hover')rg++;}
 if(!ex)o.push('no explode in '+st.id);if(!rg)o.push('no ranged in '+st.id);}
return o;});
console.log(r.length?r.join('\n'):'roster OK',errs.length?errs:'');await b.close();process.exit(r.length||errs.length?1:0);})();
