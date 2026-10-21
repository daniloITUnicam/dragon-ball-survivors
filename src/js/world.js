'use strict';
/* ====== World obstacles: sparse, deterministic, themed solid props (no storage needed) ====== */
/* ====== Map seed: every run lays its map out differently (obstacles, lakes, ground tones, decor, traps, the snake's winding and its islands).
   MAP.roll() is called when a run starts; roll(0) (or window.__MAPSEED = 0) restores the classic layout, a fixed number replays that layout. ====== */
const MAP={
  seed:0,ix:0,iy:0,nx:0,ny:0,p1:0,p2:0,
  roll(seed){
    if(seed===undefined)seed=(typeof window!=='undefined'&&window.__MAPSEED!==undefined)?window.__MAPSEED:((Math.random()*2147483646)|0)+1;
    this.seed=seed|0;
    if(!this.seed){this.ix=this.iy=this.nx=this.ny=this.p1=this.p2=0;}
    else{
      const r=n=>hash((this.seed^Math.imul(n,7919))|0,n*104729+13);
      this.ix=Math.floor(r(1)*200000)-100000;this.iy=Math.floor(r(2)*200000)-100000;
      this.nx=r(3)*900;this.ny=r(4)*900;this.p1=r(5)*Math.PI*2;this.p2=r(6)*Math.PI*2;
    }
    World.cache.clear();World.zc.clear();Snake._is.clear();if(typeof Sea!=='undefined')Sea.cache.clear();
  }
};
const mhash=(a,b)=>hash(a+MAP.ix,b+MAP.iy);
const OB_CELL=230,ZONE_CELL=460,TRAP_PERIOD=4;
const OB_DENS={beach:.14,waste:.12,redrock:.12,plains:.12,arena:.10,other:.10,hell:.12,sky:.10,namek:.12};   /* share of the 230 px cells that hold a prop (default .15) */
/* each def: w=spawn weight, r=ground collision radius, art(R,C)=painter, W,H=sprite size in art units (origin bottom centre) */
const OB=(w,r,W,H,art,rk)=>({w,r,W,H,art,rk});
const OBS=(w,r,W,H,art,sc)=>({w,r,W,H,art,sc});   /* sc: the sprite is drawn that many times larger than the base 3.1 px per art unit (r is already the scaled collision radius) */
/* Rock sprites. Two planets draw their rocks from a sprite atlas (assets/sprites/<sheet>.png, built by tools/make_rocks.py; sprites.json: rects [x,y,w,h] per rock,
   kinds {name: [rock numbers]} = which rocks an obstacle of that kind may use, anim = the extra frames of the animated ones, dry = rocks without lava):
   Namek -> rocks (grey-green stones), Inferno -> lavarocks (volcanic stones with lava). Nothing else uses them: the other planets keep their painted rocks.
   A rock is drawn at ROCK_S world px per sprite px (wide ones are shrunk to ROCK_MAXW); the collision circle comes from the sprite footprint. */
const ROCK_SHEET={namek:'rocks',hell:'lavarocks'};
const ROCK_S=1.2,ROCK_MAXW=150;
const rockSheet=theme=>{const id=ROCK_SHEET[theme],S=id&&typeof Sprites!=='undefined'&&Sprites.sheets&&Sprites.sheets[id];return S&&S.rects?S:null;};   /* (the headless simulators have no sprites: no rocks there) */
/* IM: the obstacle is drawn from a rect of the theme's prop sheet (PROP_SHEET, assets/sprites/props/): im = rect index, ws = world px per sprite px, ww = drawn width (the base must stand on dry land),
   nf = never mirrored (lettering), lu = world px per art unit for ObjLife's critters (they were placed on the old procedural art). The old procedural art stays as the fallback while the sheet is not decoded. */
