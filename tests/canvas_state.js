/* an exception in the middle of a 'lighter' block must not leave the canvas additive (white screen) */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:900,height:560}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const r=await pg.evaluate(()=>{const c=__app.renderer.ctx;let o=[];
 c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.3;c.arc(10,10,-5,0,6);o.push('negative arc ok');c.ellipse(5,5,-3,-2,0,0,6);o.push('negative ellipse ok');
 const g=c.createRadialGradient(0,0,-4,0,0,10);o.push('negative gradient ok');
 __app.renderer.resetCtx();o.push('after reset: '+c.globalCompositeOperation+' '+c.globalAlpha);return o;});
console.log(r.join('\n'));
// force a failing frame while the state is dirty and check the next frame draws normally
await pg.evaluate(()=>{__app.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true});});await wait(500);
await pg.evaluate(()=>{const c=__app.renderer.ctx;const orig=__app.renderer.drawLoot;let n=0;__app.renderer.drawLoot=function(...a){if(n++<1){c.save();c.globalCompositeOperation='lighter';throw new Error('boom');}return orig.apply(this,a);};});
await wait(600);
const st=await pg.evaluate(()=>{const c=__app.renderer.ctx;return c.globalCompositeOperation+' '+c.globalAlpha;});console.log('state after bad frame:',st);
console.log(errs.length?errs:'no page errors');await b.close();process.exit(/source-over 1/.test(st)&&!errs.length?0:1);})();
