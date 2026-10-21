/* Rocks of Namek (atlas rocks) and Inferno (atlas lavarocks): sprites from the atlas, standing on the ground (never in the water, base on the anchor point), animated ones loop,
   no painted rock is left on those two planets and no other planet uses the atlases.
   Optional: HTML=/path/to/built.html */
const pp=require('/opt/npm-tools/node_modules/puppeteer'),path=require('path');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const HTML=process.env.HTML||path.join(__dirname,'..','dist','dragon-ball-survivors.html');
(async()=>{
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:900,height:560}});
  const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+HTML);await wait(1800);
  const r=await pg.evaluate(()=>{
    const o={};
    for(const [th,id] of [['namek','rocks'],['hell','lavarocks']]){
      const S=Sprites.sheets[id];o[th]={loaded:!!(S&&S.rects&&S.kinds),n:S&&S.rects&&S.rects.length,kinds:S&&S.kinds&&Object.keys(S.kinds),anim:S&&S.anim?Object.keys(S.anim).length:0};
      /* every rock of the atlas: base measured, lowest opaque row on the anchor, frames of one animation share the base */
      const bad=[];if(S&&S.rects)for(let i=0;i<S.rects.length;i++){
        const im=Sprites.rockImg(id,i);if(!im){bad.push(i+':none');continue;}
        const w=im.c.width,h=im.c.height,d=im.c.getContext('2d').getImageData(0,0,w,h).data;
        let yb=-1;for(let y=h-1;y>=0&&yb<0;y--)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>40){yb=y;break;}
        if(yb<0||yb!==im.oy)bad.push(i+':base '+yb+' vs '+im.oy);
        if(!(im.ox>0&&im.ox<w&&im.bw>=3))bad.push(i+':ox/bw '+im.ox+'/'+im.bw);
        if(h-1-yb>2)bad.push(i+':transparent rows under the base '+(h-1-yb));
      }
      o[th].bad=bad;
      /* placement: every rock cell is on dry land, with a sprite number of the right kind; the cache does not hold stale nulls */
      World.cache.clear();const cells=[];let wet=0,withV=0,withoutV=0,badV=0;
      for(const c of World.visible(th,-6000,-6000,6000,6000)){
        const def=OBSTACLES[th][c.t];
        if(def.rk){withV++;if(c.v===undefined||!S.kinds[def.rk].includes(c.v))badV++;
          const R=S.rects[c.v],wd=R[2]*c.s;for(const k of[-.4,0,.4])if(Sea.wet(th,c.x+k*wd,c.y)>-.05)wet++;}
        else{withoutV++;if(c.v!==undefined)badV++;}
      }
      o[th].cells={withV,withoutV,badV,wet};
      /* no painted art for the rock definitions; no rock-kind left among the painted ones */
      o[th].defs=OBSTACLES[th].map(d=>d.rk||'-').join(',');
    }
    /* other planets: never use the atlases */
    const others={};for(const th of Object.keys(OBSTACLES)){if(th==='namek'||th==='hell')continue;others[th]=OBSTACLES[th].filter(d=>d.rk).length;}
    o.others=others;
    /* animation: the frames cycle, the base never moves, ping-pong goes back and forth */
    const L=Sprites.sheets.lavarocks,seq=(v,n)=>{const a=[];for(let k=0;k<n;k++){const f=Sprites.rockFrame('lavarocks',v,k/L.fps+.001,0);a.push(f.c);}return a;};
    const an={};for(const k of Object.keys(L.anim)){const v=+k,s=seq(v,12),base=Sprites.rockImg('lavarocks',v),uniq=new Set(s).size;
      const same=s.every((c,i)=>{const f=Sprites.rockFrame('lavarocks',v,i/L.fps+.001,0);return f.ox===base.ox&&f.oy===base.oy&&f.c.width===base.c.width&&f.c.height===base.c.height;});
      an[k]={uniq,same,pp:(L.pp||[]).includes(v),idx:s.map(c=>[...new Set(s)].indexOf(c)).join('')};}
    o.anim=an;
    o.noOld=typeof MA.lavarock==='undefined'&&typeof ROCK_TINT==='undefined'&&typeof World.rockOn==='undefined';
    o.namekStatic=Sprites.sheets.rocks.anim===null;
    return o;});
  for(const th of['namek','hell']){const t=r[th];
    ok(t.loaded&&t.n>=20,th+': atlas loaded ('+t.n+' sprites, kinds '+(t.kinds||[]).join('/')+')');
    ok(t.bad.length===0,th+': every sprite stands on its anchor (lowest opaque row = anchor, base measured) '+t.bad.slice(0,4).join(' | '));
    ok(t.cells.withV>30&&t.cells.badV===0,th+': rocks placed from the atlas ('+t.cells.withV+' in the area, '+t.cells.badV+' wrong)');
    ok(t.cells.wet===0,th+': no rock has any part of its base in the water');
    ok(/mix/.test(t.defs),th+': obstacle definitions use rock kinds ('+t.defs+')');}
  ok(r.hell.anim>=7,'Inferno: '+r.hell.anim+' animated rocks');
  ok(r.namekStatic,'Namek rocks are static');
  for(const [k,a] of Object.entries(r.anim))ok(a.uniq>=2&&a.same,'rock '+k+': '+a.uniq+' frames loop on the same base'+(a.pp?' (ping-pong '+a.idx+')':''));
  ok(r.noOld,'no painted rock left (MA.lavarock, ROCK_TINT, World.rockOn removed)');
  ok(Object.values(r.others).every(n=>n===0),'other planets do not use the rock atlases');
  /* in play: both planets render with rocks on screen (glow + embers on Inferno), no JS errors */
  for(const th of['namek','hell']){
    const n=await pg.evaluate((th)=>{const idx=STAGES.findIndex(s=>s.theme===th);window.__MAPSEED=0;__app.startGame({stage:idx,char:'goku',diff:'normal',x2:false,sandbox:true});const g=__app.game;g.sb.god=true;g.en=[];
      let best=null,bn=-1;for(let x=-1500;x<=1500;x+=250)for(let y=-1500;y<=1500;y+=250){let n=0;for(const o of World.visible(th,x-300,y-200,x+300,y+200))if(o.v!==undefined)n++;if(n>bn){bn=n;best=[x,y];}}
      g.p.x=best[0];g.p.y=best[1];for(let i=0;i<120;i++){g.en=[];g.update(1/60);}return bn;},th);
    await wait(500);
    ok(n>=2,th+': rocks on screen while playing ('+n+')');
  }
  ok(errs.length===0,'no JS errors '+errs.slice(0,2).join(' | '));
  await b.close();console.log(fails?'FAILED '+fails:'ALL OK');process.exit(fails?1:0);
})().catch(e=>{console.log('ERR',e);process.exit(2)});