const IM=(d,im,ws,o)=>Object.assign(d,{im,ws},o);
const PROP_SHEET={beach:'beachprops',redrock:'redrockprops',waste:'wasteprops',arena:'arenaprops',other:'otherprops',plains:'plainsprops',sky:'skyprops',hell:'hellprops',namek:'namekprops'};
const ROCK=(w,kind)=>OB(w,14,26,18,R=>{},kind);   /* a rock obstacle: its art is the sprite, so nothing is painted (and nothing is placed until the sprites are decoded) */
const tri=(R,cx,base,hgt,hw,c1,c2)=>{for(let i=0;i<hgt;i++){const k=i/hgt,w=hw*(1-k)*2;R(cx-w/2,base-i-1,w,1,i%5<2?c2:c1);}};
const OBSTACLES={
  plains:[   /* sheet art (assets/sprites/props/plainsprops.png) */
    IM(OB(6,10,26,34,(R,C)=>{R(-1.5,-15,3,15,'#6a4a2a');C(R,0,-22,9,'#3f9e4a');C(R,-3,-25,5,'#5ac05a');}),0,0.83,{ww:147}),
    IM(OB(3.5,20,22,14,R=>{R(-8,-6,16,6,'#8a8f98');R(-6,-10,12,5,'#a0a6b0');R(-3,-9,5,2,'#c0c6d0');}),1,0.735,{ww:101}),
    IM(OB(0.8,41,40,28,(R)=>{tri(R,0,0,24,18,'#8a7a62','#a89a80');R(-3,-24,6,3,'#f4f1ea');}),2,1.011,{ww:203}),
    IM(OB(0.5,29,26,26,R=>{R(-10,-12,20,12,'#e8e4d8');R(-10,-14,20,3,'#e8742c');R(-4,-8,8,8,'#6ac0e8');R(-1,-20,2,6,'#8a8f98');}),3,1.056,{ww:154}),
    IM(OB(1.5,32,26,18,R=>{R(-12,-8,24,8,'#8a8f98');R(-9,-14,18,7,'#a0a6b0');}),4,0.962,{ww:161}),
    IM(OBS(2,16,16,14,MA.haybale,2.2),5,0.579,{ww:82,lu:6.5}),
    IM(OBS(1.6,31,24,16,MA.fence,2.0),6,0.714,{ww:156,lu:6.8}),
    IM(OBS(1,5,20,26,MA.sign,1.9),7,0.579,{ww:74}),
    IM(OBS(1.4,10,16,14,MA.crate,2.3),8,0.525,{ww:50,lu:5.2})
  ],
  namek:[   /* the tree, the ship and the crystal come from namekprops.png; the three rocks from the rocks atlas */
    IM(OB(4,10,30,46,(R,C)=>{R(-1.5,-28,3,28,'#b8d7c0');C(R,0,-33,10,'#7bd6a6');C(R,-3,-36,6,'#9ee8bf');}),0,0.5,{ww:147}),
    ROCK(3,'mix'),ROCK(1.2,'big'),ROCK(1.2,'spire'),
    IM(OB(0.4,88,50,32,(R,C)=>{R(-20,-10,40,7,'#7a5ab0');R(-17,-14,34,5,'#9a7ad0');R(-12,-18,24,5,'#b898e8');C(R,0,-20,9,'#6ad0e8');R(-6,-24,12,4,'#d8f4ff');R(-22,-6,44,3,'#4a3a7a');R(-14,-3,3,3,'#f2c230');R(11,-3,3,3,'#f2c230');}),1,0.714,{ww:442}),
    IM(OBS(1.4,14,24,24,MA.crystalN,1.8),2,0.5,{ww:86,lu:6.1})
  ],
  waste:[   /* sheet art (assets/sprites/props/wasteprops.png): the weight is the chance of each prop relative to the others */
    IM(OBS(1.6,24,16,14,MA.crate,2.3),0,.5,{ww:119,lu:8.37}),
    IM(OBS(1.6,14,14,19,MA.barrel,2.3),1,.343,{ww:78,lu:4.92}),
    IM(OBS(1.2,19,16,20,MA.tomb,2.0),2,.5,{ww:109,lu:5.7}),
    IM(OBS(1.2,25,24,16,MA.skullpile,1.9),3,.5,{ww:134,lu:7.2}),
    IM(OBS(1.4,9,20,26,MA.cactus,1.5),4,.5,{ww:90}),
    IM(OB(1.2,31,26,16,R=>{R(-11,-8,22,8,'#8a3a3a');R(-7,-13,14,6,'#6a2a2a');R(-5,-12,4,4,'#8ac0d8');R(2,-12,4,4,'#8ac0d8');R(-9,-3,5,3,'#222');R(5,-3,5,3,'#222');}),5,.5,{ww:153}),
    IM(OB(1,15,26,34,R=>{R(-6,-26,12,26,'#5a5650');R(-4,-22,3,4,'#2a2622');R(1,-14,3,4,'#2a2622');R(-6,-28,5,3,'#5a5650');}),6,.5,{ww:123}),
    IM(OB(1,33,28,14,R=>{R(-11,-5,22,5,'#6a6460');R(-8,-9,16,5,'#7a746e');R(-3,-12,8,4,'#8a847e');R(4,-8,6,3,'#4a4642');}),7,.5,{ww:166}),
    IM(OB(.8,8,16,26,R=>{R(-1,-24,2,24,'#4a3a2a');R(-7,-18,6,1.4,'#4a3a2a');R(1,-12,6,1.4,'#4a3a2a');}),8,.5,{ww:116}),
    IM(OB(.8,33,26,18,R=>{R(-12,-8,24,8,'#6a6460');R(-9,-14,18,7,'#7a746e');}),9,.5,{ww:166})
  ],
  other:[   /* sheet art (otherprops.png): slime blobs, puddles and a geyser were added to the old four */
    IM(OB(3,9,18,30,R=>{R(-2,-26,4,26,'#ff9ad8');R(-4,-16,8,16,'#ff7ac0');R(-1,-24,1.5,12,'#ffd0f0');}),0,.501,{ww:75}),
    IM(OB(2,24,30,22,(R,C)=>{C(R,-6,-6,6,'#fff0ff');C(R,3,-8,8,'#ffe0ff');C(R,10,-5,5,'#fff0ff');R(-12,-1,26,1,'#d8b0ff');}),1,.501,{ww:130}),
    IM(OB(.3,67,44,36,(R,C)=>{for(let i=0;i<22;i++){const hw=Math.sqrt(1-(i/22)*(i/22))*17;R(-hw,-i-4,hw*2,1,'#ff9ec7');}R(-17,-4,34,4,'#e87aa0');R(-3,-14,6,10,'#f4f1ea');R(-1,-34,2,10,'#8a4fc0');C(R,0,-35,2,'#ffd23f');}),2,.511,{ww:337}),
    IM(OBS(1.2,9,14,21,MA.lantern,1.9),3,.501,{ww:92,lu:5.3}),
    IM(OB(2,14,26,18,R=>{}),4,.5,{ww:76}),
    IM(OB(1.5,18,26,18,R=>{}),5,.5,{ww:98}),
    IM(OB(1.2,20,26,18,R=>{}),6,.5,{ww:108}),
    IM(OB(1.2,21,26,18,R=>{}),7,.499,{ww:113}),
    IM(OB(1.5,14,26,18,R=>{}),8,.5,{ww:105}),
    IM(OB(.8,10,26,18,R=>{}),9,.501,{ww:75})
  ],
  /* void (Tournament of Power): no props, the arena is kept clean (only the tower in the middle) */
  beach:[   /* the weight (first number) is the chance of each prop relative to the others: the palm is the commonest, the Kame House the rarest */
    IM(OB(6,6,30,42,(R,C)=>{R(-1.5,-24,3,24,'#8a6a3a');R(0,-30,2.5,8,'#8a6a3a');for(const [a,b] of [[-10,-30],[-6,-34],[6,-34],[10,-30],[0,-36]])C(R,a,b,4,'#2f9a4a');C(R,0,-31,3,'#5ac05a');}),0,.42,{ww:89}),
    IM(OB(1.2,11,20,12,R=>{R(-7,-5,14,5,'#9a9a98');R(-5,-9,10,5,'#b8b8b4');R(-2,-8,4,1,'#d8d8d4');}),1,.42,{ww:67}),
    IM(OB(.4,63,50,34,R=>{R(-20,-14,40,14,'#ffb0c8');R(-22,-20,44,7,'#d8402a');R(-18,-24,36,5,'#e8583a');R(-14,-11,8,8,'#6ac0e8');R(4,-11,8,11,'#8a5a2a');R(-1,-30,2,8,'#f4f1ea');R(-8,-26,16,3,'#f4f1ea');}),2,.586,{ww:313,nf:1}),
    IM(OB(3,9,20,16,(R,C)=>{C(R,-4,-6,6,'#d8a8d8');C(R,3,-5,6,'#e8c0e8');R(-2,-3,4,3,'#8a6a3a');}),3,.42,{ww:66}),
    IM(OB(.8,17,26,18,R=>{R(-12,-8,24,8,'#9a9a98');R(-9,-14,18,7,'#b8b8b4');}),4,.42,{ww:85}),
    IM(OBS(1.5,21,16,14,MA.crate,2.3),5,.42,{ww:97,lu:7.8}),
    IM(OBS(.8,20,16,24,MA.crate2,2.1),6,.42,{ww:114,lu:5.5}),
    IM(OBS(1.5,12,14,19,MA.barrel,2.3),7,.284,{ww:77,lu:4.83}),
    IM(OBS(.7,17,16,20,MA.tomb,2.0),8,.42,{ww:104,lu:5.65}),
    IM(OBS(.3,17,16,20,MA.tomb2,2.0),9,.42,{ww:114,lu:5.65,nf:1}),
    IM(OBS(3,9,26,16,MA.agave,1.2),10,.42,{ww:85,lu:4.2}),
    IM(OBS(1.5,18,18,18,MA.rockpile,2.0),11,.42,{ww:126})
  ],
  redrock:[   /* sheet art (redrockprops.png) */
    IM(OB(4,23,26,18,R=>{R(-10,-7,20,7,'#8a3a22');R(-7,-12,14,6,'#a8482a');R(-3,-14,7,3,'#c85a34');R(2,-8,6,3,'#6a2a18');}),0,.499,{ww:113}),
    IM(OB(3,11,16,36,R=>{tri(R,0,0,32,6,'#7a2a18','#a8482a');}),1,.5,{ww:84}),
    IM(OB(.4,22,30,22,(R,C)=>{C(R,0,-10,10,'#d8d8e8');R(-10,-3,20,3,'#8a8a9a');R(-4,-14,8,6,'#6ad0ff');R(-3,-13,2,1,'#fff');R(-12,-2,24,2,'#4a4a5a');}),2,.501,{ww:127}),
    IM(OB(.35,32,22,22,R=>{R(-6,-16,12,16,'#6a2a18');R(-4,-20,8,5,'#8a3a22');R(-1,-10,2,10,'#3a1208');}),3,.5,{ww:173}),
    IM(OB(.8,23,26,18,R=>{R(-12,-8,24,8,'#8a3a22');R(-9,-14,18,7,'#a8482a');}),4,.5,{ww:115}),
    IM(OBS(2.2,11,20,26,MA.cactus,1.5),5,.501,{ww:106}),
    IM(OBS(1,28,24,16,MA.skullpile,1.9),6,.5,{ww:149,lu:6.5}),
    IM(OBS(1,12,14,19,MA.barrel,2.3),7,.346,{ww:63,lu:4.89}),
    IM(OBS(1,24,16,14,MA.crate,2.3),8,.501,{ww:118,lu:8.43})
  ],
  arena:[   /* sheet art (arenaprops.png). The ring of the Cell Games (gd) is a huge floor drawn under everything and never blocks */
    IM(OB(2,10,18,38,R=>{R(-5,-30,10,30,'#b8b0a0');R(-6,-32,12,3,'#d8d0c0');R(-6,-3,12,3,'#8a8274');R(-1,-24,1.4,14,'#6a6254');}),0,.38,{ww:69}),
    IM(OB(3,26,26,14,R=>{R(-10,-5,20,5,'#9a9284');R(-7,-9,14,5,'#b0a898');R(1,-7,6,3,'#7a7264');R(-9,-3,3,3,'#6a6254');}),1,.499,{ww:128}),
    IM(OB(.6,17,16,34,R=>{R(-.8,-30,1.6,30,'#6a6254');R(-1.6,-31,3.2,1.6,'#9a9284');}),2,.5,{ww:119}),
    IM(OB(1.2,24,28,22,R=>{R(-11,-8,22,8,'#8a8274');R(-8,-14,16,7,'#b0a898');R(-2,-20,4,7,'#d8d0c0');}),3,.501,{ww:118}),
    IM(OB(2,25,26,18,R=>{R(-12,-8,24,8,'#9a9284');R(-9,-14,18,7,'#b0a898');}),4,.5,{ww:124}),
    IM(OBS(1.6,14,16,22,MA.pillar,2.0),5,.5,{ww:94}),
    IM(OBS(1.2,7,18,34,MA.banner,1.9),6,.5,{ww:99}),
    IM(OBS(1.2,17,14,19,MA.barrel,2.3),7,.371,{ww:91,lu:4.9}),
    IM(OBS(1.2,25,16,14,MA.crate,2.3),8,.499,{ww:127,lu:7.77}),
    IM(OB(.6,0,40,20,R=>{}),9,1.173,{ww:900,gd:1,nf:1}),
    IM(OB(.5,35,26,18,R=>{}),10,.5,{ww:174})
  ],
  sky:[   /* sheet art (skyprops.png): staff, Zeno's throne and cosmic orb are new */
    IM(OB(3,15,16,34,R=>{R(-4,-30,8,30,'#f4f1ea');R(-5,-32,10,3,'#fff');R(-5,-3,10,3,'#c8c0d8');R(-1,-28,1,24,'#d8d0e0');}),0,0.5,{ww:129}),
    IM(OB(3,33,26,20,(R,C)=>{C(R,-6,-6,6,'#fff');C(R,3,-8,8,'#eaf4ff');C(R,10,-5,5,'#fff');R(-10,-1,22,1,'#bcd8f4');}),1,0.5,{ww:164}),
    IM(OB(2,13,20,32,R=>{R(-6,-4,12,4,'#c8c0d8');R(-3,-20,6,16,'#e8e0f0');R(-5,-27,10,8,'#f4f1ea');R(-2,-30,4,3,'#ffd23f');}),2,0.5,{ww:98}),
    IM(OB(0.5,42,34,30,R=>{R(-14,-24,28,4,'#e8503a');R(-12,-20,3,20,'#f4f1ea');R(9,-20,3,20,'#f4f1ea');R(-14,-3,28,3,'#c8c0d8');R(-8,-27,16,4,'#d8402a');}),3,0.5,{ww:223}),
    IM(OB(1.5,9,14,21,R=>{R(-4,-12,8,12,'#3a3a44');R(-3,-17,6,5,'#ffd23f');}),4,0.5,{ww:64}),
    IM(OB(1.5,4,16,34,R=>{}),5,0.5,{ww:79}),
    IM(OB(0.6,27,26,20,R=>{}),6,0.5,{ww:133}),
    IM(OB(1.5,20,22,22,R=>{}),7,0.5,{ww:119})
  ],
  hell:[   /* the four rocks come from the lavarocks atlas; the rest from hellprops.png (demon portal, infernal torch, thorny roots, demon statue and crystal ore are new) */
    ROCK(4,'mix'),ROCK(1.2,'big'),ROCK(1.4,'crater'),ROCK(1,'spire'),
    IM(OB(3,12,14,36,R=>{tri(R,0,0,32,5,'#d8d0c0','#f4f0e4');R(-1,-24,2,3,'#3a1a1a');}),0,0.5,{ww:125}),
    IM(OB(0.6,36,28,24,(R,C)=>{C(R,0,-10,10,'#e8e0d0');R(-5,-12,3,4,'#1a0a0a');R(2,-12,3,4,'#1a0a0a');R(-1,-8,2,3,'#3a1a1a');R(-4,-3,8,3,'#d8d0c0');R(-3,-2,1,2,'#3a1a1a');R(0,-2,1,2,'#3a1a1a');}),1,0.5,{ww:180}),
    IM(OBS(2,27,20,16,MA.spikes,1.9),2,0.5,{ww:135,lu:6.5}),
    IM(OBS(1.4,26,24,16,MA.skullpile,1.9),3,0.5,{ww:129,lu:6.9}),
    IM(OBS(1,18,16,20,MA.tomb2,2.0),4,0.5,{ww:103,lu:5.7}),
    IM(OB(0.4,40,26,18,R=>{}),5,0.5,{ww:213}),
    IM(OB(1.5,7,12,22,R=>{}),6,0.5,{ww:85}),
    IM(OB(1.5,14,26,18,R=>{}),7,0.5,{ww:108}),
    IM(OB(0.8,21,20,28,R=>{}),8,0.5,{ww:124}),
    IM(OBS(1.2,17,24,24,MA.crystalV,1.8),9,0.5,{ww:90,lu:6.1})
  ]
};
/* ====== Snake Way: the only walkable ground is the snake's body, a winding corridor along the x axis ====== */
const ISLE_KINDS=['kingkai','kami','kame','korin','capsule','grandkai','shrine','nimbus','temple'];
const Snake={
  HW:150,XMAX:22000,IS:3800,
  f(x){return 230*Math.sin(x*.0042+MAP.p1)+60*Math.sin(x*.0113+1.1+MAP.p2);},
  df(x){return 230*.0042*Math.cos(x*.0042+MAP.p1)+60*.0113*Math.cos(x*.0113+1.1+MAP.p2);},
  cx(x){return Math.max(-this.XMAX,Math.min(this.XMAX,x));},
  /* floating islands beside the body (walkable, they hold power-ups): one about every IS px on both sides of the start, none near it */
  _is:new Map(),
  island(i){
    let o=this._is.get(i);if(o!==undefined)return o;
    const n=Math.abs(i),sg=i<0?-1:1,x=sg*(1050+(n-1)*this.IS+(mhash(n*3+(i<0?50:0),7)-.5)*400);
    if(n<1||Math.abs(x)>this.XMAX-500)o=null;
    else{
      const side=mhash(i*5+1,3)<.5?-1:1,r=100+mhash(i*7+2,11)*50,k=Math.sqrt(1+this.df(x)**2);
      o={id:i,x,y:this.f(x)+side*(this.HW*k+r*.45),r,side,kind:ISLE_KINDS[(((n-1)*2+(i<0?1:0))*4)%ISLE_KINDS.length]};   /* 4 is coprime with 9: any 9 neighbours in a row show every kind once */
    }
    this._is.set(i,o);return o;
  },
  /* the islands whose centre lies between x0 and x1 */
  islandsIn(x0,x1){
    const out=[];
    for(const sg of[-1,1]){
      const lo=Math.max(0,sg>0?x0:-x1),hi=sg>0?x1:-x0;if(hi<0)continue;
      for(let n=Math.max(1,Math.floor((lo-1050)/this.IS)+1);n<=Math.ceil((hi-1050)/this.IS)+2;n++){const o=this.island(sg*n);if(o&&o.x>=x0&&o.x<=x1)out.push(o);}
    }
    return out;
  },
  /* push a point back onto the walkable ground: the body, or an island attached to it (rad = how much of the ground width the object itself takes) */
  clamp(o,rad){
    o.x=this.cx(o.x);rad=rad||0;
    const s=this.df(o.x),k=Math.sqrt(1+s*s),lim=Math.max(8,this.HW-rad)*k,c=this.f(o.x),dy=o.y-c;
    if(Math.abs(dy)<=lim)return;
    let bx=o.x,by=dy>lim?c+lim:c-lim,bd=Math.abs(o.y-by);
    for(const I of this.islandsIn(o.x-260,o.x+260)){
      const dx=o.x-I.x,ey=o.y-I.y,d=Math.hypot(dx,ey),L=Math.max(8,I.r-rad);
      if(d<=L)return;
      if(d-L<bd){bd=d-L;bx=I.x+dx/d*L;by=I.y+ey/d*L;}
    }
    o.x=bx;o.y=by;
  },
  /* random point on the body at about horizontal distance d from x0 (side: -1/1), spread across the width */
  spot(x0,d,side,spread){
    let sg=side||(Math.random()<.5?-1:1);if(x0>this.XMAX-d)sg=-1;else if(x0<-this.XMAX+d)sg=1;
    const x=this.cx(x0+sg*d),s=this.df(x),k=Math.sqrt(1+s*s),w=(spread===undefined?.8:spread)*this.HW*k;
    return[x,this.f(x)+(Math.random()*2-1)*w];
  }
};
/* ====== Tournament of Power: ONE closed elliptical arena (the ring seen from above, drawn by top_arena.js) with a tower in the middle. Nothing exists outside it:
   the player, enemies, bosses, drops, props and traps are all held inside (clamp), spawns are re-aimed inside (Game.spawnSpot). The ellipse is the perspective of a circle. ====== */
