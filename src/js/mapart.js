'use strict';
/* ====== MapArt: pixel-art props painted at start-up (crates, barrels, gravestones, desert plants, burrows, shells...) for the obstacles (solid, in world.js OBSTACLES)
   and the ground decor (flat details, in renderer.getDecor). Every painter gets (R,C): R(x,y,w,h,colour) in art units (origin at the bottom centre), C = circle helper.
   Sprites.paint adds the dark outline. Integer coordinates keep the pixels crisp. ====== */
const MA={};
const maRows=(R,n,fn)=>{for(let i=0;i<n;i++){const o=fn(i);if(o)R(o[0],o[1],o[2],o[3],o[4]);}};
/* a leaf / blade from (0,y0) to a tip (tx,ty), thinning out */
const maBlade=(R,y0,tx,ty,w0,c1,c2,tip)=>{const n=Math.max(Math.abs(tx),Math.abs(ty-y0))|0;for(let i=0;i<=n;i++){const k=i/n,x=Math.round(tx*k),y=Math.round(y0+(ty-y0)*k),w=Math.max(1,Math.round(w0*(1-k)+.6));R(x-(w>>1),y,w,1,i%3===0?c2:c1);}if(tip)R(tx,ty-1,1,1,tip);};

/* ---- solid obstacles ---- */
MA.crate=R=>{   /* a wooden crate: lighter lid, planks, dark frame, a diagonal brace and four nails */
  R(-6,-11,12,11,'#a9763b');R(-6,-11,12,3,'#cf9d5c');R(-6,-8,12,1,'#7a4c22');
  R(-6,-5,12,1,'#8a5a2a');R(-6,-2,12,1,'#8a5a2a');
  R(-6,-11,2,11,'#7e4f24');R(4,-11,2,11,'#7e4f24');R(-6,-3,12,3,'#7e4f24');
  for(let i=0;i<5;i++)R(-3+i,-7+i,2,1,'#6a4220');
  R(-5,-10,1,1,'#e8e0d0');R(4,-10,1,1,'#e8e0d0');R(-5,-2,1,1,'#e8e0d0');R(4,-2,1,1,'#e8e0d0');
  R(-6,-11,1,11,'#bd8848');
};
MA.crate2=R=>{  /* two crates stacked */
  MA.crate(R);
  const S=(x,y,w,h,c)=>R(x,y-11,w,h,c);
  S(-5,-11,10,10,'#b4813f');S(-5,-11,10,3,'#d8a862');S(-5,-8,10,1,'#7a4c22');S(-5,-5,10,1,'#8a5a2a');S(-5,-2,10,2,'#7e4f24');
  S(-5,-11,2,10,'#7e4f24');S(3,-11,2,10,'#7e4f24');for(let i=0;i<4;i++)S(-2+i,-7+i,2,1,'#6a4220');
};
MA.barrel=R=>{  /* a barrel: bulging staves, two iron hoops, a lid */
  for(let y=0;y<13;y++){const hw=Math.round(3.6+Math.sin(Math.PI*(y+.5)/13)*1.8);R(-hw,-y-1,hw*2,1,'#9c6633');R(-hw,-y-1,2,1,'#bd8444');R(hw-2,-y-1,2,1,'#6e4420');}
  for(const y of[2,9]){const hw=Math.round(3.6+Math.sin(Math.PI*(y+.5)/13)*1.8)+0;R(-hw,-y-2,hw*2,2,'#46464f');R(-hw,-y-2,hw*2,1,'#7c7c88');}
  R(-2,-12,1,10,'#7a4c22');R(1,-12,1,10,'#7a4c22');
  R(-4,-16,8,1,'#7a4c22');R(-5,-15,10,3,'#c8964e');R(-4,-12,8,1,'#7a4c22');R(-2,-14,4,1,'#e0b068');
};
MA.tomb=R=>{    /* a gravestone with a carved cross, moss, a stone base */
  R(-6,-3,12,3,'#666672');R(-5,-4,10,1,'#7c7c88');
  R(-4,-14,8,10,'#8e8e9a');R(-3,-16,6,2,'#8e8e9a');R(-2,-17,4,1,'#8e8e9a');
  R(-4,-14,2,10,'#a8a8b4');R(2,-14,2,10,'#767684');R(-3,-16,1,2,'#a8a8b4');
  R(-1,-14,2,7,'#52525c');R(-3,-12,6,2,'#52525c');
  R(-4,-6,3,2,'#5e8c4c');R(-2,-5,2,1,'#74a65e');R(2,-4,2,1,'#5e8c4c');
};
MA.tomb2=R=>{   /* a taller headstone with a rounded top and a plaque */
  R(-7,-3,14,3,'#5e5e6a');R(-5,-5,10,2,'#767684');
  R(-4,-16,8,11,'#9494a0');R(-5,-14,10,1,'#9494a0');R(-3,-17,6,1,'#9494a0');
  R(-4,-16,2,11,'#b0b0bc');R(2,-16,2,11,'#7a7a88');
  R(-3,-12,6,5,'#6a6a76');R(-2,-11,4,1,'#a0a0ac');R(-2,-9,3,1,'#a0a0ac');
};
MA.agave=R=>{   /* a desert plant: a rosette of spiky leaves */
  for(const [tx,ty] of [[-10,-5],[-7,-9],[-3,-11],[3,-11],[7,-9],[10,-5],[-11,-2],[11,-2],[-5,-6],[5,-6]])maBlade(R,-2,tx,ty,3,'#2f8a3a','#4bb04c','#c8f08a');
  R(-3,-5,6,4,'#2a7a34');R(-2,-5,3,1,'#6ccc5a');
};
MA.cactus=R=>{  /* a saguaro-style cactus */
  R(-2,-22,4,22,'#3d8a3a');R(-2,-22,1,22,'#5ab04c');R(1,-22,1,22,'#2d6a2c');R(-1,-23,2,1,'#3d8a3a');
  R(-7,-15,5,3,'#3d8a3a');R(-7,-19,3,6,'#3d8a3a');R(-7,-19,1,6,'#5ab04c');
  R(2,-12,5,3,'#3d8a3a');R(5,-16,3,6,'#3d8a3a');R(7,-16,1,6,'#2d6a2c');
  for(const [x,y] of[[-1,-18],[0,-12],[-1,-7],[-6,-17],[6,-14]])R(x,y,1,1,'#f0e8c0');
};
MA.rockpile=R=>{ /* a small cairn of stacked stones */
  R(-7,-4,14,4,'#8a6a46');R(-6,-5,12,1,'#a88a60');R(-5,-9,10,5,'#9a7a52');R(-4,-10,8,1,'#b89a70');R(-3,-13,6,4,'#a88a60');R(-2,-14,4,1,'#c8aa80');
  R(-7,-4,2,4,'#a88a60');R(5,-9,2,5,'#6a4e30');
};
MA.skullpile=R=>{ /* a heap of bones and a skull */
  R(-8,-3,16,3,'#cfc7b0');R(-6,-5,12,2,'#e0d8c2');R(-7,-3,3,1,'#a89f88');
  R(-3,-11,7,7,'#efe8d6');R(-2,-12,5,1,'#efe8d6');R(-3,-11,1,7,'#d0c8b2');R(-2,-9,2,2,'#2a2420');R(1,-9,2,2,'#2a2420');R(0,-6,1,1,'#2a2420');R(-2,-5,5,1,'#c8c0aa');
  R(5,-7,5,1,'#e0d8c2');R(4,-6,2,2,'#e0d8c2');R(9,-8,2,2,'#e0d8c2');
};
MA.haybale=R=>{   /* a round hay bale */
  for(let y=0;y<10;y++){const hw=Math.round(Math.sqrt(25-Math.pow(y-4.5,2))+1);R(-hw,-y-1,hw*2,1,y>6?'#e8c860':'#d4b048');}
  R(-6,-8,12,1,'#a88a30');R(-6,-4,12,1,'#a88a30');R(-5,-9,3,1,'#f4dc80');R(0,-6,5,1,'#a88a30');
  R(-1,-10,2,10,'#b89838');
};
MA.fence=R=>{     /* a broken wooden fence section */
  for(const x of[-9,-3,3,9])R(x-1,-12,2,12,'#8a5a2c');
  R(-10,-9,20,2,'#a9763b');R(-10,-5,20,2,'#9a6a32');R(-10,-9,20,1,'#c89252');
  for(const x of[-9,-3,3,9])R(x-1,-13,2,1,'#c89252');
};
MA.sign=R=>{      /* a signpost */
  R(-1,-20,2,20,'#7a4c22');R(-8,-20,16,7,'#b88848');R(-8,-20,16,1,'#d8a862');R(-8,-14,16,1,'#7a4c22');R(-6,-18,10,1,'#6a4220');R(-6,-16,7,1,'#6a4220');R(-1,-22,2,2,'#7a4c22');
};
MA.crystalOf=cs=>R=>{   /* a cluster of crystals; cs = [body, light, shade] */
  for(const [x,h,w] of[[-6,12,4],[-1,18,5],[5,10,4]]){for(let i=0;i<h;i++){const k=1-i/h*.55,ww=Math.max(1,Math.round(w*k));R(x-(ww>>1),-i-1,ww,1,i%4===0?cs[1]:cs[0]);}R(x-1,-h-1,1,1,cs[1]);R(x+(w>>1)-1,-Math.round(h*.5),1,Math.round(h*.5),cs[2]);}
  R(-8,-1,16,1,cs[2]);
};
MA.crystalN=MA.crystalOf(['#7be8ff','#e8ffff','#2a98c8']);
MA.crystalV=MA.crystalOf(['#8a6aff','#e0d8ff','#4a2ad0']);
MA.pillar=R=>{    /* a broken marble pillar */
  R(-5,-3,10,3,'#b8b0a0');R(-4,-14,8,11,'#e8e0d0');R(-4,-14,2,11,'#fff8e8');R(2,-14,2,11,'#c8c0b0');R(-5,-16,10,2,'#d8d0c0');R(-3,-18,4,2,'#d8d0c0');
  R(-4,-9,8,1,'#b8b0a0');
};
MA.banner=R=>{    /* a tournament banner on a pole */
  R(-1,-28,2,28,'#5a4a3a');R(-1,-30,2,2,'#e8c040');R(1,-27,10,12,'#d83a2a');R(1,-27,10,1,'#f0604a');R(1,-16,10,1,'#9a2418');R(4,-24,4,4,'#fff3b0');R(5,-23,2,2,'#d83a2a');
  R(1,-15,3,3,'#d83a2a');R(8,-15,3,3,'#d83a2a');
};
MA.lantern=R=>{   /* a stone lantern */
  R(-4,-3,8,3,'#8a8a94');R(-2,-10,4,7,'#a6a6b0');R(-5,-13,10,3,'#8a8a94');R(-4,-16,8,3,'#6a6a76');R(-2,-17,4,1,'#8a8a94');R(-2,-9,4,3,'#ffd86a');R(-1,-8,2,1,'#fff3b0');
};
MA.spikes=R=>{    /* iron spikes */
  for(const x of[-6,-2,2,6]){R(x-1,-3,2,3,'#3a3a44');R(x-1,-10,1,7,'#6a6a78');R(x,-10,1,7,'#4a4a56');R(x-.5,-12,1,2,'#8a8a98');}
  R(-8,-2,16,2,'#2a2a32');
};
MA.lavarock=R=>{  /* a cooling rock veined with lava */
  R(-9,-4,18,4,'#2a1214');R(-7,-8,14,4,'#3a1a1c');R(-4,-11,8,3,'#4a2224');R(-3,-3,6,1,'#ff7a2a');R(-1,-7,2,1,'#ff9a3a');R(3,-6,1,2,'#ff7a2a');R(-6,-6,1,2,'#ff5a1a');
};

