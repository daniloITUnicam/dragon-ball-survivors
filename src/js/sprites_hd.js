'use strict';
/* ====== HD sprite pipeline for enemies / bosses / pets ======
   - every sprite is painted on a finer pixel grid (6-10 px per art unit, picked from its on-screen size)
   - post pass: coloured (not flat black) outline, top-left rim light, bottom-right core shadow, soft gradient
   - the creature painters below are written on a half-unit grid and carry far more detail than the old blocky ones */
Sprites.hdS=u=>u>=2.4?10:u>=1.8?8:6;
Sprites.hd={};
/* Pre-build the sprites a stage will need, one per frame, so a new enemy / boss never causes a hitch when it first appears */
Sprites.warm=function(defs){
  const q=Sprites._wq||(Sprites._wq=[]);
  for(const sp of defs){if(!sp)continue;for(let f=0;f<7;f++)q.push([sp,f,false]);for(let f=1;f<=4;f++)q.push([sp,f,true]);}
};
/* v121: the warming runs in the browser's idle time between frames (several sprites when there is room, none while frames are busy);
   the per-frame step stays as the fallback where idle callbacks do not exist */
Sprites.warmStep=function(){const q=Sprites._wq;if(!q||!q.length)return;
  if(typeof requestIdleCallback==='function'){if(!Sprites._wi){Sprites._wi=1;requestIdleCallback(Sprites.warmIdle,{timeout:500});}return;}
  const w=q.shift();Sprites.forSp(w[0],w[1],w[2]);};
Sprites.warmIdle=function(dl){const q=Sprites._wq;Sprites._wi=0;
  if(dl.didTimeout&&q&&q.length){const w=q.shift();Sprites.forSp(w[0],w[1],w[2]);}   /* a busy page: one at a time still */
  while(q&&q.length&&dl.timeRemaining()>3){const w=q.shift();Sprites.forSp(w[0],w[1],w[2]);}
  if(q&&q.length){Sprites._wi=1;requestIdleCallback(Sprites.warmIdle,{timeout:500});}};

Sprites.paintHD=function(W,H,ox,oy,draw,S){
  const pad=Math.max(2,Math.round(S*.42)),w=W*S,h=H*S;
  const mk=(a,b)=>{const c=document.createElement('canvas');c.width=a;c.height=b;return c;};
  const c=mk(w,h),g=c.getContext('2d');
  const R=(ax,ay,aw,ah,col)=>{g.fillStyle=col;g.fillRect(Math.round((ax+ox)*S),Math.round((ay+oy)*S),Math.max(1,Math.round(aw*S)),Math.max(1,Math.round(ah*S)));};
  draw(R,g);
  /* rim light (top-left edge) and core shadow (bottom-right edge) derived from the silhouette */
  const d=Math.max(1,Math.round(S*.32));
  const edge=(dx,dy,col,a)=>{
    const t=mk(w,h),tg=t.getContext('2d');tg.drawImage(c,0,0);
    tg.globalCompositeOperation='destination-out';tg.drawImage(c,dx,dy);
    tg.globalCompositeOperation='source-in';tg.fillStyle=col;tg.fillRect(0,0,w,h);
    g.save();g.globalCompositeOperation='source-atop';g.globalAlpha=a;g.drawImage(t,0,0);g.restore();
  };
  edge(d,d,'#fff8e8',.34);edge(-d,-d,'#0a0c24',.36);
  const o=mk(w+pad*2,h+pad*2),og=o.getContext('2d');
  /* outline = a darkened copy of the sprite itself, so it keeps a hint of its own hue */
  const dk=mk(w,h),dg=dk.getContext('2d');dg.drawImage(c,0,0);dg.globalCompositeOperation='source-atop';dg.fillStyle='rgba(6,8,22,.84)';dg.fillRect(0,0,w,h);
  for(let r=1;r<=pad;r++)for(let i=0;i<12;i++){const a=i/12*Math.PI*2;og.drawImage(dk,pad+Math.round(Math.cos(a)*r),pad+Math.round(Math.sin(a)*r));}
  og.drawImage(c,pad,pad);
  og.globalCompositeOperation='source-atop';
  const gr=og.createLinearGradient(0,0,o.width*.8,o.height);
  gr.addColorStop(0,'rgba(255,255,255,.13)');gr.addColorStop(.5,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(0,0,40,.24)');
  og.fillStyle=gr;og.fillRect(0,0,o.width,o.height);
  return{c:o,ox:ox*S+pad,oy:oy*S+pad,s:S};
};

/* ---- painter helpers (art units, any fraction) ---- */
const SX=shadeHex;
const hdHash=(a,b)=>{let x=Math.sin(a*127.1+b*311.7)*43758.5453;return x-Math.floor(x);};
/* filled ellipse built from horizontal slivers */
const ell=(R,cx,cy,rx,ry,col,st)=>{st=st||.5;for(let y=-ry;y<ry-.001;y+=st){const m=y+st/2,hw=rx*Math.sqrt(Math.max(0,1-m*m/(ry*ry)));if(hw>.04)R(cx-hw,cy+y,hw*2,st,col);}};
/* cel-shaded ball: core shadow, body, light patch, specular dot */
const ball=(R,cx,cy,rx,ry,col,o)=>{o=o||{};
  ell(R,cx+rx*.04,cy+ry*.06,rx,ry,o.dk||SX(col,-.32));
  ell(R,cx-rx*.05,cy-ry*.06,rx*.92,ry*.9,col);
  ell(R,cx-rx*.28,cy-ry*.32,rx*.5,ry*.4,o.lt||SX(col,.26));
  if(o.spec!==false)ell(R,cx-rx*.38,cy-ry*.46,rx*.17,ry*.13,SX(col,.72));};
/* thick line from (x0,y0) to (x1,y1) */
const ln=(R,x0,y0,x1,y1,w,col)=>{const n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)/(w*.45)));for(let i=0;i<=n;i++){const t=i/n;R(x0+(x1-x0)*t-w/2,y0+(y1-y0)*t-w/2,w,w,col);}};
/* tapered limb: width goes from w0 to w1 */
const taper=(R,x0,y0,x1,y1,w0,w1,col)=>{const n=Math.max(2,Math.ceil(Math.hypot(x1-x0,y1-y0)*2.2));for(let i=0;i<=n;i++){const t=i/n,w=w0+(w1-w0)*t;R(x0+(x1-x0)*t-w/2,y0+(y1-y0)*t-w/2,w,w,col);}};
/* eye with iris / pupil / two glints */
const eye=(R,x,y,w,h,iris,white,pup)=>{R(x,y,w,h,white||'#fff');R(x+w*.18,y+h*.12,w*.64,h*.8,iris);R(x+w*.34,y+h*.28,w*.32,h*.5,pup||'#12101a');R(x+w*.2,y+h*.14,w*.26,h*.26,'#fff');R(x+w*.62,y+h*.58,w*.14,h*.16,'#ffffffb0');R(x,y,w,h*.16,SX(white||'#fff',-.5));};