const TOPARENA={
  RX:2400,RY:2016,TR:50,   /* half width, half height, radius of the tower foot (a solid circle) */
  inside(x,y,m){const ex=this.RX-(m||0),ey=this.RY-(m||0)*.84;return (x/ex)*(x/ex)+(y/ey)*(y/ey)<=1;},
  clamp(o,rad){
    rad=rad||0;const ex=this.RX-rad-6,ey=this.RY-(rad+6)*.84,k=(o.x/ex)*(o.x/ex)+(o.y/ey)*(o.y/ey);
    if(k>1){const s=1/Math.sqrt(k);o.x*=s;o.y*=s;}
    const d=Math.hypot(o.x,o.y),m=this.TR+rad;
    if(d<m){if(d>.01){o.x*=m/d;o.y*=m/d;}else{o.x=0;o.y=m;}}
  }
};
const World={
  cache:new Map(),key:'',
  cell(theme,cx,cy){
    const k=cx*100003+cy;let c=this.cache.get(k);
    if(c!==undefined)return c;
    c=null;const defs=OBSTACLES[theme];
    if(defs&&mhash(cx*7+3,cy*13+5)<(OB_DENS[theme]||.15)){
      const x=(cx+.15+mhash(cx+11,cy+3)*.7)*OB_CELL,y=(cy+.15+mhash(cx+5,cy+17)*.7)*OB_CELL;
      if(x*x+y*y>260*260&&!(Sea.wet(theme,x,y)>-.05)&&(theme!=='void'||TOPARENA.inside(x,y,100))){   /* never in the water or on the wet shore */
        let tot=0;for(const d of defs)tot+=d.w;let q=mhash(cx+31,cy+9)*tot,ti=0;
        for(;ti<defs.length-1;ti++){q-=defs[ti].w;if(q<=0)break;}
        c={x,y,t:ti,r:defs[ti].r*1.5,f:defs[ti].nf?1:mhash(cx+2,cy+8)<.5?-1:1,gd:defs[ti].gd};
        const ww=defs[ti].ww;if(ww)for(const k of[-.4,.4])if(Sea.wet(theme,x+k*ww,y)>-.05){c=null;break;}   /* a wide prop never stands half in the water */
        const rk=c&&defs[ti].rk;
        if(rk){
          const S=rockSheet(theme),kind=S&&S.kinds&&S.kinds[rk];
          if(!kind||!kind.length)c=null;   /* a rock whose sprites are not there (yet) is not placed */
          else{
            const v=kind[Math.floor(mhash(cx+19,cy+23)*kind.length)],R=S.rects[v],sc=Math.min(ROCK_S,ROCK_MAXW/R[2]),wd=R[2]*sc,ht=R[3]*sc;
            c.v=v;c.s=sc;c.r=Math.max(6,Math.min(.36*wd,.55*ht));
            for(const k of[-.4,.4])if(Sea.wet(theme,x+k*wd,y)>-.05){c=null;break;}   /* the whole base stands on dry land, never half in the water */
          }
        }
      }
    }
    if(this.cache.size>4000)this.cache.clear();
    this.cache.set(k,c);return c;
  },
  setTheme(theme){if(this.key!==theme){this.key=theme;this.cache.clear();this.zc.clear();}},
  /* ground zones (deterministic, larger grid): healing pools (rare) and timed floor traps */
  zc:new Map(),
  zone(theme,cx,cy){
    const k=cx*100003+cy;let c=this.zc.get(k);
    if(c!==undefined)return c;
    c=null;const q=mhash(cx*5+1,cy*9+2);
    if(theme==='snake'){   /* only on the body: one row of cells, y follows the path */
      if(cy===0&&q<.2&&Math.abs(cx)<26){const x=(cx+.2+mhash(cx+3,cy+7)*.6)*ZONE_CELL;if(Math.abs(x)>340){const y=Snake.f(x)+(mhash(cx+9,cy+1)-.5)*Snake.HW*.8;c=q<.06?{kind:'heal',x,y,r:82,ph:0,id:k}:{kind:'trap',x,y,r:46+mhash(cx+4,cy+4)*16,ph:mhash(cx+8,cy+2)*TRAP_PERIOD,id:k,theme};}}
      this.zc.set(k,c);return c;
    }
    if(q<.2){
      const x=(cx+.2+mhash(cx+3,cy+7)*.6)*ZONE_CELL,y=(cy+.2+mhash(cx+9,cy+1)*.6)*ZONE_CELL;
      const dry=!Sea.has(theme)||[[0,0],[100,0],[-100,0],[0,100],[0,-100]].every(o=>Sea.wet(theme,x+o[0],y+o[1])<-.03);   /* no pool or trap in a lake */
      if(x*x+y*y>340*340&&dry&&(theme!=='void'||TOPARENA.inside(x,y,200))){
        if(q<.06)c={kind:'heal',x,y,r:82,ph:0,id:k};
        else c={kind:'trap',x,y,r:46+mhash(cx+4,cy+4)*16,ph:mhash(cx+8,cy+2)*TRAP_PERIOD,id:k,theme};
      }
    }
    if(this.zc.size>2000)this.zc.clear();
    this.zc.set(k,c);return c;
  },
  zonesNear(theme,x,y,rad){
    const out=[],c0=Math.floor((x-rad)/ZONE_CELL),c1=Math.floor((x+rad)/ZONE_CELL),r0=Math.floor((y-rad)/ZONE_CELL),r1=Math.floor((y+rad)/ZONE_CELL);
    for(let gx=c0;gx<=c1;gx++)for(let gy=r0;gy<=r1;gy++){const z=this.zone(theme,gx,gy);if(z)out.push(z);}
    return out;
  },
  /* 0 = safe, 1 = about to fire, 2 = active */
  trapState(z,t){const m=(t+z.ph)%TRAP_PERIOD;return m<TRAP_PERIOD-1.4?0:m<TRAP_PERIOD-.8?1:2;},
  /* push a ground circle out of nearby obstacles */
  resolve(theme,o,rad){
    if(theme==='snake'){Snake.clamp(o,rad);return;}
    if(theme==='void')TOPARENA.clamp(o,rad);
    const cx=Math.floor(o.x/OB_CELL),cy=Math.floor(o.y/OB_CELL);
    for(let gx=cx-1;gx<=cx+1;gx++)for(let gy=cy-1;gy<=cy+1;gy++){
      const b=this.cell(theme,gx,gy);if(!b||b.gd)continue;   /* (a floor prop never blocks) */
      const dx=o.x-b.x,dy=o.y-b.y,rr=b.r+rad,d2=dx*dx+dy*dy;
      if(d2<rr*rr){const d=Math.sqrt(d2)||.01;o.x=b.x+dx/d*rr;o.y=b.y+dy/d*rr;}
    }
    if(theme==='void')TOPARENA.clamp(o,rad);   /* (a prop pushed you out of the ring? back in) */
  },
  visible(theme,x0,y0,x1,y1){
    const out=[];
    for(let gx=Math.floor(x0/OB_CELL)-1;gx<=Math.floor(x1/OB_CELL)+1;gx++)for(let gy=Math.floor(y0/OB_CELL)-1;gy<=Math.floor(y1/OB_CELL)+1;gy++){const b=this.cell(theme,gx,gy);if(b)out.push(b);}
    return out;
  }
};
