'use strict';
/* ====== Renderer: world, entities, effects, HUD. Camera is always centred on the player. ====== */
/* a negative radius (an animation overshooting) throws and aborts the frame in the middle of a 'lighter' block, which used to leave the whole canvas additive (white): clamp radii instead */
(()=>{const P=typeof CanvasRenderingContext2D!=='undefined'&&CanvasRenderingContext2D.prototype;if(!P||P.__safeRad)return;P.__safeRad=1;
  const arc=P.arc,ell=P.ellipse,rg=P.createRadialGradient,rr=P.roundRect;
  P.arc=function(x,y,r,...a){return arc.call(this,x,y,r>0?r:0,...a);};
  P.ellipse=function(x,y,rx,ry,...a){return ell.call(this,x,y,rx>0?rx:0,ry>0?ry:0,...a);};
  P.createRadialGradient=function(x0,y0,r0,x1,y1,r1){return rg.call(this,x0,y0,r0>0?r0:0,x1,y1,r1>0?r1:0);};
  if(rr)P.roundRect=function(x,y,w,h,r){return rr.call(this,x,y,w,h,r);};
})();
const THEMES={
  plains:{ground:['#4f9b4a','#56a552','#489244','#5aa955'],hi:'#7acb6a',lo:'#2f6a30',water:['#3b86c4','#4394d0','#3079b4'],sky:'#1d3a2a'},
  namek:{ground:['#3f9e6e','#46a877','#3a9567','#4aae7e'],hi:'#7ad6a6',lo:'#1f6a4a',water:['#2f86b8','#3790c4','#2a7aaa'],sky:'#14342c'},
  waste:{ground:['#8a7a68','#948472','#7e6e5c','#9a8a78'],hi:'#b8a890',lo:'#4a3e32',sky:'#2a2420'},
  other:{ground:['#a888c8','#b496d4','#9c7cbc','#bca0dc'],hi:'#e8d0ff',lo:'#6a4a8a',sky:'#2a1a3a'},
  beach:{ground:['#ecc886','#f1cf90','#e4bf7c','#f4d69b'],hi:'#fbe6b4',lo:'#b0803e',water:['#3aa8d8','#42b2e2','#2f9ccc'],sky:'#164a5c'},
  redrock:{ground:['#b2543a','#bc5e42','#a64a32','#c4664a'],hi:'#e8946a',lo:'#6a2a1a',sky:'#3a1610'},
  arena:{ground:['#b8b2a4','#c2bcae','#aea898','#c8c2b4'],hi:'#e8e2d4',lo:'#6a6458',sky:'#24262e'},
  sky:{ground:['#e8f0fa','#f0f6fc','#dce8f6','#f4f8fe'],hi:'#ffffff',lo:'#a8c0e0',sky:'#2a4a78'},
  hell:{ground:['#3a1a1c','#441e20','#301418','#4a2224'],hi:'#ff7a2a',lo:'#12080a',sky:'#2a0a0a'},
  snake:{ground:['#f4a82e','#f8b43a','#ee9c26','#fabc48'],hi:'#ffe08a',lo:'#a85a10',sky:'#7a3a8a'},
  void:{ground:['#1a2244','#1e2850','#161e3c','#222c58'],hi:'#4a6aff',lo:'#0a0e22',sky:'#05081a'}
};
/* per-theme multiply tint of the rock sprites (grey-green art: plains/beach/arena keep it as drawn) */
/* extra share of tiles that get a ground decoration (the base is 2.5-9%) */
const DEC_DENS={beach:.03,waste:.018,redrock:.015,plains:.012,namek:.012,arena:.01,hell:.012};
const ROCK_TINT={redrock:'#e0a08a',waste:'#d8c2a4',hell:'#8a6a66'};
const LOOT_COL={sball:'#ffd23f',coin:'#ffd23f',bag:'#ffd23f',heal:'#8be07a',magnet:'#ff5a5a',dmg:'#ff5a3d',haste:'#ffe24d',xp:'#5ad0ff',capsule:'#ffffff',luck:'#8be07a',ball:'#ffaa28'};
/* tiny skull (progress-bar milestones): cranium + jaw, dark outline, eye sockets and nose */
function drawSkull(ctx,x,y,r,col,a){
  ctx.save();ctx.globalAlpha=a==null?1:a;ctx.lineJoin='round';ctx.lineWidth=Math.max(1,r*.3);ctx.strokeStyle='#14080c';ctx.fillStyle=col;
  ctx.beginPath();ctx.rect(x-r*.52,y+r*.5,r*1.04,r*.7);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.arc(x,y-r*.1,r,0,TAU);ctx.fill();ctx.stroke();
  ctx.fillRect(x-r*.5,y+r*.4,r,r*.3);   /* hides the seam between cranium and jaw */
  ctx.fillStyle='#14080c';
  ctx.beginPath();ctx.arc(x-r*.36,y-r*.05,r*.27,0,TAU);ctx.arc(x+r*.36,y-r*.05,r*.27,0,TAU);ctx.fill();
  ctx.beginPath();ctx.moveTo(x,y+r*.16);ctx.lineTo(x-r*.12,y+r*.42);ctx.lineTo(x+r*.12,y+r*.42);ctx.closePath();ctx.fill();
  if(r>5){ctx.lineWidth=Math.max(1,r*.1);ctx.beginPath();for(const k of[-.22,0,.22]){ctx.moveTo(x+r*k,y+r*.62);ctx.lineTo(x+r*k,y+r*1.12);}ctx.stroke();}
  ctx.restore();
}
/* tiny Shenron (final boss marker): green serpent with a horned head */
function drawShenron(ctx,x,y,s,a){
  ctx.save();ctx.globalAlpha=a==null?1:a;ctx.lineCap='round';ctx.lineJoin='round';
  const body=()=>{ctx.beginPath();ctx.moveTo(x-10*s,y+4*s);ctx.bezierCurveTo(x-7*s,y-4*s,x-3*s,y+8*s,x+1*s,y+1*s);ctx.bezierCurveTo(x+3*s,y-2.5*s,x+5*s,y-3*s,x+7*s,y-4*s);};
  ctx.strokeStyle='#0d3a1e';ctx.lineWidth=5.2*s;body();ctx.stroke();
  ctx.strokeStyle='#3fbf5a';ctx.lineWidth=3.4*s;body();ctx.stroke();
  ctx.strokeStyle='#b8f0a0';ctx.lineWidth=1*s;body();ctx.stroke();
  /* head */
  ctx.fillStyle='#59d070';ctx.strokeStyle='#0d3a1e';ctx.lineWidth=1.4*s;
  ctx.beginPath();ctx.ellipse(x+9.2*s,y-4.6*s,4.2*s,3*s,-.2,0,TAU);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+12.6*s,y-5.4*s);ctx.lineTo(x+15.2*s,y-4.4*s);ctx.lineTo(x+12.4*s,y-3*s);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#ffe08a';ctx.lineWidth=1.3*s;ctx.beginPath();ctx.moveTo(x+7.6*s,y-6.6*s);ctx.lineTo(x+5.2*s,y-9.6*s);ctx.moveTo(x+9*s,y-7*s);ctx.lineTo(x+7.6*s,y-10.4*s);ctx.stroke();   /* horns */
  ctx.strokeStyle='#e8ffd8';ctx.lineWidth=.8*s;ctx.beginPath();ctx.moveTo(x+13.6*s,y-4.2*s);ctx.quadraticCurveTo(x+16.6*s,y-1*s,x+18*s,y-2.6*s);ctx.stroke();   /* whisker */
  ctx.fillStyle='#ff2a2a';ctx.beginPath();ctx.arc(x+9.8*s,y-5.2*s,.9*s,0,TAU);ctx.fill();
  ctx.restore();
}
/* the 7 Dragon Balls (1..7 stars): assets/dragonballs.webp, one 64x64 frame each (build.py replaces __DBALLS__) */
const DBALLS_URL=('__DBALLS__'?'data:image/webp;base64,__DBALLS__':'');
/* Tamagami patterns that are a weapon strike (frames 5 wind-up and 6 strike of their art); every other pattern uses the special pose (frame 7) */
const TAMA_WEAPON={hammer:1,slam:1,swordwave:1,rush:1,lance:1,jsword:1};
class Renderer{
  constructor(canvas,save){
    this.cv=canvas;this.ctx=canvas.getContext('2d');this.save=save;
    /* the opacity slider for the player's own effects: while FXL.m<1 every alpha the drawing code sets is scaled by it (see fxBegin/fxEnd) */
    {const d=Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype,'globalAlpha'),c=this.ctx;
      if(d&&d.get&&d.set)Object.defineProperty(c,'globalAlpha',{configurable:true,enumerable:true,get(){const v=d.get.call(c);return FXL.m>0&&FXL.m<1?Math.min(1,v/FXL.m):v;},set(v){d.set.call(c,FXL.m<1?v*FXL.m:v);}});}
this.W=1;this.H=1;this.Z=1;
    this.tiles={};this.decor={};this.vign=null;this.menuT=0;this.fps=60;this.fa=0;this.fn=0;
    try{if(document.fonts)document.fonts.load('12px "Anton"','0123456789');}catch(e){}   /* the damage-number lettering */
    this.hint=null;this.joy=null;this.keyHints={};this.tr=(x)=>typeof x==='string'?x:x.it;this.tt=(k)=>k;
  }
  resize(){
    const s=this.save.d.settings,cw=window.innerWidth,ch=window.innerHeight;
    let iw,ih;
    if(s.res==='720'){ih=720;iw=Math.round(720*cw/ch);}
    else if(s.res==='1080'){ih=1080;iw=Math.round(1080*cw/ch);}
    else{const sc=clamp(s.scale||1,.5,2)*Math.min(2,window.devicePixelRatio||1);iw=Math.round(cw*sc);ih=Math.round(ch*sc);}
    this.cv.width=iw;this.cv.height=ih;this.cv.style.width=cw+'px';this.cv.style.height=ch+'px';
    this.W=iw;this.H=ih;this.Z=clamp(Math.min(iw,ih)/560,.6,3.4);this.vign=null;
    this.U=Math.max(.8,ih/720);
  }
  /* ---------- terrain ---------- */
  getTiles(theme){
    if(this.tiles[theme])return this.tiles[theme];
    const th=THEMES[theme],mk=(base,seed,water)=>{
      const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
      g.fillStyle=base;g.fillRect(0,0,64,64);
      for(let i=0;i<46;i++){
        const x=Math.floor(hash(seed,i)*62),y=Math.floor(hash(i,seed+7)*62),r=hash(seed+3,i);
        g.fillStyle=r<.5?th.lo:th.hi;g.globalAlpha=water?.16:.2+r*.14;g.fillRect(x,y,2+(r>.8?2:0),2);
      }
      g.globalAlpha=1;
      if(!water){
        if(theme==='plains'||theme==='namek'){g.strokeStyle=th.lo;g.globalAlpha=.4;g.lineWidth=1.5;for(let i=0;i<4;i++){const x=hash(seed,i+40)*58+3,y=hash(i+9,seed)*54+6;g.beginPath();g.moveTo(x,y+5);g.lineTo(x-1,y);g.moveTo(x+3,y+5);g.lineTo(x+4,y+1);g.stroke();}g.globalAlpha=1;}
        else if(theme==='waste'){g.strokeStyle=th.lo;g.globalAlpha=.55;g.lineWidth=1.4;for(let i=0;i<2;i++){let x=hash(seed,i+50)*64,y=hash(i,seed+3)*64;g.beginPath();g.moveTo(x,y);for(let k=0;k<4;k++){x+=hash(seed+k,i)*14-4;y+=hash(i+k,seed)*14-4;g.lineTo(x,y);}g.stroke();}g.globalAlpha=1;}
        else if(theme==='other'){const gr=g.createRadialGradient(32,32,2,32,32,40);gr.addColorStop(0,'rgba(255,255,255,.18)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);}
        else if(theme==='beach'){   /* wind ripples in the sand: short pixel waves, dark with a light lip under them */
          for(let i=0;i<3;i++){const w=10+Math.floor(hash(seed,i+60)*12),x0=Math.floor(hash(i,seed+8)*(56-w))+2,y0=Math.floor(hash(seed+2,i+61)*46)+8,ph=hash(seed,i)*6;
            for(let q=0;q<w;q+=2){const yy=y0+Math.round(Math.sin(q*.5+ph)*1.4);g.fillStyle=th.lo;g.globalAlpha=.32;g.fillRect(x0+q,yy,2,2);g.fillStyle=th.hi;g.globalAlpha=.8;g.fillRect(x0+q,yy+2,2,1.5);}}
          g.globalAlpha=1;}
        else if(theme==='redrock'){g.strokeStyle=th.lo;g.globalAlpha=.6;g.lineWidth=1.5;for(let i=0;i<2;i++){let x=hash(seed,i+70)*64,y=hash(i,seed+9)*64;g.beginPath();g.moveTo(x,y);for(let k=0;k<5;k++){x+=hash(seed+k,i+1)*12-3;y+=hash(i+k,seed+2)*10-2;g.lineTo(x,y);}g.stroke();}g.globalAlpha=1;}
        else if(theme==='arena'){g.strokeStyle=th.lo;g.globalAlpha=.5;g.lineWidth=2;g.strokeRect(1,1,62,62);g.globalAlpha=.25;g.beginPath();g.moveTo(32,1);g.lineTo(32,63);g.moveTo(1,32);g.lineTo(63,32);g.stroke();if(hash(seed,77)>.5){g.globalAlpha=.6;g.beginPath();g.moveTo(10,10);g.lineTo(22,24);g.lineTo(18,38);g.stroke();}g.globalAlpha=1;}
        else if(theme==='sky'){g.fillStyle='#ffffff';g.globalAlpha=.55;for(let i=0;i<3;i++){const x=hash(seed,i+80)*50,y=hash(i,seed+4)*50;g.beginPath();g.ellipse(x+8,y+5,9,4,0,0,TAU);g.fill();}g.globalAlpha=1;}
        else if(theme==='hell'){g.strokeStyle='#ff6a1a';g.globalAlpha=.55;g.lineWidth=1.6;for(let i=0;i<2;i++){let x=hash(seed,i+90)*64,y=hash(i,seed+6)*64;g.beginPath();g.moveTo(x,y);for(let k=0;k<4;k++){x+=hash(seed+k,i+5)*12-4;y+=hash(i+k,seed+1)*12-4;g.lineTo(x,y);}g.stroke();}g.globalAlpha=1;}
        else if(theme==='void'){g.strokeStyle=th.hi;g.globalAlpha=.16;g.lineWidth=1;g.strokeRect(.5,.5,63,63);g.globalAlpha=1;if(hash(seed,99)>.6){g.fillStyle='#bfd0ff';g.fillRect(Math.floor(hash(seed,3)*60),Math.floor(hash(3,seed)*60),2,2);}}
      }
      return c;
    };
    const t={ground:th.ground.map((b,i)=>mk(b,i*13+1,false)),water:(th.water||[]).map((b,i)=>mk(b,i*7+90,true))},am=AMB[theme];
    t.lv=[0,1,2,3,4].map(l=>l===2||!am?t.ground:t.ground.map(src=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.drawImage(src,0,0);g.globalAlpha=l===0||l===4?.22:.11;g.fillStyle=am.tint[l<2?0:1];g.fillRect(0,0,64,64);return c;}));
    this.tiles[theme]=t;return t;
  }
  getDecor(theme){
    if(this.decor[theme])return this.decor[theme];
    const P=(W,H,ox,oy,fn)=>Sprites.paint(W,H,ox,oy,fn),C=Sprites.circ,out=[];
    if(theme==='plains'){
      out.push(P(26,34,13,33,R=>{R(-1.5,-15,3,15,'#6a4a2a');C(R,0,-22,9,'#3f9e4a');C(R,-3,-25,5,'#5ac05a');}));
      out.push(P(16,10,8,9,R=>{C(R,0,-4,5,'#2f8a3a');C(R,-2,-5,3,'#4aaa4a');}));
      out.push(P(18,12,9,11,R=>{R(-6,-6,12,6,'#8a8f98');R(-4,-9,8,4,'#a0a6b0');R(-2,-8,3,2,'#c0c6d0');}));
    }else if(theme==='namek'){
      out.push(P(30,46,15,45,R=>{R(-1.5,-28,3,28,'#b8d7c0');C(R,0,-33,10,'#7bd6a6');C(R,-3,-36,6,'#9ee8bf');}));
      out.push(P(18,12,9,11,R=>{R(-6,-6,12,6,'#78a8b4');R(-4,-9,8,4,'#a6cdd6');}));
      out.push(P(24,30,12,29,R=>{R(-1,-20,2,20,'#b8d7c0');C(R,0,-24,7,'#5fc08e');}));
    }else if(theme==='waste'){
      out.push(P(26,30,13,29,R=>{R(-1,-20,2,20,'#4a3a2a');R(-7,-15,6,1.4,'#4a3a2a');R(1,-11,6,1.4,'#4a3a2a');R(-5,-19,1.4,5,'#4a3a2a');}));
      out.push(P(22,14,11,13,R=>{R(-8,-5,16,5,'#6a6460');R(-4,-9,8,4,'#7a746e');R(2,-7,5,2,'#8a847e');}));
      out.push(P(26,34,13,33,R=>{R(-6,-26,12,26,'#5a5650');R(-4,-22,3,4,'#2a2622');R(1,-14,3,4,'#2a2622');R(-6,-28,5,3,'#5a5650');}));
    }else if(theme==='other'){
      out.push(P(30,22,15,21,R=>{C(R,-6,-6,6,'#fff0ff');C(R,3,-8,8,'#ffe0ff');C(R,10,-5,5,'#fff0ff');}));
      out.push(P(18,30,9,29,R=>{R(-2,-24,4,24,'#ff9ad8');R(-4,-16,8,16,'#ff7ac0');R(-1,-22,1.5,12,'#ffd0f0');}));
      out.push(P(16,34,8,33,R=>{R(-3,-30,6,30,'#d8b0ff');R(-4,-32,8,3,'#f0d8ff');}));
    }else if(theme==='beach'){
      out.push(P(16,8,8,7,R=>{R(-6,-3,12,3,'#f4d8e0');R(-4,-5,8,3,'#e8a8c0');R(-1,-6,2,2,'#fff');}));
      out.push(P(14,10,7,9,R=>{C(R,0,-4,4,'#2f9a4a');C(R,-2,-5,2,'#5ac05a');}));
      out.push(P(14,8,7,7,R=>{R(-5,-3,10,3,'#c8a868');R(-3,-5,6,3,'#d8b878');}));
    }else if(theme==='redrock'){
      out.push(P(14,8,7,7,R=>{R(-5,-3,10,3,'#8a3a22');R(-3,-5,6,3,'#a8482a');}));
      out.push(P(16,6,8,5,R=>{R(-6,-2,12,2,'#5a2010');R(-3,-4,5,2,'#6a2a18');}));
      out.push(P(10,14,5,13,R=>{R(-1,-10,2,10,'#6a3a1a');R(-4,-8,3,1,'#6a3a1a');R(1,-6,3,1,'#6a3a1a');}));
    }else if(theme==='arena'){
      out.push(P(14,8,7,7,R=>{R(-5,-3,10,3,'#9a9284');R(-3,-5,5,3,'#b0a898');}));
      out.push(P(12,6,6,5,R=>{R(-4,-2,8,2,'#8a8274');R(-2,-4,3,2,'#a8a090');}));
      out.push(P(10,8,5,7,R=>{R(-3,-4,6,4,'#c8c0b0');R(-2,-6,4,2,'#d8d0c0');}));
    }else if(theme==='sky'){
      out.push(P(20,10,10,9,R=>{C(R,-3,-3,3,'#fff');C(R,2,-4,4,'#f4f8ff');C(R,6,-2,2,'#fff');}));
      out.push(P(8,10,4,9,R=>{R(-.5,-7,1,7,'#ffd23f');R(-2,-8,4,2,'#fff6a8');}));
    }else if(theme==='hell'){
      out.push(P(12,8,6,7,R=>{R(-4,-3,8,3,'#2a1214');R(-2,-5,5,3,'#3a1a1c');R(-1,-3,2,1,'#ff7a1a');}));
      out.push(P(10,12,5,11,R=>{R(-1,-9,2,9,'#e8e0d0');R(-3,-9,6,2,'#e8e0d0');}));
      out.push(P(16,6,8,5,R=>{R(-6,-2,12,2,'#ff5a1a');R(-3,-3,6,1,'#ffd23f');}));
    }else{
      out.push(P(18,40,9,39,R=>{R(-4,-34,8,34,'#2a3a6a');R(-.6,-34,1.2,34,'#6ad0ff');R(-5,-36,10,3,'#3a4a8a');}));
      out.push(P(18,10,9,9,R=>{R(-5,-5,10,5,'#3a4a8a');R(-3,-7,6,3,'#4a5a9a');}));
      out.push(P(14,26,7,25,R=>{R(-2,-20,4,20,'#2a3a6a');R(-.5,-20,1,20,'#ff6aa0');}));
    }
    /* extra variants (less repetition): indices 3..5 match DECA in ambient.js */
    const X={
      plains:[P(14,10,7,9,R=>{R(-5,-4,1,4,'#2f8a3a');R(-2,-7,1,7,'#3f9e4a');R(1,-5,1,5,'#2f8a3a');R(4,-3,1,3,'#4aaa4a');}),P(10,8,5,7,R=>{R(-.8,-3,1.6,3,'#f0e8d8');R(-3,-6,6,3,'#d8402a');R(-1.5,-5.5,1,1,'#fff');R(1,-4.5,1,1,'#fff');}),P(18,8,9,7,R=>{R(-7,-4,14,4,'#7a5430');R(-7,-4,2,4,'#a67c4a');R(-3,-5,3,1,'#2f8a3a');})],
      namek:[P(10,14,5,13,R=>{R(-.5,-9,1,9,'#7bd6a6');C(R,0,-10,3,'#9ee8ff');C(R,0,-10,1.4,'#fff');}),P(12,8,6,7,R=>{R(-4,-3,8,3,'#5a9a8a');R(-2,-5,4,2,'#8acaba');}),P(14,22,7,21,R=>{R(-.6,-18,1.2,18,'#9ac8a8');R(-4,-14,3,1,'#9ac8a8');R(1,-10,3,1,'#9ac8a8');C(R,0,-19,3,'#b8f0d0');})],
      waste:[P(12,6,6,5,R=>{R(-4,-2,8,2,'#e8e0d0');R(-2,-4,3,2,'#f4f0e4');R(-3,-1,1,1,'#222');}),P(16,10,8,9,R=>{R(-5,-3,10,3,'#7a6a3a');R(-3,-6,6,3,'#8a7a46');R(1,-8,2,2,'#9a8a56');}),P(10,18,5,17,R=>{R(-1.3,-14,2.6,14,'#4a8a3a');R(-4,-9,2.5,1.5,'#4a8a3a');R(-4,-12,1.5,4,'#4a8a3a');R(1.8,-8,2.5,1.5,'#4a8a3a');})],
      other:[P(10,14,5,13,R=>{R(-.5,-9,1,9,'#d8b0ff');C(R,0,-10,3,'#fff0ff');C(R,0,-10,1.5,'#ffd23f');}),P(12,14,6,13,R=>{R(-4,-8,2.5,8,'#ffa0e0');R(-1,-12,3,12,'#e8b0ff');R(2.5,-6,2,6,'#ffa0e0');}),P(14,8,7,7,R=>{C(R,-2,-3,3,'#fff0ff');C(R,2,-3,2.5,'#ffe0ff');})],
      beach:[P(8,6,4,5,R=>{R(-3,-2,6,2,'#fff4e8');R(-2,-4,4,2,'#ffd8c0');}),P(18,6,9,5,R=>{R(-7,-3,14,3,'#a8884a');R(-5,-4,6,1,'#c8a868');}),P(10,8,5,7,R=>{R(-1,-3,2,3,'#ff8a3a');R(-3,-2,6,1,'#ff8a3a');R(-.5,-5,1,5,'#ff8a3a');})],
      redrock:[P(14,8,7,7,R=>{R(-5,-1,10,1,'#e8e0d0');R(-4,-4,1,3,'#e8e0d0');R(-1,-5,1,4,'#e8e0d0');R(2,-4,1,3,'#e8e0d0');}),P(14,10,7,9,R=>{R(-5,-3,10,3,'#6a3a1a');R(-3,-6,6,3,'#8a4a24');}),P(10,12,5,11,R=>{R(-1.5,-10,3,10,'#ff7a5a');R(-.5,-10,1,8,'#ffd0b0');})],
      arena:[P(14,10,7,9,R=>{R(-5,-6,10,6,'#8a5a2a');R(-5,-6,10,1,'#b0804a');R(-1,-6,2,6,'#6a4018');}),P(12,6,6,5,R=>{R(-4,-2,8,2,'#d8d0c0');R(-1,-4,2,2,'#f4f0e4');}),P(6,18,3,17,R=>{R(-.8,-12,1.6,12,'#5a4a3a');R(-2,-14,4,3,'#8a8274');})],
      sky:[P(12,10,6,9,R=>{C(R,-2,-3,3,'#fff');C(R,2,-4,3.5,'#f4f8ff');}),P(12,12,6,11,R=>{R(-4,-8,8,1.5,'#ffd23f');R(-4,-3,8,1.5,'#ffd23f');R(-4,-8,1.5,6,'#ffd23f');R(2.5,-8,1.5,6,'#ffd23f');}),P(14,12,7,11,R=>{C(R,0,-5,5,'#fff');C(R,-4,-3,3,'#eaf4ff');})],
      hell:[P(14,8,7,7,R=>{R(-5,-1,10,1,'#e8e0d0');R(-4,-4,1,3,'#e8e0d0');R(-1,-5,1,4,'#e8e0d0');R(2,-4,1,3,'#e8e0d0');}),P(12,8,6,7,R=>{C(R,0,-3,4,'#e8e0d0');R(-2,-4,1.4,1.6,'#2a0a0a');R(1,-4,1.4,1.6,'#2a0a0a');}),P(10,14,5,13,R=>{R(-3,-4,6,4,'#2a1214');R(-4,-6,8,2,'#4a2a2a');R(-.8,-10,1.6,4,'#4a2a2a');})],
      void:[P(10,12,5,11,R=>{R(-3,-8,6,6,'#4a5a9a');R(-3,-8,6,1,'#6ad0ff');R(-3,-3,6,1,'#2a3a6a');}),P(10,10,5,9,R=>{R(-1,-8,2,8,'#6ad0ff');R(-2,-5,4,2,'#bfe8ff');}),P(12,14,6,13,R=>{R(-2,-10,4,10,'#8a6aff');R(-.5,-10,1,8,'#d8ccff');})]
    };
    if(X[theme])out.push(...X[theme]);
    for(const d of (MA.dec[theme]||[])){const sp=P(d[0],d[1],d[2],d[3],R=>d[4](R,C));sp.sc=1.35;out.push(sp);}   /* pixel-art ground details (burrows, shells, bones...), drawn a little larger */
    this.decor[theme]=out;return out;
  }
  getObst(theme){
    this.obst=this.obst||{};
    if(this.obst[theme])return this.obst[theme];
    const C=Sprites.circ,out=(OBSTACLES[theme]||[]).map(d=>{const sp=Sprites.paint(d.W,d.H,d.W/2,d.H-1,R=>d.art(R,C));sp.sc=d.sc||1;sp.kind=d.art&&d.art.kind;return sp;});
    this.obst[theme]=out;return out;
  }
  terrain(cx,cy,vw,vh,t,theme){
    if(theme==='snake'){this.snakeTerrain(cx,cy,vw,vh,t);return;}
    const ctx=this.ctx,TS=64,tl=this.getTiles(theme),dec=this.getDecor(theme),th=THEMES[theme],A=Ambient;
    const x0=Math.floor(cx/TS),y0=Math.floor(cy/TS),x1=Math.floor((cx+vw)/TS),y1=Math.floor((cy+vh)/TS+1.6);
    const water=th.water&&tl.water.length;
    A.beginTerrain(theme,x0,y0,x1,y1);
    const ba=A.back(ctx,cx,cy,vw,vh,t,theme);
    for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
      const h=mhash(tx,ty),w=water&&A.isW(tx,ty);let lv=2;
      if(ba<1)ctx.globalAlpha=ba;
      if(w){
        ctx.drawImage(tl.water[(h*3)|0],tx*TS,ty*TS);
        if(ba<1)ctx.globalAlpha=1;
        if(Math.sin(t*1.5+h*30)>.55){ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(tx*TS+h*30,ty*TS+hash(ty,tx)*40,14,2);}
      }else{
        lv=A.lvl(tx,ty);ctx.drawImage(tl.lv[lv][(h*tl.ground.length)|0],tx*TS,ty*TS);
        if(ba<1)ctx.globalAlpha=1;
      }
      A.tile(ctx,theme,tx,ty,t,TS,w,lv);
    }
    Sea.draw(ctx,cx,cy,vw,vh,t,theme);   /* lakes and the sea: a low-res pixel layer with foam */
    A.waves(ctx,theme,cx,cy,vw,vh,t);
    A.glow(ctx,theme,x0,y0,x1,y1,t,TS);
    /* scenery (second pass so neighbouring tiles never clip it) */
    const k=2/Sprites.S,sea=Sea.has(theme),dn=DEC_DENS[theme]||0;
    for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
      if(water&&A.isW(tx,ty))continue;
      const n2=vnoise(tx*.07+50+MAP.nx,ty*.07+9+MAP.ny),thr=.975-.09*Math.pow(n2,1.3)-dn;
      if(mhash(tx+99,ty-7)>thr){
        const i=(mhash(tx*3+1,ty*5+2)*dec.length)|0,d=dec[i];
        const bx=tx*TS+32+(mhash(tx+3,ty+9)-.5)*28,by=ty*TS+56+(mhash(tx+8,ty+2)-.5)*12;
        if(sea&&Sea.wet(theme,bx,by)>-.05)continue;   /* nothing lies in the sea or on the wet sand */
        const kk=k*(d.sc||1);
        if(!A.decor(ctx,theme,i,d,bx,by,kk,t))ctx.drawImage(d.c,bx-d.ox*kk,by-d.oy*kk,d.c.width*kk,d.c.height*kk);
      }
    }
  }
  /* ---------- menu background ---------- */
  drawMenuBg(dt){if(!this.menuBg)this.menuBg=new MenuBg(this);this.menuBg.draw(dt);}
  vignette(a){
    const ctx=this.ctx;
    if(!this.vign||this.vign.a!==a){const r=Math.hypot(this.W,this.H)/2,g=ctx.createRadialGradient(this.W/2,this.H/2,r*.45,this.W/2,this.H/2,r);g.addColorStop(0,'rgba(4,12,24,0)');g.addColorStop(1,'rgba(4,12,24,'+a+')');this.vign={g,a};}
    ctx.fillStyle=this.vign.g;ctx.fillRect(0,0,this.W,this.H);
  }

  /* ---------- game ---------- */
  /* drop any state a half-finished frame could have left behind (blend mode, alpha, dash, clip stack) */
  /* the slider is applied with a gentle curve (a^1.7): the additive layers of an effect (glow + core + star) add up past 100%, so a straight scale would look unchanged until very low values */
  fxBegin(){if(FXL.a>=1)return;FXL.m=Math.pow(FXL.a,1.7);this.ctx.globalAlpha=1;}
  fxEnd(){if(FXL.m===1)return;FXL.m=1;this.ctx.globalAlpha=1;}
  resetCtx(){const c=this.ctx;try{for(let i=0;i<40;i++)c.restore();}catch(e){}c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.setLineDash([]);c.lineCap='butt';c.lineJoin='miter';c.shadowBlur=0;c.filter='none';}
  draw(g,dt){
    Sprites.warmStep();this.fdt=dt;
    const ctx=this.ctx,s=this.save.d.settings,t=g.t,p=g.p;
    FXL.a=s.fxAlpha===undefined?1:clamp((+s.fxAlpha)/100,0,1);FXL.m=1;
    this.resetCtx();
    ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
    g.vw=this.W/this.Z;g.vh=this.H/this.Z;
    let sx=0,sy=0;if(g.shake>0&&s.shake){sx=rnd(-1,1)*g.shake*(FXL.on?5:14);sy=rnd(-1,1)*g.shake*(FXL.on?5:14);}
    const cx=p.x-g.vw/2+sx,cy=p.y-14-g.vh/2+sy;
    ctx.setTransform(this.Z,0,0,this.Z,-cx*this.Z,-cy*this.Z);
    const theme=g.stage.theme;
    Ambient.setCfg(s);if(g.trial){Ambient.on=false;Ambient.wxOn=false;Ambient.dnOn=false;Ambient.nt=0;Ambient.evI=0;}else Ambient.update(g,dt,t,cx,cy,g.vw,g.vh,theme,p);
    if(g.trial){this.gameRef=g;this.zenoCoins=g.run.coins;this.zenoPl=g.p;this.trialRoom(cx,cy,g.vw,g.vh,t,g.trial);}else this.terrain(cx,cy,g.vw,g.vh,t,theme);
    const vx0=cx-90,vx1=cx+g.vw+90,vy0=cy-130,vy1=cy+g.vh+90;
    if(Ambient.on)Ambient.ground(ctx,t);
    if(theme==='snake'&&Ambient.on&&Ambient.lod>=.5)Ambient.flockShadows(ctx,cx,cy,g.vw,g.vh,t,3,1,0);   /* shadows of the bird flocks gliding over the cloud sea */
    ELEC.n=0;this.fxBegin();
    for(const e of g.en)if(e.bm&&!e.dead)this.drawBmGround(e,t);
    if(g.rain.length)this.drawRainGround(g,t);
    if(FXL.a>0){for(const w of g.weapons.values())if(w.drawGround)w.drawGround(ctx);
    const au=g.weapons.get('aura');if(au){au.draw(ctx);au.elecOverlay(ctx);}}
    this.fxEnd();
    /* ground items */
    for(const gm of (g.trial?[]:g.gm)){
      if(gm.held)continue;   /* carried gems are drawn with the companion */
      const col=gm.v<2.2?'#5ad0ff':gm.v<11?'#ffb13b':'#ff5a3d',r=gm.v<2.2?4:gm.v<11?6:9;
      ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(gm.x,gm.y-r);ctx.lineTo(gm.x+r*.8,gm.y);ctx.lineTo(gm.x,gm.y+r);ctx.lineTo(gm.x-r*.8,gm.y);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillRect(gm.x-1,gm.y-r*.5,2,r*.5);
    }
    if(g.rg&&!g.trial){const r=g.rg,pu=1+.12*Math.sin(t*6),R=(13+Math.min(9,Math.log10(1+r.v)*3))*pu;
      GLOW.at(ctx,r.x,r.y,R*3.2,'#ff3b2f',.75);
      ctx.fillStyle='#b3150c';ctx.beginPath();ctx.moveTo(r.x,r.y-R);ctx.lineTo(r.x+R*.85,r.y);ctx.lineTo(r.x,r.y+R);ctx.lineTo(r.x-R*.85,r.y);ctx.closePath();ctx.fill();
      ctx.fillStyle='#ff5a3d';ctx.beginPath();ctx.moveTo(r.x,r.y-R*.78);ctx.lineTo(r.x+R*.62,r.y);ctx.lineTo(r.x,r.y+R*.78);ctx.lineTo(r.x-R*.62,r.y);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.8)';ctx.fillRect(r.x-R*.14,r.y-R*.55,R*.28,R*.5);
    }
    if(!g.trial)this.drawZones(g,cx,cy,t);
    if(!g.trial)this.drawEvents(g,t);
    this.drawDanger(g,t);this.drawBeams(g,t);
    for(const l of (g.trial?[]:g.loot))this.drawLoot(l,t);
    for(const f of (g.trial?[]:g.feat))this.drawFeature(f,t,g);
    for(const c of (g.trial?[]:g.chests))this.drawChest(c,t);
    /* entities, depth sorted */
    const list=g.en.slice();
    if(!g.trial){const os=this.getObst(theme);for(const b of World.visible(theme,vx0-60,vy0-60,vx1+60,vy1+60))list.push({ob:b,y:b.y,spr:os[b.t]});}
    if(g.trial)for(const ob of g.trial.obs)list.push({pil:ob,y:ob.y});
    if(g.pet)list.push({pet:g.pet,y:g.pet.y});
    list.sort((a,b)=>a.y-b.y);
    for(const e of list){
      if(e.pil){this.drawPillar(e.pil);continue;}
      if(e.pet){this.drawPet(e.pet,t,g);continue;}
      if(e.ob&&e.ob.v!==undefined){const b=e.ob,ri=Sprites.rockImg(b.v,ROCK_TINT[theme]);if(ri){const wd=ri.c.width*b.s;ctx.fillStyle='rgba(0,0,0,.24)';ctx.beginPath();ctx.ellipse(b.x,b.y,Math.min(wd*.5,ri.c.height*b.s*.7),Math.min(wd*.5,ri.c.height*b.s*.7)*.34,0,0,TAU);ctx.fill();ctx.save();ctx.translate(b.x,b.y+2);ctx.scale(b.f*b.s,b.s);ctx.imageSmoothingEnabled=false;ctx.drawImage(ri.c,-ri.ox,-ri.oy);ctx.restore();continue;}}
      if(e.ob){const b=e.ob,sp=e.spr,k=3.1/Sprites.S*(sp.sc||1);ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(b.x,b.y,b.r*1.1,b.r*.5,0,0,TAU);ctx.fill();if(!Ambient.prop(ctx,b,sp,k,theme,t)){ctx.save();ctx.translate(b.x,b.y+2);ctx.scale(b.f*k,k);ctx.drawImage(sp.c,-sp.ox,-sp.oy);ctx.restore();}if(Ambient.on&&sp.kind)ObjLife.draw(ctx,b,sp,t,theme,Ambient);continue;}
      if(e.x<vx0||e.x>vx1||e.y<vy0||e.y>vy1)continue;
      this.drawEnemy(e,t);
    }
    if(g.vic)this.drawVictory(g.vic,t);
    if(g.sbc)this.drawSbc(g,t);
    if(g.held)this.drawHeld(g,t);
    if(g.rain.length)this.drawRainAir(g,t);
    if(g.spheres.length)this.drawSpheres(g,t);
    if(g.ghosts)this.drawGhosts(g,t);
    this.fxBegin();if(FXL.a>0)for(const w of g.weapons.values())if(w.draw&&w.id!=='aura'){w.draw(ctx);w.elecOverlay(ctx);}this.fxEnd();
    if(Ambient.on)Ambient.air(ctx,t);
    if(theme==='snake'&&Ambient.on)SnakeArt.air(ctx,cx,cy,g.vw,g.vh,t);   /* birds, mist, the Flying Nimbus */
    /* projectiles */
    const elv=ELEC.lvl(g);
    this.fxBegin();
    for(const b of (FXL.a>0?g.pr:[])){
      if(b.tr)VFX.trail(ctx,b.tr,b.r*.9,b.c);
      if(b.spear!==undefined){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.spear);GLOW.at(ctx,0,0,b.r*3.4,b.c,.7);ctx.globalCompositeOperation='lighter';ctx.fillStyle=b.c;ctx.fillRect(-30,-2.2,38,4.4);ctx.fillStyle='#fff';ctx.fillRect(-26,-1,34,2);ctx.beginPath();ctx.moveTo(8,-6);ctx.lineTo(24,0);ctx.lineTo(8,6);ctx.closePath();ctx.fillStyle='#fff';ctx.fill();ctx.restore();}
      else VFX.orb(ctx,b.x,b.y,b.r,b.c,t);
      if(elv)ELEC.pt(ctx,b.x,b.y,b.r*1.5+3,b.c,t,elv,b.x*.13+b.y*.07);
    }
    this.fxEnd();
    for(const b of g.eb){if(b.cp)continue;GLOW.at(ctx,b.x,b.y,b.r*3,b.c,.9);ctx.fillStyle=b.c;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x,b.y,b.r*.45,0,TAU);ctx.fill();}
    if(g.eb.some(b=>b.cp)){   /* the Master's copies of your weapons: the same orbs and spears as your own shots */
      this.fxBegin();
      for(const b of g.eb){if(!b.cp)continue;
        if(b.spear!==undefined){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.spear);GLOW.at(ctx,0,0,b.r*3.4,b.c,.7);ctx.globalCompositeOperation='lighter';ctx.fillStyle=b.c;ctx.fillRect(-30,-2.2,38,4.4);ctx.fillStyle='#fff';ctx.fillRect(-26,-1,34,2);ctx.beginPath();ctx.moveTo(8,-6);ctx.lineTo(24,0);ctx.lineTo(8,6);ctx.closePath();ctx.fillStyle='#fff';ctx.fill();ctx.restore();}
        else VFX.orb(ctx,b.x,b.y,b.r*1.15,b.c,t);}
      this.fxEnd();
    }
    /* fx */
    this.fxBegin();
    for(const f of (FXL.a>0?g.fx:[])){
      if(f.beam){
        const k=1-f.l/f.m,a=clamp(f.l/f.m,0,1),w=f.w*(k<.15?k/.15:1)*(.4+.6*a);
        ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.a);ctx.globalCompositeOperation='lighter';
        let gr=ctx.createLinearGradient(0,-w,0,w);gr.addColorStop(0,hexA(f.c,0));gr.addColorStop(.35,hexA(f.c,.75));gr.addColorStop(.5,'rgba(255,255,255,.95)');gr.addColorStop(.65,hexA(f.c,.75));gr.addColorStop(1,hexA(f.c,0));
        ctx.globalAlpha=Math.min(1,a*1.3);ctx.fillStyle=gr;ctx.fillRect(0,-w,f.len,w*2);
        GLOW.at(ctx,0,0,w*1.8,f.c,.9);GLOW.at(ctx,f.len,0,w*1.1,f.c,.6);
        if(f.sbc){ctx.lineCap='round';for(const [col,ph,lw] of [[f.c,0,4],['#b46bff',Math.PI,4],['#ffffff',Math.PI/2,2]]){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();for(let x=0;x<=f.len;x+=7){const yy=Math.sin(x*.05-k*46+ph)*w*.7;if(x)ctx.lineTo(x,yy);else ctx.moveTo(x,yy);}ctx.stroke();}}   /* Special Beam Cannon: the twisting spiral around the core */
        ctx.strokeStyle='#ffffff';ctx.lineWidth=2;for(let q=0;q<6;q++){const x0=Math.random()*f.len,sp=w*.9;ctx.beginPath();ctx.moveTo(x0,(Math.random()-.5)*sp*2);for(let i=1;i<=4;i++)ctx.lineTo(x0+i*22,(Math.random()-.5)*sp*2);ctx.stroke();}
        ctx.restore();continue;
      }
      if(f.bolt){
        const a=clamp(f.l/f.m,0,1);ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineJoin='round';ctx.globalAlpha=a;
        for(const [lw,col] of [[5,f.c],[2,'#ffffff']]){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(f.pts[0][0],f.pts[0][1]);for(let i=1;i<f.pts.length;i++)ctx.lineTo(f.pts[i][0],f.pts[i][1]);ctx.stroke();}
        ctx.restore();continue;
      }
      if(f.pillar){
        const k=1-f.l/f.m,w=44*(1-k*.75),h=360;
        ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-k;
        const gr=ctx.createLinearGradient(0,f.y-h,0,f.y);gr.addColorStop(0,hexA(f.c,0));gr.addColorStop(.7,hexA(f.c,.55));gr.addColorStop(1,hexA(f.c,.9));
        ctx.fillStyle=gr;ctx.fillRect(f.x-w/2,f.y-h,w,h);ctx.fillStyle='#ffffff';ctx.globalAlpha=(1-k)*.6;ctx.fillRect(f.x-w*.18,f.y-h*.8,w*.36,h*.8);ctx.restore();continue;
      }
      if(f.shock){
        const k=1-f.l/f.m,R=f.max*(1-Math.pow(1-k,2.2)),a=1-k;
        ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(f.x,f.y);ctx.scale(1,.8);
        const w=70+110*(1-k),r0=Math.max(1,R-w),gr=ctx.createRadialGradient(0,0,r0,0,0,R+8);
        gr.addColorStop(0,hexA(f.c,0));gr.addColorStop(.72,hexA(f.c,.45*a));gr.addColorStop(.94,hexA('#ffffff',.95*a));gr.addColorStop(1,hexA(f.c,0));
        ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,R+8,0,TAU);ctx.fill();
        ctx.lineWidth=3+5*(1-k);ctx.strokeStyle=hexA('#ffffff',.8*a);ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.stroke();
        ctx.lineWidth=2;ctx.strokeStyle=hexA(f.c,.6*a);ctx.beginPath();ctx.arc(0,0,R*.82,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(0,0,R*.64,0,TAU);ctx.stroke();
        ctx.lineWidth=2;ctx.strokeStyle=hexA('#ffffff',.5*a);
        for(let i=0;i<28;i++){const an=i/28*TAU+f.max*.01,r1=R-30-((i*37)%60),r2=R+6;ctx.beginPath();ctx.moveTo(Math.cos(an)*r1,Math.sin(an)*r1);ctx.lineTo(Math.cos(an)*r2,Math.sin(an)*r2);ctx.stroke();}
        ctx.restore();continue;
      }
      if(f.ring){const k=1-f.l/f.m;ctx.strokeStyle=f.c;ctx.globalAlpha=1-k;ctx.lineWidth=5*(1-k)+1;ctx.beginPath();ctx.arc(f.x,f.y,f.r*k,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
      else{ctx.fillStyle=f.c;ctx.globalAlpha=clamp(f.l/f.m*1.4,0,1);ctx.fillRect(f.x-f.s/2,f.y-f.s/2,f.s,f.s);ctx.globalAlpha=1;}
    }
    this.fxEnd();
    /* the character model (and its aura) is always on top of every ability effect */
    this.drawPlayer(g,t);
    /* floating texts. Damage on enemies (c 0) and critical hits (c 6) are drawn as sprites of a clean medium-weight lettering (dmgSpr) and stay on screen DMG_T seconds; the rest keep the plain font */
    ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.7)';
    const smo=ctx.imageSmoothingEnabled;
    for(const d of g.tx){
      const L=d.l||.8,u=d.t/L,a=u<.62?1:clamp(1-(u-.62)/.38,0,1),y=d.y-d.t*(L>.8?30:34);
      if(d.c===0||d.c===6){
        const cr=d.c===6,sp=this.dmgSpr(String(d.s),cr),pop=d.t<.12?1+(.12-d.t)/.12*(cr?.5:.25):1,k=pop/sp.ds,sh=cr&&d.t<.2?Math.sin(d.t*90)*(1-d.t/.2)*2.2:0;
        ctx.globalAlpha=a;ctx.imageSmoothingEnabled=true;
        ctx.drawImage(sp.cv,d.x-sp.w*k/2+sh,y-sp.h*k*.72,sp.w*k,sp.h*k);
        continue;
      }
      ctx.globalAlpha=a;
      ctx.fillStyle=d.c===1?'#ffd23f':d.c===4?'#ff6b6b':d.c===2?'#ffb0b0':d.c===3?'#9fe8ff':'#fff';
      const txt=String(d.s);
      ctx.font=(d.c===1?'900 17px':(typeof d.s==='string'?'700 14px':'700 13px'))+' "Rajdhani",sans-serif';
      ctx.strokeText(txt,d.x,y);ctx.fillText(txt,d.x,y);
    }
    ctx.imageSmoothingEnabled=smo;
    ctx.globalAlpha=1;
    ctx.setTransform(1,0,0,1,0,0);
    this.vignette(g.dying?Math.min(.9,.5+.5*g.dying.t/.6):.5);if(g.dying){const dk=Math.min(.45,g.dying.t*.6);ctx.fillStyle='rgba(40,0,0,'+dk+')';ctx.fillRect(0,0,this.W,this.H);}
    if(!g.trial)Ambient.screen(ctx,this.W,this.H,this.U,t);
    if(!g.trial)this.eventOverlay(g,t);
    if(g.tsT>0){ctx.fillStyle='rgba(215,225,255,'+Math.min(.3,g.tsT*.3)+')';ctx.fillRect(0,0,this.W,this.H);}
    if(g.xform&&!g.xform.released){const c=g.xform.t/g.xform.rel;ctx.fillStyle='rgba(2,4,18,'+(.42*c)+')';ctx.fillRect(0,0,this.W,this.H);ctx.globalAlpha=.25*c;ctx.fillStyle=g.xform.col;ctx.fillRect(0,0,this.W,this.H);ctx.globalAlpha=1;}
    if(g.flash>0){ctx.globalAlpha=clamp(g.flash*1.5,0,.8)*(FXL.on?.3:1);ctx.fillStyle=g.flashC;ctx.fillRect(0,0,this.W,this.H);ctx.globalAlpha=1;}
    this.hud(g,dt,cx,cy);
  }
  /* the lettering of the damage numbers: a clean, upright, medium-weight font (white for a hit, red for a critical hit) with a thin dark outline for contrast.
     It is drawn at twice the size and shown scaled down with smoothing, so the digits stay sharp and easy to read. One sprite per (text, critical?), cached */
  dmgSpr(txt,crit){
    const m=this._dm||(this._dm=new Map()),key=(crit?'c':'n')+txt;let sp=m.get(key);if(sp)return sp;
    const DS=2,fs=(crit?21:17)*DS,ff=(crit?'700 ':'600 ')+fs+'px "Rajdhani","Segoe UI","Trebuchet MS",Arial,sans-serif',mc=this._dmc||(this._dmc=document.createElement('canvas').getContext('2d'));
    mc.font=ff;const ow=2.2*DS,pad=Math.ceil(ow)+2,w=Math.ceil(mc.measureText(txt).width)+pad*2,h=Math.ceil(fs*1.15)+pad*2,cv=document.createElement('canvas');cv.width=w;cv.height=h;
    const c=cv.getContext('2d'),base=h-pad-Math.round(fs*.2);c.font=ff;c.textBaseline='alphabetic';c.textAlign='left';c.lineJoin='round';
    c.lineWidth=ow;c.strokeStyle='rgba(8,6,20,.92)';c.strokeText(txt,pad,base);   /* thin dark outline */
    c.fillStyle=crit?'#ff5646':'#ffffff';c.fillText(txt,pad,base);
    sp={cv,w,h,ds:DS};
    let ok=true;try{ok=!document.fonts||document.fonts.check('600 12px "Rajdhani"');}catch(e){}
    if(ok){if(m.size>500)m.clear();m.set(key,sp);}
    return sp;
  }
  drawPlayer(g,t){
    const ctx=this.ctx,p=g.p,u=(g.C.u||1.95);
    let frame=g.cast?6:p.atk>0?(p.atk>.17?5:6):p.mv?Sprites.walkFrame(g.pcKey,t):0;
    /* imported sprite sheets: charging a beam is a normal walk/idle (the pack's wind-up/thrust frames are full poses), the arm only
       extends (frame 6) while the beam is actually firing; a plain shot while moving keeps the walk cycle */
    if(Sprites.sheetFor(g.pcKey)){
      if(g.fireT>0)frame=6;
      else if(p.mv)frame=Sprites.walkFrame(g.pcKey,t);
      else if(g.cast)frame=0;
    }
    /* optional sheet frames for the weapon poses (10-15, see pose.js / docs/SPRITES_AI.md); only when the sheet declares them */
    let pzS=null;
    if(!g.dying&&Sprites.sheetFor(g.pcKey)&&!g.xform&&!(g.dashT>0&&Sprites.sheetHas(g.pcKey,8))){const z0=Pose.cur(g),f2=z0?Pose.sheetFrame(z0):0;if(f2&&Sprites.sheetHas(g.pcKey,f2)){frame=f2;pzS=z0;}}
    if(g.dying)frame=0;
    const flash=!g.dying&&p.inv>0&&((t*20)|0)%2===0&&p.inv<.45;
    let ex=g.dying?'hurt':null;
    if(g.emo&&g.emoT>0)ex=g.emo;else if(!g.cast&&!(p.atk>0)&&(g.rt%4.3)>4.17)ex='blink';
    const xf=g.xform,old=xf&&!xf.released?xf.old:null,pcc=old?old.pc:g.pc,pck=old?old.key:g.pcKey;
    /* imported sprite sheets: power-up pose while transforming (the new form's own burst frame), dash pose while dashing */
    let pk2=pck,pc2=pcc,dashing=false;
    if(xf){
      if(!xf.released||xf.t-xf.rel<.55){const has=Sprites.sheetHas;const pf=xf.released?(((g.rt*8)|0)%2?2:3)/4+.01:Math.min(.99,xf.t/xf.rel);if(has(g.pcKey,7)){frame=Sprites.poseFrame(g.pcKey,'pw',pf);pk2=g.pcKey;pc2=g.pc;}else if(has(pck,7)){frame=Sprites.poseFrame(pck,'pw',pf);}}
    }else if(g.dashT>0&&Sprites.sheetHas(pck,8)){frame=Sprites.poseFrame(pck,'dh',1-g.dashT/.26);dashing=true;}
    /* weapon animations (pose.js): the body is painted without arms (legs keep walking) and the arms are drawn by the pose; the character
       looks toward the aim while it acts. Imported sprite sheets, transformations, dashes and death keep their own frames. */
    let pz=null,fm=frame,fd=p.face;
    if(!g.dying&&!xf&&!dashing&&!Sprites.sheetFor(g.pcKey)){pz=Pose.cur(g);if(pz){fm=(p.mv?Sprites.walkFrame(g.pcKey,t):0)+(POSE_FIERCE[pz.st]?30:20);g.pfd=Pose.fdOf(g,pz.a);g.pfdUntil=g.rt+.3;}}
    if(pzS){g.pfd=Pose.fdOf(g,pzS.a);g.pfdUntil=g.rt+.3;}
    if(!g.dying&&g.pfdUntil>g.rt&&g.pfd)fd=g.pfd;
    const sp=Sprites.player(pk2,pc2,fm,false,ex),k=u/(sp.s||Sprites.S);
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(p.x,p.y,7*u,2.4*u,0,0,TAU);ctx.fill();
    this.fxBegin();
    if(dashing)this.dashTrail(g,pck,pcc,k,t);
    if(xf){
      const rt=g.rt,ch=xf.released?1:xf.t/xf.rel,ak=xf.released?1+Math.max(0,1-(xf.t-xf.rel)/(xf.dur-xf.rel))*1.7:.35+ch*2.1;
      const col=xf.col,R0=(46+xf.idx*5)*ak;
      GLOW.at(ctx,p.x,p.y-26,R0*1.5,col,.7);GLOW.at(ctx,p.x,p.y-26,R0*.9,'#ffffff',.35+.3*ch*(xf.released?0:1));
      ctx.save();ctx.globalCompositeOperation='lighter';
      ctx.strokeStyle=hexA(col,.8);ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y,R0*.8,R0*.26,0,0,TAU);ctx.stroke();
      ctx.strokeStyle=hexA('#ffffff',.5);ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(p.x,p.y,R0*.55,R0*.18,0,0,TAU);ctx.stroke();
      const nF=16;
      for(let i=0;i<nF;i++){
        const u=i/(nF-1)-.5,bx=p.x+u*R0*1.5,by=p.y-2-Math.abs(u)*8,h=(54+xf.idx*7)*ak*(1-Math.abs(u)*.9)*(.65+.35*Math.sin(rt*17+i*1.9)),w=7+4*ak,sw=Math.sin(rt*13+i*2.3)*6;
        ctx.fillStyle=hexA(i%3?col:'#ffffff',i%3?.38:.22);
        ctx.beginPath();ctx.moveTo(bx-w,by);ctx.quadraticCurveTo(bx-w*.4+sw,by-h*.55,bx+sw*1.4,by-h);ctx.quadraticCurveTo(bx+w*.4+sw,by-h*.5,bx+w,by);ctx.closePath();ctx.fill();
      }
      ctx.restore();
    }else if(g.bers>0){
      const rt=g.rt,R0=74,fl=1+Math.sin(rt*16)*.08;
      GLOW.at(ctx,p.x,p.y-26,R0*1.9*fl,'#4aff2a',.85);GLOW.at(ctx,p.x,p.y-26,R0*1.0,'#eaffb0',.4);
      ctx.save();ctx.globalCompositeOperation='lighter';
      for(let i=0;i<3;i++){const kk=(rt*1.5+i/3)%1;ctx.strokeStyle=hexA('#b8ff6a',(1-kk)*.8);ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y,24+R0*1.5*kk,(24+R0*1.5*kk)*.32,0,0,TAU);ctx.stroke();}
      for(let i=0;i<20;i++){const u=i/19-.5,bx=p.x+u*R0*1.7,by=p.y-2-Math.abs(u)*6,h=(78+10*Math.sin(i))*(1-Math.abs(u)*.85)*(.6+.4*Math.sin(rt*21+i*2.2)),w=8,sw=Math.sin(rt*15+i*1.9)*7;
        ctx.fillStyle=hexA(i%3===0?'#eaffb0':i%2?'#5aff2a':'#9aff4a',.42);ctx.beginPath();ctx.moveTo(bx-w,by);ctx.quadraticCurveTo(bx-w*.4+sw,by-h*.55,bx+sw*1.4,by-h);ctx.quadraticCurveTo(bx+w*.4+sw,by-h*.5,bx+w,by);ctx.closePath();ctx.fill();}
      ctx.restore();
    }else if(g.kai>0){
      this.kaiAura(g,t);
    }else if(g.formIdx>=0){
      const f=1+Math.sin(t*14)*.07;
      GLOW.at(ctx,p.x,p.y-24,(40+g.formIdx*5)*f,g.formColor,.65);
      GLOW.at(ctx,p.x,p.y-24,(26+g.formIdx*3)*f,'#ffffff',.2);
    }
    if(g.perfAura&&!g.dying){      /* a trinket at 100% perfection: the silver-white Ultra Instinct glow */
      const f=1+Math.sin(t*3.2)*.08;GLOW.at(ctx,p.x,p.y-24,52*f,'#cfeaff',.5);GLOW.at(ctx,p.x,p.y-24,30*f,'#ffffff',.24);
      if(!FXL.on){ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(235,246,255,.55)';for(let i=0;i<5;i++){const a=t*1.3+i*TAU/5,rr=17+4*Math.sin(t*3+i);ctx.fillRect(p.x+Math.cos(a)*rr-1,p.y-24+Math.sin(a)*rr*1.35-1,2,2);}ctx.restore();}
    }
    if(g.barrierReady){ctx.strokeStyle='rgba(138,216,255,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y-20,30,0,TAU);ctx.stroke();}
    {const ab=g.abil;
      if(g.regenT>0)GLOW.at(ctx,p.x,p.y-24,48,ab.c,.45+.15*Math.sin(t*10));
      if(g.abBuf){const f2=1+Math.sin(t*16)*.08;GLOW.at(ctx,p.x,p.y-24,58*f2,ab.c,.55);GLOW.at(ctx,p.x,p.y-24,30*f2,'#ffffff',.25);}
      if(g.critT>0)GLOW.at(ctx,p.x,p.y-24,50,ab.c,.5);
      if(g.shieldT>0){const a2=Math.min(1,g.shieldT*2);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55*a2;const gr=ctx.createRadialGradient(p.x,p.y-22,6,p.x,p.y-22,40);gr.addColorStop(0,hexA(ab.c,.05));gr.addColorStop(.8,hexA(ab.c,.35));gr.addColorStop(1,hexA('#ffffff',.8));ctx.fillStyle=gr;ctx.beginPath();ctx.arc(p.x,p.y-22,40,0,TAU);ctx.fill();ctx.restore();}
      if(g.clones){for(const q of g.clones){if(q.x===undefined)continue;const s2=Sprites.player(pck,pcc,frame,false,null);ctx.save();ctx.globalAlpha=.55;ctx.translate(q.x,q.y);ctx.scale(p.face*k,k);ctx.imageSmoothingEnabled=!s2.px;ctx.drawImage(s2.c,-s2.ox,-s2.oy);ctx.restore();ctx.imageSmoothingEnabled=false;GLOW.at(ctx,q.x,q.y-22,26,ab.c,.35);}}
    }
    this.fxEnd();
    const bob=p.mv&&!sp.px?-Math.abs(Math.sin(t*9))*1.2:0;   /* pack sprites bob inside their own walk frames */
    const Z=pz?Pose.build(g,pz,u,fd,Sprites.pose(fm).bob,bob):null,blink=!g.dying&&p.inv>0&&p.inv<.45,whiteArm=flash&&!xf;
    if(Z){ctx.save();if(blink)ctx.globalAlpha=.55;Pose.limb(ctx,Z.B,g.pc,u,false,whiteArm);ctx.restore();}   /* the far arm goes behind the body */
    ctx.save();ctx.translate(p.x,p.y+bob);
    if(g.dying){const dd=g.dying.t,kd=Math.min(1,dd/.6);ctx.rotate(-p.face*(Math.PI/2)*(1-Math.pow(1-kd,3)));ctx.globalAlpha=1-.55*Math.min(1,Math.max(0,(dd-.5)/1.4));}
    ctx.scale(fd*k,k);
    if(!g.dying&&p.inv>0&&p.inv<.45)ctx.globalAlpha=.55;
    ctx.imageSmoothingEnabled=!sp.px;
    ctx.drawImage((flash&&!xf?Sprites.player(pk2,pc2,fm,true,ex):sp).c,-sp.ox,-sp.oy);
    ctx.restore();ctx.imageSmoothingEnabled=false;
    if(g.dying&&g.dying.t>.45){   /* the soul leaves the body: a golden halo rises and fades */
      const s2=Math.min(1,(g.dying.t-.45)/1.4),hy=p.y-16*u-s2*60,al=1-.7*s2;
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=hexA('#ffe86a',al);ctx.lineWidth=3;
      ctx.beginPath();ctx.ellipse(p.x,hy,13,4.6,0,0,TAU);ctx.stroke();ctx.strokeStyle=hexA('#ffffff',al*.7);ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(p.x,hy,13,4.6,0,0,TAU);ctx.stroke();
      ctx.globalAlpha=al*.5;GLOW.at(ctx,p.x,hy+8,26,'#fff3b0',.5);ctx.restore();
    }
    if(g.emo&&g.emoT>0)this.drawEmote(g.emo,p.x+13,p.y-58*(u/1.95)-8-Math.sin(g.rt*8)*1.5,t);
    const SB=pzS?Pose.sheetBall(g,pzS,frame,fd,u,bob):null,BL=Z?Z.ball:SB;
    if(BL&&!g.cast){   /* the ball in the hand (Ki Blast wind-up, Spirit Bomb above the head) */
      const bl=BL||SB,col=(pz||pzS).col||'#ffd24a';
      this.fxBegin();VFX.orb(ctx,bl.x,bl.y,bl.r,col,g.rt);ctx.save();ctx.globalCompositeOperation='lighter';GLOW.at(ctx,bl.x,bl.y,bl.r*(3+.3*Math.sin(g.rt*30)),col,.35);ctx.restore();this.fxEnd();
    }
    if(g.cast){
      const c=g.cast,kk=clamp(c.t/c.dur,0,1),a=c.a,ca=Math.cos(a),sa=Math.sin(a),d=9+9*kk;
      let hx=p.x+ca*d,hy=p.y-17+sa*d;
      if(Z&&Z.ball){hx=Z.ball.x;hy=Z.ball.y;}   /* procedural arms: the ball is held between the hands */
      else if(SB){hx=SB.x;hy=SB.y;}   /* sheet frame 10: the hand anchor of the sprite */
      else{ctx.lineCap='round';ctx.strokeStyle=g.pc.skin;ctx.lineWidth=3.4;
        if(!sp.px)for(const sd of[-1,1]){ctx.beginPath();ctx.moveTo(p.x+sd*4,p.y-18);ctx.lineTo(hx-sa*sd*2.4,hy+ca*sd*2.4);ctx.stroke();}}
      this.fxBegin();VFX.orb(ctx,hx,hy,4+9*kk,c.color,g.rt);
      if(c.kind==='kame'){ctx.save();ctx.globalCompositeOperation='lighter';GLOW.at(ctx,hx,hy,(14+26*kk)*(1+.1*Math.sin(g.rt*19)),c.color,.55*kk+.2);   /* charging ball: pulsing halo and rotating rays */
        for(let i=0;i<8;i++){const aa=g.rt*3+i*TAU/8,r0=5+9*kk,l=(10+16*kk)*(.7+.3*Math.sin(g.rt*17+i));ctx.strokeStyle=hexA('#ffffff',.25+.45*kk);ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(hx+Math.cos(aa)*r0,hy+Math.sin(aa)*r0);ctx.lineTo(hx+Math.cos(aa)*(r0+l),hy+Math.sin(aa)*(r0+l));ctx.stroke();}ctx.restore();}
      ctx.save();ctx.globalCompositeOperation='lighter';
      for(let i=0;i<10;i++){const aa=g.rt*7+i*.63,rr=(1-kk)*46+10+((i*13)%7),px=hx+Math.cos(aa)*rr,py=hy+Math.sin(aa)*rr*.8;ctx.globalAlpha=.5+.4*kk;ctx.strokeStyle=i%2?c.color:'#fff';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+(hx-px)*.22,py+(hy-py)*.22);ctx.stroke();}
      ctx.globalAlpha=.35*kk;ctx.strokeStyle=c.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(hx,hy,16+30*(1-kk),0,TAU);ctx.stroke();
      ctx.restore();this.fxEnd();
    }
    if(Z){ctx.save();if(blink)ctx.globalAlpha=.55;Pose.limb(ctx,Z.A,g.pc,u,true,whiteArm);ctx.restore();}   /* the near arm in front */
  }
  /* Kaioken: a constant, living red aura (as in the anime) - glow, wavering flame tongues in two layers, a pulsing outline halo, rising sparks and ground rings.
     Drawn with the player, i.e. above every ability effect, so it never fades into the background. */
  kaiAura(g,t){
    const ctx=this.ctx,p=g.p,x2=g.kai===2,k2=x2?1.55:1,fi=g.formIdx>=0?g.formIdx:0,R0=(48+fi*4)*k2,rt=g.rt,pul=1+Math.sin(rt*11)*.07+Math.sin(rt*23)*.03;
    const cy=p.y-24;
    GLOW.at(ctx,p.x,cy,R0*1.85*pul,'#ff1a10',.55);GLOW.at(ctx,p.x,cy,R0*1.15*pul,'#ff4a2a',.7);GLOW.at(ctx,p.x,cy,R0*.62,'#ffc0a0',.28);
    ctx.save();ctx.globalCompositeOperation='lighter';
    /* ground rings expanding outward, continuously */
    for(let i=0;i<(FXL.on?1:3);i++){const kk=(rt*(x2?1.7:1.2)+i/3)%1,rr=18+R0*1.1*kk;ctx.strokeStyle=hexA('#ff4a3a',(1-kk)*.7);ctx.lineWidth=2.6*(1-kk)+.8;ctx.beginPath();ctx.ellipse(p.x,p.y,rr,rr*.3,0,0,TAU);ctx.stroke();}
    /* flame tongues: back layer (wide, dark red) then front layer (narrow, orange/white), each sways and licks upward on its own phase */
    const layers=[[x2?20:14,1.0,'#d81408',.38,.9],[x2?16:11,.78,'#ff5a2a',.5,1.2],[x2?12:8,.55,'#ffd0a0',.42,1.55]];
    for(const [n0,hs,col,al,sp] of layers){
      const n=FXL.on?Math.ceil(n0*.4):n0;
      for(let i=0;i<n;i++){
        const u=(i+.5)/n-.5,fx=p.x+u*R0*1.35,by=p.y-1-Math.abs(u)*10;
        const ph=rt*sp*5+i*2.37+hs*3,flick=.62+.38*Math.sin(ph*1.9)*Math.sin(ph*.7+1),h=(58+k2*22)*hs*(1-Math.abs(u)*.8)*flick*(1+.1*fi/6);
        const w=(6+k2*3)*hs*(1+.25*Math.sin(ph)),sw=Math.sin(ph)*8*hs+u*10,sw2=Math.sin(ph*1.3+.9)*5;
        ctx.fillStyle=hexA(col,al*(.75+.25*Math.sin(ph*2.1)));
        ctx.beginPath();ctx.moveTo(fx-w,by);ctx.quadraticCurveTo(fx-w*.5+sw2,by-h*.5,fx+sw,by-h);ctx.quadraticCurveTo(fx+w*.5+sw2,by-h*.55,fx+w,by);ctx.closePath();ctx.fill();
      }
    }
    /* vertical streaks hugging the body (the 'wind' of the aura) */
    ctx.lineCap='round';
    for(let i=0;i<(x2?10:6);i++){const ph=(rt*(1.4+i*.17)+i*.31)%1,sx=p.x+Math.sin(i*2.9+rt*2)*R0*.45,sy0=p.y-ph*70*k2;ctx.strokeStyle=hexA(i%2?'#ffffff':'#ff9a7a',(1-ph)*.65);ctx.lineWidth=1.6+k2;ctx.beginPath();ctx.moveTo(sx,sy0);ctx.lineTo(sx+Math.sin(rt*9+i)*3,sy0-16-8*k2);ctx.stroke();}
    /* pulsing outline halo + rising embers */
    ctx.strokeStyle=hexA('#ff3a2a',.5+.2*Math.sin(rt*14));ctx.lineWidth=2.4;ctx.beginPath();ctx.ellipse(p.x,cy+6,R0*.5*pul,R0*.78*pul,0,0,TAU);ctx.stroke();
    ctx.strokeStyle=hexA('#ffd0b0',.3);ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(p.x,cy+6,R0*.42*pul,R0*.68*pul,0,0,TAU);ctx.stroke();
    for(let i=0;i<(x2?12:7);i++){const ph=(rt*(.9+i*.13)+i*.43)%1,ex=p.x+Math.sin(i*5.1+rt*3)*R0*.55*(1-ph*.3),ey=p.y-6-ph*R0*1.5;ctx.fillStyle=hexA(i%2?'#ffe0c0':'#ff6a4a',(1-ph)*.9);ctx.fillRect(ex-1.3,ey-1.3,2.6,2.6);}
    ctx.restore();
  }
  /* dash: speed-lines frame (9) of the sheet behind the player + two fading dash-pose after-images */
  dashTrail(g,pck,pcc,k,t){
    const ctx=this.ctx,p=g.p,bv=g.bv,ang=bv&&(bv.x||bv.y)?Math.atan2(bv.y,bv.x):(p.face>0?0:Math.PI),dx=Math.cos(ang),dy=Math.sin(ang);
    const a=Math.max(0,Math.min(1,g.dashT/.26));
    if(Sprites.sheetHas(pck,9)){
      const s9=Sprites.player(pck,pcc,9,false,null);
      ctx.save();ctx.translate(p.x-dx*34,p.y-dy*34-16);ctx.rotate(Math.cos(ang)<0?ang+Math.PI:ang);ctx.scale(k*1.15,k*1.15);ctx.globalAlpha=.9*a+.1;ctx.imageSmoothingEnabled=false;
      ctx.drawImage(s9.c,-s9.c.width/2,-s9.c.height/2);ctx.restore();
    }
    const s8=Sprites.player(pck,pcc,8,false,null);
    for(let i=1;i<=2;i++){
      ctx.save();ctx.translate(p.x-dx*i*26,p.y-dy*i*26);ctx.scale(p.face*k,k);ctx.globalAlpha=.34/i*(.4+a*.6);ctx.imageSmoothingEnabled=false;
      ctx.drawImage(s8.c,-s8.ox,-s8.oy);ctx.restore();
    }
  }
  /* ---------- Snake Way: sea of orange clouds, the blue snake is the only road ---------- */
  snakeTerrain(cx,cy,vw,vh,t){
    const ctx=this.ctx;
    ctx.fillStyle='#f5a62c';ctx.fillRect(cx-4,cy-4,vw+8,vh+40);
    for(let L=0;L<2;L++){
      const C=L?170:250,g0=Math.floor((cx-C)/C),g1=Math.floor((cx+vw+C)/C),h0=Math.floor((cy-C)/C),h1=Math.floor((cy+vh+C*2)/C);
      for(let gx=g0;gx<=g1;gx++)for(let gy=h0;gy<=h1;gy++){
        const h=hash(gx*7+L*31,gy*3+11);if(h<.4)continue;
        const x=(gx+hash(gx+5,gy+L))*C+Math.sin(t*(.22+L*.1)+h*9)*14,y=(gy+hash(gx,gy+9))*C+Math.cos(t*.17+h*7)*8,rx=C*(.45+h*.5),ry=rx*.42;
        ctx.globalAlpha=L?.34:.28;ctx.fillStyle=h<.7?(L?'#ffd25c':'#e8861c'):(L?'#fff0a8':'#d8741a');
        ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();
        ctx.beginPath();ctx.ellipse(x+rx*.5,y-ry*.3,rx*.6,ry*.7,0,0,TAU);ctx.fill();
      }
    }
    ctx.globalAlpha=1;
    SnakeArt.decor(ctx,cx,cy,vw,vh,t);   /* little floating things in the cloud sea */
    const x0=Math.max(-Snake.XMAX,cx-80),x1=Math.min(Snake.XMAX,cx+vw+80);if(x1<x0)return;
    const path=(dy)=>{ctx.beginPath();ctx.moveTo(x0,Snake.f(x0)+dy);for(let x=x0+20;x<x1+20;x+=20){const xx=Math.min(x,x1);ctx.lineTo(xx,Snake.f(xx)+dy);}};
    ctx.lineCap='round';ctx.lineJoin='round';
    path(18);ctx.strokeStyle='rgba(150,60,0,.32)';ctx.lineWidth=Snake.HW*2+12;ctx.stroke();                 /* shadow on the clouds */
    path(0);ctx.strokeStyle='#17356c';ctx.lineWidth=Snake.HW*2+10;ctx.stroke();                              /* outline */
    path(0);ctx.strokeStyle='#3b78c4';ctx.lineWidth=Snake.HW*2;ctx.stroke();                                 /* body */
    path(0);ctx.strokeStyle='#5a9ae0';ctx.lineWidth=Snake.HW*1.5;ctx.stroke();
    path(0);ctx.strokeStyle='#8cc4f0';ctx.lineWidth=Snake.HW*.72;ctx.stroke();                               /* belly */
    /* scales and dorsal spikes, drawn along the path */
    const st=34,i0=Math.ceil(x0/st),i1=Math.floor(x1/st);
    ctx.lineWidth=2;
    for(let i=i0;i<=i1;i++){
      const x=i*st,y=Snake.f(x),sl=Snake.df(x),nl=Math.hypot(1,sl),nx=-sl/nl,ny=1/nl,tx=1/nl,ty=sl/nl;
      for(let r=-3;r<=3;r++){
        const off=r*Snake.HW*.27,sh=((i+r)&1)?st*.5:0,px=x+nx*off+tx*sh,py=y+ny*off+ty*sh;
        ctx.strokeStyle=r%2?'rgba(23,53,108,.38)':'rgba(255,255,255,.22)';
        ctx.beginPath();ctx.arc(px-tx*6,py-ty*6,11,-.9,.9);ctx.stroke();
      }
      for(const sd of[-1,1]){
        const ex=x+nx*sd*(Snake.HW+3),ey=y+ny*sd*(Snake.HW+3),ox=nx*sd,oy=ny*sd,h=11+6*hash(i,sd+3);
        ctx.fillStyle='#17356c';ctx.beginPath();ctx.moveTo(ex-tx*8,ey-ty*8);ctx.lineTo(ex+ox*h,ey+oy*h);ctx.lineTo(ex+tx*8,ey+ty*8);ctx.closePath();ctx.fill();
        ctx.fillStyle='#4a86d0';ctx.beginPath();ctx.moveTo(ex-tx*5,ey-ty*5);ctx.lineTo(ex+ox*(h-4),ey+oy*(h-4));ctx.lineTo(ex+tx*5,ey+ty*5);ctx.closePath();ctx.fill();
      }
    }
    SnakeArt.body(ctx,x0,x1,t);   /* light running down the body, sparkles on the scales */
    for(const I of Snake.islandsIn(cx-260,cx+vw+260)){if(I.y+I.r*1.6<cy-60||I.y-I.r-140>cy+vh)continue;SnakeArt.isle(ctx,I,t);}   /* the islands you can walk onto */
    ctx.lineCap='butt';ctx.lineJoin='miter';
  }
  /* Janemba's beam: thin warning line while charging, then a thick crimson beam */
  drawBeams(g,t){
    const ctx=this.ctx;
    for(const b of g.jbeams||[]){
      const fire=b.t>=b.charge,k=fire?(b.t-b.charge)/b.fire:b.t/b.charge;
      ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.a);
      if(b.cp){   /* the Master copies your beam: the same Kamehameha art in the colour of your weapon */
        const c=b.col||'#ffffff';
        if(!fire){ctx.strokeStyle=hexA(c,.35+.35*Math.sin(t*26)*.5+.2);ctx.lineWidth=2+k*4;ctx.setLineDash([16,10]);ctx.lineDashOffset=-t*120;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(b.len,0);ctx.stroke();ctx.setLineDash([]);
          const r=8+26*k;GLOW.at(ctx,26,0,r*2,c,.5+.4*k);ctx.fillStyle=hexA('#ffffff',.5+.4*k);ctx.beginPath();ctx.arc(26,0,r*.5,0,TAU);ctx.fill();}
        else VFX.beam(ctx,b.len,b.w*2,c,Math.min(1,(1-k)*3.2,k*14+.15),t,b.a*3,false,true);
        ctx.restore();continue;
      }
      if(!fire){
        ctx.strokeStyle='rgba(255,60,90,'+(.35+.4*Math.sin(t*26)*.5+.2)+')';ctx.lineWidth=3+k*5;ctx.setLineDash([16,10]);ctx.lineDashOffset=-t*120;
        ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(b.len,0);ctx.stroke();ctx.setLineDash([]);
        const r=10+34*k;ctx.fillStyle='rgba(255,120,150,'+(.4+.4*k)+')';ctx.beginPath();ctx.arc(26,0,r,0,TAU);ctx.fill();
      }else{
        const w=b.w*(1.1-.35*k)*(.92+.08*Math.sin(t*60));
        const gr=ctx.createLinearGradient(0,-w,0,w);gr.addColorStop(0,'rgba(120,10,70,0)');gr.addColorStop(.3,'rgba(255,40,100,.75)');gr.addColorStop(.5,'rgba(255,230,240,.95)');gr.addColorStop(.7,'rgba(255,40,100,.75)');gr.addColorStop(1,'rgba(120,10,70,0)');
        ctx.fillStyle=gr;ctx.fillRect(0,-w,b.len,w*2);
        ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillRect(0,-w*.22,b.len,w*.44);
        ctx.fillStyle='rgba(255,90,140,.9)';ctx.beginPath();ctx.arc(0,0,w*1.15,0,TAU);ctx.fill();
      }
      ctx.restore();
    }
  }
  drawDanger(g,t){
    const ctx=this.ctx;
    for(const z of g.bz){
      const k=Math.min(1,z.t/z.dur),pul=.5+.5*Math.sin(t*18);
      ctx.save();ctx.translate(z.x,z.y);ctx.scale(1,.8);
      ctx.fillStyle=z.cp?hexA(z.c,.08+.12*k):'rgba(255,50,40,'+(.08+.12*k)+')';ctx.beginPath();ctx.arc(0,0,z.r,0,TAU);ctx.fill();
      ctx.fillStyle=z.cp?hexA(z.c,.18+.24*k):'rgba(255,90,50,'+(.16+.22*k)+')';ctx.beginPath();ctx.arc(0,0,z.r*k,0,TAU);ctx.fill();
      ctx.strokeStyle=z.cp?hexA(z.c,.7+.25*pul):'rgba(255,'+(120+pul*100|0)+',80,.95)';ctx.lineWidth=2.5;ctx.setLineDash([8,6]);ctx.lineDashOffset=-t*50;ctx.beginPath();ctx.arc(0,0,z.r,0,TAU);ctx.stroke();ctx.setLineDash([]);
      ctx.restore();
    }
  }
  drawEnemy(e,t){
    const ctx=this.ctx,def=e.boss?e.bd:e.def,sd=def.sp,u=sd.u||def.u||1.6;
    let frame=e.atk>0?(e.atk>.18?5:6):(e.fuse>0?5:(e.st===2&&e.ai==='charge')?6:1+((t*8+e.ph)|0)%4);
    const fuseFlash=e.fuse>0&&((e.fuse*12)|0)%2===0,warn=(e.st===1&&e.ai==='charge')||(e.xf&&!e.xf.released&&((t*14)|0)%2===0)||(e.st===1&&(e.ai==='slam'||e.ai==='leap')&&((t*16)|0)%2===0);
    const flash=e.fl>0||fuseFlash||warn||(e.tel&&e.telK>.45&&((t*16)|0)%2===0)||(e.vis&&e.vis.flash&&((t*(10+(e.bm?e.bm.t:0)*5))|0)%2===0);
    const esid=Sprites.enemySid(e);   /* pack art for this boss / enemy, if any */
    if(esid&&e.boss&&/^tama[123]f?$/.test(esid))frame=e.pwUntil>t?7:(e.stun>0?8:(e.atk>0?(TAMA_WEAPON[e.lp]?(e.atk>.18?5:6):7):frame));   /* Tamagami: power-up / hit / weapon strike / special */
    const sp=esid?Sprites.sheetEnemy(esid,frame,flash):Sprites.forSp(sd,frame,flash),k=u/(sp.s||Sprites.S)*(e.elite?ELITE_R:1);
    const zo=e.zoff||0,bsz=e.boss?1+.1*(e.tf||0):1,sqx=e.sq?1.1:1,sqy=e.sq?.8:1;
    ctx.fillStyle='rgba(0,0,0,'+(.28-Math.min(.14,zo/500))+')';ctx.beginPath();ctx.ellipse(e.x,e.y,e.r*.95*(1-Math.min(.3,zo/300)),e.r*.32,0,0,TAU);ctx.fill();
    if(e.elite){      /* elite: golden halo, a pulsing ring on the ground and flickering sparks */
      GLOW.at(ctx,e.x,e.y-e.r,e.r*3.1,'#ffd23f',.5+.12*Math.sin(t*5+e.ph));
      ctx.save();ctx.strokeStyle='rgba(255,210,63,'+(.55+.25*Math.sin(t*6))+')';ctx.lineWidth=2.6;ctx.beginPath();ctx.ellipse(e.x,e.y,e.r*1.15,e.r*.4,0,0,TAU);ctx.stroke();
      ctx.globalCompositeOperation='lighter';ctx.fillStyle='#ffe58a';for(let i=0;i<(FXL.on?0:4);i++){const a=t*2.4+i/4*TAU+e.ph,q=(t*1.3+i*.25+e.ph)%1;ctx.globalAlpha=1-q;ctx.fillRect(e.x+Math.cos(a)*e.r*1.0-1.2,e.y-e.r*.2-q*e.r*1.9-1.2,2.4,2.4);}ctx.restore();
    }
    if(e.boss){
      GLOW.at(ctx,e.x,e.y-e.r,e.r*2.8,e.bd.c,.35+.1*Math.sin(t*5));
      if(e.tf>0||e.xf){
        /* powered-up aura: flames + pulsing glow; during the charge it swells and rings expand */
        const c=e.xf&&!e.xf.released?Math.min(1,e.xf.t/e.xf.rel):1,ar=e.r*(2.6+.5*(e.tf||0))*(.7+.5*c);
        GLOW.at(ctx,e.x,e.y-e.r,ar*1.5,'#ff3b2a',.35+.2*c);GLOW.at(ctx,e.x,e.y-e.r,ar,e.bd.c,.55);
        ctx.save();ctx.globalCompositeOperation='lighter';
        for(let i=0;i<(FXL.on?4:11);i++){const a=i/(FXL.on?4:11)*TAU+t*.7,bx=e.x+Math.cos(a)*e.r*1.05,by=e.y-e.r*.2+Math.sin(a)*e.r*.3,h=ar*(.55+.45*Math.sin(t*9+i*2.3))*.9;
          ctx.fillStyle=i%2?'rgba(255,120,60,.45)':'rgba(255,230,160,.4)';ctx.beginPath();ctx.moveTo(bx-e.r*.22,by);ctx.lineTo(bx+Math.sin(t*7+i)*e.r*.15,by-h);ctx.lineTo(bx+e.r*.22,by);ctx.closePath();ctx.fill();}
        if(e.xf&&!e.xf.released){ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=3;for(let q=0;q<3;q++){const rr=((t*1.6+q/3)%1);ctx.globalAlpha=1-rr;ctx.beginPath();ctx.ellipse(e.x,e.y-e.r*.3,e.r*(1+rr*5),e.r*(.4+rr*1.6),0,0,TAU);ctx.stroke();}}
        ctx.restore();
      }
    }
    if(e.ai==='explode'&&sd.pal){GLOW.at(ctx,e.x,e.y-e.r,e.r*(2.6+Math.sin(t*12+e.ph)*.5)*(e.fuse>0?1.5:1),sd.pal[3],e.fuse>0?.85:.5);}
    if(e.fuse>0){ctx.strokeStyle='rgba(255,80,60,.75)';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.beginPath();ctx.arc(e.x,e.y,e.def.rad,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='rgba(255,60,40,.12)';ctx.fill();}
    const fly=def.fly||(e.def&&e.def.fly);let bob=fly?Math.sin(t*4+e.ph)*3-8:0;
    if(e.under){      /* burrowed: a moving mound of dirt */
      ctx.fillStyle='rgba(70,50,35,.85)';ctx.beginPath();ctx.ellipse(e.x,e.y,e.r*1.1,e.r*.45,0,0,TAU);ctx.fill();ctx.fillStyle='rgba(120,90,60,.9)';ctx.beginPath();ctx.ellipse(e.x,e.y-2,e.r*.7,e.r*.3,0,0,TAU);ctx.fill();return;}
    if(!e.boss){      /* procedural life: walking bob / lean, breathing, wind-up pose, spawn pop, per-kind motion */
      const kd=sd.k,mvs=e.mvs&&!zo,st=Math.sin(t*(kd==='golem'?5:kd==='beast'?12:9)+e.ph*3),ab=Math.abs(st);
      let sx=1,sy=1,rot=0,ox=0,oy=0,al=1;
      if(kd==='blob'){const j=Math.sin(t*7+e.ph*2);sx=1+.13*j;sy=1-.13*j;oy=-Math.abs(j)*3;}
      else if(kd==='ghost'){ox=Math.sin(t*2.3+e.ph)*3;oy=Math.sin(t*3.1+e.ph)*3;rot=Math.sin(t*2.3+e.ph)*.09;}
      else if(kd==='orb'){const pu=Math.sin(t*5+e.ph);sx=sy=1+.08*pu;}
      else if(fly){const f=Math.sin(t*22+e.ph);sy=1+.07*f;sx=1-.05*f;rot=Math.sin(t*3+e.ph)*.07+(mvs?e.face*.1:0);}
      else if(mvs){oy=-ab*(kd==='golem'?2.6:kd==='beast'?4.5:3);rot=st*(kd==='golem'?.05:.07);sy=1+(ab<.2?-.05:.03);sx=1-(ab<.2?-.04:.02);}
      else{sy=1+.025*Math.sin(t*2.2+e.ph*2);sx=1-.012*Math.sin(t*2.2+e.ph*2);}
      if(e.tel){const q=e.telK||0;sx*=1+.15*q;sy*=1-.2*q;rot-=e.face*.14*q;ox+=Math.sin(t*70)*1.3*q;}
      else if(e.atk>0){const q=Math.min(1,e.atk/.4);sx*=1-.06*q;sy*=1+.1*q;rot+=e.face*.1*q;}
      if(e.fl>0){sx*=1.12;sy*=.9;}
      if(e.age<.4){const q=e.age/.4,bk=1+2.2*Math.pow(q-1,3)+1.2*Math.pow(q-1,2);sx*=bk;sy*=bk;al=Math.min(1,q*3);}
      ctx.save();ctx.translate(e.x+ox,e.y+bob-zo+oy);ctx.rotate(rot);ctx.scale(e.face*k*sqx*sx,k*sqy*sy);
      ctx.globalAlpha=al*((e.def&&e.def.alpha)||1);
      if(e.enr||e.shield>0||e.tel){      /* rage / evolution aura, guard bubble, wind-up glow */
        ctx.restore();
        if(e.enr)GLOW.at(ctx,e.x,e.y-e.r*1.1,e.r*(2.3+.3*Math.sin(t*9+e.ph)),e.rc||'#ff3b2a',.45);
        if(e.tel)GLOW.at(ctx,e.x,e.y-e.r*1.1,e.r*(1.8+1.2*(e.telK||0)),e.tel,.35+.4*(e.telK||0));
        ctx.save();ctx.translate(e.x+ox,e.y+bob-zo+oy);ctx.rotate(rot);ctx.scale(e.face*k*sqx*sx,k*sqy*sy);ctx.globalAlpha=al*((e.def&&e.def.alpha)||1);
      }
      ctx.imageSmoothingEnabled=true;ctx.drawImage(sp.c,-sp.ox,-sp.oy);ctx.imageSmoothingEnabled=false;ctx.restore();
      if(e.enr&&((t*10+e.ph)|0)%2===0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=e.rc||'#ff3b2a';ctx.globalAlpha=.55;for(let i=0;i<3;i++){const fx=e.x+(i-1)*e.r*.55,fh=e.r*(.9+.5*Math.sin(t*12+i*2+e.ph));ctx.beginPath();ctx.moveTo(fx-3,e.y-e.r*.4);ctx.lineTo(fx+Math.sin(t*8+i)*2,e.y-e.r*.4-fh);ctx.lineTo(fx+3,e.y-e.r*.4);ctx.fill();}ctx.restore();}
      if(e.shield>0){ctx.save();ctx.strokeStyle=e.sk&&e.sk.cur?'#fff':'rgba(160,230,255,.9)';ctx.lineWidth=2.5;ctx.globalAlpha=.6+.3*Math.sin(t*12);ctx.fillStyle='rgba(140,220,255,.16)';ctx.beginPath();ctx.ellipse(e.x,e.y-e.r*.9,e.r*1.45,e.r*1.6,0,0,TAU);ctx.fill();ctx.stroke();ctx.restore();}
      if(e.tel){ctx.fillStyle=e.tel;ctx.globalAlpha=.8+.2*Math.sin(t*30);ctx.font='bold '+(12+(e.telK||0)*6|0)+'px sans-serif';ctx.textAlign='center';ctx.fillText('!',e.x,e.y-e.r*2.5-Math.abs(Math.sin(t*14))*3);ctx.globalAlpha=1;}
      if(e.sk){for(const en of e.sk.l)if(en.s.id==='orbs'){const n=en.s.n||3;for(let q=0;q<n;q++){const a=(e.oa||0)+q/n*TAU,ox2=e.x+Math.cos(a)*(e.r+24),oy2=e.y-e.r*.8+Math.sin(a)*(e.r+16)*.8;GLOW.at(ctx,ox2,oy2,12,en.s.c||'#fff',.9);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ox2,oy2,3,0,TAU);ctx.fill();}}}
    }else{
    const vs=e.vis;   /* signature move pose (shake / spin / stretch) set by Game.updateBossMove */
    ctx.save();ctx.translate(e.x+(vs?vs.ox:0),e.y+bob-zo+(vs?vs.oy:0));if(vs&&vs.rot){ctx.translate(0,-e.r);ctx.rotate(vs.rot);ctx.translate(0,e.r);}ctx.scale(e.face*k*bsz*sqx*(vs?vs.sx:1),k*bsz*sqy*(vs?vs.sy:1));
    if(e.def&&e.def.alpha)ctx.globalAlpha=e.def.alpha;
    ctx.imageSmoothingEnabled=true;ctx.drawImage(sp.c,-sp.ox,-sp.oy);ctx.imageSmoothingEnabled=false;ctx.restore();
    }
    if(e.stun>0){ctx.fillStyle='#fff7b0';for(let i=0;i<3;i++){const a=t*6+i*TAU/3;ctx.fillRect(e.x+Math.cos(a)*10-1.5,e.y-e.r*2.4+Math.sin(a)*3,3,3);}}
    if(e.bm&&e.bm.k==='rain')this.drawBuuHand(e,t);
    if(e.boss&&e.bar>0){ctx.save();ctx.strokeStyle='rgba(160,230,255,.95)';ctx.lineWidth=3;ctx.globalAlpha=Math.min(1,e.bar*2)*(.6+.3*Math.sin(t*14));ctx.fillStyle='rgba(140,220,255,.16)';ctx.beginPath();ctx.ellipse(e.x,e.y-e.r*.9,e.r*1.6,e.r*1.75,0,0,TAU);ctx.fill();ctx.stroke();ctx.restore();}   /* barrier of the androids / Kaioshin */
    const topY=e.y+bob-zo-sp.oy*k;   /* the top of the sprite: the health bars sit above the head, not on the body */
    if(e.elite){const bw=e.r*2.6,bx=e.x-bw/2,by=topY-14;ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(bx-1,by-1,bw+2,6);ctx.fillStyle='#ffd23f';ctx.fillRect(bx,by,bw*clamp(e.hp/e.max,0,1),4);
      ctx.fillStyle='#ffd23f';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText('★',e.x,by-4);}
    else if(!e.boss&&e.max>=100&&e.hp<e.max){ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(e.x-e.r,topY-8,e.r*2,3);ctx.fillStyle='#e9503f';ctx.fillRect(e.x-e.r,topY-8,e.r*2*clamp(e.hp/e.max,0,1),3);}
  }
  /* the sprite sheet of the Dragon Balls, or null until the image has loaded (then the old vector drawing is used) */
  ballSheet(){
    if(this.ballImg===undefined){this.ballImg=null;if(DBALLS_URL){const im=new Image();im.onload=()=>{this.ballImg=im;};im.src=DBALLS_URL;}}
    const im=this.ballImg;return im&&im.complete&&im.naturalWidth?im:null;
  }
  /* bounce of a Dragon Ball t seconds after it appeared: a toss with hops that shrink, then a lively hop every 1.6 s.
     h = height above the ground (px), vy = vertical speed, since = seconds since the last landing, lv = speed of that landing (0 = none yet) */
  ballHop(t){
    const G=1700;let v=320,tt=t,lv=0;
    for(;v>=80;v*=.56){
      const d=2*v/G;
      if(tt<d)return{h:v*tt-.5*G*tt*tt,vy:v-G*tt,since:tt,lv};
      tt-=d;lv=v;
    }
    const tr=tt-.8;                                   /* it rests for a moment after the last small bounce... */
    if(tr<0)return{h:0,vy:0,since:tt,lv};
    const P=1.6,vi=200,dh=2*vi/G,k=Math.floor(tr/P),u=tr-k*P;   /* ...then hops (11 px) every 1.6 s to get noticed */
    if(u<dh)return{h:vi*u-.5*G*u*u,vy:vi-G*u,since:k>0?u+P-dh:tt,lv:k>0?vi:lv};
    return{h:0,vy:0,since:u-dh,lv:vi};
  }
  /* Dragon Ball on the ground: real bounces with squash and stretch, a shock ring and sparks at every landing, a light pillar, pulsing glow,
     turning rays and twinkling stars - it must be seen (and felt) from far away */
  drawBall(l,im){
    const ctx=this.ctx,t=l.t,S=30,star=Math.max(1,Math.min(7,l.star||1)),hp=this.ballHop(t),h=Math.max(0,hp.h),gx=l.x,gy=l.y+4,cy=gy-S*.5-h;
    const pulse=.5+.5*Math.sin(t*4.2),lvK=Math.min(1,hp.lv/300),air=Math.min(1,h/12);
    /* light on the ground + shadow */
    ctx.save();ctx.translate(gx,gy);ctx.scale(1,.42);GLOW.at(ctx,0,0,34+4*pulse,'#ffb13b',.55);ctx.restore();
    ctx.fillStyle='rgba(0,0,0,'+(.34-.16*air)+')';ctx.beginPath();ctx.ellipse(gx,gy,Math.max(5,11-h*.16),Math.max(2,4-h*.06),0,0,TAU);ctx.fill();
    /* pillar of light */
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(const [w,hh,a] of [[16,150,.3],[7,190,.42]]){const gr=ctx.createLinearGradient(0,gy,0,gy-hh);gr.addColorStop(0,'rgba(255,196,80,'+a+')');gr.addColorStop(1,'rgba(255,196,80,0)');ctx.globalAlpha=.6+.4*pulse;ctx.fillStyle=gr;ctx.fillRect(gx-w/2,gy-hh,w,hh);}
    ctx.restore();
    /* landing: shock ring + sparks */
    if(hp.lv>0&&hp.since>=0&&hp.since<.5){
      const p=hp.since/.5;ctx.save();ctx.globalCompositeOperation='lighter';
      const rx=6+p*(22+16*lvK);ctx.globalAlpha=(1-p)*(.3+.55*lvK);ctx.strokeStyle='#ffe9a8';ctx.lineWidth=.8+2*(1-p);
      ctx.beginPath();ctx.ellipse(gx,gy,rx,rx*.38,0,0,TAU);ctx.stroke();
      ctx.fillStyle='#ffd27a';ctx.globalAlpha=(1-p)*(.4+.6*lvK);
      for(let i=0;i<7;i++){const a=i/7*TAU+l.x*.1,d=p*(18+16*lvK);ctx.fillRect(gx+Math.cos(a)*d-1,gy-Math.sin(p*Math.PI)*(8+8*lvK)*(.5+.5*Math.abs(Math.sin(a*2)))+Math.sin(a)*d*.38-1,2.2,2.2);}
      ctx.restore();
    }
    /* glow + turning rays behind the ball */
    GLOW.at(ctx,gx,cy,38+6*pulse,'#ffaa28',.7);GLOW.at(ctx,gx,cy,18,'#ffe9a8',.45+.25*pulse);
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(gx,cy);ctx.rotate(t*.9);ctx.fillStyle='#ffd27a';ctx.globalAlpha=.14+.1*pulse;
    if(!FXL.on)for(let i=0;i<8;i++){ctx.rotate(TAU/8);ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(-2.2,-(36+6*Math.sin(t*3+i)));ctx.lineTo(2.2,-(36+6*Math.sin(t*3+i)));ctx.closePath();ctx.fill();}
    ctx.restore();
    /* the ball: squash when it lands, stretch while it flies, pops in when it appears */
    const sqz=h<1.5&&hp.lv>0?lvK*.26*Math.exp(-hp.since*16):0,str=h>1?Math.min(.16,Math.abs(hp.vy)/2400):0,pop=Math.min(1,.45+t*4.4);
    ctx.save();ctx.translate(gx,gy-h);ctx.scale((1+sqz-str*.6)*pop,(1-sqz+str)*pop);
    ctx.imageSmoothingEnabled=true;ctx.drawImage(im,(star-1)*64,0,64,64,-S/2,-S,S,S);
    ctx.restore();
    /* twinkling stars around it */
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle='#fff2b0';
    for(let i=0;i<(FXL.on?2:5);i++){const a=t*1.8+i*TAU/5,R=21+3*Math.sin(t*2+i),px=gx+Math.cos(a)*R,py=cy+Math.sin(a)*R*.72,tw=.5+.5*Math.sin(t*7+i*2.1),z=1.4+2.6*tw;ctx.globalAlpha=.25+.7*tw;ctx.fillRect(px-z,py-.6,z*2,1.2);ctx.fillRect(px-.6,py-z,1.2,z*2);}
    ctx.restore();
    ctx.globalAlpha=1;
  }
  /* Super Dragon Ball: a giant ball floating over the ground with a golden aura, a tall column of light, turning rays and slow rings - impossible to miss */
  /* a Tamagami statue: the boss sprite painted in cold grey stone (cached) */
  /* the final boss falling: it shakes and flashes while cracks of light spread, then the blast whites it out (Game.startVictory / updateVictory) */
  /* ---- boss signature moves (Game.updateBossMove): the path of Dodoria's body hurl / Dr. Gero's lunge on the ground, drawn as wide as the body ---- */
  drawBmGround(e,t){
    const m=e.bm;if(m.k!=='dtoss'&&m.k!=='grab')return;
    const ctx=this.ctx,tel=m.k==='dtoss',w=tel?e.r*2:e.r*1.7,L=m.L,k=m.st===0?clamp(m.t/m.warn,0,1):1,locked=m.st>0||m.t>=m.lock,fade=m.st===0?1:clamp(1-m.t/(L/(tel?1250:1100)),0,1);
    const col=tel?'255,60,60':'120,255,110',cb=tel?(locked?'#ff3b3b':'#ffb13b'):(locked?'#9cff7a':'#e6ff9a');
    ctx.save();ctx.translate(m.ox,m.oy-e.r*.3);ctx.rotate(m.a);ctx.globalAlpha=fade;
    const pul=.5+.5*Math.sin(t*(locked?26:12));
    const gr=ctx.createLinearGradient(0,0,L,0);gr.addColorStop(0,'rgba('+col+','+(.08+.14*k)+')');gr.addColorStop(1,'rgba('+col+','+(.2+.25*k+(locked?.12*pul:0))+')');
    ctx.fillStyle=gr;ctx.fillRect(0,-w/2,L,w);
    ctx.globalCompositeOperation='lighter';ctx.strokeStyle=cb;ctx.lineWidth=locked?3:2;ctx.globalAlpha=fade*(.5+.5*(locked?1:k));
    ctx.beginPath();ctx.moveTo(0,-w/2);ctx.lineTo(L,-w/2);ctx.moveTo(0,w/2);ctx.lineTo(L,w/2);ctx.stroke();
    /* chevrons running along the path */
    ctx.lineWidth=2.4;ctx.globalAlpha=fade*(.25+.45*k);const sp=(t*(locked?420:160))%64;
    for(let x=sp;x<L-10;x+=64){ctx.beginPath();ctx.moveTo(x-9,-w*.28);ctx.lineTo(x+3,0);ctx.lineTo(x-9,w*.28);ctx.stroke();}
    /* where it ends: the landing circle of the body slam (Dodoria) or the reach of the hand (Gero) */
    ctx.globalAlpha=fade*(.4+.5*k);ctx.setLineDash([9,7]);ctx.lineDashOffset=-t*40;ctx.beginPath();ctx.ellipse(L,0,tel?e.r*2.6+30:w*.7,tel?(e.r*2.6+30)*.8:w*.6,0,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.restore();
    /* the countdown above the boss */
    if(m.st===0){const left=Math.max(0,m.warn-m.t);ctx.save();ctx.font='bold 20px sans-serif';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='rgba(0,0,0,.7)';ctx.fillStyle=locked?'#ff5a4a':'#ffd23f';const txt=left.toFixed(1),y=e.y-e.r*3.1;ctx.strokeText(txt,e.x,y);ctx.fillText(txt,e.x,y);ctx.restore();}
  }
  /* Super Buu's raised hand: an arm in his skin colour going up with a ball of pink ki growing on it */
  drawBuuHand(e,t){
    const m=e.bm,ctx=this.ctx,up=m.st===0?clamp(m.t/.5,0,1):(m.st===1?1:clamp(1-m.t/.5,0,1)),hx=e.x+e.face*e.r*1.5,sy=e.y-e.r*1.1,hy=sy-e.r*1.7*up;
    ctx.save();ctx.lineCap='round';ctx.strokeStyle='#ff8fb8';ctx.lineWidth=e.r*.42;ctx.beginPath();ctx.moveTo(hx,sy);ctx.lineTo(hx,hy);ctx.stroke();
    ctx.fillStyle='#ffb0d0';ctx.beginPath();ctx.arc(hx,hy,e.r*.26,0,TAU);ctx.fill();
    const ch=m.st===0?clamp(m.t/.9,0,1):1,br=(10+22*ch)*(1+.08*Math.sin(t*30));
    ctx.globalCompositeOperation='lighter';GLOW.at(ctx,hx,hy-e.r*.5,br*2.6,'#ff4fb0',.5+.4*ch);ctx.fillStyle='#ffd0ec';ctx.beginPath();ctx.arc(hx,hy-e.r*.5,br*.42,0,TAU);ctx.fill();
    ctx.restore();
  }
  /* the balls of the rain: a streak going up from the hand, then (1 s before it lands) the marked spot on the ground */
  drawRainGround(g,t){
    const ctx=this.ctx;
    for(const r of g.rain){
      if(!r.mk)continue;
      const k=clamp((r.t-2)/1,0,1),R=38;
      ctx.save();ctx.translate(r.lx,r.ly);ctx.scale(1,.85);
      ctx.fillStyle='rgba(255,40,150,'+(.1+.26*k)+')';ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.fill();
      ctx.strokeStyle='rgba(255,40,150,'+(.5+.5*k)+')';ctx.lineWidth=2.6;ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.stroke();
      ctx.beginPath();ctx.arc(0,0,R*(1-k*.85),0,TAU);ctx.strokeStyle='rgba(255,255,255,'+(.3+.6*k)+')';ctx.lineWidth=2;ctx.stroke();
      ctx.restore();
    }
  }
  drawRainAir(g,t){
    const ctx=this.ctx;ctx.save();ctx.globalCompositeOperation='lighter';
    for(const r of g.rain){
      if(r.t<.7){const q=r.t/.7;ctx.globalAlpha=1-q*.5;ctx.strokeStyle='#ff7ac0';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(r.hx,r.hy-q*420);ctx.lineTo(r.hx,r.hy-q*420+46);ctx.stroke();GLOW.at(ctx,r.hx,r.hy-q*420,16,'#ff4fb0',.8);}
      else if(r.mk&&r.t>2.62){const q=clamp((r.t-2.62)/.38,0,1),y=r.ly-(1-q)*(1-q)*440;ctx.globalAlpha=1;GLOW.at(ctx,r.lx,y,24,'#ff4fb0',.9);ctx.fillStyle='#ffe0f2';ctx.beginPath();ctx.arc(r.lx,y,6,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,122,192,.7)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(r.lx,y-34*(1-q*.5));ctx.lineTo(r.lx,y);ctx.stroke();}
    }
    ctx.restore();
  }
  /* Dr. Gero's hold: the green energy streaming from you into him */
  drawHeld(g,t){
    const h=g.held,e=h.e,p=g.p,ctx=this.ctx,x0=p.x,y0=p.y-16,x1=e.x,y1=e.y-e.r;
    ctx.save();ctx.globalCompositeOperation='lighter';
    GLOW.at(ctx,p.x,p.y-16,46+6*Math.sin(t*20),'#9cff7a',.55);
    for(let j=0;j<3;j++){ctx.strokeStyle=j?'rgba(255,255,255,.55)':'rgba(120,255,110,.8)';ctx.lineWidth=j?1.5:4;ctx.beginPath();ctx.moveTo(x0,y0);for(let i=1;i<=8;i++){const q=i/8,wob=Math.sin(t*26+i*1.7+j*2)*(8*(1-Math.abs(q-.5)*2)+2);ctx.lineTo(x0+(x1-x0)*q,y0+(y1-y0)*q+wob);}ctx.stroke();}
    ctx.restore();
    const left=Math.max(0,3-h.t).toFixed(1);ctx.save();ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='rgba(0,0,0,.7)';ctx.fillStyle='#9cff7a';ctx.strokeText(left,p.x,p.y-58);ctx.fillText(left,p.x,p.y-58);ctx.restore();
  }
  /* Special Beam Cannon: the charge at the fingertips (two fingers on the forehead), a growing glow, a twisting spiral and the aiming line */
  drawSbc(g,t){
    const s=g.sbc,p=g.p;if(s.t>=s.dur)return;
    const ctx=this.ctx,c=g.abil.c,k=Math.min(1,s.t/s.dur),u=g.C.u||1.95,fx=Math.cos(s.ang)>=0?1:-1,hx=p.x+fx*5,hy=p.y-27*u;
    ctx.save();ctx.globalCompositeOperation='lighter';
    /* aiming line */
    const ox=p.x,oy=p.y-24;ctx.setLineDash([14,10]);ctx.lineDashOffset=-t*60;ctx.lineWidth=1.6;ctx.strokeStyle=hexA(c,.1+.3*k);
    ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ox+Math.cos(s.ang)*900,oy+Math.sin(s.ang)*900);ctx.stroke();ctx.setLineDash([]);
    /* glow + spirals around the fingertips */
    GLOW.at(ctx,hx,hy,12+34*k,c,.5+.5*k);GLOW.at(ctx,hx,hy,6+14*k,'#ffffff',.7);
    for(let j=0;j<3;j++){
      ctx.strokeStyle=hexA(j===1?'#b46bff':c,.4+.5*k);ctx.lineWidth=1.8;ctx.beginPath();
      for(let i=0;i<=16;i++){const a=t*(9+j)+i*.42+j*2.1,r=(4+i*(1.1+1.4*k))*(.4+.6*k);const x=hx+Math.cos(a)*r,y=hy+Math.sin(a)*r*.8;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}
      ctx.stroke();
    }
    ctx.restore();
  }
  /* Sphere of Justice (Toppo): a dark sphere with a purple-magenta rim, swirling strands and the dashed area it will blow up */
  drawSpheres(g,t){
    const ctx=this.ctx,c=g.abil.c;
    for(const s of g.spheres){
      const k=s.ph?Math.min(1,s.t/s.hold):0,r=s.ph===0?15+Math.sin(t*30):s.rr;
      ctx.save();ctx.translate(s.x,s.y);
      if(s.ph===1){ctx.save();ctx.scale(1,.8);ctx.strokeStyle=hexA('#ff4fd8',.15+.35*k);ctx.lineWidth=2;ctx.setLineDash([10,8]);ctx.lineDashOffset=-t*34;ctx.beginPath();ctx.arc(0,0,s.R,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.restore();}
      GLOW.at(ctx,0,0,r*3.4,c,.55);GLOW.at(ctx,0,0,r*2,'#ff4fd8',.25+.3*k);
      ctx.globalCompositeOperation='lighter';ctx.lineWidth=2;ctx.strokeStyle=hexA('#d8a0ff',.8);
      for(let i=0;i<6;i++){ctx.beginPath();const a0=t*(s.ph?3:6)+i*1.05;ctx.moveTo(Math.cos(a0)*r,Math.sin(a0)*r);for(let q=1;q<=4;q++){const a=a0+q*.2,rr=r*(1+q*.13)+Math.sin(t*22+i+q)*2.4;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.stroke();}
      ctx.globalCompositeOperation='source-over';
      ctx.fillStyle='#10041c';ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();
      ctx.strokeStyle=c;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();
      ctx.strokeStyle=hexA('#ff4fd8',.55+.4*Math.sin(t*14));ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,r*.72,0,TAU);ctx.stroke();
      ctx.fillStyle='#5a1a9a';ctx.beginPath();ctx.arc(-r*.28,-r*.28,r*.3,0,TAU);ctx.fill();
      ctx.restore();
    }
  }
  /* Super Ghost Kamikaze (Gotenks): the little grinning ghosts. They flash red and shake when their time is up and they are about to explode */
  drawGhosts(g,t){
    const ctx=this.ctx,c=g.abil.c,dy=g.ghostT<=0;
    for(const k of g.ghosts){
      const a=k.atk>0?k.atk/.4:0,sc=1.25*(1+a*.25);
      ctx.save();ctx.translate(k.x+(dy?Math.sin(t*90+k.a)*1.6:0),k.y+Math.sin(k.ph)*3);ctx.scale(k.fl*sc,sc);
      ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(0,30/sc,9,3,0,0,TAU);ctx.fill();
      GLOW.at(ctx,0,0,30,dy?'#ff5a5a':c,.4+.25*a);
      ctx.globalAlpha=.9;ctx.fillStyle=dy&&Math.sin(t*40)>0?'#ffd0d0':'#f6f0ff';ctx.strokeStyle=hexA(dy?'#ff5a5a':c,.95);ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(-11,4);ctx.bezierCurveTo(-14,-17,14,-17,11,4);ctx.quadraticCurveTo(9,12,6,8);ctx.quadraticCurveTo(3,16,0,9);ctx.quadraticCurveTo(-4,16,-7,8);ctx.quadraticCurveTo(-10,12,-11,4);ctx.closePath();ctx.fill();ctx.stroke();
      /* little arms */
      ctx.beginPath();ctx.moveTo(-10,0);ctx.quadraticCurveTo(-17,-3-a*6,-15,-8-a*6);ctx.moveTo(10,0);ctx.quadraticCurveTo(17,-3-a*6,15,-8-a*6);ctx.stroke();
      /* eyes, glints and the grin (wide open when it attacks) */
      ctx.fillStyle=dy?'#ff2a2a':'#2a1a4a';ctx.beginPath();ctx.ellipse(-4.2,-5,2.3,3.4,0,0,TAU);ctx.ellipse(4.2,-5,2.3,3.4,0,0,TAU);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-3.4,-6.2,.9,0,TAU);ctx.arc(5,-6.2,.9,0,TAU);ctx.fill();
      ctx.strokeStyle='#2a1a4a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,-2,5.4,.12*Math.PI,.88*Math.PI);ctx.stroke();
      if(a>0.2){ctx.fillStyle='#2a1a4a';ctx.beginPath();ctx.arc(0,-2,5.2,.1*Math.PI,.9*Math.PI);ctx.closePath();ctx.fill();}
      ctx.restore();
    }
  }
  drawVictory(v,t){
    const ctx=this.ctx,e=v.e,k=Math.min(1,v.t/2.6);
    if(!v.boom){
      e.fl=((v.t*16)|0)%3===0?1:0;
      ctx.save();ctx.translate(rnd(-1,1)*(1.5+4.5*k),rnd(-1,1)*(1+2*k));this.drawEnemy(e,t);ctx.restore();
      GLOW.at(ctx,v.x,v.y-v.r,v.r*(1.2+1.8*k),'#ffffff',.12+.4*k);
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(255,255,255,'+(.25+.6*k)+')';ctx.lineWidth=1.5;
      for(let i=0;i<(FXL.on?3:7);i++){const a=i/7*TAU+v.t*.6,L=v.r*(.6+1.7*k);ctx.beginPath();ctx.moveTo(v.x,v.y-v.r);ctx.lineTo(v.x+Math.cos(a)*L,v.y-v.r+Math.sin(a)*L);ctx.stroke();}
      ctx.restore();
    }else{
      const q=v.t-v.bt;
      if(q<.4){e.fl=1;ctx.save();ctx.globalAlpha=1-q/.4;this.drawEnemy(e,t);ctx.restore();}
      GLOW.at(ctx,v.x,v.y-v.r,v.r*(3+4*Math.min(1,q/.5)),'#ffffff',Math.max(0,.9-q*.45));
    }
  }
  stoneSprite(id){
    this.stoneC=this.stoneC||{};if(this.stoneC[id]!==undefined)return this.stoneC[id];
    const bd=BOSSES[id],sp=bd&&Sprites.forSp(bd.sp,1,false);if(!sp||!sp.c)return null;
    const c=document.createElement('canvas');c.width=sp.c.width;c.height=sp.c.height;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
    g.drawImage(sp.c,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='rgba(122,128,144,.86)';g.fillRect(0,0,c.width,c.height);
    const gr=g.createLinearGradient(0,0,0,c.height);gr.addColorStop(0,'rgba(255,255,255,.18)');gr.addColorStop(1,'rgba(0,0,0,.28)');g.fillStyle=gr;g.fillRect(0,0,c.width,c.height);
    return this.stoneC[id]={c,ox:sp.ox,oy:sp.oy,s:sp.s};
  }
  /* shop / upgrade pixel-art icon as an image (null until it has decoded, or when that upgrade has none) */
  shopImg(id){const c=this.shopImgC||(this.shopImgC={});if(c[id]!==undefined)return c[id]&&c[id].complete&&c[id].naturalWidth?c[id]:null;const u=id&&typeof SHOP_IMG!=='undefined'&&SHOP_IMG[id];if(!u){c[id]=null;return null;}const im=new Image();im.src=u;c[id]=im;return null;}
  statueArt(n){this.statC=this.statC||{};return this.statC[n]||(this.statC[n]=Sprites.sheetFrame('tamas'+n,0));}   /* the statue sheet of Tamagami n (pedestal included), cached */
  drawSuperBall(l){
    const ctx=this.ctx,t=l.t,im=this.ballSheet(),S=76,star=Math.max(1,Math.min(7,l.star||1)),gx=l.x,gy=l.y+6,fl=Math.sin(t*1.6)*6,pulse=.5+.5*Math.sin(t*3.2);
    /* a Tamagami guardian: until it wakes up its statue (pedestal included) stands there and the ball floats above its head; afterwards the bare pedestal stays */
    const tid=Math.max(1,Math.min(3,star)),art=l.tama&&!l.woke&&Sprites.sheets['tamas'+tid]?this.statueArt(tid):null;
    const hy=art?art.oy+S*.5+12:S*.62+10;l.hy=l.hy===undefined?hy:l.hy+(hy-l.hy)*Math.min(1,(this.fdt||.016)*5);     /* the ball glides down when the statue wakes */
    const cy=gy-l.hy-fl;
    let stone=null;
    if(l.tama&&!art){
      ctx.save();ctx.fillStyle='rgba(70,74,88,.9)';ctx.beginPath();ctx.ellipse(gx,gy+2,40,14,0,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,210,90,.55)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(gx,gy+2,40,14,0,0,TAU);ctx.stroke();ctx.restore();
      if(!l.woke){const st=this.stoneSprite('tama'+tid),bd=BOSSES['tama'+tid];if(st&&bd)stone={st,k:(bd.sp.u||bd.u||3)/(st.s||Sprites.S)};}   /* no pack art: grey procedural statue, drawn on top of the light below */
    }
    if(art){ctx.save();ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(gx,gy+1,art.c.width*.46,10,0,0,TAU);ctx.fill();ctx.translate(gx,gy);ctx.imageSmoothingEnabled=false;ctx.drawImage(art.c,-art.ox,-art.oy);ctx.restore();}
    ctx.save();ctx.translate(gx,gy);ctx.scale(1,.4);GLOW.at(ctx,0,0,86+8*pulse,'#ffd23f',.5);ctx.restore();
    ctx.fillStyle='rgba(0,0,0,.34)';ctx.beginPath();ctx.ellipse(gx,gy,26-fl*.5,8-fl*.15,0,0,TAU);ctx.fill();
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(const [w,hh,a] of [[40,320,.14],[16,400,.24]]){const gr=ctx.createLinearGradient(0,gy,0,gy-hh);gr.addColorStop(0,'rgba(255,214,90,'+a+')');gr.addColorStop(1,'rgba(255,214,90,0)');ctx.globalAlpha=.65+.35*pulse;ctx.fillStyle=gr;ctx.fillRect(gx-w/2,gy-hh,w,hh);}
    for(let i=0;i<3;i++){const p=(t*.55+i/3)%1;ctx.globalAlpha=(1-p)*.4;ctx.strokeStyle='#ffe9a8';ctx.lineWidth=1+3*(1-p);ctx.beginPath();ctx.ellipse(gx,gy,18+p*110,(18+p*110)*.38,0,0,TAU);ctx.stroke();}
    ctx.restore();
    GLOW.at(ctx,gx,cy,100+12*pulse,'#ffb013',.5);GLOW.at(ctx,gx,cy,54,'#fff3b0',.3+.15*pulse);
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(gx,cy);ctx.rotate(t*.6);ctx.fillStyle='#ffe28a';ctx.globalAlpha=.11+.07*pulse;
    if(!FXL.on)for(let i=0;i<12;i++){ctx.rotate(TAU/12);ctx.beginPath();ctx.moveTo(0,-30);ctx.lineTo(-6,-(120+14*Math.sin(t*2.4+i)));ctx.lineTo(6,-(120+14*Math.sin(t*2.4+i)));ctx.closePath();ctx.fill();}
    ctx.restore();
    if(art){ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(art.c,gx-art.ox,gy+6-art.oy);ctx.restore();}
    if(stone){ctx.save();ctx.translate(gx,gy);ctx.scale(stone.k,stone.k);ctx.imageSmoothingEnabled=false;ctx.drawImage(stone.st.c,-stone.st.ox,-stone.st.oy);ctx.restore();}
    const pop=Math.min(1,.4+t*3);
    if(im){ctx.save();ctx.translate(gx,cy);ctx.scale(pop,pop);ctx.imageSmoothingEnabled=true;ctx.drawImage(im,(star-1)*64,0,64,64,-S/2,-S/2,S,S);
      ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.16+.16*pulse;ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.arc(0,0,S*.47,0,TAU);ctx.fill();ctx.restore();}
    else{ctx.save();ctx.translate(gx,cy);ctx.scale(pop,pop);const g2=ctx.createRadialGradient(-S*.15,-S*.2,4,0,0,S*.5);g2.addColorStop(0,'#fff0b8');g2.addColorStop(.5,'#ffae1c');g2.addColorStop(1,'#a85a00');ctx.fillStyle=g2;ctx.beginPath();ctx.arc(0,0,S*.47,0,TAU);ctx.fill();
      ctx.fillStyle='#d22';for(let i=0;i<star;i++){const a=i/star*TAU+t*.4,r=star>1?S*.2:0;ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r,S*.06,0,TAU);ctx.fill();}ctx.restore();}
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle='#fff6c4';
    for(let i=0;i<(FXL.on?3:8);i++){const a=t*1.4+i*TAU/8,R=56+6*Math.sin(t*2+i),px=gx+Math.cos(a)*R,py=cy+Math.sin(a)*R*.7,tw=.5+.5*Math.sin(t*6+i*2.1),z=2+4*tw;ctx.globalAlpha=.25+.7*tw;ctx.fillRect(px-z,py-.8,z*2,1.6);ctx.fillRect(px-.8,py-z,1.6,z*2);}
    ctx.restore();ctx.globalAlpha=1;
  }
  drawLoot(l,t){
    if(l.k==='ball'){const im=this.ballSheet();if(im){this.drawBall(l,im);return;}}
    if(l.k==='sball'){this.drawSuperBall(l);return;}
    const ctx=this.ctx,T0=l.t,ph=(l.x*.13+l.y*.07)%TAU;
    /* drop animation: the item pops out with a little hop and a squash, then floats with a gentle bob */
    const pk=Math.min(1,T0/.45),hop=pk<1?Math.sin(pk*Math.PI)*16:0,pop=pk<1?(.35+.65*(1+2.2*Math.pow(pk-1,3)+1.2*Math.pow(pk-1,2))):1;
    const bh=pk>=1?Math.abs(Math.sin(T0*3.1+ph))*(l.k==='coin'?6:8):0,x=0,y=0,k=l.k,col=LOOT_COL[k]||'#fff';   /* bouncing on the ground */
    if(l.ttl&&l.ttl-l.t<8&&((l.t*6)|0)%2===0)ctx.globalAlpha=.4;
    const lift=hop+bh+(pk>=1?1:0),sq=pk>=1&&bh<1.6?1-(1.6-bh)*.09:1;   /* flattens a little when it touches the ground */
    ctx.fillStyle='rgba(0,0,0,'+(.26-Math.min(.12,lift*.006))+')';ctx.beginPath();ctx.ellipse(l.x,l.y+4,Math.max(1.5,7-lift*.12),Math.max(.6,2.5-lift*.04),0,0,TAU);ctx.fill();
    if(k!=='coin'&&pk>=1){                              /* pulsing ground ring + orbiting sparkles on the special items */
      const rp=(T0*.9+ph)%1;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=.35*(1-rp);ctx.strokeStyle=col;ctx.lineWidth=1.5;
      ctx.beginPath();ctx.ellipse(l.x,l.y+4,6+rp*14,2.2+rp*5,0,0,TAU);ctx.stroke();ctx.restore();
    }
    ctx.save();ctx.translate(l.x,l.y-6-lift);ctx.scale(pop*(2-sq),pop*(pk<1?1-Math.sin(pk*Math.PI)*.12:sq));
    switch(k){
      case'coin':ctx.scale(Math.max(.18,Math.abs(Math.cos(T0*4+ph))),1);break;                 /* spinning coin */
      case'heal':{const s2=1+.1*Math.sin(T0*6+ph);ctx.scale(s2,s2);break;}                       /* heartbeat */
      case'magnet':ctx.rotate(Math.sin(T0*3+ph)*.28);break;
      case'dmg':case'haste':{const s2=1+.09*Math.sin(T0*9+ph);ctx.scale(s2,s2);break;}
      case'xp':ctx.scale(Math.max(.35,Math.abs(Math.cos(T0*2.4+ph))),1);break;                  /* turning gem */
      case'capsule':ctx.rotate(Math.sin(T0*2.2+ph)*.35);break;
      case'luck':ctx.rotate(T0*1.6+ph);break;
    }
    if(k==='dmg'||k==='haste'||k==='magnet'||k==='heal'||k==='xp'||k==='capsule'||k==='luck')ctx.scale(1.22,1.22);   /* the power-ups are a little bigger so they read at a glance */
    switch(l.k){
      case'bag':{GLOW.at(ctx,x,y,30,'#ffd23f',.75);GLOW.at(ctx,x,y,15,'#fff3b0',.35);
        ctx.lineJoin='round';ctx.lineWidth=1.6;ctx.strokeStyle='#2e1a08';ctx.fillStyle='#9a6330';
        ctx.beginPath();ctx.moveTo(x-4.5,y-5);ctx.quadraticCurveTo(x-13,y+1,x-10,y+8.5);ctx.quadraticCurveTo(x,y+13,x+10,y+8.5);ctx.quadraticCurveTo(x+13,y+1,x+4.5,y-5);ctx.closePath();ctx.fill();ctx.stroke();   /* the sack */
        ctx.fillStyle='#c48a45';ctx.beginPath();ctx.ellipse(x-4.5,y+2,2.6,5,-.35,0,TAU);ctx.fill();
        ctx.fillStyle='#9a6330';ctx.beginPath();ctx.moveTo(x-4.5,y-5.5);ctx.lineTo(x-7,y-10.5);ctx.lineTo(x-2,y-8);ctx.lineTo(x,y-11.5);ctx.lineTo(x+2.5,y-8);ctx.lineTo(x+7,y-10.5);ctx.lineTo(x+4.5,y-5.5);ctx.closePath();ctx.fill();ctx.stroke();   /* the gathered top */
        ctx.fillStyle='#e8c040';ctx.fillRect(x-5.5,y-5.5,11,2.4);ctx.strokeRect(x-5.5,y-5.5,11,2.4);   /* the rope */
        ctx.fillStyle='#ffd23f';ctx.strokeStyle='#5a3a08';ctx.lineWidth=1.2;ctx.font='900 11px sans-serif';ctx.textAlign='center';ctx.strokeText('Z',x,y+8);ctx.fillText('Z',x,y+8);   /* the zenny mark */
        ctx.font='900 11px sans-serif';ctx.lineWidth=2.4;ctx.strokeStyle='rgba(30,16,4,.85)';ctx.fillStyle='#fff1a8';ctx.strokeText(String(l.v),x,y-15);ctx.fillText(String(l.v),x,y-15);   /* its value */
        break;}
      case'coin':{GLOW.at(ctx,x,y,16,'#ffd23f',.7);   /* a gold coin: bright rim, engraved inner ring, a Z and a glint */
        ctx.lineJoin='round';ctx.beginPath();ctx.arc(x,y,6.6,0,TAU);ctx.fillStyle='#ffd23f';ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#5a3a08';ctx.stroke();
        ctx.beginPath();ctx.arc(x,y,4.5,0,TAU);ctx.fillStyle='#f0b324';ctx.fill();ctx.lineWidth=.9;ctx.strokeStyle='#b8860b';ctx.stroke();
        ctx.strokeStyle='#8a5a08';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x-2.2,y-2.4);ctx.lineTo(x+2.2,y-2.4);ctx.lineTo(x-2.2,y+2.4);ctx.lineTo(x+2.2,y+2.4);ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.ellipse(x-3.6,y-3.8,1.7,.9,-.7,0,TAU);ctx.fill();break;}
      case'heal':{GLOW.at(ctx,x,y,21,'#8be07a',.85);   /* Senzu Bean: a plump bean with a seam, a shine and a golden shimmer */
        ctx.save();ctx.translate(x,y);ctx.rotate(-.5);
        const gr=ctx.createLinearGradient(0,-5.4,0,5.4);gr.addColorStop(0,'#c4f59a');gr.addColorStop(.55,'#6fd05a');gr.addColorStop(1,'#2f9a3c');
        ctx.beginPath();ctx.ellipse(0,0,9.2,5.6,0,0,TAU);ctx.fillStyle=gr;ctx.fill();ctx.lineJoin='round';ctx.lineWidth=1.6;ctx.strokeStyle='#143d12';ctx.stroke();
        ctx.strokeStyle='rgba(20,70,20,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-6.5,.8);ctx.quadraticCurveTo(0,-2.2,6.5,.8);ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.ellipse(-3.3,-2.6,3.2,1.2,-.15,0,TAU);ctx.fill();
        ctx.restore();
        ctx.save();ctx.globalCompositeOperation='lighter';const sh=(T0*.9+ph)%1;ctx.globalAlpha=Math.sin(sh*Math.PI)*.55;GLOW.at(ctx,x+(sh-.5)*12,y-1,7,'#fff6a8',.9);ctx.restore();break;}
      case'magnet':{GLOW.at(ctx,x,y,21,'#ff5a5a',.7);   /* a horseshoe magnet with painted poles; the field pulses off its tips */
        const U=(w,col)=>{ctx.lineWidth=w;ctx.strokeStyle=col;ctx.lineCap='butt';ctx.beginPath();ctx.moveTo(x-7.5,y+7);ctx.lineTo(x-7.5,y-1);ctx.arc(x,y-1,7.5,Math.PI,0);ctx.lineTo(x+7.5,y+7);ctx.stroke();};
        U(9.4,'#2a1208');U(6.6,'#d8d8e4');
        ctx.fillStyle='#e03a3a';ctx.fillRect(x-10.8,y+1.4,6.6,6.2);ctx.fillStyle='#3a6ae0';ctx.fillRect(x+4.2,y+1.4,6.6,6.2);
        ctx.fillStyle='#ffffff';ctx.fillRect(x-10.8,y+6.1,6.6,1.5);ctx.fillRect(x+4.2,y+6.1,6.6,1.5);
        ctx.lineWidth=1.2;ctx.strokeStyle='#2a1208';ctx.strokeRect(x-10.8,y+1.4,6.6,6.2);ctx.strokeRect(x+4.2,y+1.4,6.6,6.2);
        ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(x,y-1,6.7,Math.PI*1.1,Math.PI*1.55);ctx.stroke();
        ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineWidth=1.2;for(let i=0;i<2;i++){const r=(T0*1.1+i*.5+ph)%1;ctx.globalAlpha=(1-r)*.7;ctx.strokeStyle='#ff9a9a';ctx.beginPath();ctx.arc(x,y+9,3+r*9,Math.PI*1.12,Math.PI*1.88);ctx.stroke();}ctx.restore();break;}
      case'dmg':{   /* red arrow: bold outlined arrow that bobs, with chevrons that keep climbing off it and a pulsing aura */
        const bob=Math.sin(T0*7+ph)*1.8,pu=1+.12*Math.sin(T0*9+ph);
        GLOW.at(ctx,x,y,26*pu,'#ff3b2f',.85);GLOW.at(ctx,x,y,13,'#ffd0b8',.35);
        ctx.save();ctx.globalCompositeOperation='lighter';
        for(let i=0;i<2;i++){const r=(T0*1.2+i*.5+ph)%1;ctx.globalAlpha=(1-r)*.65;ctx.fillStyle='#ff7a5a';const cy2=y+2-r*22;ctx.beginPath();ctx.moveTo(x,cy2-6);ctx.lineTo(x+6.5,cy2+1);ctx.lineTo(x+3.6,cy2+1);ctx.lineTo(x,cy2-2.4);ctx.lineTo(x-3.6,cy2+1);ctx.lineTo(x-6.5,cy2+1);ctx.closePath();ctx.fill();}
        ctx.restore();
        const y2=y+bob,ar=()=>{ctx.beginPath();ctx.moveTo(x,y2-10);ctx.lineTo(x+8,y2+1);ctx.lineTo(x+3,y2+1);ctx.lineTo(x+3,y2+9);ctx.lineTo(x-3,y2+9);ctx.lineTo(x-3,y2+1);ctx.lineTo(x-8,y2+1);ctx.closePath();};
        const gr=ctx.createLinearGradient(0,y2-10,0,y2+9);gr.addColorStop(0,'#ffb08a');gr.addColorStop(.45,'#ff4a2a');gr.addColorStop(1,'#b3150c');
        ar();ctx.fillStyle=gr;ctx.fill();ctx.lineJoin='round';ctx.lineWidth=1.7;ctx.strokeStyle='#3d0804';ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,.75)';ctx.beginPath();ctx.moveTo(x-.5,y2-7);ctx.lineTo(x-4.6,y2-.4);ctx.lineTo(x-1.5,y2-.4);ctx.closePath();ctx.fill();   /* shine */
        break;}
      case'haste':{   /* rapid fire: an outlined bolt with a hot core and little sparks crackling around it */
        const fl=.8+.2*Math.sin(T0*22+ph);GLOW.at(ctx,x,y,24,'#ffd21f',.8*fl);
        const bolt=()=>{ctx.beginPath();ctx.moveTo(x+3,y-10);ctx.lineTo(x-6,y+1.5);ctx.lineTo(x-.8,y+1.5);ctx.lineTo(x-4,y+10);ctx.lineTo(x+6.5,y-2.5);ctx.lineTo(x+.8,y-2.5);ctx.closePath();};
        bolt();ctx.fillStyle='#ffe24d';ctx.fill();ctx.lineJoin='round';ctx.lineWidth=1.6;ctx.strokeStyle='#5a3a00';ctx.stroke();
        ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(255,255,255,'+(.55*fl)+')';ctx.beginPath();ctx.moveTo(x+2,y-7);ctx.lineTo(x-2.6,y);ctx.lineTo(x+.6,y);ctx.lineTo(x-1.4,y+5);ctx.lineTo(x+3.2,y-2);ctx.lineTo(x,y-2);ctx.closePath();ctx.fill();
        ctx.strokeStyle='rgba(255,245,170,'+(.8*fl)+')';ctx.lineWidth=1.2;for(let q=0;q<2;q++){const a=T0*9+q*3.1+ph,r1=10,r2=14+3*Math.sin(T0*14+q);ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1);ctx.lineTo(x+Math.cos(a+.25)*r2,y+Math.sin(a+.25)*r2);ctx.stroke();}ctx.restore();
        break;}
      case'xp':{   /* experience: a faceted gem that turns and glints */
        GLOW.at(ctx,x,y,22,'#5ad0ff',.85);
        const gem=()=>{ctx.beginPath();ctx.moveTo(x,y-9);ctx.lineTo(x+7,y-1);ctx.lineTo(x,y+9);ctx.lineTo(x-7,y-1);ctx.closePath();};
        gem();ctx.fillStyle='#4cc3ff';ctx.fill();ctx.lineJoin='round';ctx.lineWidth=1.5;ctx.strokeStyle='#07406b';ctx.stroke();
        ctx.fillStyle='#bfeaff';ctx.beginPath();ctx.moveTo(x,y-9);ctx.lineTo(x+7,y-1);ctx.lineTo(x,y-1);ctx.closePath();ctx.fill();
        ctx.fillStyle='#1b8fe0';ctx.beginPath();ctx.moveTo(x,y-1);ctx.lineTo(x+7,y-1);ctx.lineTo(x,y+9);ctx.closePath();ctx.fill();
        const g2=(T0*.8+ph)%1;if(g2<.3){const a=Math.sin(g2/.3*Math.PI);ctx.fillStyle='rgba(255,255,255,'+a+')';ctx.fillRect(x-5,y-5.8,10,1.6);ctx.fillRect(x-.8,y-10,1.6,10);}
        break;}
      case'capsule':{GLOW.at(ctx,x,y,22,'#ffffff',.75);   /* a Hoi-Poi capsule: red and white, with a seam and a shine */
        const pill=()=>{ctx.beginPath();ctx.moveTo(x-4,y-5);ctx.lineTo(x+4,y-5);ctx.arc(x+4,y,5,-Math.PI/2,Math.PI/2);ctx.lineTo(x-4,y+5);ctx.arc(x-4,y,5,Math.PI/2,Math.PI*1.5);ctx.closePath();};
        ctx.save();pill();ctx.clip();ctx.fillStyle='#f6f3ec';ctx.fillRect(x-11,y-6,22,12);
        const gr=ctx.createLinearGradient(0,y-5,0,y+5);gr.addColorStop(0,'#ff7a9a');gr.addColorStop(1,'#c81e4a');ctx.fillStyle=gr;ctx.fillRect(x-11,y-6,11,12);
        ctx.fillStyle='rgba(255,255,255,.75)';ctx.fillRect(x-8,y-4,8,1.8);ctx.fillRect(x+1.5,y-4,7,1.4);ctx.fillStyle='rgba(0,0,0,.16)';ctx.fillRect(x-11,y+2.5,22,3.5);ctx.restore();
        ctx.fillStyle='#2a1018';ctx.fillRect(x-.6,y-5,1.2,10);pill();ctx.lineWidth=1.5;ctx.lineJoin='round';ctx.strokeStyle='#2a1018';ctx.stroke();break;}
      case'luck':{GLOW.at(ctx,x,y,22,'#8be07a',.8);   /* a four-leaf clover with a golden heart */
        ctx.lineJoin='round';
        for(let i=0;i<4;i++){ctx.save();ctx.translate(x,y);ctx.rotate(i*Math.PI/2);ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-6,-2,-7,-9,-2.6,-9.4);ctx.bezierCurveTo(-.8,-9.5,0,-8,0,-6.6);ctx.bezierCurveTo(0,-8,.8,-9.5,2.6,-9.4);ctx.bezierCurveTo(7,-9,6,-2,0,0);ctx.closePath();
          const gr=ctx.createLinearGradient(0,0,0,-9);gr.addColorStop(0,'#2f9a3c');gr.addColorStop(1,'#7be86a');ctx.fillStyle=gr;ctx.fill();ctx.lineWidth=1.3;ctx.strokeStyle='#0f3a14';ctx.stroke();
          ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,-1.5);ctx.lineTo(0,-6);ctx.stroke();ctx.restore();}
        ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.arc(x,y,2.2,0,TAU);ctx.fill();ctx.lineWidth=1;ctx.strokeStyle='#5a3a08';ctx.stroke();break;}
      case'ball':GLOW.at(ctx,x,y-4,22+3*Math.sin(T0*5),'#ffaa28',.7);ctx.fillStyle='#ff9d1c';ctx.beginPath();ctx.arc(x,y-4,10,0,TAU);ctx.fill();ctx.fillStyle='#ffd27a';ctx.beginPath();ctx.arc(x-3,y-7,3.5,0,TAU);ctx.fill();ctx.fillStyle='#d22';for(let i=0;i<4;i++){const a=i/4*TAU+.6;ctx.fillRect(x+Math.cos(a)*4-1,y-4+Math.sin(a)*4-1,2,2);}break;
    }
    ctx.restore();
    if(pk>=1){                                              /* glints: a coin shine, rising crosses on the heal, orbiting stars on the rest */
      const cx=l.x,cy=l.y-6-lift;
      if(k==='coin'){const g2=(T0*.7+ph)%1;if(g2<.25){const a=Math.sin(g2/.25*Math.PI);ctx.fillStyle='rgba(255,255,255,'+a*.9+')';ctx.fillRect(cx-4,cy-.8,8,1.6);ctx.fillRect(cx-.8,cy-4,1.6,8);}}
      else if(k==='heal'){for(let i=0;i<2;i++){const r=(T0*.8+i*.5+ph)%1;ctx.fillStyle='rgba(216,255,200,'+(1-r)+')';const px=cx+(i?5:-5)+Math.sin(r*6+i)*2,py=cy-r*16;ctx.fillRect(px-2,py-.7,4,1.4);ctx.fillRect(px-.7,py-2,1.4,4);}}
      else{const n=k==='ball'?4:2;ctx.save();ctx.globalCompositeOperation='lighter';
        for(let i=0;i<n;i++){const a=T0*2+i/n*TAU+ph,r=k==='ball'?15:11,px=cx+Math.cos(a)*r,py=cy+Math.sin(a)*r*.55;ctx.fillStyle=col;ctx.globalAlpha=.85;ctx.fillRect(px-1.2,py-1.2,2.4,2.4);}
        ctx.restore();}
    }
    ctx.globalAlpha=1;
  }
  trialRoom(cx,cy,vw,vh,t,tr){
    if(tr.zeno)return this.zenoRoom(cx,cy,vw,vh,t,tr);
    const ctx=this.ctx,TS=64;
    ctx.fillStyle='#f3efe4';ctx.fillRect(cx-10,cy-10,vw+20,vh+20);
    const x0=Math.floor(cx/TS),y0=Math.floor(cy/TS),x1=Math.floor((cx+vw)/TS),y1=Math.floor((cy+vh)/TS);
    for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)if((tx+ty)&1){ctx.fillStyle='rgba(190,178,150,.25)';ctx.fillRect(tx*TS,ty*TS,TS,TS);}
    const gr=ctx.createRadialGradient(tr.cx,tr.cy,tr.R*.75,tr.cx,tr.cy,tr.R*1.3);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(255,255,255,.96)');
    ctx.fillStyle=gr;ctx.fillRect(cx-10,cy-10,vw+20,vh+20);
    ctx.strokeStyle='rgba(255,180,60,.85)';ctx.lineWidth=4;ctx.setLineDash([14,10]);ctx.lineDashOffset=-t*30;ctx.beginPath();ctx.arc(tr.cx,tr.cy,tr.R,0,TAU);ctx.stroke();ctx.setLineDash([]);
    for(const tp of tr.trp){
      const on=tp.armed>0,warn=on&&tp.tick<.45;
      ctx.fillStyle=on?'rgba(255,120,50,.22)':'rgba(120,110,150,.18)';ctx.beginPath();ctx.ellipse(tp.x,tp.y,tp.r,tp.r*.62,0,0,TAU);ctx.fill();
      ctx.strokeStyle=warn?'rgba(255,60,40,.95)':on?'rgba(255,170,60,.9)':'rgba(120,110,150,.55)';ctx.lineWidth=3;ctx.setLineDash(on?[]:[8,6]);ctx.beginPath();ctx.ellipse(tp.x,tp.y,tp.r,tp.r*.62,0,0,TAU);ctx.stroke();ctx.setLineDash([]);
      for(let i=0;i<6;i++){const a=i/6*TAU,px=tp.x+Math.cos(a)*tp.r*.55,py=tp.y+Math.sin(a)*tp.r*.34,h2=tp.fl>0?18:warn?8:on?4:2;ctx.fillStyle=tp.fl>0?'#fff2e0':'#9a94b4';ctx.beginPath();ctx.moveTo(px-4,py);ctx.lineTo(px,py-h2);ctx.lineTo(px+4,py);ctx.closePath();ctx.fill();}
      if(tp.fl>0)GLOW.at(ctx,tp.x,tp.y-8,tp.r*1.4,'#ff7a3a',.5);
    }
    for(const b of tr.btn){
      const ready=b.cd<=0;
      ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(b.x,b.y+3,b.r*1.05,b.r*.55,0,0,TAU);ctx.fill();
      ctx.fillStyle='#6a6488';ctx.beginPath();ctx.ellipse(b.x,b.y,b.r,b.r*.55,0,0,TAU);ctx.fill();
      ctx.fillStyle=ready?'#ff4a3a':'#6a6a70';ctx.beginPath();ctx.ellipse(b.x,b.y-(ready?4:1),b.r*.72,b.r*.4,0,0,TAU);ctx.fill();
      ctx.fillStyle=ready?'#ff9a8a':'#8a8a92';ctx.beginPath();ctx.ellipse(b.x-b.r*.2,b.y-(ready?6:3),b.r*.3,b.r*.14,0,0,TAU);ctx.fill();
      if(ready)GLOW.at(ctx,b.x,b.y-6,b.r*1.6,'#ff4a3a',.3+.15*Math.sin(t*5));
    }
    for(let i=0;i<16;i++){const a=t*.25+i*.4,rr=60+((i*53+t*18)%(tr.R-40));ctx.fillStyle='rgba(255,210,120,.55)';ctx.fillRect(tr.cx+Math.cos(a)*rr,tr.cy+Math.sin(a*1.3)*rr,3,3);}
  }
  drawZones(g,cx,cy,t){
    const ctx=this.ctx,th=g.stage.theme,hot=['hell','redrock','waste','arena'].includes(th);
    for(const z of World.zonesNear(th,cx+g.vw/2,cy+g.vh/2,Math.hypot(g.vw,g.vh)/2+120)){
      if(z.kind==='heal'){
        const pl=.5+.5*Math.sin(t*2.4+z.x);
        const gr=ctx.createRadialGradient(z.x,z.y,4,z.x,z.y,z.r);gr.addColorStop(0,'rgba(170,255,190,.55)');gr.addColorStop(.75,'rgba(90,210,130,.38)');gr.addColorStop(1,'rgba(90,210,130,0)');
        ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(z.x,z.y,z.r,z.r*.62,0,0,TAU);ctx.fill();
        ctx.strokeStyle='rgba(200,255,210,'+(.35+.3*pl)+')';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(z.x,z.y,z.r*(.55+.25*pl),z.r*(.55+.25*pl)*.62,0,0,TAU);ctx.stroke();
        ctx.fillStyle='rgba(235,255,240,.9)';for(let i=0;i<5;i++){const a=t*.9+i*1.26,rr=z.r*.6*(((t*.35+i*.2)%1));ctx.fillRect(z.x+Math.cos(a)*rr-1.5,z.y+Math.sin(a)*rr*.6-((t*30+i*9)%24),3,3);}
        ctx.fillStyle='#e8ffe8';ctx.fillRect(z.x-1.5,z.y-8,3,16);ctx.fillRect(z.x-8,z.y-1.5,16,3);
      }else{
        const st=World.trapState(z,g.rt),r=z.r,bc=hot?'#ff7a2a':'#c9d4e8';
        ctx.fillStyle='rgba(20,16,24,.55)';ctx.beginPath();ctx.ellipse(z.x,z.y,r,r*.6,0,0,TAU);ctx.fill();
        ctx.strokeStyle=st===0?'rgba(255,255,255,.18)':st===1?'rgba(255,200,60,.9)':'rgba(255,60,40,.95)';ctx.lineWidth=st===0?2:3;ctx.beginPath();ctx.ellipse(z.x,z.y,r,r*.6,0,0,TAU);ctx.stroke();
        const n=7;
        for(let i=0;i<n;i++){
          const a=i/n*TAU+z.ph,rr=i===0?0:r*.62,px=z.x+(i===0?0:Math.cos(a)*rr),py=z.y+(i===0?0:Math.sin(a)*rr*.6);
          const hgt=st===2?15:st===1?4+((t*14)|0)%2*2:2;
          ctx.fillStyle=st===2?'#ffe8e0':bc;ctx.beginPath();ctx.moveTo(px-4,py);ctx.lineTo(px,py-hgt);ctx.lineTo(px+4,py);ctx.closePath();ctx.fill();
          if(st===2){ctx.fillStyle='rgba(255,70,50,.9)';ctx.fillRect(px-1,py-hgt,2,3);}
        }
        if(st===2){GLOW.at(ctx,z.x,z.y-6,r*1.2,'#ff4a30',.35);}
      }
    }
  }
  drawEmote(k,x,y,t){
    const ctx=this.ctx;ctx.save();ctx.textAlign='center';ctx.font='900 17px "Bangers",sans-serif';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.85)';
    const sym={happy:['★','#ffd23f'],hurt:['!','#ff6b6b'],pain:['!!','#ff3b3b'],smug:['♪','#ffd23f'],wow:['?!','#8ad8ff']}[k];
    if(sym){ctx.strokeText(sym[0],x,y);ctx.fillStyle=sym[1];ctx.fillText(sym[0],x,y);}
    ctx.restore();
  }
  drawPet(q,t,g){
    const ctx=this.ctx,d=q.d,sd=d.sp,mv=Math.abs(q.x-(q.px===undefined?q.x:q.px))>.2;
    q.px=q.x;
    const fr=q.act>0?6:mv?1+((t*9)|0)%4:0,sp=Sprites.forSp(sd,fr,q.fl>0&&((t*20)|0)%2===0),k=(sd.u||1.4)/(sp.s||Sprites.S);
    const fly=d.id==='shenron'||d.id==='droid'||d.id==='buu',bob=fly?Math.sin(t*4+q.t)*3-8:Math.abs(Math.sin(q.t*(mv?9:2)))*(mv?-2:-.8);
    ctx.fillStyle='rgba(0,0,0,.26)';ctx.beginPath();ctx.ellipse(q.x,q.y,7,2.4,0,0,TAU);ctx.fill();
    if(q.cd<=0)GLOW.at(ctx,q.x,q.y-12+bob,20+3*Math.sin(t*5),d.c,.45);
    ctx.save();ctx.translate(q.x,q.y+bob);ctx.scale(q.face*k,k);ctx.drawImage(sp.c,-sp.ox,-sp.oy);ctx.restore();
    /* the XP gems it is carrying float above its head */
    if(q.hold&&q.hold.length&&!g.trial)for(let i=0;i<q.hold.length;i++){const gm=q.hold[i],col=gm.v<2.2?'#5ad0ff':gm.v<11?'#ffb13b':'#ff5a3d',r=gm.v<2.2?4:gm.v<11?6:9,gy=gm.y+bob*.5+Math.sin(t*6+i*2)*1.2;
      GLOW.at(ctx,gm.x,gy,r*3,col,.45);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(gm.x,gy-r);ctx.lineTo(gm.x+r*.8,gy);ctx.lineTo(gm.x,gy+r);ctx.lineTo(gm.x-r*.8,gy);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillRect(gm.x-1,gy-r*.5,2,r*.5);}
  }
  drawPillar(o){
    const ctx=this.ctx,x=o.x,y=o.y,r=o.r;
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(x,y+2,r*1.15,r*.5,0,0,TAU);ctx.fill();
    ctx.fillStyle='#8c84a8';ctx.fillRect(x-r*.95,y-r*.5,r*1.9,r*.6);
    ctx.fillStyle='#d8d4e8';ctx.fillRect(x-r*.62,y-r*2.6,r*1.24,r*2.2);ctx.fillStyle='#b4aed0';ctx.fillRect(x+r*.15,y-r*2.6,r*.47,r*2.2);
    ctx.fillStyle='#f4f2fc';ctx.fillRect(x-r*.62,y-r*2.6,r*.22,r*2.2);
    ctx.fillStyle='#a49cc4';ctx.fillRect(x-r*.85,y-r*2.85,r*1.7,r*.34);ctx.fillStyle='#8c84a8';ctx.fillRect(x-r*.85,y-r*.55,r*1.7,r*.2);
    if(o.v===0){ctx.fillStyle='#6a64c8';ctx.fillRect(x-r*.1,y-r*1.9,r*.2,r*.9);ctx.fillRect(x-r*.3,y-r*1.6,r*.6,r*.18);}
  }
  drawChest(c,t){
    const ctx=this.ctx,x=c.x,y=c.y,s=c.final?1.5:c.elite?1.2:1,pulse=.5+.5*Math.sin(t*4);
    GLOW.at(ctx,x,y-10*s,(34+8*pulse)*s,c.final?'#ff7ad0':'#ffd23f',.9);
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(x,y+3,14*s,4*s,0,0,TAU);ctx.fill();
    ctx.fillStyle='#7a4a1e';ctx.fillRect(x-12*s,y-14*s,24*s,14*s);ctx.fillStyle='#a8682a';ctx.fillRect(x-12*s,y-20*s,24*s,7*s);
    ctx.fillStyle='#ffd23f';ctx.fillRect(x-12*s,y-9*s,24*s,2.5*s);ctx.fillRect(x-2*s,y-18*s,4*s,10*s);ctx.fillStyle='#fff3b0';ctx.fillRect(x-1*s,y-12*s,2*s,3*s);
  }
  /* ---------- Zeno's Shop dimension ---------- */
  zenoRoom(cx,cy,vw,vh,t,tr){
    const ctx=this.ctx,g=this.game||null;
    const gr=ctx.createLinearGradient(0,cy-10,0,cy+vh+10);gr.addColorStop(0,'#241a52');gr.addColorStop(.55,'#6f4aa6');gr.addColorStop(1,'#ffb4d2');
    ctx.fillStyle=gr;ctx.fillRect(cx-10,cy-10,vw+20,vh+20);
    GLOW.at(ctx,tr.cx-260,tr.cy-240,260,'#7aa0ff',.18);GLOW.at(ctx,tr.cx+300,tr.cy+60,300,'#ff7ad0',.16);
    for(let i=0;i<110;i++){const sx=cx+(((i*977)%1000)/1000*vw*1.1+t*(1.5+i%5)*2)%(vw+20),sy=cy+((i*613)%1000)/1000*vh,tw=.35+.65*Math.abs(Math.sin(t*(1+i%4*.6)+i));ctx.fillStyle='rgba(255,255,255,'+tw*.85+')';ctx.fillRect(sx,sy,i%7===0?3:2,i%7===0?3:2);}
    const R=tr.R,x0=tr.cx,y0=tr.cy;
    ctx.fillStyle='rgba(30,10,60,.35)';ctx.beginPath();ctx.ellipse(x0,y0+R*.06+26,R*1.02,R*.97,0,0,TAU);ctx.fill();
    GLOW.at(ctx,x0,y0,R*1.5,'#ffd8f0',.35);
    ctx.save();ctx.beginPath();ctx.arc(x0,y0,R,0,TAU);ctx.clip();
    ctx.fillStyle='#fff6e6';ctx.fillRect(x0-R,y0-R,R*2,R*2);
    const TS=70;for(let ty=Math.floor((y0-R)/TS);ty<=Math.ceil((y0+R)/TS);ty++)for(let tx=Math.floor((x0-R)/TS);tx<=Math.ceil((x0+R)/TS);tx++)if((tx+ty)&1){ctx.fillStyle='rgba(255,205,150,.38)';ctx.fillRect(tx*TS,ty*TS,TS,TS);}
    ctx.fillStyle='#b8243a';ctx.fillRect(x0-62,y0-R,124,R*2);ctx.fillStyle='#e0b020';ctx.fillRect(x0-62,y0-R,6,R*2);ctx.fillRect(x0+56,y0-R,6,R*2);
    ctx.restore();
    ctx.strokeStyle='#ffd23f';ctx.lineWidth=6;ctx.beginPath();ctx.arc(x0,y0,R,0,TAU);ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x0,y0,R-8,0,TAU);ctx.stroke();
    for(let i=0;i<14;i++){const a=i/14*TAU+t*.05,rr=R+22+10*Math.sin(t*.8+i*2);GLOW.at(ctx,x0+Math.cos(a)*rr,y0+Math.sin(a)*rr*.97,46,'#ffffff',.55);}
    /* exit portal */
    const ex=tr.exit.x,ey=tr.exit.y,pu=.5+.5*Math.sin(t*4);GLOW.at(ctx,ex,ey-16,60+8*pu,'#c080ff',.7);ctx.strokeStyle='#e0b8ff';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(ex,ey-10,30,16,0,0,TAU);ctx.stroke();ctx.fillStyle='rgba(42,15,74,.85)';ctx.beginPath();ctx.ellipse(ex,ey-10,24,12,0,0,TAU);ctx.fill();
    /* items on the ground */
    const p=(this.gameRef||{}).p;
    for(const it of tr.items){
      const tdef=TRINKETS.find(q=>q.id===it.id),col=RARITY[it.rar].c,ix=x0+it.x,iy=y0+it.y,near=tr.near===it;
      ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(ix,iy+6,26,9,0,0,TAU);ctx.fill();
      if(it.sold){ctx.fillStyle='rgba(120,100,140,.5)';ctx.beginPath();ctx.ellipse(ix,iy,22,8,0,0,TAU);ctx.fill();continue;}
      GLOW.at(ctx,ix,iy-14,44+8*Math.sin(t*3+it.x),col,.6);
      ctx.fillStyle='#fff6e6';ctx.beginPath();ctx.ellipse(ix,iy,24,9,0,0,TAU);ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.stroke();
      const by=iy-22-Math.abs(Math.sin(t*2.2+it.x*.05))*6;
      ctx.fillStyle='rgba(20,10,40,.85)';ctx.beginPath();ctx.arc(ix,by,17,0,TAU);ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.stroke();
      ctx.font='bold 21px sans-serif';ctx.textAlign='center';ctx.fillStyle=col;ctx.fillText(tdef.k,ix,by+7);
      if(near&&tr.hold>0){ctx.strokeStyle='#ffffff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(ix,by,22,-Math.PI/2,-Math.PI/2+TAU*Math.min(1,tr.hold/.7));ctx.stroke();}
      ctx.font='bold 13px sans-serif';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.8)';const aff=(this.zenoCoins||0)>=it.price;const pl=it.price>0?'Z '+it.price:this.tr(T('GRATIS','FREE'));ctx.strokeText(pl,ix,iy+24);ctx.fillStyle=it.free?'#ffe14a':aff?'#9affb0':'#ff9a9a';ctx.fillText(pl,ix,iy+24);
    }
    /* Zeno-sama (the sprite sent by the user) */
    const zx=tr.zx,zy=tr.zy,ph=(t*1.7)%1,bph=4*ph*(1-ph),land=Math.pow(1-bph,7),bob=-bph*42,jp=tr.zj>0?Math.sin(tr.zj/.7*Math.PI)*30:0;   /* Zeno-sama bounces up and down */
    GLOW.at(ctx,zx,zy-44+bob,92,'#ffe9a0',.35+.1*Math.sin(t*2));
    ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(zx,zy+4,(32-jp*.3)*(1-bph*.22),(10-jp*.1)*(1-bph*.22),0,0,TAU);ctx.fill();
    if(ZENO_SPR&&ZENO_SPR.complete&&ZENO_SPR.naturalWidth){const hh=104,ww=hh*ZENO_SPR.naturalWidth/ZENO_SPR.naturalHeight,sq=tr.zj>0?1+.05*Math.sin(tr.zj/.7*TAU):1+.17*land-.07*bph,rot=Math.sin(t*3.4)*.07*(1-land)   /* squash when landing, stretch while rising */
      ctx.save();ctx.translate(zx,zy+bob-jp);ctx.rotate(rot);ctx.scale(sq,2-sq);ctx.imageSmoothingEnabled=true;ctx.drawImage(ZENO_SPR,-ww/2,-hh,ww,hh);ctx.imageSmoothingEnabled=false;ctx.restore();}
    for(let i=0;i<10;i++){const q=t*.6+i*.63,rr=44+16*Math.sin(t+i);ctx.fillStyle='rgba(255,233,160,'+(.5+.4*Math.sin(t*3+i))+')';ctx.fillRect(zx+Math.cos(q)*rr*1.3-1.5,zy-50+Math.sin(q)*rr-1.5,3,3);}
    ctx.textAlign='left';
  }
  drawFeature(f,t,g){
    const ctx=this.ctx,x=f.x,y=f.y,pulse=.5+.5*Math.sin(t*3+x);
    if(f.ttl-f.t<10&&((f.t*5)|0)%2===0)ctx.globalAlpha=.5;
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(x,y+2,22,7,0,0,TAU);ctx.fill();
    switch(f.kind){
      case'shrine':GLOW.at(ctx,x,y-20,40+8*pulse,'#ffd23f',.7);ctx.fillStyle='#8a8f98';ctx.fillRect(x-9,y-34,18,34);ctx.fillStyle='#a8aeb8';ctx.fillRect(x-9,y-34,18,5);ctx.fillStyle='#ffd23f';ctx.fillRect(x-3,y-24,6,2);ctx.fillRect(x-1,y-28,2,10);break;
      case'spring':GLOW.at(ctx,x,y-4,46,'#8be07a',.5);ctx.fillStyle='#2f86b8';ctx.beginPath();ctx.ellipse(x,y-2,22,9,0,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y-2,10+pulse*8,4+pulse*3,0,0,TAU);ctx.stroke();break;
      case'altar':GLOW.at(ctx,x,y-26,38+6*pulse,'#ff5a5a',.7);ctx.fillStyle='#3a3340';ctx.fillRect(x-16,y-14,32,14);ctx.fillStyle='#4a4250';ctx.fillRect(x-16,y-14,32,4);ctx.fillStyle='#ff5a5a';ctx.beginPath();ctx.moveTo(x,y-34-pulse*3);ctx.lineTo(x+6,y-24);ctx.lineTo(x,y-16);ctx.lineTo(x-6,y-24);ctx.closePath();ctx.fill();break;
      case'font':GLOW.at(ctx,x,y-30,50,'#8ad8ff',.6);{const gr=ctx.createLinearGradient(0,y-80,0,y);gr.addColorStop(0,'rgba(138,216,255,0)');gr.addColorStop(1,'rgba(138,216,255,.55)');ctx.fillStyle=gr;ctx.fillRect(x-12,y-80,24,80);}ctx.fillStyle='#fff';ctx.fillRect(x-2,y-40-pulse*10,4,4);break;
      case'chamber':GLOW.at(ctx,x,y-34,70+10*pulse,'#ffffff',.8);GLOW.at(ctx,x,y-34,44,'#ffd27a',.6);
        ctx.fillStyle='#e9e1cf';ctx.fillRect(x-22,y-64,44,64);ctx.fillStyle='#c9bfa6';ctx.fillRect(x-22,y-64,6,64);ctx.fillRect(x+16,y-64,6,64);ctx.fillRect(x-22,y-68,44,6);
        ctx.fillStyle='#fffbe8';ctx.fillRect(x-14,y-58,28,58);ctx.fillStyle='#ffd23f';ctx.fillRect(x-1,y-58,2,58);
        ctx.strokeStyle='rgba(255,210,63,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y-34,24+pulse*4,0,TAU);ctx.stroke();break;
      case'totem':{GLOW.at(ctx,x,y-34,48+8*pulse,'#8be07a',.7);ctx.fillStyle='#6a4a2a';ctx.fillRect(x-9,y-52,18,52);ctx.fillStyle='#8a6a3a';ctx.fillRect(x-9,y-52,5,52);ctx.fillStyle='#4a3018';ctx.fillRect(x-12,y-56,24,5);
        ctx.fillStyle='#8be07a';ctx.fillRect(x-6,y-44,4,5);ctx.fillRect(x+2,y-44,4,5);ctx.fillRect(x-5,y-34,10,3);ctx.fillStyle='#ffd23f';ctx.fillRect(x-3,y-22,6,6);
        ctx.strokeStyle='rgba(139,224,122,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y-30,28+pulse*5,0,TAU);ctx.stroke();break;}
      case'secret':{      /* stone altar with a mysterious red button */
        GLOW.at(ctx,x,y-24,f.pressed?34:54+10*pulse,'#ff3b3b',f.pressed?.25:.6);
        ctx.fillStyle='#4a4656';ctx.fillRect(x-20,y-16,40,16);ctx.fillStyle='#5e5a6e';ctx.fillRect(x-17,y-30,34,16);ctx.fillStyle='#34303e';ctx.fillRect(x-20,y-4,40,4);
        ctx.fillStyle='#2a2634';ctx.beginPath();ctx.ellipse(x,y-31,13,5,0,0,TAU);ctx.fill();
        ctx.fillStyle=f.pressed?'#7a1a1a':'#ff3b3b';ctx.beginPath();ctx.ellipse(x,y-(f.pressed?32:36),10,f.pressed?3:6,0,0,TAU);ctx.fill();
        if(!f.pressed){ctx.fillStyle='#ff9a8a';ctx.beginPath();ctx.ellipse(x-3,y-39,3.5,1.8,0,0,TAU);ctx.fill();
          ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.strokeStyle='rgba(90,0,0,.9)';ctx.lineWidth=3;const qy=y-62+Math.sin(t*3)*3;ctx.strokeText('?',x,qy);ctx.fillText('?',x,qy);ctx.textAlign='left';}
        break;}
      case'zenoportal':{GLOW.at(ctx,x,y-30,76+12*pulse,'#c080ff',.75);GLOW.at(ctx,x,y-30,40,'#ffe9a0',.6);
        ctx.save();ctx.translate(x,y-30);ctx.scale(1,1.25);ctx.lineWidth=3;
        for(let i=0;i<3;i++){const rr=(t*.6+i/3)%1;ctx.globalAlpha=1-rr;ctx.strokeStyle=i%2?'#ffe9a0':'#d9a8ff';ctx.beginPath();ctx.arc(0,0,8+rr*30,0,TAU);ctx.stroke();}
        ctx.globalAlpha=1;ctx.fillStyle='#2a0f4a';ctx.beginPath();ctx.arc(0,0,13,0,TAU);ctx.fill();
        ctx.strokeStyle='#e0b8ff';ctx.lineWidth=2;ctx.beginPath();for(let k=0;k<30;k++){const a=k*.45+t*4,r=k*.42;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.stroke();ctx.restore();
        ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.strokeStyle='rgba(60,0,110,.9)';ctx.lineWidth=3;const qy=y-78+Math.sin(t*3)*3;ctx.strokeText('?',x,qy);ctx.fillText('?',x,qy);ctx.textAlign='left';
        for(let i=0;i<4;i++){const a=t*1.4+i*1.57,rr=26+6*Math.sin(t*2+i);ctx.fillStyle='rgba(255,233,160,.8)';ctx.fillRect(x+Math.cos(a)*rr-1.5,y-30+Math.sin(a)*rr*1.2-1.5,3,3);}break;}
    }
    ctx.globalAlpha=1;
  }

  /* the character in the medallion of the HP bar: the sprite of the current form (the one before while a transformation charges), a pained face at low life */
  hudPortrait(g,ctx,cx,cy,r){
    const xf=g.xform,old=xf&&!xf.released?xf.old:null,pcc=old?old.pc:g.pc,pck=old?old.key:g.pcKey,t=g.rt,hr=g.p.hp/g.p.maxHp;
    let ex=null;
    if(g.dying||hr<.25)ex='pain';else if(g.emo&&g.emoT>0)ex=g.emo;else if((t%4.3)>4.17)ex='blink';
    const sp=Sprites.player(pck,pcc,0,false,ex);
    let ox=0,oy=0;if(xf&&!xf.released){const k=xf.t/xf.rel;ox=(Math.random()-.5)*r*.12*k;oy=(Math.random()-.5)*r*.12*k;}
    HpBar.portrait(ctx,sp,cx+ox,cy+oy,r,xf&&!xf.released?xf.col:g.formColor,t,xf?(xf.released?Math.max(0,.5-(xf.t-xf.rel)*.6):.15*xf.t/xf.rel):0);
  }

  /* ---------- HUD (screen space) ---------- */
  /* fallback icons of the weapon target while assets/tgt.webp loads (TgtArt): crosshair, heart + up arrow, heart + down arrow, skull */
  tgtIcon(ctx,mode,x,y,r,c,t){
    ctx.save();ctx.translate(x,y);ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=Math.max(1.5,r*.18);ctx.lineCap='round';ctx.lineJoin='round';
    if(mode===0){const k=1+.06*Math.sin(t*6);ctx.beginPath();ctx.arc(0,0,r*.72*k,0,TAU);ctx.stroke();for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.5,Math.sin(a)*r*.5);ctx.lineTo(Math.cos(a)*r*1.15,Math.sin(a)*r*1.15);ctx.stroke();}ctx.beginPath();ctx.arc(0,0,r*.16,0,TAU);ctx.fill();}
    else if(mode===3){drawSkull(ctx,0,0,r*1.05,c,1);}
    else{
      ctx.beginPath();ctx.moveTo(0,r*.75);ctx.bezierCurveTo(-r*1.25,-r*.1,-r*.6,-r*.95,0,-r*.3);ctx.bezierCurveTo(r*.6,-r*.95,r*1.25,-r*.1,0,r*.75);ctx.closePath();ctx.globalAlpha=.9;ctx.fill();ctx.globalAlpha=1;
      ctx.fillStyle='#0a0f1c';ctx.beginPath();if(mode===1){ctx.moveTo(0,-r*.1);ctx.lineTo(-r*.38,r*.32);ctx.lineTo(r*.38,r*.32);}else{ctx.moveTo(0,r*.38);ctx.lineTo(-r*.38,-r*.04);ctx.lineTo(r*.38,-r*.04);}ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }
  hud(g,dt,cx,cy){
    const ctx=this.ctx,U=this.U,W=this.W,H=this.H,p=g.p,tt=this.tt,tr=this.tr;
    ctx.setTransform(1,0,0,1,0,0);ctx.textBaseline='alphabetic';ctx.lineJoin='round';
    const F=(sz,wt)=>(wt||700)+' '+Math.round(sz*U)+'px "Rajdhani",sans-serif';
    const txt=(s,x,y,col,al,font)=>{ctx.font=font;ctx.textAlign=al||'left';ctx.lineWidth=3*U;ctx.strokeStyle='rgba(0,0,0,.8)';ctx.strokeText(s,x,y);ctx.fillStyle=col||'#fff';ctx.fillText(s,x,y);},tr2=(a,b)=>tr(T(a,b));
    const m=10*U;this.zones=[];
    /* xp bar */
    const xr=clamp(g.xp/g.need,0,1),xl=XpBar.layout(U,W);
    if(xl){   /* the artwork: medallion + level plates, a beam that fills up, XP / next and the percentage */
      XpBar.draw(ctx,2*U,2*U,xl,xr,{lv:g.lvl,lvl:tt('xpLevel')+' '+g.lvl,cur:String(Math.floor(g.xp)),need:String(Math.round(g.need)),pct:Math.floor(xr*100)+'%'},g.rt);
    }else{    /* narrow screens: the thin bar */
      ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(0,0,W,11*U);ctx.fillStyle='#4ac8ff';ctx.fillRect(0,0,W*xr,11*U);ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(0,0,W*xr,3*U);
      txt(tt('lv')+' '+g.lvl+'  ·  '+Math.floor(g.xp)+' / '+Math.round(g.need),m,30*U,'#fff','left',F(16));
    }
    /* hp */
    const hr=clamp(p.hp/p.maxHp,0,1),hl=HpBar.layout(U,W);let wy0;
    if(hl){   /* the artwork: medallion with the live portrait + level plate, the fill that follows the life, HP / max */
      const hy0=(xl?2*U+xl.h-6*U:2*U);
      HpBar.draw(ctx,2*U,hy0,hl,hr,{cur:String(Math.ceil(p.hp)),max:String(p.maxHp),plate:tt('lv')+' '+g.lvl},g.rt,(c,cx,cy,r)=>this.hudPortrait(g,c,cx,cy,r));
      wy0=hy0+hl.h+2*U;
    }else{    /* narrow screens: the plain bar */
      const bw=Math.min(250*U,W*.4),hy=xl?xl.h+8*U:38*U;
      ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(m,hy,bw,15*U);
      ctx.fillStyle=hr>.3?'#e9503f':'#ff2a2a';ctx.fillRect(m,hy,bw*hr,15*U);ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillRect(m,hy,bw*hr,4*U);
      txt(Math.ceil(p.hp)+' / '+p.maxHp,m+6*U,hy+12*U,'#fff','left',F(11));
      wy0=hy+22*U;
    }
    /* weapons */
    let ix=m;const wy=wy0,sz=52*U;
    for(const w of g.weapons.values()){
      this.zones.push({x:ix,y:wy,w:sz,h:sz,k:'weapon',id:w.id});
      ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(ix,wy,sz,sz);
      ctx.strokeStyle=w.evo?'#ffd23f':'rgba(255,255,255,.25)';ctx.lineWidth=(w.evo?2.5:1.5)*U;ctx.strokeRect(ix,wy,sz,sz);
      txt(w.def.k,ix+sz/2,wy+sz*.72,w.color,'center',F(34,900).replace('"Rajdhani",sans-serif','"Noto Sans JP","Hiragino Sans",sans-serif'));
      {const pw=(sz-6*U)/WMAX;for(let i=0;i<WMAX;i++){ctx.fillStyle=i<w.lv?(w.evo?'#ffd23f':'#fff'):'rgba(255,255,255,.2)';ctx.fillRect(ix+3*U+i*pw,wy+sz-5*U,pw-1.5*U,3.2*U);}}
      if(w.evo)txt(w.evo>=2?'★★':'★',ix+sz-9*U,wy+12*U,'#ffd23f','center',F(13));
      if(w.xl>0)txt(String(w.lvShow),ix+sz-4*U,wy+sz-9*U,'#ffd23f','right',F(12,900));   /* Endless: the level beyond 5 */
      if(w.maxed&&w.evo<g.maxEvo(w.id)){
        if(g.evoReady(w))txt('!',ix+6*U,wy+13*U,'#ff9d1c','center',F(15));
        else{const pn=PASS[evoPass(w.id,w.evo)];if(pn)txt(pn.k,ix+9*U,wy+13*U,pn.c,'center',F(14,900).replace('"Rajdhani",sans-serif','"Noto Sans JP","Hiragino Sans",sans-serif'));}
      }
      ix+=sz+4*U;
    }
    /* upgrades (secondary): one box each under the weapons, with a dot per level */
    const py0=wy+sz+7*U,ps=46*U;let px0=m,pshown=0;
    for(const id in g.pass){
      const lv=g.pass[id];if(!(lv>0))continue;pshown++;const P=PASS[id];
      this.zones.push({x:px0,y:py0,w:ps,h:ps,k:'pass',id});
      ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(px0,py0,ps,ps);ctx.strokeStyle=hexA(P.c,.75);ctx.lineWidth=1.8*U;ctx.strokeRect(px0,py0,ps,ps);
      {const pim=this.shopImg(PASS_IMG[id]);if(pim){const s=ps-13*U;ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(pim,px0+(ps-s)/2,py0+3*U,s,s);ctx.restore();}
       else txt(P.k,px0+ps/2,py0+ps*.62,P.c,'center',F(28,900).replace('"Rajdhani",sans-serif','"Noto Sans JP","Hiragino Sans",sans-serif'));}
      for(let i=0;i<5;i++){ctx.fillStyle=i<lv?P.c:'rgba(255,255,255,.2)';ctx.beginPath();ctx.arc(px0+ps/2+(i-2)*6.4*U,py0+ps-5.5*U,2.3*U,0,TAU);ctx.fill();}
      px0+=ps+4*U;
    }
    /* trinkets: one slot per slot you own (empty ones are dashed), the frame in the rarity colour, a perfection bar under the icon and, at 100%, the Ultra Instinct halo */
    let tx2=m;const ty=(pshown?py0+ps:wy+sz)+7*U,ts=30*U,nslot=Math.max(g.tcap,g.trinkets.length);
    for(let si=0;si<nslot;si++){
      const id=g.trinkets[si];
      if(!id){ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(tx2,ty,ts,ts);ctx.save();ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=1.6*U;ctx.setLineDash([4*U,3*U]);ctx.strokeRect(tx2,ty,ts,ts);ctx.restore();
        txt('+',tx2+ts/2,ty+ts*.68,'rgba(255,255,255,.35)','center',F(20,900));tx2+=ts+3*U;continue;}
      this.zones.push({x:tx2,y:ty,w:ts,h:ts,k:'trinket',id});
      const t=TRINKETS.find(x=>x.id===id),rr=g.trR(id),tc=RARITY[rr].c,pf=g.trP(id),has=hasPf(t),perfect=has&&pf>=100;
      if(perfect)GLOW.at(ctx,tx2+ts/2,ty+ts/2,ts*(1.05+.12*Math.sin(g.rt*4)),'#cfeaff',.4);
      ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(tx2,ty,ts,ts);ctx.fillStyle=hexA(tc,.16);ctx.fillRect(tx2,ty,ts,ts);
      ctx.strokeStyle=perfect?'#f4faff':tc;ctx.lineWidth=2*U;ctx.strokeRect(tx2,ty,ts,ts);
      txt(t.k,tx2+ts/2,ty+ts*.68,tc,'center',F(19,900).replace('"Rajdhani",sans-serif','"Noto Sans JP","Hiragino Sans",sans-serif'));
      if(has){const bx=tx2+3*U,bw2=ts-6*U,by=ty+ts-6*U;ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillRect(bx,by,bw2,3*U);ctx.fillStyle=perfColor(pf);ctx.fillRect(bx,by,bw2*pf/100,3*U);}
      tx2+=ts+3*U;
    }
    /* form label */
    const fe=g.formEntry,nxt=g.formsUnlocked<g.formMax?FORM_TIERS[g.formsUnlocked].lvl:null;
    const fy=ty+ts+16*U;
    txt((fe?tr(fe.n):tt('baseForm'))+(nxt?'  ·  '+tt('nextForm')+' '+nxt:''),m,fy,fe?fe.aura:'#fff','left',F(12));
    /* weapon target (TAB): closest / most HP / least HP / boss; only the active one is shown */
    if(!g.ended){
      const mode=g.tgt|0,c=['#ffd23f','#ff6b8a','#8ad8ff','#ff5a3d'][mode],bh=26*U,bw=134*U,by2=fy+13*U,nm=[['Più vicino','Closest'],['Più Salute','Most HP'],['Meno Salute','Least HP'],['Boss','Boss']][mode];
      if(this.tgtMode!==mode){this.tgtMode=mode;this.tgtAt=g.rt;}
      const pw=Math.min(98*U,W*.2),dh=TgtArt.draw(ctx,mode,m,by2,pw,Math.max(0,1-(g.rt-this.tgtAt)/.28));
      if(dh){   /* the artwork panel of the active mode + the key hint under it */
        this.zones.push({x:m,y:by2,w:pw,h:dh,k:'target'});
        txt('['+(this.keyHints.target||'Tab')+']',m+pw/2,by2+dh+12*U,'#fff','center',F(11));
      }else{    /* art not loaded yet: the simple box */
        this.zones.push({x:m,y:by2,w:bw,h:bh,k:'target'});
        ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(m,by2,bw,bh);ctx.strokeStyle=hexA(c,.8);ctx.lineWidth=1.6*U;ctx.strokeRect(m,by2,bw,bh);
        this.tgtIcon(ctx,mode,m+bh/2,by2+bh/2,bh*.34,c,g.rt);
        txt('['+(this.keyHints.target||'Tab')+'] '+tr2(nm[0],nm[1]),m+bh+2*U,by2+bh*.68,'#fff','left',F(12));
      }
    }
    /* pet ability button (bottom-left) */
    this.petBtn=null;
    if(g.pet&&!g.ended){
      const q=g.pet,d=q.d,rr=24*U,bx=m+rr+4*U,by=H-m-rr-8*U,ready=q.cd<=0;
      this.petBtn={x:bx,y:by,r:rr};this.zones.push({x:bx-rr,y:by-rr,w:rr*2,h:rr*2,k:'pet'});
      ctx.fillStyle='rgba(0,0,0,.6)';ctx.beginPath();ctx.arc(bx,by,rr,0,TAU);ctx.fill();
      if(!ready){ctx.fillStyle='rgba(255,255,255,.14)';ctx.beginPath();ctx.moveTo(bx,by);ctx.arc(bx,by,rr-3*U,-Math.PI/2,-Math.PI/2+TAU*(1-q.cd/d.cd));ctx.closePath();ctx.fillStyle=hexA(d.c,.45);ctx.fill();}
      ctx.lineWidth=3*U;ctx.strokeStyle=ready?d.c:'rgba(255,255,255,.3)';ctx.beginPath();ctx.arc(bx,by,rr,0,TAU);ctx.stroke();
      if(ready){ctx.globalAlpha=.3+.25*Math.sin(g.rt*6);ctx.strokeStyle=d.c;ctx.lineWidth=2*U;ctx.beginPath();ctx.arc(bx,by,rr+4*U,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
      txt(d.k,bx,by+8*U,ready?d.c:'#9aa6b8','center',F(22,900).replace('"Rajdhani",sans-serif','"Noto Sans JP","Hiragino Sans",sans-serif'));
      txt(ready?'['+(this.keyHints.pet||'Q')+']':Math.ceil(q.cd)+'s',bx,by+rr+13*U,ready?'#fff':'#9aa6b8','center',F(11));
    }
    /* universal dash button (after the pet and ability buttons): Shift, cooldown pie */
    this.dashBtn=null;
    if(!g.ended){
      const rr=24*U,bx=m+rr+4*U+(rr*2+12*U)*((g.pet?1:0)+1),by=H-m-rr-8*U,rdy=g.dashCd<=0,act=g.dashT>0,col='#7fd4ff',prog=rdy?1:1-g.dashCd/g.dashCdMax;
      this.dashBtn={x:bx,y:by,r:rr};this.zones.push({x:bx-rr,y:by-rr,w:rr*2,h:rr*2,k:'dash'});
      ctx.fillStyle='rgba(0,0,0,.6)';ctx.beginPath();ctx.arc(bx,by,rr,0,TAU);ctx.fill();
      if(prog<1){ctx.beginPath();ctx.moveTo(bx,by);ctx.arc(bx,by,rr-3*U,-Math.PI/2,-Math.PI/2+TAU*prog);ctx.closePath();ctx.fillStyle=hexA(col,.45);ctx.fill();}
      ctx.lineWidth=3*U;ctx.strokeStyle=rdy?col:'rgba(255,255,255,.3)';ctx.beginPath();ctx.arc(bx,by,rr,0,TAU);ctx.stroke();
      if(rdy||act){ctx.globalAlpha=.3+.25*Math.sin(g.rt*(act?12:6));ctx.strokeStyle=col;ctx.lineWidth=2*U;ctx.beginPath();ctx.arc(bx,by,rr+4*U,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
      txt('走',bx,by+8*U,rdy||act?col:'#6a7688','center',F(22,900).replace('"Rajdhani",sans-serif','"Noto Sans JP","Hiragino Sans",sans-serif'));
      txt(rdy?'['+(this.keyHints.dash||'Shift')+']':(g.dashCd<10?g.dashCd.toFixed(1):Math.ceil(g.dashCd))+'s',bx,by+rr+13*U,rdy?'#fff':'#9aa6b8','center',F(11));
      txt(this.tr(T('Scatto','Dash')),bx,by-rr-7*U,rdy||act?col:'#9aa6b8','center',F(10));
    }
    /* Senzu bag button (after the pet, ability and dash buttons) */
    this.szBtn=null;
    if(!g.ended){
      const rr=24*U,bx=m+rr+4*U+(rr*2+12*U)*((g.pet?1:0)+2),by=H-m-rr-8*U,n=g.senzu,ok=n>0&&g.p.hp<g.p.maxHp-.5&&g.senzuCd<=0,col='#8be07a';
      this.szBtn={x:bx,y:by,r:rr};this.zones.push({x:bx-rr,y:by-rr,w:rr*2,h:rr*2,k:'senzu'});
      ctx.fillStyle='rgba(0,0,0,.6)';ctx.beginPath();ctx.arc(bx,by,rr,0,TAU);ctx.fill();
      ctx.lineWidth=3*U;ctx.strokeStyle=n>0?col:'rgba(255,255,255,.3)';ctx.beginPath();ctx.arc(bx,by,rr,0,TAU);ctx.stroke();
      if(ok){ctx.globalAlpha=.3+.25*Math.sin(g.rt*6);ctx.strokeStyle=col;ctx.lineWidth=2*U;ctx.beginPath();ctx.arc(bx,by,rr+4*U,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
      txt('豆',bx,by+8*U,n>0?col:'#6a7688','center',F(22,900).replace('"Rajdhani",sans-serif','"Noto Sans JP","Hiragino Sans",sans-serif'));
      for(let i=0;i<SENZU_MAX;i++){ctx.fillStyle=i<n?col:'rgba(255,255,255,.22)';ctx.beginPath();ctx.arc(bx+(i-1)*8*U,by-rr+5*U,2.6*U,0,TAU);ctx.fill();}
      txt('['+(this.keyHints.senzu||'H')+']',bx,by+rr+13*U,n>0?'#fff':'#9aa6b8','center',F(11));
    }
    /* character ability button (next to the pet button) */
    this.abBtn=null;
    if(!g.ended){
      const a=g.abil,rr=24*U,bx=(g.pet?m+rr+4*U+rr*2+12*U:m+rr+4*U),by=H-m-rr-8*U,ready=g.abReady,col=a.c;
      let prog=1,label,act=false;
      if(a.m==='berserk'){act=g.bers>0;prog=act?g.bers/(g.bersMax||10):g.bersCd>0?1-g.bersCd/g.bersCdMax:1;label=act?Math.ceil(g.bers)+'s':g.bersCd>0?Math.ceil(g.bersCd)+'s':'['+(this.keyHints.kaioken||'R')+']';}
      else if(a.m==='kaioken'){act=g.kai>0;prog=1;label=g.kai?'x'+(g.kai===1?10:20):g.kaiAvail?'['+(this.keyHints.kaioken||'R')+']':'Lv '+FORM_TIERS[0].lvl;}
      else{prog=g.abCd>0?Math.max(0,1-g.abCd/Math.max(1,g.abCdMax)):1;label=g.abCd>0?Math.ceil(g.abCd)+'s':'['+(this.keyHints.kaioken||'R')+']';act=!!(g.regenT>0||g.abBuf||g.clones||g.critT>0||g.shieldT>0||g.tsT>0);}
      const usable=a.m==='kaioken'?g.kaiAvail:ready;
      this.abBtn={x:bx,y:by,r:rr};this.zones.push({x:bx-rr,y:by-rr,w:rr*2,h:rr*2,k:'ability'});
      ctx.fillStyle='rgba(0,0,0,.6)';ctx.beginPath();ctx.arc(bx,by,rr,0,TAU);ctx.fill();
      if(prog<1){ctx.beginPath();ctx.moveTo(bx,by);ctx.arc(bx,by,rr-3*U,-Math.PI/2,-Math.PI/2+TAU*prog);ctx.closePath();ctx.fillStyle=hexA(col,.45);ctx.fill();}
      ctx.lineWidth=3*U;ctx.strokeStyle=usable?col:'rgba(255,255,255,.3)';ctx.beginPath();ctx.arc(bx,by,rr,0,TAU);ctx.stroke();
      if(usable||act){ctx.globalAlpha=.3+.25*Math.sin(g.rt*(act?12:6));ctx.strokeStyle=col;ctx.lineWidth=2*U;ctx.beginPath();ctx.arc(bx,by,rr+4*U,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
      txt(a.k,bx,by+8*U,usable||act?col:'#9aa6b8','center',F(22,900).replace('"Rajdhani",sans-serif','"Noto Sans JP","Hiragino Sans",sans-serif'));
      txt(label,bx,by+rr+13*U,usable?'#fff':'#9aa6b8','center',F(11));
      txt(this.tr(a.n),bx,by-rr-7*U,usable||act?col:'#9aa6b8','center',F(10));
    }
    /* Super Dragon Balls owned (3): shown bottom right once the first one is collected */
    if(!g.sandbox&&!g.trial&&g.save.sball&&g.save.sball.length>0){
      const have=new Set(g.save.sball),r=11*U,gap=5*U,y1=H-m-r-4*U;
      txt(tt('sbTitle'),W-m,y1-r-6*U,'#ffd23f','right',F(10));
      for(let i=0;i<SB_TOTAL;i++){
        const x1=W-m-r-(SB_TOTAL-1-i)*(2*r+gap),on=have.has(i+1);
        ctx.save();ctx.globalAlpha=on?1:.35;
        const gr=ctx.createRadialGradient(x1-r*.3,y1-r*.35,1,x1,y1,r);gr.addColorStop(0,on?'#fff0b8':'#6a7688');gr.addColorStop(.55,on?'#ffae1c':'#3a4658');gr.addColorStop(1,on?'#a85a00':'#202a3a');
        ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x1,y1,r,0,TAU);ctx.fill();ctx.strokeStyle=on?'#ffe9a0':'rgba(255,255,255,.4)';ctx.lineWidth=1.5*U;ctx.stroke();
        ctx.fillStyle=on?'#d22':'rgba(255,255,255,.5)';const n=i+1;for(let k=0;k<n;k++){const a=k/n*TAU-Math.PI/2,rr=n>1?r*.42:0;ctx.beginPath();ctx.arc(x1+Math.cos(a)*rr,y1+Math.sin(a)*rr,r*.15,0,TAU);ctx.fill();}
        ctx.restore();
      }
    }
    /* timer + progress */
    const stg=g.stage;
    txt(fmtT(g.t),W/2,42*U,'#ffd23f','center',F(30,400).replace('"Rajdhani"','"Bangers"'));
    const pw=Math.min(300*U,W*.34),px=W/2-pw/2,py=52*U;
    ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(px,py,pw,6*U);ctx.fillStyle='#ffd23f';ctx.fillRect(px,py,pw*clamp(g.t/g.dur,0,1),6*U);
    /* milestones: small white skull = horde, big red skull = boss, Shenron = final boss (past ones fade; the next boss pulses when it is close) */
    {const cy=py+3*U;let nextB=null;for(const b of g.bossQ)if(!b.done&&b.t>=g.t&&(!nextB||b.t<nextB.t))nextB=b;
      for(const ht of (g.hordePlan||[])){const past=ht<g.t;drawSkull(ctx,px+pw*clamp(ht/g.dur,0,1),cy+7*U,3.6*U,'#f4f4f4',past?.3:.95);}
      for(const e of (g.elitePlan||[])){const x=px+pw*clamp(e.t/g.dur,0,1),y=cy+14*U,r=3.8*U;ctx.save();ctx.globalAlpha=e.done||e.t<g.t?.3:.95;ctx.fillStyle='#ffd23f';ctx.strokeStyle='#0a0f1c';ctx.lineWidth=Math.max(1,U);ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}ctx.closePath();ctx.stroke();ctx.fill();ctx.restore();}   /* gold star = elite enemy */
      for(const b of g.bossQ){const x=px+pw*clamp(b.t/g.dur,0,1),past=b.done||b.t<g.t,soon=b===nextB&&b.t-g.t<30,pulse=soon?1+.18*Math.sin(g.rt*8):1,a=past?.35:1;
        if(b.final)drawShenron(ctx,x,cy-1*U,1.25*U*pulse,a);else drawSkull(ctx,x,cy-3*U,6.2*U*pulse,'#ff3b3b',a);}}
    /* right side: kills, zenny, buffs */
    txt(g.kills+' '+tt('kills'),W-m,30*U,'#fff','right',F(15));
    {const zs=String(Math.floor(g.run.coins));txt(zs,W-m,50*U,'#ffd23f','right',F(14));ctx.font=F(14);const zw=ctx.measureText(zs).width,cr=7*U,cx0=W-m-zw-cr-4*U,cy0=45*U;
      ctx.fillStyle='#7a4e0c';ctx.beginPath();ctx.arc(cx0,cy0,cr,0,TAU);ctx.fill();ctx.fillStyle='#f2b51c';ctx.beginPath();ctx.arc(cx0,cy0,cr*.84,0,TAU);ctx.fill();
      ctx.strokeStyle='#7a4e0c';ctx.lineWidth=1.6*U;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx0-cr*.38,cy0-cr*.38);ctx.lineTo(cx0+cr*.38,cy0-cr*.38);ctx.lineTo(cx0-cr*.38,cy0+cr*.38);ctx.lineTo(cx0+cr*.38,cy0+cr*.38);ctx.stroke();}
    let by=70*U;
    {const tk=g.run.tk||{},tn=(tk.t1||0)+(tk.t10||0)+(tk.l10||0);if(tn>0){txt(tt('hudTickets',{n:(tk.t1||0)+(tk.t10||0)*10+(tk.l10||0)*10}),W-m,by-2*U,'#ffd7f0','right',F(12));by+=16*U;}}
    if(g.streak>=5){                                    /* kill streak: counter that pops on every kill + a bar that drains until the streak breaks */
      const sc=g.streak,col=sc>=500?'#d86bff':sc>=200?'#ff5a3d':sc>=100?'#ff7b4a':sc>=50?'#ffb13b':'#ffe24d',pop=1+Math.min(.4,Math.max(0,g.streakPop)*1.6),bw=74*U;
      txt(tr(T('SERIE','STREAK')),W-m,by,'#ffe7c0','right',F(11,800));
      ctx.save();ctx.translate(W-m,by+20*U);ctx.scale(pop,pop);txt('x'+sc,0,0,col,'right',F(22,900));ctx.restore();
      ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(W-m-bw,by+25*U,bw,3*U);ctx.fillStyle=col;ctx.fillRect(W-m-bw,by+25*U,bw*clamp(g.streakT/STREAK_WIN,0,1),3*U);
      by+=36*U;
    }
    if(g.buffs.dmg>0){txt(tt('buffDmg')+' '+Math.ceil(g.buffs.dmg)+'s',W-m,by,'#ff7b4a','right',F(12));by+=16*U;}
    if(g.buffs.haste>0){txt(tt('buffHaste')+' '+Math.ceil(g.buffs.haste)+'s',W-m,by,'#ffe24d','right',F(12));by+=16*U;}
    if(g.riskT>0){txt(tt('buffRisk')+' '+Math.ceil(g.riskT)+'s',W-m,by,'#ff7a3a','right',F(12));by+=16*U;}
    if(g.totemTag){const d=g.totemFx.storm?Math.ceil(Math.max(0,g.stormT)):g.totemFx.spirit?Math.ceil(Math.max(0,g.pulseT)):0;txt(this.tr(g.totemTag)+(g.totemLuck>0?' x'+g.totemLuck:'')+(d?' '+d+'s':''),W-m,by,'#8be07a','right',F(12));by+=16*U;}
    if(g.inHeal){txt(tt('inHeal'),W-m,by,'#8be07a','right',F(12));by+=16*U;}
    if(g.bers>0){txt('BERSERK '+Math.ceil(g.bers)+'s  ·  +80% DMG  +5 ARM',W-m,by,'#8aff3a','right',F(14,900));by+=17*U;}
    else if(g.berAvail){txt(g.bersCd>0?'Berserk '+Math.ceil(g.bersCd)+'s':'['+(this.keyHints.kaioken||'R')+'] Berserk',W-m,by,g.bersCd>0?'#8a9a8a':'#b8ff8a','right',F(11));by+=15*U;}
    if(g.kai>0){txt('KAIOKEN x'+(g.kai===1?10:20)+'  -'+(Math.round(g.kaiDrain*10)/10)+' HP/s  ['+(this.keyHints.kaioken||'R')+']',W-m,by,'#ff3b2f','right',F(13,900));by+=17*U;}
    else if(g.kaiAvail){txt('['+(this.keyHints.kaioken||'R')+'] Kaioken x10 / x20',W-m,by,'#d89a8a','right',F(11));by+=15*U;}
    if(g.slowT>0){txt(tt('buffSlow'),W-m,by,'#9fe8ff','right',F(12));by+=16*U;}
    if(g.x2)txt('x2',W-m,by+4*U,'#ff7ad0','right',F(16,900));
    /* dragon balls: tiny, bottom-right */
    {const sh=this.ballSheet(),own=g.ballOwned?g.ballOwned():null,all7=own?own.size>=7:g.balls>=7,sz=15*U;
      for(let i=0;i<7;i++){const x=W-m-(6-i)*16.5*U-sz/2,y=H-m-sz/2-U,on=own?own.has(i+1):i<g.balls;
        if(sh){
          ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.arc(x,y,sz*.5,0,TAU);ctx.fill();
          if(on){GLOW.at(ctx,x,y,sz*(all7?1.1+.2*Math.sin(g.rt*6+i):.8),'#ffaa28',all7?.8:.45);}
          ctx.save();ctx.globalAlpha=on?1:.2;ctx.imageSmoothingEnabled=true;ctx.drawImage(sh,i*64,0,64,64,x-sz/2,y-sz/2,sz,sz);ctx.restore();
        }else{ctx.fillStyle=on?'#ff9d1c':'rgba(0,0,0,.45)';ctx.beginPath();ctx.arc(x,y,5*U,0,TAU);ctx.fill();ctx.strokeStyle=on?'#ffd27a':'rgba(255,255,255,.2)';ctx.lineWidth=1;ctx.stroke();if(on){ctx.fillStyle='#d22';ctx.fillRect(x-1,y-1,2,2);}}}}
    /* boss bars */
    let yb=70*U;const bosses=g.en.filter(e=>(e.boss||e.sparring)&&!e.dead);
    for(const b of bosses.slice(0,2)){
      const bw2=Math.min(620*U,W*.72),bx=(W-bw2)/2,bh=18*U;
      b.hpLag=b.hpLag===undefined?b.hp:lerp(b.hpLag,b.hp,Math.min(1,dt*3));
      ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(bx-3*U,yb-3*U,bw2+6*U,bh+6*U);
      ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillRect(bx,yb,bw2*clamp(b.hpLag/b.max,0,1),bh);
      const gr=ctx.createLinearGradient(0,yb,0,yb+bh);gr.addColorStop(0,b.bd.c);gr.addColorStop(1,'#7a1a1a');ctx.fillStyle=gr;ctx.fillRect(bx,yb,bw2*clamp(b.hp/b.max,0,1),bh);
      ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(bx+bw2*.33,yb,2*U,bh);ctx.fillRect(bx+bw2*.66,yb,2*U,bh);
      txt(tr(b.bd.n)+(b.final?'  ★':'')+(b.tf?'  '+'★'.repeat(b.tf):''),bx,yb-6*U,'#fff','left',F(14));
      txt(fmtN(Math.max(0,b.hp))+' / '+fmtN(b.max),bx+bw2,yb-6*U,'#ffd0d0','right',F(12));
      yb+=bh+22*U;
    }
    /* beacons for off-screen map items */
    const tgts=[];for(const f of g.feat)if(!f.used)tgts.push([f.x,f.y,(f.kind==='secret'||f.kind==='zenoportal')?(f.kind==='secret'?'#ff5a5a':'#d9a8ff'):f.kind==='chamber'?'#ffffff':f.kind==='totem'?'#8be07a':f.kind==='altar'?'#ff5a5a':f.kind==='spring'?'#8be07a':f.kind==='font'?'#8ad8ff':'#ffd23f']);
    for(const c of g.chests)tgts.push([c.x,c.y,'#ffd23f']);
    for(const l of g.loot)if(l.k==='ball'||l.k==='sball'||l.k==='capsule'||l.k==='bag')tgts.push([l.x,l.y,l.k==='sball'?'#ffe066':l.k==='ball'?'#ff9d1c':l.k==='bag'?'#ffd23f':'#ffffff']);
    for(const [tx3,ty3,col] of (g.trial?[]:tgts)){
      const sxp=(tx3-cx)*this.Z,syp=(ty3-cy)*this.Z;
      if(sxp>20&&sxp<W-20&&syp>20&&syp<H-20)continue;
      const a=Math.atan2(ty3-(p.y-14),tx3-p.x),r=Math.min(W,H)/2-30*U,ex=W/2+Math.cos(a)*Math.min(r*W/H*.9,W/2-26*U),ey=H/2+Math.sin(a)*Math.min(r,H/2-26*U);
      /* big, glowing, outlined arrow that pulses; the distance sits next to it */
      const pu=1+.13*Math.sin(g.rt*6+tx3*.01),k2=1.75*pu,dist=Math.hypot(tx3-p.x,ty3-p.y);
      GLOW.at(ctx,ex,ey,34*U*pu,col,.7);
      ctx.save();ctx.translate(ex,ey);ctx.rotate(a);ctx.scale(k2,k2);
      ctx.beginPath();ctx.moveTo(12*U,0);ctx.lineTo(-8*U,-9*U);ctx.lineTo(-4*U,0);ctx.lineTo(-8*U,9*U);ctx.closePath();
      ctx.lineJoin='round';ctx.lineWidth=4.5*U;ctx.strokeStyle='#0a0f1c';ctx.stroke();ctx.lineWidth=1.6*U;ctx.strokeStyle='#ffffff';ctx.stroke();
      ctx.fillStyle=col;ctx.globalAlpha=1;ctx.fill();ctx.restore();
      txt(Math.round(dist/10)+'m',clamp(ex-Math.cos(a)*34*U,26*U,W-26*U),clamp(ey-Math.sin(a)*26*U+4*U,18*U,H-8*U),'#ffffff','center',F(12));
    }
    /* altar prompt */
    for(const f of g.feat)if(f.kind==='secret'&&f.near&&!f.used)txt('['+(this.keyHints.interact||'E')+'] '+tr2('Premi il bottone misterioso','Press the mysterious button'),W/2,H*.7,'#ff8a8a','center',F(16));
    for(const f of g.feat)if((f.kind==='altar'||f.kind==='chamber'||f.kind==='totem')&&f.near&&!f.used){
      txt('['+(this.keyHints.interact||'E')+'] '+tt(f.kind==='altar'?'altarPrompt':f.kind==='totem'?'totemPrompt':'chamberPrompt'),W/2,H*.7,'#ff8a8a','center',F(16));
    }
    if(g.trial&&g.trial.zeno){
      const zt=g.trial,rem=Math.max(0,Math.ceil(zt.dur-zt.t)),bw=Math.min(360*U,W*.5);
      txt(tr2('SHOP DI ZENO','ZENO\'S SHOP')+'  '+rem+'s',W/2,H*.82,'#ffe9a0','center',F(26,400).replace('"Rajdhani"','"Bangers"'));
      ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(W/2-bw/2,H*.82+10*U,bw,8*U);ctx.fillStyle='#e0b8ff';ctx.fillRect(W/2-bw/2,H*.82+10*U,bw*clamp(1-zt.t/zt.dur,0,1),8*U);
      txt(tr2('Avvicinati a un oggetto per vederne gli effetti · restaci sopra per comprarlo · portale in basso per uscire','Get close to an item to see what it does · stand right on it to buy · portal below to leave'),W/2,H*.82+38*U,'#ffffff','center',F(13));
      const it=zt.look||zt.near;
      if(it){
        const td=TRINKETS.find(q=>q.id===it.id),col=RARITY[it.rar].c,aff=g.run.coins>=it.price,full=false;
        const lines=trinStats(td,it.rar,it.pf).map(x=>[tr(x.t),true]);if(hasPf(td)&&it.pf!=null)lines.push(['\0perf',true],['\0bar',true]);
        if(td.x)lines.push([tr(td.x),true,1]);else if(td.sp)lines.push([tr(td.d),true,1]);
        const cc=g.trinkets.length>=g.tcap?(g.trinkets.length===1?g.trinkets[0]:'*'):null,ccd=cc&&cc!=='*'&&TRINKETS.find(q=>q.id===cc);
        const pw=Math.min(268*U,W-16*U),lh=18*U,ph=(78+Math.max(1,lines.length)*18+(it.sold?0:20))*U;
        const ix=(zt.cx+it.x-cx)*this.Z,iy=(zt.cy+it.y-cy)*this.Z;
        /* speech bubble ("nuvoletta") beside the item, with a tail pointing at it */
        const gap=40*U,fitR=ix+gap+pw<=W-8*U,fitL=ix-gap-pw>=8*U,plX=(g.p.x-cx)*this.Z;
        const right=plX<=ix?(fitR||!fitL):!(fitL||!fitR);   /* the bubble opens on the side opposite to the player, so it never hides the character */
        const px=right?Math.min(ix+gap,W-pw-8*U):Math.max(ix-gap-pw,8*U),py=clamp(iy-ph*.55,8*U,H-ph-8*U),rr=14*U;
        const tipX=right?ix+26*U:ix-26*U,baseX=right?px:px+pw,ty=clamp(iy-8*U,py+rr+10*U,py+ph-rr-10*U);
        ctx.save();ctx.fillStyle='rgba(16,8,38,.94)';ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.lineJoin='round';
        ctx.beginPath();ctx.moveTo(px+rr,py);ctx.lineTo(px+pw-rr,py);ctx.quadraticCurveTo(px+pw,py,px+pw,py+rr);
        if(!right){ctx.lineTo(px+pw,ty-9*U);ctx.lineTo(tipX,iy-8*U);ctx.lineTo(px+pw,ty+9*U);}
        ctx.lineTo(px+pw,py+ph-rr);ctx.quadraticCurveTo(px+pw,py+ph,px+pw-rr,py+ph);ctx.lineTo(px+rr,py+ph);ctx.quadraticCurveTo(px,py+ph,px,py+ph-rr);
        if(right){ctx.lineTo(px,ty+9*U);ctx.lineTo(tipX,iy-8*U);ctx.lineTo(px,ty-9*U);}
        ctx.lineTo(px,py+rr);ctx.quadraticCurveTo(px,py,px+rr,py);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
        GLOW.at(ctx,px+26*U,py+30*U,34*U,col,.5);
        txt(td.k,px+26*U,py+39*U,col,'center',F(26));
        txt(tr(td.n),px+52*U,py+26*U,col,'left',F(17));
        txt(tr(RARITY[it.rar].n)+(ccd?'  ·  '+tr2('sostituirà','replaces')+' '+tr(ccd.n):(cc==='*'?'  ·  '+tr2('sostituirà un cimelio','replaces a trinket'):'')),px+52*U,py+44*U,'#c8c0e0','left',F(12));
        let yy=py+72*U;
        txt(tr2('Statistiche','Stats'),px+12*U,yy-6*U,'#8a82a8','left',F(11));
        for(const [tx2,good,small] of lines){
          if(tx2==='\0perf'){txt(tr2('Perfezione','Perfection')+'  '+it.pf+' / 100'+(it.pf>=100?' ✦':''),px+14*U,yy+12*U,perfColor(it.pf),'left',F(13));}
          else if(tx2==='\0bar'){const bx=px+14*U,bw=pw-28*U,by=yy+2*U;ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(bx,by,bw,6*U);ctx.fillStyle=perfColor(it.pf);ctx.fillRect(bx,by,bw*it.pf/100,6*U);ctx.fillStyle='rgba(0,0,0,.55)';for(let q=1;q<4;q++)ctx.fillRect(bx+bw*q/4-.5*U,by,U,6*U);
            ctx.fillStyle='#8a82a8';txt('0',bx,by+16*U,'#8a82a8','left',F(9));txt('100',bx+bw,by+16*U,'#8a82a8','right',F(9));}
          else txt(tx2,px+14*U,yy+12*U,good?'#9affb0':'#ff9a9a','left',F(small?12:14));
          yy+=lh;}
        if(!it.sold)txt((it.price>0?'Z '+it.price:tr2('GRATIS','FREE'))+(it.disc?'  ·  −30%':'')+(aff?'':'  ·  '+tr2('monete insufficienti','not enough coins')),px+14*U,py+ph-10*U,it.free?'#ffe14a':aff?'#ffe08a':'#ff9a9a','left',F(14));
      }
    }
    if(g.trial&&g.trial.phase==='train'){
      const tr=g.trial,rem=Math.max(0,Math.ceil(tr.dur-tr.t)),bw=Math.min(360*U,W*.5);
      txt(tt('trialTrain')+' '+rem+'s',W/2,H*.18,'#5a64c8','center',F(26,400).replace('"Rajdhani"','"Bangers"'));
      txt(tt('trialHint'),W/2,H*.18+38*U,'#cfd8ff','center',F(13));
      ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(W/2-bw/2,H*.18+10*U,bw,8*U);ctx.fillStyle='#aab4ff';ctx.fillRect(W/2-bw/2,H*.18+10*U,bw*clamp(1-tr.t/tr.dur,0,1),8*U);
    }
    /* banner */
    if(g.banner){
      const b=g.banner,k=b.t/b.dur,a=k<.1?k/.1:k>.8?(1-k)/.2:1;
      ctx.globalAlpha=clamp(a,0,1);
      txt(b.txt,W/2,H*.3,b.col,'center',F(Math.min(34,Math.max(18,W/U/24)),400).replace('"Rajdhani"','"Bangers"'));
      if(b.sub){   /* second line: a thin golden rule and a smaller sentence under the title (Endless notices) */
        const lw=Math.min(W*.5,340*U),ly=H*.3+11*U,lg=ctx.createLinearGradient(W/2-lw/2,0,W/2+lw/2,0);
        lg.addColorStop(0,'rgba(255,210,63,0)');lg.addColorStop(.5,b.col);lg.addColorStop(1,'rgba(255,210,63,0)');
        ctx.fillStyle=lg;ctx.fillRect(W/2-lw/2,ly,lw,1.5*U);
        let fs=16;ctx.font=F(fs,600);while(ctx.measureText(b.sub).width>W*.92&&fs>9){fs-=.5;ctx.font=F(fs,600);}
        txt(b.sub,W/2,H*.3+32*U,'#fff3cf','center',F(fs,600));
      }
      ctx.globalAlpha=1;
    }
    if(this.joy&&this.joy.on){
      const j=this.joy;ctx.globalAlpha=.3;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(j.ox,j.oy,48*U,0,TAU);ctx.fill();
      ctx.globalAlpha=.6;ctx.beginPath();ctx.arc(j.ox+j.x*38*U,j.oy+j.y*38*U,22*U,0,TAU);ctx.fill();ctx.globalAlpha=1;
    }
    if(this.save.d.settings.fps){this.fa+=dt;this.fn++;if(this.fa>.5){this.fps=Math.round(this.fn/this.fa);this.fa=0;this.fn=0;}txt(this.fps+' FPS',W-m,H-26*U,'#9fe8ff','right',F(11));}
    if(g.sandbox)txt('SANDBOX',W/2,H-10*U,'#ff7ad0','center',F(12));
  }
}
