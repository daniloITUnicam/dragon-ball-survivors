'use strict';
/* ====== Sea: lakes and the sea as a low-resolution pixel layer (visual only, never touches gameplay).
   The water field is a smooth noise function of world position (so the coast is organic, not tile-shaped). It is baked in chunks of 64x64 "pixels" of
   4 world px each, four swash phases per chunk (the foam creeps in and out), then drawn scaled up: wet sand, broken foam, a bright foam line, and bands from
   light shallows to deep water with a checker dither between them. Plains (ponds), Namek and the beach each have their own palette. ====== */
const Sea={
  CELL:4,CH:64,cache:new Map(),
  /* foam, foam2 = foam highlights; bands = shallow -> deep; wet/wet2 = wet ground (RGB) with alpha wa */
  PAL:{
    beach:{foam:[255,255,255],foam2:[212,246,255],bands:[[158,238,250],[92,214,243],[48,174,235],[33,136,219],[28,108,205],[24,86,188]],wet:[176,118,48],wet2:[146,96,38],wa:.38},
    plains:{foam:[246,255,250],foam2:[200,240,236],bands:[[152,228,214],[106,202,212],[66,168,206],[48,140,196],[40,114,182],[32,94,164]],wet:[66,62,26],wet2:[46,46,20],wa:.34},
    namek:{foam:[236,255,248],foam2:[188,255,232],bands:[[142,250,220],[98,236,214],[54,208,206],[38,172,196],[32,142,184],[26,114,168]],wet:[18,92,82],wet2:[12,66,60],wa:.32},
    /* lava: a bright rim instead of foam, yellow-hot shallows down to a dark red crust, scorched ground around it */
    hell:{foam:[255,244,170],foam2:[255,255,255],bands:[[255,214,84],[255,168,40],[244,110,22],[208,64,18],[150,34,16],[98,20,14]],wet:[40,12,10],wet2:[24,6,8],wa:.55,crest:[255,236,130],step:.5,lava:1}
  },
  /* band edges, in world px of distance from the waterline (so the foam and every band keep the same width whatever the slope of the field) */
  EDGE:[16,30,55,90,140,200],
  NP:8,SWASH:[2,6,8,6,2,-2,-4,-2],   /* 8 phases: the foam creeps in and out, the wave crests slide toward the shore */
  has(theme){const c=AMB[theme];return !!(c&&c.wt&&this.PAL[theme]);},
  /* the smooth water field at a world position (water where it is above AMB[theme].wt); the start area is kept dry */
  field(theme,x,y){
    const tx=x/64,ty=y/64;
    let n=vnoise(tx*.085+MAP.nx,ty*.085+MAP.ny)*.65+vnoise(tx*.21+30+MAP.nx,ty*.21+17+MAP.ny)*.35;
    const r=Math.sqrt(tx*tx+ty*ty);if(r<10)n-=(1-r/10)*.62;   /* the start area stays dry (no lake within ~250 px of where the run begins) */
    return n;
  },
  /* how far above the shoreline a point is (> 0 is water, < 0 dry); -9 when the map has no lakes */
  wet(theme,x,y){const c=AMB[theme];return c&&c.wt&&this.PAL[theme]?this.field(theme,x,y)-c.wt:-9;},
  chunk(theme,cx,cy){
    const key=theme+'|'+cx+'|'+cy;let e=this.cache.get(key);if(e)return e;
    const CH=this.CH,C2=CH+2,wt=AMB[theme].wt,B=new Float32Array(C2*C2),f=new Float32Array(CH*CH),CELL=this.CELL;let mx=-1e9;
    for(let j=-1;j<=CH;j++)for(let i=-1;i<=CH;i++){
      const gi=cx*CH+i,gj=cy*CH+j;
      B[(j+1)*C2+i+1]=this.field(theme,(gi+.5)*CELL,(gj+.5)*CELL)-wt+(vnoise(gi*.12+7+MAP.nx,gj*.12+3+MAP.ny)-.5)*.012;
    }
    for(let j=0;j<CH;j++)for(let i=0;i<CH;i++){
      const k=(j+1)*C2+i+1,dx=(B[k+1]-B[k-1])/(2*CELL),dy=(B[k+C2]-B[k-C2])/(2*CELL),gr=Math.max(.0006,Math.hypot(dx,dy));
      const d=Math.max(-90,Math.min(400,B[k]/gr));   /* distance to the waterline in px (negative on the dry side) */
      f[j*CH+i]=d;if(d>mx)mx=d;
    }
    e={f,empty:mx<-28,img:new Array(8).fill(null),gl:null,cx,cy};
    if(!e.empty){
      e.gl=[];   /* glints on the open water */
      for(let j=0;j<CH;j++)for(let i=0;i<CH;i++){
        if(f[j*CH+i]<70)continue;const gi=cx*CH+i,gj=cy*CH+j;
        if(hash(gi+9,gj+4)>.9955)e.gl.push({x:gi*CELL,y:gj*CELL,w:8+((hash(gi,gj+2)*3)|0)*4,ph:hash(gi+1,gj)*40});
      }
    }
    this.cache.set(key,e);
    if(this.cache.size>260)this.purge(cx,cy);
    return e;
  },
  purge(cx,cy){for(const [k,e] of this.cache)if(Math.abs(e.cx-cx)>5||Math.abs(e.cy-cy)>5)this.cache.delete(k);},
  img(e,theme,ph){
    if(e.img[ph])return e.img[ph];
    const CH=this.CH,P=this.PAL[theme],c=document.createElement('canvas');c.width=c.height=CH;
    const g=c.getContext('2d'),im=g.createImageData(CH,CH),d=im.data,f=e.f,s=this.SWASH[ph],E=this.EDGE,CR=P.crest||P.foam2,lava=!!P.lava;
    for(let j=0;j<CH;j++)for(let i=0;i<CH;i++){
      const n=f[j*CH+i],gi=e.cx*CH+i,gj=e.cy*CH+j,k=(j*CH+i)*4;
      let r=0,gg=0,b=0,a=0;
      const dd=n-s,hh=vnoise(gi*.17+ph*1.3,gj*.17+ph*.4),h2=hash(gi*3+ph*11,gj*5+ph*7);   /* hh: clumpy, so the foam breaks into streaks instead of static */
      if(dd<-30){continue;}
      else if(dd<-13){r=P.wet[0];gg=P.wet[1];b=P.wet[2];a=P.wa*255;}
      else if(dd<-5){
        if(hh>.5){r=P.foam[0];gg=P.foam[1];b=P.foam[2];a=235;}else{r=P.wet2[0];gg=P.wet2[1];b=P.wet2[2];a=(P.wa+.14)*255;}
      }else if(dd<7){
        if(h2>.93){r=P.foam2[0];gg=P.foam2[1];b=P.foam2[2];}else{r=P.foam[0];gg=P.foam[1];b=P.foam[2];}a=255;
      }else{
        /* the open water: bands by depth (independent of the swash), a checker dither where two bands meet */
        const dz=n+((gi+gj)&1?3:-3);let bi=0;for(let q=0;q<E.length;q++)if(dz>=E[q])bi=q+1;
        let col=P.bands[Math.min(5,bi)];
        if(dd<16&&hh>.55){col=P.foam;}   /* the inner fringe of the foam is broken */
        else if(dd>20&&dd<200){   /* wave crests parallel to the coast, sliding shoreward one step per phase; broken into streaks */
          const cp=((n+ph*6)%48+48)%48,w2=vnoise(gi*.09+3,gj*.09+8);
          if(cp<5&&w2>.4){const m=Math.min(1,(200-dd)/120)*(lava?.7:.5);col=[col[0]+(CR[0]-col[0])*m,col[1]+(CR[1]-col[1])*m,col[2]+(CR[2]-col[2])*m];}
        }
        r=col[0];gg=col[1];b=col[2];a=255;
      }
      d[k]=r;d[k+1]=gg;d[k+2]=b;d[k+3]=a;
    }
    g.putImageData(im,0,0);e.img[ph]=c;return c;
  },
  draw(ctx,cx,cy,vw,vh,t,theme){
    if(!this.has(theme))return;
    const P=this.PAL[theme],S=this.CELL*this.CH,x0=Math.floor((cx-8)/S),x1=Math.floor((cx+vw+8)/S),y0=Math.floor((cy-8)/S),y1=Math.floor((cy+vh+8)/S);
    const ph=Math.floor(t/(P.step||.2))%this.NP;
    ctx.save();ctx.imageSmoothingEnabled=false;
    const vis=[];
    for(let gx=x0;gx<=x1;gx++)for(let gy=y0;gy<=y1;gy++){
      const e=this.chunk(theme,gx,gy);if(e.empty)continue;
      ctx.drawImage(this.img(e,theme,ph),gx*S,gy*S,S+1,S+1);vis.push(e);
    }
    /* glints drifting over the open water (sparks on lava) */
    ctx.fillStyle=P.lava?'#fff4b0':'#ffffff';
    for(const e of vis)for(const q of e.gl){
      const a=Math.sin(t*1.6+q.ph);if(a<.5)continue;
      ctx.globalAlpha=Math.min(.85,(a-.45)*1.5);ctx.fillRect(q.x+(Math.round(((t*5+q.ph*2)%16)/4)*4),q.y,q.w,4);
    }
    ctx.globalAlpha=1;
    if(vis.length)this.life(ctx,cx,cy,vw,vh,t,theme);
    ctx.restore();ctx.globalAlpha=1;
  },
  /* things that happen on the water: fish leaping out with a splash (lava: bubbles that swell and burst in sparks). Deterministic in world cells and time slots. */
  life(ctx,cx,cy,vw,vh,t,theme){
    const P=this.PAL[theme],lava=!!P.lava,G=220,SL=lava?2.2:2.8,gx0=Math.floor(cx/G)-1,gx1=Math.floor((cx+vw)/G)+1,gy0=Math.floor(cy/G)-1,gy1=Math.floor((cy+vh)/G)+1,sl=Math.floor(t/SL);
    const fc=theme==='beach'?'#d6ecf8':theme==='namek'?'#9af0cc':'#f2cf70';
    for(let slot=sl-1;slot<=sl;slot++)for(let gx=gx0;gx<=gx1;gx++)for(let gy=gy0;gy<=gy1;gy++){
      if(hash(gx*131+slot*7,gy*71+slot*3+5)>(lava?.2:.15))continue;
      const x=(gx+hash(gx+slot,gy+4))*G,y=(gy+hash(gx,gy+slot+9))*G;
      if(this.wet(theme,x,y)<.09)continue;
      const u=(t-slot*SL-hash(gx+3,gy+slot)*SL*.5)/(lava?1.5:1.05);if(u<0||u>1)continue;
      if(lava){
        const r=u<.72?3+10*Math.sin(u/.72*Math.PI/2):0;
        if(u<.72){ctx.fillStyle='#ff9a2a';ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.fillStyle='#ffe27a';ctx.beginPath();ctx.arc(x-r*.25,y-r*.25,r*.55,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,.8)';ctx.fillRect(x-r*.5,y-r*.55,2,2);}
        else{
          const k=(u-.72)/.28;ctx.strokeStyle='rgba(255,230,120,'+(1-k)+')';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,6+k*20,3+k*9,0,0,TAU);ctx.stroke();
          for(let i=0;i<7;i++){const a=i/7*TAU+hash(gx,gy)*6,sp=26+hash(i,gx)*30;ctx.fillStyle='rgba(255,'+(170+i*10)+',60,'+(1-k)+')';ctx.fillRect(x+Math.cos(a)*sp*k,y+Math.sin(a)*sp*k*.6-60*k*(1-k)*1.6,3,3);}
        }
      }else{
        const dir=hash(gx+9,gy+slot)<.5?-1:1,L=48,fx=x+dir*u*L,fy=y-30*4*u*(1-u),ang=Math.atan2(-120*(1-2*u),L);
        const rs=(px,k)=>{ctx.strokeStyle='rgba(255,255,255,'+(.8*(1-k))+')';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(px,y,3+k*14,1.4+k*6,0,0,TAU);ctx.stroke();};
        if(u<.28)rs(x,u/.28);if(u>.72)rs(x+dir*L,(u-.72)/.28);
        ctx.save();ctx.translate(fx,fy);ctx.scale(dir*1.35,1.35);ctx.rotate(ang);
        ctx.fillStyle=fc;ctx.beginPath();ctx.ellipse(0,0,6,2.6,0,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,.75)';ctx.beginPath();ctx.ellipse(1,1,4,1,0,0,TAU);ctx.fill();
        ctx.fillStyle=fc;ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(-9.5,-3.2+Math.sin(t*40)*1.2);ctx.lineTo(-9.5,3.2+Math.sin(t*40)*1.2);ctx.fill();
        ctx.fillStyle='#10202a';ctx.fillRect(3.4,-1.3,1.2,1.2);ctx.restore();
      }
    }
  }
};
