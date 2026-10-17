/* transformation lines: Kaioken and Ultra Instinct are Goku's; Vegeta Saiyan Pride -> SSJ... -> Ultra Ego; other Saiyans Saiyan Fury -> ... -> Blue; no Instinct anywhere else; achievements; every form can be played and drawn */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:900,height:520}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const r=await pg.evaluate(async()=>{const o=[],bad=[];const ok=(c,m)=>{(c?o:bad).push((c?'PASS ':'FAIL ')+m);};
 const names=l=>LINES[l].map(f=>f.n.en);
 const g0=names('saiyan');
 ok(g0.length===8&&g0[0]==='Kaioken'&&/Sign/.test(g0[6])&&/Mastered/.test(g0[7]),'Goku keeps the canonical line: '+g0.join(' > '));
 const ve=names('vegeta');
 ok(ve.length===8&&ve[0]==='Saiyan Pride'&&ve[1]==='Super Saiyan'&&ve[5]==='Super Saiyan Blue'&&/Ultra Ego/.test(ve[6])&&ve[7]==='Ultra Ego'&&!ve.some(n=>/Kaioken|Instinct/.test(n)),'Vegeta: '+ve.join(' > '));
 const s2=names('saiyan2');
 ok(s2.length===6&&s2[0]==='Saiyan Fury'&&s2[5]==='Super Saiyan Blue'&&!s2.some(n=>/Kaioken|Instinct|Ego/.test(n)),'other Saiyans: '+s2.join(' > '));
 ok(ve.slice(1,6).join()===g0.slice(1,6).join()&&s2.slice(1).join()===g0.slice(1,6).join(),'Super Saiyan -> Blue are the same steps as before');
 const bad1=Object.keys(LINES).filter(k=>k!=='saiyan'&&LINES[k].some(f=>/Instinct|Istinto/.test(f.n.en+f.n.it)));
 ok(!bad1.length,'no other line has an Instinct form'+(bad1.length?' ('+bad1.join()+')':''));
 const kk=Object.keys(LINES).filter(k=>k!=='saiyan'&&LINES[k].some(f=>/Kaioken/.test(f.n.en)));
 ok(!kk.length,'no other line has a Kaioken form'+(kk.length?' ('+kk.join()+')':''));
 ok(names('kai').join()==='King Kai Training,Gravity x10,Gravity x100,Heavenly Master','King Kai: '+names('kai').join(' > '));
 const sa=CHARS.filter(c=>c.line==='saiyan').map(c=>c.id);ok(sa.join()==='goku','only Goku has the Kaioken/Ultra Instinct line ('+sa.join()+')');
 ok(CHARS.find(c=>c.id==='vegeta').line==='vegeta'&&['trunks','gohan','goten','gotenks','vegito','raditz','nappa','bardock','kefla','gogeta','saiyaman'].every(id=>CHARS.find(c=>c.id===id).line==='saiyan2'),'Vegeta has his own line, the other Saiyans share saiyan2');
 /* achievements: the Instinct ones need Goku */
 const f7=ACHIEVEMENTS.find(a=>a.id==='f7'),f8=ACHIEVEMENTS.find(a=>a.id==='f8'),f1=ACHIEVEMENTS.find(a=>a.id==='f1');
 ok(f7.test({run:{ui:7,form:7},rec:{}})&&!f7.test({run:{ui:0,form:7},rec:{ui:0}})&&f8.test({run:{ui:8},rec:{}})&&!f8.test({run:{ui:0,form:8},rec:{}}),'Sign of Instinct / Perfected need Goku');
 ok(f1.test({run:{form:1},rec:{}})&&/transformation/.test(f1.d.en),'Inner Fire: first transformation of anyone ("'+f1.d.en+'")');
 /* every character: play through the whole line and draw each form */
 const out=[];
 for(const id of['goku','vegeta','trunks','gohan','piccolo','krillin','c18','beerus','kingkai','broly']){
  const C=CHARS.find(c=>c.id===id);if(!C)continue;
  __app.startGame({stage:0,char:id,diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.god=true;window.G=g;g.en=[];
  g.setLevel(140);let n=0;while(g.formsUnlocked<g.formMax&&n<3000){g.update(1/30);if(g.modal)g.modal=null;n++;}
  const lines=LINES[C.line],last=lines[g.formMax-1].n.en;
  ok(g.formsUnlocked===g.formMax,id+': reaches the last form ('+last+', '+g.formMax+' steps)');
  for(let i=-1;i<g.formMax;i++){g.xform=null;g.formIdx=i;g.recalc();for(let k=0;k<3;k++)g.update(1/60);}
 }
 return {o,bad};});
await wait(400);
console.log(r.o.join('\n'));console.log(r.bad.join('\n')||'ALL PASS');console.log(errs.length?errs.slice(0,3):'no errors');await b.close();})();