/* ---- flat ground decor: [W,H,originX,originY,painter] per theme ---- */
const maD=(W,H,ox,oy,fn)=>[W,H,ox,oy,fn];
MA.dec={
  beach:[
    maD(18,10,9,7,R=>{   /* a burrow: dark pit, a lip of dug sand and a spray of dirt */
      for(let y=-3;y<=3;y++){const hw=Math.round(5.4*Math.sqrt(Math.max(0,1-Math.pow(y/3.8,2))));R(-hw-1,y,hw*2+2,1,'#c08a4a');}
      for(let y=-2;y<=2;y++){const hw=Math.round(4.2*Math.sqrt(Math.max(0,1-Math.pow(y/2.9,2))));R(-hw,y,hw*2,1,'#3a2210');}
      R(-2,-1,4,1,'#5a3818');R(-7,-3,1,1,'#8a5a2a');R(6,-2,1,1,'#8a5a2a');R(-5,3,1,1,'#8a5a2a');R(5,3,2,1,'#a87036');R(8,0,1,1,'#8a5a2a');
    }),
    maD(14,12,7,10,R=>{ /* a starfish */
      R(-1,-9,2,3,'#f08a3a');R(-7,-6,4,2,'#f08a3a');R(3,-6,4,2,'#f08a3a');R(-6,-2,3,3,'#f08a3a');R(3,-2,3,3,'#f08a3a');R(-3,-7,6,6,'#f8a050');R(-1,-5,2,2,'#ffd8a0');R(-1,-9,1,1,'#ffc080');R(-6,-2,1,1,'#ffc080');R(5,-2,1,1,'#d06a20');
    }),
    maD(14,8,7,6,R=>{ /* pebbles */
      R(-6,-3,4,3,'#a09a90');R(-6,-4,3,1,'#c4beb2');R(-1,-2,3,2,'#8a847a');R(-1,-3,2,1,'#b0aa9e');R(3,-4,4,4,'#b4aea2');R(3,-5,3,1,'#d4cec2');
    }),
    maD(26,8,13,6,R=>{ /* driftwood */
      R(-11,-3,22,3,'#8a6a40');R(-11,-4,22,1,'#b08a58');R(-12,-2,2,2,'#6a4e2c');R(10,-3,2,3,'#6a4e2c');R(-4,-2,1,1,'#5a4024');R(3,-3,1,1,'#5a4024');R(-8,-1,6,1,'#6a4e2c');
    }),
    maD(16,12,8,10,R=>{ /* dune grass: a mound with four broad blades */
      R(-5,-2,10,2,'#5a9a40');R(-4,-3,8,1,'#7cba58');
      for(const [tx,ty] of[[-6,-8],[-2,-10],[2,-10],[6,-8]])maBlade(R,-2,tx,ty,4,'#6aa84a','#8cc860','#d0f0a0');
    }),
    maD(18,8,9,6,R=>{ /* fish bones */
      R(-7,-3,14,1,'#e8e0d0');for(let i=0;i<4;i++){R(-5+i*3,-5,1,2,'#e8e0d0');R(-5+i*3,-2,1,2,'#e8e0d0');}R(7,-5,3,4,'#e8e0d0');R(8,-4,1,1,'#2a2420');R(-9,-5,2,4,'#d8d0c0');
    }),
    maD(14,10,7,8,R=>{ /* a white conch */
      R(-5,-4,9,4,'#f4eee0');R(-4,-6,7,2,'#fff9ee');R(-2,-8,4,2,'#f0e0d0');R(-5,-2,3,2,'#e0b8b8');R(2,-3,2,3,'#e8d4c4');R(-1,-5,1,3,'#d8c8b8');
    }),
    maD(12,8,6,6,R=>{ /* a coconut */
      R(-3,-5,6,5,'#6a4a28');R(-2,-6,4,1,'#8a6a40');R(-1,-4,1,1,'#2a1a0a');R(1,-3,1,1,'#2a1a0a');R(-3,-3,1,2,'#4a321a');
    })
  ],
  waste:[
    maD(18,10,9,8,R=>{for(let y=-3;y<=3;y++){const hw=Math.round(5*Math.sqrt(Math.max(0,1-Math.pow(y/3.8,2))));R(-hw-1,y,hw*2+2,1,'#8a7a62');}for(let y=-2;y<=2;y++){const hw=Math.round(4*Math.sqrt(Math.max(0,1-Math.pow(y/2.9,2))));R(-hw,y,hw*2,1,'#2a2018');}R(-6,-3,1,1,'#5a4a3a');R(6,2,1,1,'#5a4a3a');}),
    maD(16,8,8,6,R=>{R(-6,-3,12,1,'#d8d0b8');R(-7,-4,2,3,'#d8d0b8');R(5,-4,2,3,'#d8d0b8');R(-3,-2,6,1,'#b8b098');}),   /* a bone */
    maD(14,8,7,6,R=>{R(-6,-3,4,3,'#6a625a');R(-6,-4,3,1,'#8a8278');R(0,-2,5,2,'#5a524a');R(0,-3,4,1,'#7a7268');}),
    maD(16,14,8,13,R=>{for(const [tx,ty] of[[-5,-9],[-1,-11],[3,-9],[6,-6],[-6,-5]])maBlade(R,-1,tx,ty,2,'#8a8a4a','#a8a860','#d0d098');}),
    maD(20,10,10,8,R=>{R(-8,-4,16,1,'#6a4a2a');R(-6,-3,2,3,'#4a3220');R(4,-3,2,3,'#4a3220');R(-3,-6,6,2,'#8a6a3a');R(-9,-1,3,1,'#3a2a18');})  /* a broken plank on legs */
  ],
  plains:[
    maD(20,14,10,12,R=>{for(const [x,y,c] of[[-6,-4,'#ff6a8a'],[0,-7,'#ffd23f'],[5,-4,'#fff'],[-2,-2,'#b890ff'],[7,-8,'#ff8a3a']]){R(x,y,1,4,'#2f8a3a');R(x-1,y-2,3,3,c);R(x,y-1,1,1,'#fff6a8');}}),   /* wild flowers */
    maD(14,8,7,6,R=>{R(-6,-3,5,3,'#9aa0a8');R(-6,-4,4,1,'#c0c6ce');R(0,-2,5,2,'#848a92');R(0,-3,4,1,'#a8aeb6');R(-4,-3,2,1,'#6a9a5a');}),
    maD(16,12,8,10,R=>{R(-6,-4,12,4,'#8a6a3a');R(-5,-6,10,2,'#a88450');R(-3,-8,6,2,'#c8a468');R(-4,-3,2,1,'#6a4e2c');R(1,-5,1,2,'#6a4e2c');}),   /* a stump */
    maD(18,8,9,6,R=>{R(-8,-3,16,3,'#b89458');R(-8,-4,16,1,'#d8b878');R(-3,-3,1,3,'#8a6a3a');R(4,-2,1,2,'#8a6a3a');})   /* a dirt path patch */
  ],
  namek:[
    maD(14,12,7,10,R=>{for(const [x,h,c] of[[-4,6,'#7ae0ff'],[0,9,'#c8f8ff'],[4,5,'#5ac8f0']]){for(let i=0;i<h;i++)R(x-1,-i-1,2,1,i%3===0?'#e8ffff':c);}R(-5,-1,10,1,'#2a8ab0');}),   /* small crystals */
    maD(16,12,8,11,R=>{for(const [tx,ty] of[[-5,-9],[-1,-10],[3,-9],[6,-6]])maBlade(R,-1,tx,ty,2,'#3aa46a','#5ac88a','#bff7d4');}),
    maD(14,8,7,6,R=>{R(-6,-3,12,3,'#5ab0c0');R(-5,-4,10,1,'#8ad8e4');R(1,-2,4,1,'#3a8a9a');}),
    maD(10,10,5,8,R=>{R(-2,-7,4,7,'#5ac88a');R(-3,-8,6,2,'#7ae0a8');R(-1,-5,2,1,'#2a8a5a');})
  ],
  redrock:[
    maD(14,8,7,6,R=>{R(-6,-3,5,3,'#a8482a');R(-6,-4,4,1,'#c86a44');R(0,-2,5,2,'#8a3a22');R(0,-3,4,1,'#b05030');}),
    maD(18,10,9,8,R=>{for(let y=-3;y<=3;y++){const hw=Math.round(5*Math.sqrt(Math.max(0,1-Math.pow(y/3.8,2))));R(-hw-1,y,hw*2+2,1,'#8a3a22');}for(let y=-2;y<=2;y++){const hw=Math.round(4*Math.sqrt(Math.max(0,1-Math.pow(y/2.9,2))));R(-hw,y,hw*2,1,'#2a0e08');}}),
    maD(16,8,8,6,R=>{R(-6,-3,12,1,'#e0d4b8');R(-7,-4,2,3,'#e0d4b8');R(5,-4,2,3,'#e0d4b8');}),
    maD(14,14,7,13,R=>{R(-1,-10,2,10,'#3d8a3a');R(-5,-6,4,2,'#3d8a3a');R(-5,-8,2,3,'#3d8a3a');R(1,-4,4,2,'#3d8a3a');R(3,-7,2,4,'#3d8a3a');R(-1,-11,2,1,'#f0e8c0');})
  ],
  arena:[
    maD(16,8,8,6,R=>{R(-6,-3,12,3,'#8a8274');R(-6,-4,10,1,'#b0a898');R(-4,-2,1,2,'#5a5448');R(2,-3,1,3,'#5a5448');}),   /* a cracked slab */
    maD(14,10,7,8,R=>{R(-4,-8,8,8,'#d8d0c0');R(-4,-8,2,8,'#f0e8d8');R(-2,-5,4,1,'#8a8274');}),
    maD(18,8,9,6,R=>{R(-8,-2,16,2,'#e8e0d0');R(-8,-2,16,1,'#fff');R(-3,-4,6,2,'#d83a2a');}),   /* a chalk line mark */
    maD(10,12,5,10,R=>{R(-1,-9,2,9,'#6a6254');R(-3,-9,6,2,'#9a9284');R(-1,-10,2,1,'#e8503a');})
  ],
  sky:[
    maD(16,8,8,6,R=>{R(-6,-2,12,2,'#fff');R(-4,-4,8,2,'#fff');R(-2,-5,5,1,'#e8f4ff');R(-7,-1,14,1,'#c8dcf4');}),
    maD(10,12,5,10,R=>{R(-1,-9,2,9,'#d8c8e8');R(-3,-9,6,3,'#ffd23f');R(-2,-8,4,1,'#fff3b0');}),
    maD(14,8,7,6,R=>{R(-5,-3,10,3,'#e8f0fa');R(-3,-5,6,2,'#fff');R(0,-3,3,1,'#c8dcf4');})
  ],
  hell:[
    maD(14,10,7,8,R=>{R(-4,-8,8,8,'#d8d0c0');R(-3,-9,6,1,'#e8e0d0');R(-2,-6,2,2,'#1a0a0a');R(1,-6,2,2,'#1a0a0a');R(-1,-3,2,2,'#3a1a1a');}),   /* a skull */
    maD(18,8,9,6,R=>{R(-7,-3,14,2,'#2a1214');R(-5,-4,10,1,'#3a1a1c');R(-4,-3,8,1,'#ff7a2a');R(-1,-3,3,1,'#ffd23f');}),   /* a lava crack */
    maD(12,10,6,8,R=>{R(-1,-8,2,8,'#c8c0b0');R(-3,-6,6,1,'#c8c0b0');R(-4,-4,2,1,'#c8c0b0');R(2,-3,2,1,'#c8c0b0');})
  ],
  void:[
    maD(12,12,6,10,R=>{for(const [x,h,c] of[[-3,7,'#8a6aff'],[1,10,'#c8b8ff'],[4,5,'#6a4aff']]){for(let i=0;i<h;i++)R(x-1,-i-1,2,1,i%3===0?'#ffffff':c);}}),
    maD(16,8,8,6,R=>{R(-6,-3,12,2,'#3a4a8a');R(-4,-5,8,2,'#4a5a9a');R(-1,-4,3,1,'#6ad0ff');}),
    maD(10,10,5,8,R=>{R(-1,-8,2,8,'#6ad0ff');R(-3,-4,6,1,'#6ad0ff');R(-1,-4,2,1,'#fff');})
  ],
  other:[
    maD(16,10,8,8,R=>{R(-5,-5,10,5,'#fff0ff');R(-3,-8,6,3,'#fff');R(-7,-3,3,3,'#ffe0ff');R(4,-3,3,3,'#ffe0ff');}),
    maD(14,12,7,10,R=>{R(-1,-9,2,9,'#ffd23f');R(-4,-9,8,2,'#fff3b0');R(-2,-11,4,2,'#fff');}),
    maD(12,8,6,6,R=>{R(-4,-3,8,3,'#d8b0ff');R(-2,-5,4,2,'#f0d8ff');})
  ]
};

for(const k of Object.keys(MA))if(typeof MA[k]==='function'&&k!=='crystalOf')MA[k].kind=k;   /* ObjLife looks at this to decide what lives on a prop */