/* ===== Saibaman / kamikaze / android bomber ===== */
Sprites.hd.saiba=(R,pal,f,robot)=>{
  const[c1,c2,dk,ac]=pal,ps=Sprites.pose(f),lx=ps.atk===2?2:ps.atk===1?-1:0,by=ps.bob,hx=lx*.7;
  const hi=SX(c1,.3),lo=SX(c1,-.28),bone=robot?'#3a3a4c':'#e6ead4';
  /* legs + feet */
  for(let s=0;s<2;s++){const x=s?1.4:-5.4,l=s?ps.r:ps.l;
    R(x,-7-l,4,7+l,c2);R(x,-7-l,1.2,7+l,SX(c2,.22));R(x+3,-7-l,1,7+l,SX(c2,-.28));R(x+.3,-4.6-l,3.4,.6,SX(c2,-.34));
    R(x-.8,-1.8-l,5.6,1.8,bone);R(x-.8,-1.8-l,5.6,.5,SX(bone,.3));
    if(!robot){R(x+1.2,-1.4-l,.4,1.4,SX(bone,-.35));R(x+3,-1.4-l,.4,1.4,SX(bone,-.35));}else{R(x+.2,-1-l,3.6,.5,'#1a1a28');}}
  /* body */
  ball(R,lx*.4,-11.2,5.6,5.2,c1);
  if(robot){
    R(-5+lx*.4,-14,10,1.4,c2);R(-5+lx*.4,-14,10,.5,SX(c2,.4));R(-.4+lx*.4,-14,.8,6.4,SX(c1,-.35));
    for(const sx of[-4.2,3.4])R(sx+lx*.4,-12.6,.9,.9,SX(c1,.5));
    R(-4.2+lx*.4,-9.2,8.4,2.4,dk);R(-4.2+lx*.4,-9.2,8.4,.5,'#4a4a5c');
  }
  R(-4.6+lx*.4,-13.2,9.2,5.4,'#26262e');R(-4.6+lx*.4,-13.2,9.2,1,'#4c4c58');R(-4.6+lx*.4,-13.2,1.2,5.4,'#36363f');
  ell(R,lx*.4,-10.7,1.9,1.9,SX(ac,-.35));ell(R,lx*.4,-10.7,1.5,1.5,ac);R(-.8+lx*.4,-11.4,.9,.9,'#fff');
  R(-3.8+lx*.4,-8.2,.9,.9,ac);R(2.9+lx*.4,-8.2,.9,.9,ac);
  /* arms + claws */
  const ar=ps.atk===2?3.4:0;
  const arm=(sg,col,sw,ext)=>{const x0=sg<0?-6.6:5.6,y0=-13.4;
    R(x0+lx*.6,y0-sw,1.9,4.6,col);R(x0+lx*.6,y0-sw,.6,4.6,SX(col,.25));
    const hxp=x0+sg*(1.8+ext)+lx,hyp=y0+4.2-sw;
    R(Math.min(x0+lx*.6,hxp),hyp-1.3,Math.abs(hxp-(x0+lx*.6))+2,1.9,col);
    for(let k=-1;k<=1;k++)R(hxp+(sg>0?1.6:-.4)+(sg>0?k*0:k*0),hyp-1.8+k*1.1,1.9,.7,'#fff');};
  arm(-1,c1,ps.sw,0);arm(1,c2,-ps.sw,ar);
  /* head */
  const hy=-20.6+by;
  if(robot){
    R(-6.2+hx,hy-5,12.4,10.4,c1);R(-6.2+hx,hy-5,12.4,1.6,SX(c1,.3));R(4.4+hx,hy-5,1.8,10.4,c2);R(-6.2+hx,hy-5,1,10.4,SX(c1,.22));
    R(-5+hx,hy-1.2,10,4.2,dk);R(-4.6+hx,hy-.8,9.2,3.2,SX(ac,-.45));R(-4.4+hx,hy-.6,8.8,2.8,ac);R(-4.4+hx,hy-.6,8.8,.8,SX(ac,.5));
    R(-.2+hx+(f%2?1.2:-1.2),hy-.6,.9,2.8,'#fff');
    R(-.5+hx,hy-9,1,4.2,'#8a94aa');ell(R,hx,hy-9.6,1.2,1.2,ac);
    R(-7+hx,hy-1,1.2,3.4,c2);R(5.8+hx,hy-1,1.2,3.4,c2);R(-3.6+hx,hy+3,7.2,1.6,c2);
    for(let i=0;i<4;i++)R(-3+i*1.7+hx,hy+3.2,.5,1.2,'#1a1a28');
    R(-5.4+hx,hy-3.8,.8,.8,SX(c1,.5));R(4.6+hx,hy-3.8,.8,.8,SX(c1,.5));
  }else{
    /* crown ridge + pointed ears */
    R(-1.2+hx,hy-8.6,2.4,3.4,c2);R(-.6+hx,hy-9.6,1.2,1.4,c2);R(-3.6+hx,hy-7,2,2.4,c2);R(1.6+hx,hy-7,2,2.4,c2);
    ball(R,hx,hy,6.4,5.8,c1);
    R(-10.2+hx,hy-1.4,4,2.2,c1);R(-11.6+hx,hy-2,2,1.2,c1);R(-10.2+hx,hy-1.4,4,.6,hi);
    R(6.2+hx,hy-1.4,4,2.2,c2);R(9.8+hx,hy-2,2,1.2,c2);
    /* brow ridges + eyes */
    R(-5.4+hx,hy-3.6,4.6,.9,c2);R(.8+hx,hy-3.6,4.6,.9,c2);
    for(const ex of[-4.8,.9]){R(ex+hx,hy-2.6,3.9,4.4,dk);R(ex+.5+hx,hy-2.2,2.9,3.4,SX(ac,-.55));R(ex+hx+(ex<0?.9:.5),hy-2,1.8,2.8,'#10080a');R(ex+.7+hx,hy-2.2,1.1,1.1,'#fff');R(ex+2.4+hx,hy-.4,.6,.6,'#ffffffa0');}
    R(-.6+hx,hy+.2,.6,.7,lo);R(.5+hx,hy+.2,.6,.7,lo);
    /* toothy grin */
    const m=ps.atk===2?2.8:2;R(-3.8+hx,hy+2.2,7.6,m,dk);
    for(let i=0;i<5;i++)R(-3.4+i*1.5+hx,hy+2.2,.8,1.1,'#fff');for(let i=0;i<4;i++)R(-2.6+i*1.5+hx,hy+2.2+m-.9,.7,.9,'#e8e8e0');
    /* acid-spot freckles */
    R(-5+hx,hy+.4,.9,.9,lo);R(-4.2+hx,hy+1.6,.7,.7,lo);R(4.3+hx,hy+.6,.9,.9,lo);R(3.6+hx,hy+1.8,.7,.7,lo);R(-.6+hx,hy-4.6,1.1,1.1,lo);
  }
};

