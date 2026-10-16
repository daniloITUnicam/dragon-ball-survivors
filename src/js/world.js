'use strict';
/* ====== World obstacles: sparse, deterministic, themed solid props (no storage needed) ====== */
const OB_CELL=230,ZONE_CELL=460,TRAP_PERIOD=4;
/* each def: w=spawn weight, r=ground collision radius, art(R,C)=painter, W,H=sprite size in art units (origin bottom centre) */
const OB=(w,r,W,H,art,rk)=>({w,r,W,H,art,rk});
/* rock sprites (atlas rocks.png, same order as assets/sprites/rocks/rock_<n>.png): [w,h] in sprite px. 0 flat slab with lichen, 1-3 big boulders, 4/5/9/10/11 spires, 6 mid, 7-19 small stones.
   Drawn at ROCK_S world px per sprite px (wide ones are shrunk to ROCK_MAXW); the collision circle comes from the sprite footprint, not from the painted fallback. */
const ROCKD=[[91,55],[163,110],[161,94],[123,79],[34,66],[56,63],[90,53],[43,27],[42,32],[38,56],[24,45],[16,26],[45,28],[30,17],[23,14],[40,29],[49,30],[48,32],[16,9],[40,25]];
const ROCK_S=1.2,ROCK_MAXW=150;
const rockScale=i=>Math.min(ROCK_S,ROCK_MAXW/ROCKD[i][0]);
const RK_SMALL=[6,7,8,12,15,16,17,19],RK_BIG=[0,1,2,3],RK_SPIRE=[4,5,9,10,11],RK_MIX=[6,7,8,12,15,16,17,19,3,0];
const rkDef=(w,rk,art,r)=>OB(w,r||14,26,18,art||(R=>{R(-10,-7,20,7,'#8a8f98');R(-7,-12,14,6,'#a0a6b0');}),rk);
const tri=(R,cx,base,hgt,hw,c1,c2)=>{for(let i=0;i<hgt;i++){const k=i/hgt,w=hw*(1-k)*2;R(cx-w/2,base-i-1,w,1,i%5<2?c2:c1);}};
const OBSTACLES={
  plains:[
    OB(5,7,26,34,(R,C)=>{R(-1.5,-15,3,15,'#6a4a2a');C(R,0,-22,9,'#3f9e4a');C(R,-3,-25,5,'#5ac05a');}),
    OB(4,11,22,14,R=>{R(-8,-6,16,6,'#8a8f98');R(-6,-10,12,5,'#a0a6b0');R(-3,-9,5,2,'#c0c6d0');},RK_MIX),
    OB(1.1,21,40,28,(R)=>{tri(R,0,0,24,18,'#8a7a62','#a89a80');R(-3,-24,6,3,'#f4f1ea');}),
    OB(.5,16,26,26,R=>{R(-10,-12,20,12,'#e8e4d8');R(-10,-14,20,3,'#e8742c');R(-4,-8,8,8,'#6ac0e8');R(-1,-20,2,6,'#8a8f98');}),
    rkDef(.8,RK_BIG,R=>{R(-12,-8,24,8,'#8a8f98');R(-9,-14,18,7,'#a0a6b0');})
  ],
  namek:[
    OB(4,6,30,46,(R,C)=>{R(-1.5,-28,3,28,'#b8d7c0');C(R,0,-33,10,'#7bd6a6');C(R,-3,-36,6,'#9ee8bf');}),
    OB(3,12,22,30,R=>{R(-8,-22,16,22,'#4a9fb4');R(-8,-22,4,22,'#7acce0');R(-9,-26,18,5,'#8ad8a8');R(-3,-10,2,10,'#2f7f94');}),
    OB(1.2,22,40,28,R=>{tri(R,0,0,24,19,'#3f9e8a','#6ad0b0');R(-4,-22,8,3,'#b8f0d8');}),
    OB(.28,30,50,32,(R,C)=>{R(-20,-10,40,7,'#7a5ab0');R(-17,-14,34,5,'#9a7ad0');R(-12,-18,24,5,'#b898e8');C(R,0,-20,9,'#6ad0e8');R(-6,-24,12,4,'#d8f4ff');R(-22,-6,44,3,'#4a3a7a');R(-14,-3,3,3,'#f2c230');R(11,-3,3,3,'#f2c230');})
  ],
  waste:[
    OB(3,15,26,16,R=>{R(-11,-8,22,8,'#8a3a3a');R(-7,-13,14,6,'#6a2a2a');R(-5,-12,4,4,'#8ac0d8');R(2,-12,4,4,'#8ac0d8');R(-9,-3,5,3,'#222');R(5,-3,5,3,'#222');}),
    OB(3,14,26,34,R=>{R(-6,-26,12,26,'#5a5650');R(-4,-22,3,4,'#2a2622');R(1,-14,3,4,'#2a2622');R(-6,-28,5,3,'#5a5650');}),
    OB(3,16,28,14,R=>{R(-11,-5,22,5,'#6a6460');R(-8,-9,16,5,'#7a746e');R(-3,-12,8,4,'#8a847e');R(4,-8,6,3,'#4a4642');},RK_MIX),
    OB(.5,12,16,26,R=>{R(-1,-24,2,24,'#4a3a2a');R(-7,-18,6,1.4,'#4a3a2a');R(1,-12,6,1.4,'#4a3a2a');}),
    rkDef(.6,RK_BIG,R=>{R(-12,-8,24,8,'#6a6460');R(-9,-14,18,7,'#7a746e');})
  ],
  other:[
    OB(4,8,18,30,R=>{R(-2,-26,4,26,'#ff9ad8');R(-4,-16,8,16,'#ff7ac0');R(-1,-24,1.5,12,'#ffd0f0');}),
    OB(3,14,30,22,(R,C)=>{C(R,-6,-6,6,'#fff0ff');C(R,3,-8,8,'#ffe0ff');C(R,10,-5,5,'#fff0ff');R(-12,-1,26,1,'#d8b0ff');}),
    OB(.4,26,44,36,(R,C)=>{for(let i=0;i<22;i++){const hw=Math.sqrt(1-(i/22)*(i/22))*17;R(-hw,-i-4,hw*2,1,'#ff9ec7');}R(-17,-4,34,4,'#e87aa0');R(-3,-14,6,10,'#f4f1ea');R(-1,-34,2,10,'#8a4fc0');C(R,0,-35,2,'#ffd23f');})
  ],
  void:[
    OB(4,8,18,40,R=>{R(-4,-34,8,34,'#2a3a6a');R(-.6,-34,1.2,34,'#6ad0ff');R(-5,-36,10,3,'#3a4a8a');}),
    OB(3,12,24,12,R=>{R(-9,-5,18,5,'#3a4a8a');R(-6,-8,12,4,'#4a5a9a');R(-2,-7,5,1,'#6ad0ff');}),
    OB(.5,18,36,26,R=>{R(-14,-8,28,8,'#2a3a6a');R(-11,-12,22,5,'#3a4a8a');R(-8,-17,16,5,'#4a5a9a');R(-3,-17,6,1,'#ff6aa0');})
  ],
  beach:[
    OB(5,6,30,42,(R,C)=>{R(-1.5,-24,3,24,'#8a6a3a');R(0,-30,2.5,8,'#8a6a3a');for(const [a,b] of [[-10,-30],[-6,-34],[6,-34],[10,-30],[0,-36]])C(R,a,b,4,'#2f9a4a');C(R,0,-31,3,'#5ac05a');}),
    OB(3,10,20,12,R=>{R(-7,-5,14,5,'#9a9a98');R(-5,-9,10,5,'#b8b8b4');R(-2,-8,4,1,'#d8d8d4');},RK_SMALL),
    OB(.3,26,50,34,R=>{R(-20,-14,40,14,'#ffb0c8');R(-22,-20,44,7,'#d8402a');R(-18,-24,36,5,'#e8583a');R(-14,-11,8,8,'#6ac0e8');R(4,-11,8,11,'#8a5a2a');R(-1,-30,2,8,'#f4f1ea');R(-8,-26,16,3,'#f4f1ea');}),
    OB(2,9,20,16,(R,C)=>{C(R,-4,-6,6,'#d8a8d8');C(R,3,-5,6,'#e8c0e8');R(-2,-3,4,3,'#8a6a3a');}),
    rkDef(.5,RK_BIG,R=>{R(-12,-8,24,8,'#9a9a98');R(-9,-14,18,7,'#b8b8b4');})
  ],
  redrock:[
    OB(4,14,26,18,R=>{R(-10,-7,20,7,'#8a3a22');R(-7,-12,14,6,'#a8482a');R(-3,-14,7,3,'#c85a34');R(2,-8,6,3,'#6a2a18');},RK_MIX),
    OB(3,8,16,36,R=>{tri(R,0,0,32,6,'#7a2a18','#a8482a');},RK_SPIRE),
    OB(.4,17,30,22,(R,C)=>{C(R,0,-10,10,'#d8d8e8');R(-10,-3,20,3,'#8a8a9a');R(-4,-14,8,6,'#6ad0ff');R(-3,-13,2,1,'#fff');R(-12,-2,24,2,'#4a4a5a');}),
    OB(2,10,22,22,R=>{R(-6,-16,12,16,'#6a2a18');R(-4,-20,8,5,'#8a3a22');R(-1,-10,2,10,'#3a1208');}),
    rkDef(.7,RK_BIG,R=>{R(-12,-8,24,8,'#8a3a22');R(-9,-14,18,7,'#a8482a');})
  ],
  arena:[
    OB(4,9,18,38,R=>{R(-5,-30,10,30,'#b8b0a0');R(-6,-32,12,3,'#d8d0c0');R(-6,-3,12,3,'#8a8274');R(-1,-24,1.4,14,'#6a6254');}),
    OB(4,12,26,14,R=>{R(-10,-5,20,5,'#9a9284');R(-7,-9,14,5,'#b0a898');R(1,-7,6,3,'#7a7264');R(-9,-3,3,3,'#6a6254');},RK_MIX),
    OB(2,5,16,34,R=>{R(-.8,-30,1.6,30,'#6a6254');R(-1.6,-31,3.2,1.6,'#9a9284');}),
    OB(.5,14,28,22,R=>{R(-11,-8,22,8,'#8a8274');R(-8,-14,16,7,'#b0a898');R(-2,-20,4,7,'#d8d0c0');}),
    rkDef(.6,RK_BIG,R=>{R(-12,-8,24,8,'#9a9284');R(-9,-14,18,7,'#b0a898');})
  ],
  sky:[
    OB(4,8,16,34,R=>{R(-4,-30,8,30,'#f4f1ea');R(-5,-32,10,3,'#fff');R(-5,-3,10,3,'#c8c0d8');R(-1,-28,1,24,'#d8d0e0');}),
    OB(3,11,26,20,(R,C)=>{C(R,-6,-6,6,'#fff');C(R,3,-8,8,'#eaf4ff');C(R,10,-5,5,'#fff');R(-10,-1,22,1,'#bcd8f4');}),
    OB(2,10,20,32,R=>{R(-6,-4,12,4,'#c8c0d8');R(-3,-20,6,16,'#e8e0f0');R(-5,-27,10,8,'#f4f1ea');R(-2,-30,4,3,'#ffd23f');}),
    OB(.5,17,34,30,R=>{R(-14,-24,28,4,'#e8503a');R(-12,-20,3,20,'#f4f1ea');R(9,-20,3,20,'#f4f1ea');R(-14,-3,28,3,'#c8c0d8');R(-8,-27,16,4,'#d8402a');})
  ],
  hell:[
    OB(4,13,24,18,R=>{R(-9,-7,18,7,'#3a1a1a');R(-6,-12,12,6,'#5a2a22');R(-3,-4,6,2,'#ff7a1a');R(-1,-10,2,3,'#ff9a3a');}),
    OB(3,8,14,36,R=>{tri(R,0,0,32,5,'#d8d0c0','#f4f0e4');R(-1,-24,2,3,'#3a1a1a');}),
    OB(.6,16,28,24,(R,C)=>{C(R,0,-10,10,'#e8e0d0');R(-5,-12,3,4,'#1a0a0a');R(2,-12,3,4,'#1a0a0a');R(-1,-8,2,3,'#3a1a1a');R(-4,-3,8,3,'#d8d0c0');R(-3,-2,1,2,'#3a1a1a');R(0,-2,1,2,'#3a1a1a');})
  ]
};
/* ====== Snake Way: the only walkable ground is the snake's body, a winding corridor along the x axis ====== */
const Snake={
  HW:150,XMAX:12000,
  f(x){return 230*Math.sin(x*.0042)+60*Math.sin(x*.0113+1.1);},
  df(x){return 230*.0042*Math.cos(x*.0042)+60*.0113*Math.cos(x*.0113+1.1);},
  cx(x){return Math.max(-this.XMAX,Math.min(this.XMAX,x));},
  /* push a point back onto the body (rad = how much of the body width the object itself takes) */
  clamp(o,rad){
    o.x=this.cx(o.x);const s=this.df(o.x),k=Math.sqrt(1+s*s),lim=Math.max(8,this.HW-(rad||0))*k,c=this.f(o.x),dy=o.y-c;
    if(dy>lim)o.y=c+lim;else if(dy<-lim)o.y=c-lim;
  },
  /* random point on the body at about horizontal distance d from x0 (side: -1/1), spread across the width */
  spot(x0,d,side,spread){
    let sg=side||(Math.random()<.5?-1:1);if(x0>this.XMAX-d)sg=-1;else if(x0<-this.XMAX+d)sg=1;
    const x=this.cx(x0+sg*d),s=this.df(x),k=Math.sqrt(1+s*s),w=(spread===undefined?.8:spread)*this.HW*k;
    return[x,this.f(x)+(Math.random()*2-1)*w];
  }
};
const World={
  cache:new Map(),key:'',rockOn:false,
  cell(theme,cx,cy){
    const k=cx*100003+cy;let c=this.cache.get(k);
    if(c!==undefined)return c;
    c=null;const defs=OBSTACLES[theme];
    if(defs&&hash(cx*7+3,cy*13+5)<.15){
      const x=(cx+.15+hash(cx+11,cy+3)*.7)*OB_CELL,y=(cy+.15+hash(cx+5,cy+17)*.7)*OB_CELL;
      if(x*x+y*y>260*260){
        let tot=0;for(const d of defs)tot+=d.w;let q=hash(cx+31,cy+9)*tot,ti=0;
        for(;ti<defs.length-1;ti++){q-=defs[ti].w;if(q<=0)break;}
        c={x,y,t:ti,r:defs[ti].r*1.5,f:hash(cx+2,cy+8)<.5?-1:1};
        const rk=defs[ti].rk;
        if(this.rockOn&&rk){const v=rk[Math.floor(hash(cx+19,cy+23)*rk.length)],sc=rockScale(v),wd=ROCKD[v][0]*sc,ht=ROCKD[v][1]*sc;
          c.v=v;c.s=sc;c.r=Math.max(6,Math.min(.36*wd,.55*ht));}
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
    c=null;const q=hash(cx*5+1,cy*9+2);
    if(theme==='snake'){   /* only on the body: one row of cells, y follows the path */
      if(cy===0&&q<.2&&Math.abs(cx)<26){const x=(cx+.2+hash(cx+3,cy+7)*.6)*ZONE_CELL;if(Math.abs(x)>340){const y=Snake.f(x)+(hash(cx+9,cy+1)-.5)*Snake.HW*.8;c=q<.06?{kind:'heal',x,y,r:82,ph:0,id:k}:{kind:'trap',x,y,r:46+hash(cx+4,cy+4)*16,ph:hash(cx+8,cy+2)*TRAP_PERIOD,id:k,theme};}}
      this.zc.set(k,c);return c;
    }
    if(q<.2){
      const x=(cx+.2+hash(cx+3,cy+7)*.6)*ZONE_CELL,y=(cy+.2+hash(cx+9,cy+1)*.6)*ZONE_CELL;
      if(x*x+y*y>340*340){
        if(q<.06)c={kind:'heal',x,y,r:82,ph:0,id:k};
        else c={kind:'trap',x,y,r:46+hash(cx+4,cy+4)*16,ph:hash(cx+8,cy+2)*TRAP_PERIOD,id:k,theme};
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
    const cx=Math.floor(o.x/OB_CELL),cy=Math.floor(o.y/OB_CELL);
    for(let gx=cx-1;gx<=cx+1;gx++)for(let gy=cy-1;gy<=cy+1;gy++){
      const b=this.cell(theme,gx,gy);if(!b)continue;
      const dx=o.x-b.x,dy=o.y-b.y,rr=b.r+rad,d2=dx*dx+dy*dy;
      if(d2<rr*rr){const d=Math.sqrt(d2)||.01;o.x=b.x+dx/d*rr;o.y=b.y+dy/d*rr;}
    }
  },
  visible(theme,x0,y0,x1,y1){
    const out=[];
    for(let gx=Math.floor(x0/OB_CELL)-1;gx<=Math.floor(x1/OB_CELL)+1;gx++)for(let gy=Math.floor(y0/OB_CELL)-1;gy<=Math.floor(y1/OB_CELL)+1;gy++){const b=this.cell(theme,gx,gy);if(b)out.push(b);}
    return out;
  }
};
