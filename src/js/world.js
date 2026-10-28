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
const OB_CELL=230,ZONE_CELL=460,TRAP_PERIOD=4,TRAP_WARN=.22,TRAP_ON=.38,TRAP_CD=1.1,ZONE_P=.045,ZONE_HEAL=.008;   /* share of ground cells holding a trap or a pool: 4.5% (it was 20%), of which healing pools 0.8% (it was 6%) */
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
    IM(OB(0,32,22,22,R=>{R(-6,-16,12,16,'#6a2a18');R(-4,-20,8,5,'#8a3a22');R(-1,-10,2,10,'#3a1208');}),3,.5,{ww:173}),
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
    IM(OB(0,42,34,30,R=>{R(-14,-24,28,4,'#e8503a');R(-12,-20,3,20,'#f4f1ea');R(9,-20,3,20,'#f4f1ea');R(-14,-3,28,3,'#c8c0d8');R(-8,-27,16,4,'#d8402a');}),3,0.5,{ww:223}),
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
    IM(OB(0,40,26,18,R=>{}),5,0.5,{ww:213}),
    IM(OB(1.5,7,12,22,R=>{}),6,0.5,{ww:85}),
    IM(OB(1.5,14,26,18,R=>{}),7,0.5,{ww:108}),
    IM(OB(0.8,21,20,28,R=>{}),8,0.5,{ww:124}),
    IM(OBS(1.2,17,24,24,MA.crystalV,1.8),9,0.5,{ww:90,lu:6.1})
  ]
};
/* ====== Snake Way: the only walkable ground is the snake's body, a winding corridor along the x axis ====== */
const ISLE_KINDS=['kingkai','kami','kame','korin','capsule','grandkai','shrine','nimbus','temple'];
/* v110: the islands are painted sprites (assets/sprites/props/isle<kind>.png). Per kind, in sprite px: the centre and the two radii of the walkable top (an ellipse seen
   in perspective) - [ax, ay, rx, ry]. The island's ground in the world is that same ellipse, scaled so that rx = I.r */
const ISLE_GEO={kingkai:[299.5,213.1,279.6,197],kami:[373,252.1,363.6,192.4],kame:[332,225,297,187.3],korin:[397,200.4,379.2,172.3],capsule:[382,239.2,372.4,216.1],
  grandkai:[383.5,237,358.6,218.9],shrine:[379.5,255.9,369.9,227.5],nimbus:[368,243.5,336.7,202.9],temple:[381,259.1,363.8,229.7]};