/* ===== Cell Jr. ===== */
Sprites.hd.celljr=(R,f)=>{
  const g1='#4e8f3d',g2='#2d6a28',g3='#9fd478',bk='#15171c',ps=Sprites.pose(f),lx=ps.atk===2?2:0,by=ps.bob;
  /* legs */
  for(let s=0;s<2;s++){const x=s?.8:-4.4,l=s?ps.r:ps.l;
    R(x,-6-l,3.6,6+l,g2);R(x,-6-l,1,6+l,SX(g2,.25));R(x+.2,-3.6-l,3.2,.5,SX(g2,-.3));
    R(x-.6,-1.4-l,4.8,1.4,bk);R(x-.6,-1.4-l,4.8,.4,'#34363e');}
  /* wing nubs */
  R(-8+lx*.3,-19,2,5,g2);R(-9.4+lx*.3,-21,1.6,3.4,g2);R(6+lx*.3,-19,2,5,g2);R(7.8+lx*.3,-21,1.6,3.4,g2);
  /* arms + claws */
  R(-9.4+lx*.4,-16-ps.sw,2.6,7,g1);R(-9.4+lx*.4,-16-ps.sw,.8,7,g3);R(-9.6+lx*.4,-9.6-ps.sw,3,1.6,bk);
  R(6.8+lx,-16+ps.sw,2.6,7,g1);R(8.6+lx+(ps.atk===2?3:0),-10.6+ps.sw,1.4,2.6,bk);R(6.6+lx,-9.6+ps.sw,3,1.6,bk);
  /* torso */
  ball(R,lx*.3,-13,5.8,5.8,g1);
  R(-3.4+lx*.3,-17,6.8,.8,g2);R(-.3+lx*.3,-17,.6,8,g2);
  const sp=(x,y,r)=>{ell(R,x+lx*.3,y,r,r*.9,bk);R(x-r*.3+lx*.3,y-r*.5,r*.7,r*.3,'#3a3d46');};
  sp(-3.4,-13,1.1);sp(3,-11,1.2);sp(-1,-9.4,.9);sp(1.4,-15.4,.8);sp(-3,-9,.7);
  R(-2.6+lx*.3,-9.6,5.2,.8,SX(g1,-.3));
  /* head: dome + black face plate */
  const hy=-24.4+by,hx=lx*.6;
  ball(R,hx,hy,5.8,5.4,g1);
  R(-4.6+hx,hy-5.4,9.2,3.2,bk);R(-3+hx,hy-6.6,6,1.6,bk);R(-5.2+hx,hy-3.2,10.4,1,bk);
  R(-3.6+hx,hy-6,2.2,.6,'#3a3d46');
  R(-5.2+hx,hy-5,.9,3.6,bk);R(4.3+hx,hy-5,.9,3.6,bk);
  for(const ex of[-4,.9]){R(ex+hx,hy-2.4,3.1,3,'#fff');R(ex+.5+hx,hy-2,2.1,2.4,'#d2272a');R(ex+1+hx,hy-1.6,1.1,1.6,'#2a0608');R(ex+.5+hx,hy-2,.8,.8,'#fff');}
  R(-3+hx,hy+2.4,6,ps.atk?2.2:1.2,bk);for(let i=0;i<4;i++)R(-2.4+i*1.5+hx,hy+2.4,.6,.9,'#d8e0d0');
  R(-6.4+hx,hy-1,1.4,2.2,g2);R(5+hx,hy-1,1.4,2.2,g2);
  R(-3.4+hx,hy-.2,.7,.7,SX(g1,-.35));R(2.7+hx,hy-.2,.7,.7,SX(g1,-.35));
};

/* ===== Hover drone ===== */
Sprites.hd.drone=(R,f)=>{
  const ps=Sprites.pose(f),b=ps.bob?.8:0,ax=ps.atk===2?1.6:0,met='#a5b0c4';
  /* thruster flames */
  const fl=1+(f%3)*.6;
  for(const x of[-6.6,3.8]){R(x,-6+b,2.8,2,'#4a5268');R(x+.4,-4+b,2,fl+1.2,'#ff9d1c');R(x+.8,-4+b,1.2,fl+.6,'#ffe27a');}
  /* side arms + guns */
  R(-12.6,-12.6+b-ps.sw,4.2,1.6,'#5f6a80');R(-13.6,-13.4+b-ps.sw,1.6,3.2,'#3e4658');R(-13.2,-12.6+b-ps.sw,.8,.8,'#ff9d1c');
  R(8.4,-12.6+b+ps.sw,4.2,1.6,'#5f6a80');R(12,-13.4+b+ps.sw,1.6,3.2,'#3e4658');R(12.4,-12.6+b+ps.sw,.8,.8,'#ff9d1c');
  /* chassis */
  ball(R,0,-12+b,9,6.4,met,{lt:'#dfe6f4',dk:'#566078'});
  R(-9,-11.4+b,18,.6,'#566078');R(-9,-9.2+b,18,.5,'#566078');
  for(const x of[-7.4,6.4]){R(x,-12.4+b,.9,.9,'#e8eef8');}
  R(-3,-4.6+b,6,1.8,'#3e4658');for(let i=0;i<4;i++)R(-2.4+i*1.5,-4.4+b,.7,1.2,'#1c2230');
  /* lens */
  const lc=ps.atk?'#ffffff':'#ff3b3b';
  ell(R,ax,-12.6+b,3.6,3.4,'#2a2e3c');ell(R,ax,-12.6+b,2.8,2.7,SX(lc,-.35));ell(R,ax,-12.6+b,2.1,2,lc);R(-1+ax,-13.8+b,1.2,1.1,'#fff');R(.8+ax,-11.6+b,.7,.7,'#ffffffa0');
  /* dome + antenna */
  ball(R,0,-17.6+b,5,3,'#c9d4e4',{lt:'#f0f4fc'});
  R(-.4,-25+b,.9,5.6,'#97a2b8');ell(R,0,-25.6+b,1.3,1.3,ps.atk?'#fff':'#ff9d1c');R(-.6,-26.2+b,.6,.6,'#fff');
};

