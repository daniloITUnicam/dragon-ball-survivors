/* Goku grid sheets: animated charge / dash poses for the 9 forms + emote portraits in the character-select screen.
   node tests/goku_grid.js   (HTML=<build>, SHOTS=<dir>) */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=process.env.SHOTS||'/tmp/o';let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  const pg=await b.newPage();await pg.setViewport({width:1100,height:760});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(2000);
  const ev=(f,...a)=>pg.evaluate(f,...a);
  const ids=['goku','goku_0','goku_1','goku_2','goku_3','goku_4','goku_5','goku_6','goku_7'];
  ok(await ev(ids=>ids.every(i=>{const S=Sprites.sheets[i];return S&&S.pw&&S.pw.length===4&&S.dh&&S.dh.length===4&&S.pw.concat(S.dh).every(f=>f<S.cols)&&S.has.indexOf(7)>=0&&S.has.indexOf(8)>=0;}),ids),'9 Goku sheets with 4 charge + 4 dash frames');
  ok(await ev(ids=>ids.every((i,n)=>{const S=Sprites.sheets['emogoku'+(n?'_'+(n-1):'')];return S&&S.cols===4;}),ids),'9 emote sheets of 4 portraits');
  ok(await ev(()=>Sprites.poseFrame('goku:-1','pw',0)===7&&Sprites.poseFrame('goku:-1','pw',.99)===12&&Sprites.poseFrame('goku:-1','dh',.5)===14&&Sprites.poseFrame('vegeta:-1','pw',.5)===7),'poseFrame maps progress to the animation frames, others keep 7/8');
  // character-select portrait
  await ev(()=>{const u=__app.ui;u.show('main');u.push('chars');});await wait(500);
  ok(await ev(()=>!!document.querySelector('.emoframe canvas')),'portrait canvas in the character select (goku)');
  const sigs=new Set();
  for(let i=0;i<5;i++){await wait(1150);sigs.add(await ev(()=>{const c=document.querySelector('.emoframe canvas');return c.toDataURL().length+':'+c.toDataURL().slice(-60);}));}
  ok(sigs.size>=3,'portrait cycles the emotes ('+sigs.size+' different)');
  await pg.screenshot({path:OUT+'/goku_menu.png'});
  await ev(()=>{__app.save.d.maxForm=__app.save.d.maxForm||{};__app.save.d.maxForm.goku=8;__app.ui.show('main');__app.ui.push('chars');});
  for(let i=0;i<4;i++){await wait(3300);await pg.screenshot({path:OUT+'/goku_menu_f'+i+'.png',clip:{x:640,y:80,width:460,height:330}});}
  ok(await ev(()=>{__app.sel&&0;__app.ui.sel.char='vegeta';__app.ui.rebuild(true);return !document.querySelector('.emoframe');}),'no portrait for characters without emote sheets');
  // charge + dash in game for every form
  for(let f=-1;f<8;f++){
    await ev(f=>{__app.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.god=true;g.formsUnlocked=f+1;g.formIdx=f;g.recalc&&g.recalc();},f);await wait(700);
    const key=await ev(()=>__app.game.pcKey);
    // dash
    await ev(()=>{const g=__app.game;g.bv={x:1,y:0};g.dashT=.2;g.dashCd=3;});
    const dsh=await ev(()=>{const g=__app.game,s=new Set();for(let k=.26;k>0;k-=.02)s.add(Sprites.poseFrame(g.pcKey,'dh',1-k/.26));return [...s].join(',');});
    await pg.screenshot({path:OUT+'/goku_dash'+(f+1)+'.png',clip:{x:400,y:230,width:300,height:300}});
    // charge
    await ev(f=>{const g=__app.game;g.dashT=0;g.prevPc=g.pc;g.prevKey=g.pcKey;g.xform={t:1.4,dur:4.2,rel:1.7,col:'#ffd23f',idx:Math.max(0,f),released:false,old:{pc:g.pc,key:g.pcKey}};},f);await wait(120);
    await pg.screenshot({path:OUT+'/goku_charge'+(f+1)+'.png',clip:{x:400,y:230,width:300,height:300}});
    ok(dsh.split(',').length>=3,'form '+f+' ('+key+'): dash animation frames '+dsh);
  }
  ok(errs.length===0,'no JS errors '+errs.join('|'));
  console.log(fails?'FAILED '+fails:'ALL OK');await b.close();process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