const ISLE_K=6,ISLE_RMAX=150*ISLE_K,ISLE_RW=78;   /* islands 6x bigger than before (radius 600-900), each joined to the body by a road ISLE_RW px wide on each side */
const Snake={
  HW:150,XMAX:22000,IS:3800,
  f(x){return 230*Math.sin(x*.0042+MAP.p1)+60*Math.sin(x*.0113+1.1+MAP.p2);},
  df(x){return 230*.0042*Math.cos(x*.0042+MAP.p1)+60*.0113*Math.cos(x*.0113+1.1+MAP.p2);},
  cx(x){return Math.max(-this.XMAX,Math.min(this.XMAX,x));},
  /* floating islands beside the body (walkable, they hold power-ups): one about every IS px on both sides of the start, none near it.
     v110: the island stands clear of the body (its ellipse never touches it, whatever the curve of the snake under it) and a winding road joins them (I.road, a polyline) */
  _is:new Map(),
  island(i){
    let o=this._is.get(i);if(o!==undefined)return o;
    const n=Math.abs(i),sg=i<0?-1:1,x=sg*(1900+(n-1)*this.IS+(mhash(n*3+(i<0?50:0),7)-.5)*400);
    const r=(100+mhash(i*7+2,11)*50)*ISLE_K;
    if(n<1||Math.abs(x)>this.XMAX-r-300)o=null;
    else{
      const side=mhash(i*5+1,3)<.5?-1:1,kind=ISLE_KINDS[(((n-1)*2+(i<0?1:0))*4)%ISLE_KINDS.length],G=ISLE_GEO[kind],ry=r*G[3]/G[2];   /* 4 is coprime with 9: any 9 neighbours in a row show every kind once */
      const gap=260+mhash(i*11+4,5)*260;
      let y=side>0?-1e9:1e9;   /* the centre: far enough that no point of the ellipse comes within gap px of the body's edge */
      for(let k=-10;k<=10;k++){const u=k/10,xx=x+u*r,s=this.df(xx),e=this.f(xx)+side*(this.HW*Math.sqrt(1+s*s)+gap+ry*Math.sqrt(1-u*u));y=side>0?Math.max(y,e):Math.min(y,e);}
      o={id:i,x,y,r,ry,side,kind};
      /* the road: from the body (a little to one side) to the near edge of the island, an S curve (cubic Bezier sampled into ROAD_N points) */
      const lat=(mhash(i*13+6,9)-.5)*r*.9,bx=x+lat,by=this.f(bx),ex=x+(mhash(i*17+3,2)-.5)*r*.4,ey=y-side*ry*.82,L=Math.abs(ey-by);
      const P=[[bx,by],[bx,by+side*L*.45],[ex,ey-side*L*.45],[ex,ey]],pts=[];
      for(let j=0;j<=24;j++){const t=j/24,u=1-t;pts.push([u*u*u*P[0][0]+3*u*u*t*P[1][0]+3*u*t*t*P[2][0]+t*t*t*P[3][0],u*u*u*P[0][1]+3*u*u*t*P[1][1]+3*u*t*t*P[2][1]+t*t*t*P[3][1]]);}
      o.road=pts;
    }
    this._is.set(i,o);return o;
  },
  /* the islands whose centre lies between x0 and x1 */
  islandsIn(x0,x1){
    const out=[];
    for(const sg of[-1,1]){
      const lo=Math.max(0,sg>0?x0:-x1),hi=sg>0?x1:-x0;if(hi<0)continue;
      for(let n=Math.max(1,Math.floor((lo-1900)/this.IS)+1);n<=Math.ceil((hi-1900)/this.IS)+2;n++){const o=this.island(sg*n);if(o&&o.x>=x0&&o.x<=x1)out.push(o);}
    }
    return out;
  },
  /* the islands (and their roads) that may hold the point x */
  isleNear(x){return this.islandsIn(x-ISLE_RMAX-260,x+ISLE_RMAX+260);},
  /* inside the island's ellipse (rad = room the object needs)? returns the normalised distance (<= 1 inside) */
  inIsle(I,x,y,rad){const rx=Math.max(8,I.r-rad),ry=Math.max(8,I.ry-rad*I.ry/I.r),nx=(x-I.x)/rx,ny=(y-I.y)/ry;return Math.hypot(nx,ny);},
  /* nearest point of the island's road to (x,y) and its distance */
  roadNear(I,x,y){
    let bd=1e18,bx=0,by=0;const R=I.road;
    for(let j=1;j<R.length;j++){const ax=R[j-1][0],ay=R[j-1][1],dx=R[j][0]-ax,dy=R[j][1]-ay,l2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/l2)),px=ax+dx*t,py=ay+dy*t,d=(x-px)**2+(y-py)**2;if(d<bd){bd=d;bx=px;by=py;}}
    return[bx,by,Math.sqrt(bd)];
  },
  /* v112: the structures of island I (ISLE_OBJ) in world px, computed once. Per structure: the box of its picture (x0,y0,x1,y1), the atlas rect r, the footprints P
     (convex polygons with their outward edge normals n = [nx,ny,c,...]: inside when nx*x+ny*y < c for every edge) and the front edge of the footprints, fy[] sampled
     from fx0 to fx1 (FN samples; outside the footprints: the nearest edge) */
  FN:24,
  objs(I){
    if(I._ob)return I._ob;
    const L=(typeof ISLE_OBJ!=='undefined'&&ISLE_OBJ[I.kind])||[],G=ISLE_GEO[I.kind],k=I.r/G[2],X=v=>I.x+(v-G[0])*k,Y=v=>I.y+(v-G[1])*k,N=this.FN;
    return I._ob=L.map(o=>{
      const poly=f=>{
        const p=[];for(let j=0;j<f.length;j+=2)p.push(X(f[j]),Y(f[j+1]));
        let mx=0,my=0;const m=p.length/2;for(let j=0;j<p.length;j+=2){mx+=p[j]/m;my+=p[j+1]/m;}
        const n=[];let bx0=1e9,by0=1e9,bx1=-1e9,by1=-1e9;
        for(let j=0;j<p.length;j+=2){
          const ax=p[j],ay=p[j+1],bx=p[(j+2)%p.length],by=p[(j+3)%p.length],l=Math.hypot(bx-ax,by-ay)||1;let nx=(by-ay)/l,ny=-(bx-ax)/l;
          if(nx*(mx-ax)+ny*(my-ay)>0){nx=-nx;ny=-ny;}
          n.push(nx,ny,nx*ax+ny*ay);bx0=Math.min(bx0,ax);bx1=Math.max(bx1,ax);by0=Math.min(by0,ay);by1=Math.max(by1,ay);
        }
        return{p,n,bx0,by0,bx1,by1};
      };
      const P=o.f.map(poly),T=(o.t||[]).map(poly),PT=P.concat(T);
      /* an edge shared by two footprints of the same structure (the quads of the altar's wall) is inside their union: never pushed through (q.int) */
      const key=(ax,ay,bx,by)=>Math.round(ax*10)+','+Math.round(ay*10)+','+Math.round(bx*10)+','+Math.round(by*10),E=new Map();
      P.forEach((q,qi)=>{const p=q.p;for(let j=0;j<p.length;j+=2){const k=key(p[j],p[j+1],p[(j+2)%p.length],p[(j+3)%p.length]);E.set(k,qi);}});
      P.forEach((q,qi)=>{const p=q.p;q.int=[];for(let j=0;j<p.length;j+=2){const o2=E.get(key(p[(j+2)%p.length],p[(j+3)%p.length],p[j],p[j+1]));q.int.push(o2!==undefined&&o2!==qi);}});
      const fx0=Math.min(...PT.map(q=>q.bx0)),fx1=Math.max(...PT.map(q=>q.bx1)),fy=new Array(N).fill(NaN);
      for(let i=0;i<N;i++){const x=fx0+(fx1-fx0)*i/(N-1);
        for(const q of PT){const p=q.p;for(let j=0;j<p.length;j+=2){const ax=p[j],ay=p[j+1],bx=p[(j+2)%p.length],by=p[(j+3)%p.length];
          if(ax===bx||(ax-x)*(bx-x)>0)continue;const y=ay+(x-ax)/(bx-ax)*(by-ay);if(!(y<=fy[i]))fy[i]=y;}}}
      for(let i=0;i<N;i++)if(isNaN(fy[i])){let d=1;while(d<N){const a=fy[i-d],b=fy[i+d];if(a===a&&a!==undefined){fy[i]=a;break;}if(b===b&&b!==undefined){fy[i]=b;break;}d++;}}
      return{x0:X(o.b[0]),y0:Y(o.b[1]),x1:X(o.b[2]),y1:Y(o.b[3]),r:o.r,P,T,fx0,fx1,fy};
    });
  },
  /* inside the convex polygon q (from objs)? */
  inPoly(q,x,y){if(x<q.bx0||x>q.bx1||y<q.by0||y>q.by1)return false;const n=q.n;for(let j=0;j<n.length;j+=3)if(n[j]*x+n[j+1]*y>n[j+2])return false;return true;},
  /* standing ON structure s (the altar's top, its stairs): never hidden by it */
  onTop(s,x,y){for(const q of s.T)if(this.inPoly(q,x,y))return true;return false;},
  /* the y of the front edge of structure s at x: whoever has his feet above it stands behind it */
  front(s,x){const N=this.FN,u=Math.max(0,Math.min(N-1,(x-s.fx0)/((s.fx1-s.fx0)||1)*(N-1))),i=Math.min(N-2,Math.floor(u)),f=u-i;return s.fy[i]*(1-f)+s.fy[i+1]*f;},
  /* on the snake's body (no island structure can be there) */
  onBody(x,y){const s=this.df(x);return Math.abs(y-this.f(x))<=this.HW*Math.sqrt(1+s*s);},
  /* push o out of the footprints standing on island I (rad = its radius): out through the edge it is least deep behind */
  solid(I,o,rad){
    const L=this.objs(I);
    for(let it=0;it<6;it++){   /* footprints that overlap (a palm against the house, the altar and its steps): a few passes settle on the outside of their union */
      let moved=false;
      for(const s of L)for(const q of s.P){
        if(o.x<q.bx0-rad||o.x>q.bx1+rad||o.y<q.by0-rad||o.y>q.by1+rad)continue;
        const n=q.n;let best=-1e9,mx=-1e9,bi=0;
        for(let j=0;j<n.length;j+=3){const d=n[j]*o.x+n[j+1]*o.y-n[j+2];if(d>mx)mx=d;if(d>best&&!q.int[j/3]){best=d;bi=j;}}
        if(mx<rad-.01){const m=rad-best;o.x+=n[bi]*m;o.y+=n[bi+1]*m;moved=true;}
      }
      if(!moved)return;
    }
  },
  /* push a point back onto the walkable ground: the body, an island or an island's road (rad = how much of the ground width the object itself takes);
     v112: on an island, out of the buildings, trees and rocks standing on it (solid) */
  clamp(o,rad){
    o.x=this.cx(o.x);rad=rad||0;
    let s=this.df(o.x),k=Math.sqrt(1+s*s),lim=Math.max(8,this.HW-rad)*k,c=this.f(o.x),dy=o.y-c;
    if(Math.abs(dy)<=lim)return;
    const IS=this.isleNear(o.x);let hit=false;
    for(const I of IS)if(Math.abs(o.x-I.x)<I.r+rad+40&&Math.abs(o.y-I.y)<I.ry+rad+40){this.solid(I,o,rad);hit=true;}
    if(hit){o.x=this.cx(o.x);s=this.df(o.x);k=Math.sqrt(1+s*s);lim=Math.max(8,this.HW-rad)*k;c=this.f(o.x);dy=o.y-c;if(Math.abs(dy)<=lim)return;}
    let bx=o.x,by=dy>lim?c+lim:c-lim,bd=Math.abs(o.y-by);
    const rw=Math.max(6,ISLE_RW-rad);
    for(const I of IS){
      const d=this.inIsle(I,o.x,o.y,rad);
      if(d<=1)return;
      const px=I.x+(o.x-I.x)/d,py=I.y+(o.y-I.y)/d,dd=Math.hypot(o.x-px,o.y-py);
      if(dd<bd){bd=dd;bx=px;by=py;}
      if(I.road){const [qx,qy,dr]=this.roadNear(I,o.x,o.y);if(dr<=rw)return;const e=dr-rw;if(e<bd){bd=e;bx=qx+(o.x-qx)/dr*rw;by=qy+(o.y-qy)/dr*rw;}}
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
            c.v=v;c.s=sc;c.r=Math.max(6,Math.min(.36*wd,.55*ht));c.fw=wd;c.fh=ht;
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
      if(cy===0&&q<ZONE_P&&Math.abs(cx)<26){const x=(cx+.2+mhash(cx+3,cy+7)*.6)*ZONE_CELL;if(Math.abs(x)>340){const y=Snake.f(x)+(mhash(cx+9,cy+1)-.5)*Snake.HW*.8;c=q<ZONE_HEAL?{kind:'heal',x,y,r:82,ph:0,id:k}:{kind:'trap',x,y,r:46+mhash(cx+4,cy+4)*16,ph:mhash(cx+8,cy+2)*TRAP_PERIOD,id:k,theme};}}
      this.zc.set(k,c);return c;
    }
    if(q<ZONE_P){
      const x=(cx+.2+mhash(cx+3,cy+7)*.6)*ZONE_CELL,y=(cy+.2+mhash(cx+9,cy+1)*.6)*ZONE_CELL;
      const dry=!Sea.has(theme)||[[0,0],[100,0],[-100,0],[0,100],[0,-100]].every(o=>Sea.wet(theme,x+o[0],y+o[1])<-.03);   /* no pool or trap in a lake */
      if(x*x+y*y>340*340&&dry&&(theme!=='void'||TOPARENA.inside(x,y,200))&&this.clearAt(theme,x,y,q<ZONE_HEAL?78:56)){   /* and never under an obstacle's picture */
        if(q<ZONE_HEAL)c={kind:'heal',x,y,r:82,ph:0,id:k};
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
  /* v109: a trap sleeps until something walks on it (z.trig = the moment, set by Game.updateZones), then TRAP_WARN s of warning, TRAP_ON s of spikes and TRAP_CD s to re-arm.
     0 = safe, 1 = about to fire, 2 = active; trapPh also gives how far into that phase it is (0..1) for the sprite frames */
  trapPh(z,t){
    if(z.trig==null)return[0,0];const m=t-z.trig;
    if(m<0||m>=TRAP_WARN+TRAP_ON+TRAP_CD){z.trig=null;return[0,0];}
    return m<TRAP_WARN?[1,m/TRAP_WARN]:m<TRAP_WARN+TRAP_ON?[2,(m-TRAP_WARN)/TRAP_ON]:[0,1];
  },
  trapState(z,t){return this.trapPh(z,t)[0];},
  trapReady(z,t){return z.trig==null||t-z.trig>=TRAP_WARN+TRAP_ON+TRAP_CD;},
  /* the ground an obstacle's picture covers: half its drawn width and its drawn height (rocks: the rock; sheet art: the width ww and the crop's height; painted art: its size) */
  foot(theme,b){
    if(b._f)return b._f;
    const d=OBSTACLES[theme][b.t];let hw,ht,ok=true;
    if(b.fw)hw=b.fw/2,ht=b.fh;
    else if(d.ww){
      hw=d.ww/2;const id=PROP_SHEET[theme],BP=id&&typeof Sprites!=='undefined'&&Sprites.sheets[id],R=BP&&BP.rects&&BP.rects[d.im];
      if(R)ht=R[3]*d.ws/(BP.k||1);else{ht=hw*1.5;ok=false;}   /* sheet not decoded yet: a guess, not remembered */
    }else hw=d.W*1.55*(d.sc||1),ht=d.H*3.1*(d.sc||1);
    const F={hw,ht};if(ok)b._f=F;return F;
  },
  /* is the circle of radius rad at (x,y) clear of every obstacle's picture (and of what stands behind it)? Spawned things use it so they never overlap a prop */
  clearAt(theme,x,y,rad){
    if(theme==='snake'||!OBSTACLES[theme])return true;
    const cx=Math.floor(x/OB_CELL),cy=Math.floor(y/OB_CELL);
    for(let gx=cx-1;gx<=cx+1;gx++)for(let gy=cy-1;gy<=cy+2;gy++){
      const b=this.cell(theme,gx,gy);if(!b||b.gd)continue;
      const F=this.foot(theme,b);
      if(Math.abs(x-b.x)<F.hw+rad&&y>b.y-F.ht-rad&&y<b.y+rad+6)return false;
    }
    return true;
  },
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