/* ===== Jelly ===== */
Sprites.hd.blob=(R,pal,f)=>{
  const[c1,c2,dk]=pal,ps=Sprites.pose(f),sq=ps.bob?1:0,jp=(f===2||f===4)?-1.6:0,at=ps.atk===2?1.8:0;
  const rx=9.2+sq*.9,ry=8.2-sq*.6;
  R(-rx-.2,-2+jp*0,2*rx+.4,2,SX(c2,-.1));            /* squashed base */
  ell(R,0,-1.5+jp,rx+.3,2.2,SX(c2,-.25));
  ball(R,0,-8+jp,rx,ry,c1,{dk:c2,lt:SX(c1,.38)});
  ell(R,2.4,-4.6+jp,rx*.62,ry*.42,SX(c1,-.08));        /* soft belly */
  /* inner bubbles */
  ell(R,-5,-5+jp,.9,.9,SX(c1,.5));ell(R,5.2,-9+jp,.7,.7,SX(c1,.45));ell(R,3.2,-4.4+jp,.6,.6,SX(c1,.5));
  /* big shine */
  ell(R,-3.8,-13.2+jp,2.4,1.2,'#ffffffcc');ell(R,-6.6,-10.6+jp,.7,1.2,'#ffffffcc');
  /* face */
  for(const ex of[-4,1.4]){R(ex+at,-10.4+jp,3.2,3.6,dk);R(ex+.5+at,-10+jp,1.2,1.4,'#fff');R(ex+1.9+at,-8.2+jp,.7,.7,'#ffffffb0');}
  R(-3.2,-12.1+jp,2.4,.6,SX(c2,-.3));R(1.8,-12.1+jp,2.4,.6,SX(c2,-.3));
  R(-1.6+at,-6.2+jp,3.4,ps.atk?2.4:1.2,dk);if(ps.atk)R(-.8+at,-5.8+jp,1.8,.8,'#e88a9a');
  R(-5.8,-7.4+jp,1.6,.9,'#ff6a9a99');R(4.4,-7.4+jp,1.6,.9,'#ff6a9a99');
};

/* ===== Void orb ===== */
Sprites.hd.orb=(R,f)=>{
  const ps=Sprites.pose(f),s=ps.bob?.8:0,gl=ps.atk?2:0,t=f*.9;
  ell(R,0,-14,12.6+gl,2.6,'#2b2166');                          /* halo ring (back) */
  ball(R,0,-14,9+gl,9+gl,'#5848e6',{dk:'#241a70',lt:'#8f80ff'});
  /* swirling bands */
  for(let i=0;i<3;i++){const a=t+i*2.1,x=Math.cos(a)*5.4,y=Math.sin(a)*3.6;R(x-1.6,-14+y-.4,3.2,.8,'#b8aaff');}
  ell(R,-2,-17,3.4,2.3,'#a89aff');ell(R,-3,-18,1.4,.9,'#efeaff');
  /* front half of ring */
  R(-13,-14.8,26,.9,'#8a7aff');R(-12.4,-13.9,24.8,.5,'#4a3ab0');R(-12,-15.4,2,.5,'#d4ccff');
  /* eye */
  ell(R,0,-13.4+s*.3,3.8,2.6,'#f4f0ff');ell(R,0,-13.4+s*.3,2.2,2.2,ps.atk?'#ffffff':'#7a2ae0');ell(R,0,-13.4+s*.3,.8,2.1,'#07030f');R(-1.4,-14.6,.8,.8,'#fff');
  /* crackling sparks */
  const sp=[[-9,-20],[8,-22],[10,-9],[-10,-8]];sp.forEach((q,i)=>{if((f+i)%2===0){R(q[0],q[1],.8,.8,'#d8d0ff');R(q[0]-.6,q[1]+.8,.5,.5,'#8a7aff');}});
};

/* ===== Wraith ===== */
Sprites.hd.ghost=(R,f)=>{
  const w='#ece6ff',w2='#cdc0f0',w3='#9b8ad0',dk='#241545',ps=Sprites.pose(f),sw=ps.atk===2?3:0,by=ps.bob,ph=f*.8;
  /* tattered tail */
  for(let x=-6.5;x<6.5;x+=.5){const ed=Math.abs(x)/6.5,bot=-1.5+Math.sin(x*1.1+ph)*1.4+Math.sin(x*2.7)*.6+(ed>.7?-3*(ed-.7):0);
    R(x,-17,.5,16+bot+1,x>3?w3:x<-3?w:w2);R(x,-6,.5,5+bot+1,x>2.5?SX(w3,-.1):SX(w2,.05));}
  R(-7,-19+by,14,5,w);
  /* hood */
  ball(R,0,-21.6+by,6.2,5.8,w,{dk:w3,lt:'#ffffff'});
  ell(R,0,-21.2+by,4.2,4,dk);ell(R,0,-20.4+by,3.4,3.4,'#3a2468');
  for(const ex of[-2.6,.8])R(ex,-22.4+by,1.8,1.9,'#e6faff');R(-2.2,-22+by,1,1,'#9ae8ff');R(1.2,-22+by,1,1,'#9ae8ff');
  R(-1.6,-18.6+by,3.2,ps.atk?1.8:.9,'#150a30');
  /* arms with bony hands */
  R(-10.4+sw*.6,-17+ps.sw,3.4,6.4,w2);R(-10.4+sw*.6,-17+ps.sw,1,6.4,w);R(-11+sw*.6,-11.2+ps.sw,4,1.2,w3);
  for(let i=0;i<3;i++)R(-11+sw*.6+i*1.3,-10+ps.sw,.7,1.8,'#f4f0ff');
  R(7+sw,-17-ps.sw,3.4,6.4+sw*.4,w2);R(9.4+sw,-17-ps.sw,1,6.4,w3);R(7+sw,-11.2-ps.sw+sw*.4,4,1.2,w3);
  for(let i=0;i<3;i++)R(7.4+sw+i*1.3,-10-ps.sw+sw*.4,.7,1.8,'#f4f0ff');
  /* cloak trim */
  R(-6.4,-15.2,12.8,.7,w3);R(-.2,-15,.5,6,w3);
};

/* bevelled armour / stone plate */
const plate=(R,x,y,w,h,col,riv)=>{
  R(x,y,w,h,col);R(x,y,w,.7,SX(col,.32));R(x,y,.7,h,SX(col,.18));R(x,y+h-.7,w,.7,SX(col,-.32));R(x+w-.7,y,.7,h,SX(col,-.26));
  if(riv){const r=SX(col,.5),d=SX(col,-.45);R(x+1.1,y+1.1,.7,.7,r);R(x+w-1.8,y+1.1,.7,.7,r);R(x+1.1,y+h-1.8,.7,.7,d);R(x+w-1.8,y+h-1.8,.7,.7,d);}
};

/* ===== Armoured golem / colossus ===== */
Sprites.hd.golem=(R,pal,f)=>{
  const[a,b,eyc]=pal||['#7a8290','#5a6270','#ffb13b'],ps=Sprites.pose(f),lx=ps.atk===2?3:0,by=ps.bob;
  const crack=SX(b,-.4);
  /* legs */
  for(let s=0;s<2;s++){const x=s?1.4:-9.6,l=s?ps.r:ps.l;
    plate(R,x,-14-l,8.4,8,a,true);plate(R,x+.5,-7.4-l,7.4,5.6,b);plate(R,x-.8,-2.4-l,10,2.4,SX(b,-.12));
    R(x+2,-11-l,.6,3,crack);R(x+5.4,-4.6-l,.6,2,crack);}
  /* belt + torso */
  plate(R,-10+lx*.3,-16,20,3.6,b,true);R(-1+lx*.3,-16,2,3.6,eyc);R(-.6+lx*.3,-15.6,1.2,2.8,SX(eyc,.5));
  plate(R,-11+lx*.4,-31,22,16,a,true);
  plate(R,-8.4+lx*.4,-28.6,16.8,6,SX(a,-.12));
  R(-.5+lx*.4,-31,1,15,crack);R(-8+lx*.4,-22,6,.6,crack);R(3+lx*.4,-20.4,5,.6,crack);
  /* glowing core in the chest */
  ell(R,lx*.4,-24.6,3.8,3.8,'#1c1612');ell(R,lx*.4,-24.6,3,3,SX(eyc,-.35));ell(R,lx*.4,-24.6,2.2,2.2,eyc);ell(R,lx*.4-.6,-25.4,.9,.9,SX(eyc,.7));
  for(const q of[[-1,-1],[1,-1],[1,1],[-1,1]])ln(R,lx*.4+q[0]*3.4,-24.6+q[1]*3.4,lx*.4+q[0]*5.8,-24.6+q[1]*5,.6,eyc);
  /* arms */
  const arm=(sg,sw,ext)=>{const x=sg<0?-19:11,fx=x+lx*(sg>0?1:.4);
    plate(R,fx-.4,-33-sw,9.4,7.4,b,true);R(fx+1.5,-37.2-sw,1.4,4.4,SX(b,.2));R(fx+5.4,-36.4-sw,1.4,3.6,SX(b,.12));   /* pauldron + spikes */
    plate(R,fx+.8,-26-sw,6.6,9,a);R(fx+1.6,-21.4-sw,.6,2.4,crack);
    plate(R,fx-.6+(sg>0?ext:0),-17.4-sw,9,8,b,true);
    R(fx+.6+(sg>0?ext:0),-12-sw,.7,2.6,SX(b,-.5));R(fx+3.2+(sg>0?ext:0),-12-sw,.7,2.6,SX(b,-.5));R(fx+5.8+(sg>0?ext:0),-12-sw,.7,2.6,SX(b,-.5));};
  arm(-1,ps.sw,0);arm(1,-ps.sw,ps.atk===2?4:0);
  /* head */
  const hx=lx*.6,hy=-40+by;
  plate(R,-6.6+hx,hy-1.4,13.2,10.4,a,true);
  R(-6.6+hx,hy-1.4,13.2,2.2,SX(a,.28));
  R(-5.4+hx,hy+2.6,10.8,2.4,'#14100c');R(-5+hx,hy+2.9,4.2,1.8,eyc);R(.8+hx,hy+2.9,4.2,1.8,eyc);R(-4.6+hx,hy+3,1.4,.7,SX(eyc,.7));R(1.2+hx,hy+3,1.4,.7,SX(eyc,.7));
  plate(R,-4+hx,hy+6.2,8,2.8,b);for(let i=0;i<4;i++)R(-3+i*2+hx,hy+6.4,.6,2.2,SX(b,-.5));
  R(-2.6+hx,hy-4.2,5.2,3,b);R(-1.2+hx,hy-5.8,2.4,2,SX(b,.2));            /* crest */
  R(-8.2+hx,hy+1,2,5,SX(a,-.2));R(6.2+hx,hy+1,2,5,SX(a,-.2));
};

/* ===== Quadruped (wolf / mecha wolf) ===== */
Sprites.hd.wolf=(R,f,pal,eyec,mech)=>{
  const[c,c2,bl]=pal||['#9a8a78','#5a4a3a','#e8dcc8'],ps=Sprites.pose(f),lx=ps.atk===2?3:ps.atk===1?-2:0,a=ps.l,b=ps.r,hi=SX(c,.24),dk=SX(c,-.3);
  eyec=eyec||'#ff3a2a';
  /* far legs (darker) */
  R(5.4,-9,2.4,9+(b?-b:0)+1,c2);R(-7.6,-9,2.6,9-a*0+1,c2);
  /* tail */
  const tw=Math.sin(f*1.6)*1.4;
  ln(R,-13,-15,-18,-18+tw,3.6,c);ln(R,-18,-18+tw,-22,-23+tw,3.2,c);ln(R,-22,-23+tw,-23.6,-26+tw,2.2,mech?'#d0d8e6':bl);
  /* body masses */
  ell(R,-9,-12.4,6.4,5.6,dk);ell(R,-9.4,-12.8,6,5.3,c);
  ell(R,4.6,-12.4,7.4,5.8,dk);ell(R,4.2,-12.8,7,5.5,c);
  R(-8,-17.6,13,9.6,c);R(-8,-17.6,13,1.2,hi);R(-9,-18.4,3,2,hi);
  ell(R,1,-8.8,8.5,1.7,bl);
  /* haunch + shoulder shading */
  ell(R,-9.2,-12.6,3.4,3.2,SX(c,-.14));ell(R,5.2,-13.4,3.6,3.4,SX(c,-.12));
  if(mech){
    R(-8,-13.4,15,.6,dk);R(-.6,-17.6,.6,9.6,dk);for(const x of[-7,-3,3,6])R(x,-16.6,.9,.9,SX(c,.5));
    R(-12,-10.6,5,.6,dk);R(5,-10.6,4,.6,dk);
  }else{
    for(let i=0;i<9;i++){const x=-12+i*2.2,h=1.4+hdHash(i,3)*1.2;R(x,-18.6-h*.3,1.2,h,i%2?hi:c);R(x+.3,-19.4-h*.3,.7,h*.7,hi);}
    for(let i=0;i<4;i++)R(-7+i*3.6,-14+hdHash(i,7)*3,2.4,.5,dk);
    for(let i=0;i<5;i++)R(8.4+i*.4,-15.4+i*1.5,1.1,.5,SX(bl,-.05));  /* chest ruff */
  }
  /* near legs */
  const leg=(x,lift,hind)=>{R(x,-9.4,2.8,8.4-lift,c);R(x,-9.4,.8,8.4-lift,hi);R(x+2,-9.4,.8,8.4-lift,dk);
    if(hind)R(x-1,-8,1.4,2.6,c);R(x-.6,-1.6-lift,4,1.6,c2);R(x-.6,-1.6-lift,4,.5,SX(c2,.3));R(x+1.2,-1.2-lift,.4,1.2,SX(c2,-.4));R(x+2.4,-1.2-lift,.4,1.2,SX(c2,-.4));};
  leg(-10.4,b,true);leg(-4.6,a,true);leg(2.4,a,false);leg(8,b,false);
  /* neck + head */
  ln(R,8,-16,11.6,-19.4,6,c);ln(R,8,-14.8,11.6,-17.6,5,SX(c,-.1));
  const hx=lx,hy=-21.4-(ps.atk===1?1:0);
  ball(R,13+hx,hy,4.8,4.4,c);
  R(16+hx,hy-1.2,6.4,3.4,c);R(16+hx,hy-1.2,6.4,.8,hi);R(21.6+hx,hy-1.2,1.8,2,mech?'#2a2e3a':'#17121a');R(22.2+hx,hy-.9,.6,.6,'#fff');
  const jaw=ps.atk?2.6:.9;
  R(15.4+hx,hy+2.2,6,jaw,c2);R(15.4+hx,hy+2.2,6,.5,SX(c2,.3));
  R(18+hx,hy+1.4,.8,1.4+(ps.atk?1:0),'#fff');R(20.6+hx,hy+1.4,.8,1.4+(ps.atk?1:0),'#fff');R(16.4+hx,hy+2.1+jaw,.6,.7,'#fff');
  R(15.6+hx,hy-3,3.8,.9,dk);
  R(10.6+hx,hy-8.6,2.6,4.4,c);R(11.2+hx,hy-9.8,1.6,2,c);R(11+hx,hy-8,1,3.4,SX(c2,-.1));
  R(14.4+hx,hy-8.8,2.4,4.4,c);R(14.8+hx,hy-10,1.4,2.2,c);R(15,hy-8,.9,3.2,SX(c2,-.1));
  R(14.6+hx,hy-1.8,2.6,1.3,eyec);R(15.2+hx,hy-1.6,.9,.8,'#fff');
  if(mech){R(13+hx,hy-3.6,5,.6,'#d0d8e6');R(11+hx,hy+1.4,2.4,.6,dk);R(17+hx,hy+3.4+jaw*.4,3,.5,eyec);}
};

/* ===== Tyrannosaur (Dinosaur) ===== */
Sprites.hd.trex=(R,f,pal)=>{
  const[c,c2,bl]=pal||['#4a8a3a','#2f5a24','#cfe0a0'],ps=Sprites.pose(f),lx=ps.atk===2?3:ps.atk===1?-2:0,hi=SX(c,.24),dk=SX(c,-.3),a=ps.l,b=ps.r;
  const tw=Math.sin(f*1.4)*1.3;
  /* tail: tapered, belly stripe underneath */
  taper(R,-8,-19,-27,-13+tw,9,2.2,dk);taper(R,-8,-19.4,-27,-13.6+tw,8.2,1.6,c);taper(R,-8,-17.4,-24,-12.4+tw,4,.8,bl);
  for(let i=0;i<5;i++)R(-12-i*3,-23.6+i*1.1+tw*i*.12,1.2,2,c2);
  /* far leg */
  const leg=(sx,lift,col,colhi)=>{
    ball(R,sx,-13.4,5.2,6,col);
    taper(R,sx+.2,-9.6,sx-2.4,-4.6-lift*.6,4.8,3.2,col);taper(R,sx-2.4,-4.6-lift*.6,sx-1.8,-2.2-lift,3.2,2.8,SX(col,-.12));
    R(sx-6.2,-2.2-lift,9.6,2.2,SX(col,-.34));R(sx-6.2,-2.2-lift,9.6,.5,SX(col,-.1));
    for(const x of[-5.6,-3.2,-.8])R(sx+x,-1.2-lift,1,1.2,'#f4f0e0');};
  leg(-1,b,SX(c,-.3),null);
  /* body */
  ball(R,1,-20,11.6,9,c);
  ell(R,3.4,-14.2,8.8,2.8,bl);for(let i=0;i<5;i++)R(-3+i*2.4,-14.6,.5,1.8,SX(bl,-.2));
  for(let i=0;i<5;i++)R(-7+i*3.4,-27.6+i*.5,1.2,3.6+hdHash(i,2)*2.4,c2);
  for(let i=0;i<8;i++)R(-9+i*2.4,-29+i*.3-(i<3?0:i*.15),1.4,1.6,SX(c,.12));
  leg(-5,a,c,hi);
  /* neck + head */
  taper(R,7,-22,13,-30.4,8,6.4,c);taper(R,8.4,-20.4,13.4,-28,5,3.6,SX(c,-.1));
  const hx=lx,hy=-33;
  ball(R,17+hx,hy,6.4,4.8,c);
  R(21+hx,hy-2.8,8,5.4,c);R(21+hx,hy-2.8,8,1,hi);R(28+hx,hy-2.4,1.6,1.4,dk);R(28.4+hx,hy-2,.6,.6,'#10200e');
  const jaw=ps.atk?3.6:1.4;
  R(20.6+hx,hy+2.6,8.4,jaw,c2);
  for(let i=0;i<6;i++){R(21+i*1.35+hx,hy+2,.8,1.6+(i%2)*.3,'#f4f0e0');R(21.6+i*1.35+hx,hy+2.6+jaw-.8,.7,1.2,'#e4e0d0');}
  R(15+hx,hy-4.6,6,1.2,dk);ell(R,18.2+hx,hy-2.4,1.5,1.3,'#ffcf3a');R(18+hx,hy-2.8,.8,1.2,'#240a0a');R(17.5+hx,hy-3,.5,.5,'#fff');
  R(12+hx,hy-5.6,1.4,2,c2);R(14.4+hx,hy-6.2,1.4,2.4,c2);
  /* tiny arms */
  R(10+lx*.4,-20.4,2.6,1.4,c);R(12.2+lx*.4,-20.8,1.4,2.6,c);R(12.4+lx*.4,-18.4,.6,1,'#f4f0e0');R(13+lx*.4,-18.4,.6,1,'#f4f0e0');
};

/* ===== Raptor ===== */
Sprites.hd.raptor=(R,f,pal)=>{
  const[c,c2,bl]=pal||['#7a6a3a','#5a4a28','#c9b070'],ps=Sprites.pose(f),lx=ps.atk===2?3:ps.atk===1?-2:0,hi=SX(c,.26),dk=SX(c,-.3),a=ps.l,b=ps.r,crest='#d94a2a';
  const tw=Math.sin(f*1.5)*1;
  ln(R,-6,-12,-14,-13+tw*.4,4.6,c);ln(R,-14,-13+tw*.4,-21,-14+tw,3,c);ln(R,-21,-14+tw,-24,-14.4+tw,1.8,c2);
  R(-2.4,-8,3,8-b,c2);R(-3.6,-1.4-b,6,1.4,c2);
  ball(R,0,-13,8,5.4,c);ell(R,1.6,-9.4,6.4,1.7,bl);
  for(let i=0;i<4;i++)R(-5+i*2.6,-17.4,.8,3.4,c2);
  /* leg with hock + sickle claw */
  ball(R,-3.6,-10.4,3.6,4,c);R(-5.6,-7.4,2.6,3.4,c);R(-6.6,-4.4-a*.4,2.2,3.6-a*.6,c);R(-8.6,-2-a,7.4,2,c2);
  R(-6.6,-3.4-a*.4,.8,1,'#f4f0e0');R(-9,-1.4-a,1.1,1.4,'#f4f0e0');R(-6.2,-.7-a,1,.8,'#f4f0e0');R(-3.6,-1.2-a,1,1.2,'#f4f0e0');
  R(-5.4,-1.8-a,1.4,2.6,'#f4f0e0');
  ln(R,5,-16,8.4,-20.6,4.4,c);
  const hx=lx,hy=-22.6;
  ball(R,10.6+hx,hy,3.9,3.5,c);
  R(13.2+hx,hy-1.6,6.2,2.8,c);R(13.2+hx,hy-1.6,6.2,.7,hi);R(19+hx,hy-1.2,.9,.8,dk);
  const jaw=ps.atk?2.4:.8;R(13+hx,hy+1.2,5.6,jaw,c2);for(let i=0;i<4;i++)R(13.6+i*1.3+hx,hy+1,.6,1.2,'#fff');
  ell(R,11.4+hx,hy-1.2,1.1,1,'#ffcf3a');R(11.3+hx,hy-1.6,.6,1,'#200');R(11+hx,hy-2.6,3,.6,dk);
  R(7.8+hx,hy-5.8,1.2,3.6,crest);R(9.4+hx,hy-6.6,1.2,4.2,SX(crest,.2));R(11.2+hx,hy-6,1.1,3.4,crest);
  R(7.4,-15.4,2.2,1,c);R(9.4,-15.6,1.1,2.4,c);R(9.6,-13.6,.5,.8,'#f4f0e0');R(10.4,-13.6,.5,.8,'#f4f0e0');
  R(2,-12.4,2.4,1.4,c2);
};

/* ===== Pterodactyl ===== */
Sprites.hd.bird=(R,pal,f)=>{
  const[c1,c2,bl,ac]=pal||['#8a9a5a','#5a6a38','#e8d890','#d94a3a'],ps=Sprites.pose(f),fl=[0,-5,-1,5,-1,-8,3][f]||0,lx=ps.atk===2?3:0,hi=SX(c1,.26);
  /* swept bat-like wing: leading-edge arm -> wrist -> tip, scalloped membrane, finger bones */
  const wing=(dx,dy,col,rib,bone)=>{
    const rx=-1+dx,ry=-14+dy,wy=-5+fl*.55,ty=-11+fl*1.05;      /* wrist / tip heights relative to the shoulder */
    const L=x=>x<=8?(x/8)*wy:wy+((x-8)/10)*(ty-wy);              /* leading edge y at distance x from the shoulder */
    for(let x=0;x<=18;x+=.5){const t=x/18,top=L(x),tr=4.2+(ty+7-4.2)*Math.pow(t,1.1),sc=(((x/3)|0)%2===0?0:-1.5)*Math.min(1,t*2.4);
      const bot=Math.max(top+1.2,tr+sc);
      R(rx-x,ry+top,.55,bot-top,col);R(rx-x,ry+top,.55,.8,bone);R(rx-x,ry+bot-.7,.55,.7,SX(col,-.16));}
    for(const t of[.42,.68,.92]){const x=t*18,tr=4.2+(ty+7-4.2)*Math.pow(t,1.1);ln(R,rx-8,ry+wy,rx-x,ry+tr-.5,.7,rib);}
    ln(R,rx,ry,rx-8,ry+wy,1.3,bone);ln(R,rx-8,ry+wy,rx-18,ry+ty,1.1,bone);
  };
  wing(2.4,1.4,SX(c1,-.28),SX(c1,-.5),SX(c2,-.2));
  /* tail + legs */
  R(-9,-12,4.6,2,ac);R(-11.4,-11.6,3,1.2,SX(ac,-.2));
  R(-1.8,-8,.9,4.4,c2);R(1.6,-8,.9,4.4,c2);R(-2.4,-3.8,2.2,.8,'#222');R(1,-3.8,2.2,.8,'#222');R(-2.8,-3.2,.6,.8,'#222');R(2.8,-3.2,.6,.8,'#222');
  ball(R,-.4,-12,6.2,4.4,c1);ell(R,.4,-9.4,4.6,1.5,bl);
  taper(R,3.4,-14.4,6.6,-17.8,4.2,3,c1);
  const hx=lx;ball(R,8+hx,-18,3.2,2.8,c1);
  R(10.6+hx,-19,9,1.5,ac);R(10.6+hx,-19,9,.4,SX(ac,.4));R(10.6+hx,-17.4,7,1,SX(ac,-.18));
  if(ps.atk)R(10.6+hx,-16.6,6,.7,SX(ac,-.3));
  R(5+hx,-22.8,2.2,5,ac);R(2.6+hx,-24,2.6,4.6,SX(ac,-.14));R(.6+hx,-24.6,2.2,3.4,SX(ac,-.3));
  ell(R,8.6+hx,-18.8,.9,.9,'#fff');R(8.7+hx,-18.9,.6,.7,'#111');
  wing(0,0,c1,SX(c1,-.3),c2);
};

/* ===== Great Ape ===== */
/* fur tuft: a tapered spike pointing up (dir shifts the tip sideways) */
const tuft=(R,x,y,h,w,dir,col)=>{for(let i=0;i<h;i+=.5){const k=1-i/h;R(x-w*k/2+dir*i*.35,y-i,Math.max(.5,w*k),.5,col);}};
Sprites.hd.ape=(R,f)=>{
  const fur='#7e5532',fur2='#58381d',fur3='#a47a4c',skin='#d6aa7c',ps=Sprites.pose(f),lx=ps.atk===2?4:ps.atk===1?-2:0,by=ps.bob;
  /* legs / feet */
  for(let s=0;s<2;s++){const x=s?7:-7,l=s?ps.r:ps.l;
    ball(R,x,-8-l,7.4,7,fur2);ell(R,x+(s?1:-1),-2.6-l,7.6,2.8,'#2c1b10');for(let i=0;i<3;i++)R(x-4+i*3.4,-3.4-l,.6,2.8,'#4a3424');}
  /* torso */
  ball(R,lx*.3,-24,15.6,13.4,fur);
  ell(R,lx*.3,-19,9.6,8.2,skin);ell(R,lx*.3,-18.2,7.4,6.4,SX(skin,.1));
  R(-.4+lx*.3,-24.6,.8,9,SX(skin,-.22));R(-7+lx*.3,-21,6,.6,SX(skin,-.22));R(1.4+lx*.3,-21,6,.6,SX(skin,-.22));R(-5+lx*.3,-16.4,10,.6,SX(skin,-.2));
  for(let i=0;i<10;i++)R(-12+i*2.6+lx*.3,-30+hdHash(i,1)*5,2.4,.6,fur2);
  /* arms: shoulder ball, tapered limb, bicep, fist */
  for(let s=0;s<2;s++){const sg=s?1:-1,sw=s?-ps.sw:ps.sw,ex=s?lx*.9:lx*.3,fx=sg*(s&&ps.atk===2?9:0);
    const sx=sg*17+ex,sy=-31-sw;
    taper(R,sx,sy,sg*22.4+ex+fx*.6,-9-sw,10.4,8.4,fur2);taper(R,sx-sg*.4,sy,sg*22+ex+fx*.6,-9.6-sw,8.8,7,fur);
    taper(R,sx-sg*2.6,sy+1,sg*19+ex+fx*.4,-12-sw,2.6,2.2,fur3);
    for(let i=0;i<5;i++)R(sg*(17+i*.9)+ex-1.6,-27-sw+i*3.4,2.6,.6,fur2);
    ball(R,sx,sy,7.2,6.4,fur);
    const hx=sg*23+ex+fx;ball(R,hx,-6-sw,6.2,5.2,fur2);for(let i=0;i<3;i++)R(hx-3.4+i*2.4,-8.2-sw,.6,2.8,'#34231a');}
  /* head */
  const hx=lx*.5,hy=-41+by;
  /* mane tufts framing the head */
  for(let i=0;i<9;i++){const a=-1.25+i*.31;tuft(R,Math.sin(a)*10.4+hx,hy-5+Math.abs(Math.sin(a))*-0+(-Math.cos(a)*7.4)+3,4.6+hdHash(i,4)*2.4,2.8,Math.sin(a)*1.6,i%2?fur3:fur);}
  ball(R,hx,hy-3,10.6,9.2,fur);
  ell(R,-9.2+hx,hy-5.4,2.6,2.6,fur2);ell(R,9.2+hx,hy-5.4,2.6,2.6,fur2);ell(R,-9.2+hx,hy-5.4,1.4,1.4,skin);ell(R,9.2+hx,hy-5.4,1.4,1.4,skin);
  ell(R,hx,hy,7.8,7,skin);ell(R,hx,hy-1.4,6.6,5.2,SX(skin,.08));
  R(-8+hx,hy-4,16,2,fur2);R(-6+hx,hy-5.4,12,1.4,fur);
  for(const ex of[-5.6,2]){R(ex+hx,hy-2.6,3.8,2.8,'#240808');R(ex+.3+hx,hy-2.4,3.2,2.4,'#ff2a2a');R(ex+1.2+hx,hy-2.2,1.2,2,'#fff6c0');}
  R(-1.2+hx,hy-.2,.9,1.4,SX(skin,-.32));R(.4+hx,hy-.2,.9,1.4,SX(skin,-.32));
  const jw=ps.atk?5:3;
  R(-5.8+hx,hy+2.4,11.6,jw,'#2a0c0c');ell(R,hx,hy+2.4+jw*.62,4.2,jw*.4,'#7a1a1a');
  for(let i=0;i<6;i++){R(-5.2+i*1.9+hx,hy+2.4,1,1.8,'#fff4e0');R(-4.6+i*1.9+hx,hy+jw+.6,1,1.6,'#efe6d0');}
  R(-6.8+hx,hy+1.6,1.4,2.4,'#fff4e0');R(5.4+hx,hy+1.6,1.4,2.4,'#fff4e0');
};
