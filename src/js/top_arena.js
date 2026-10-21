'use strict';
/* ====== Tournament of Power arena: the ring seen from above, painted in code (crisp at any size) from concentric bands of triangles and blocks, with a side wall, a teal halo,
   the central tower and its long shadow. Geometry (size, clamp) lives in world.js (TOPARENA); the stage theme is still 'void'. ====== */
const TopArt={
  C:{tan:'#e6c486',tanL:'#f2d9a2',or:'#c8702e',orD:'#a65420',bl:'#7d98ad',blD:'#5c7a91',ln:'#4a2c18',cream:'#ecd29c'},
  SH:{x:690,y:-300},   /* where the tower's shadow falls from its foot (upper right) */
  P(a,rn){return[TOPARENA.RX*rn*Math.cos(a),TOPARENA.RY*rn*Math.sin(a)];},
  /* one polygon between two radii and two angles (arcs approximated with a few steps) */
  seg(ctx,a0,a1,r0,r1,n){
    n=n||3;ctx.beginPath();let p=this.P(a0,r0);ctx.moveTo(p[0],p[1]);
    for(let i=1;i<=n;i++){p=this.P(a0+(a1-a0)*i/n,r0);ctx.lineTo(p[0],p[1]);}
    for(let i=n;i>=0;i--){p=this.P(a0+(a1-a0)*i/n,r1);ctx.lineTo(p[0],p[1]);}
    ctx.closePath();
  },
  tri(ctx,a0,r0,a1,r1,a2,r2){const p=this.P(a0,r0),q=this.P(a1,r1),s=this.P(a2,r2);ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.lineTo(s[0],s[1]);ctx.closePath();},
  ring(ctx,r0,r1,col){const R=TOPARENA;ctx.beginPath();ctx.ellipse(0,0,R.RX*r1,R.RY*r1,0,0,TAU);if(r0>0){ctx.ellipse(0,0,R.RX*r0,R.RY*r0,0,0,TAU,true);}ctx.fillStyle=col;ctx.fill('evenodd');},
  line(ctx,r,col,w){const R=TOPARENA;ctx.beginPath();ctx.ellipse(0,0,R.RX*r,R.RY*r,0,0,TAU);ctx.strokeStyle=col;ctx.lineWidth=w;ctx.stroke();},
  shade(ctx,i,k,a){const h=hash(i*13+k,k*7+3);if(h<.55)return;ctx.fillStyle=h<.78?'rgba(0,0,0,'+a+')':'rgba(255,255,255,'+a*.8+')';ctx.fill();},
  /* is a segment around angle a (ring radius rm, extent ext) anywhere near the view? */
  vis(a,rm,ext,x0,y0,x1,y1){const p=this.P(a,rm);return p[0]+ext>=x0&&p[0]-ext<=x1&&p[1]+ext>=y0&&p[1]-ext<=y1;},
  /* the whole floor: space behind, halo, side wall, top face with its rings, the tower's shadow */
  /* the floor is painted once, in square tiles (cached; the vector painting is far too heavy to repeat every frame) and blitted each frame */
  TS:512,
  tiles:new Map(),
  tile(tx,ty){
    const k=tx*10007+ty;let c=this.tiles.get(k);if(c){this.tiles.delete(k);this.tiles.set(k,c);return c;}
    const TS=this.TS,M=2,cv=document.createElement('canvas');cv.width=cv.height=TS+2*M;const ctx=cv.getContext('2d');
    ctx.translate(M-tx*TS,M-ty*TS);ctx.beginPath();ctx.rect(tx*TS-M,ty*TS-M,TS+2*M,TS+2*M);ctx.clip();
    this.floor(ctx,tx*TS-M,ty*TS-M,tx*TS+TS+M,ty*TS+TS+M,0);
    this.tiles.set(k,cv);if(this.tiles.size>72)this.tiles.delete(this.tiles.keys().next().value);
    return cv;
  },
  draw(ctx,cx,cy,vw,vh,t,A){
    const R=TOPARENA,TS=this.TS,M=2;
    A.back(ctx,cx,cy,vw,vh,t,'void');
    /* nebula: big soft clouds of purple, teal and magenta that drift slowly behind everything */
    ctx.save();ctx.globalCompositeOperation='lighter';
    const cols=['#7a2aa8','#1a9a88','#b02a7a'],f=.22,cell=700,ox=cx*f,oy=cy*f;
    for(let gx=Math.floor(ox/cell)-1;gx<=Math.floor((ox+vw)/cell)+1;gx++)for(let gy=Math.floor(oy/cell)-1;gy<=Math.floor((oy+vh)/cell)+1;gy++){
      const h=hash(gx*5+11,gy*3+7);if(h>.7)continue;
      const x=(gx+hash(gx+2,gy))*cell+cx-ox+Math.sin(t*.05+h*9)*30,y=(gy+hash(gx,gy+5))*cell+cy-oy,r=330+h*420;
      ctx.globalAlpha=.16+.05*Math.sin(t*.3+h*11);ctx.drawImage(GLOW.spr(cols[(h*40|0)%3]),x-r,y-r,r*2,r*2);
    }
    ctx.restore();
    const ax0=Math.max(Math.floor(cx/TS),Math.floor((-R.RX-120)/TS)),ax1=Math.min(Math.floor((cx+vw)/TS),Math.floor((R.RX+120)/TS)),ay0=Math.max(Math.floor(cy/TS),Math.floor((-R.RY-120)/TS)),ay1=Math.min(Math.floor((cy+vh)/TS),Math.floor((R.RY+200)/TS));
    ctx.save();ctx.imageSmoothingEnabled=true;
    for(let ty=ay0;ty<=ay1;ty++)for(let tx=ax0;tx<=ax1;tx++)ctx.drawImage(this.tile(tx,ty),tx*TS-M,ty*TS-M);
    ctx.restore();
    /* look-ahead: one tile of the ring around the view per frame, so walking never has to paint several at once */
    for(let ty=ay0-1;ty<=ay1+1;ty++)for(let tx=ax0-1;tx<=ax1+1;tx++){
      if(this.tiles.has(tx*10007+ty)||Math.abs(tx*TS)>R.RX+TS||ty*TS<-R.RY-TS||ty*TS>R.RY+TS)continue;
      this.tile(tx,ty);return;
    }
  },
  /* the whole floor inside the box x0..y1: halo, side wall, top face with its rings, the tower's shadow */
  floor(ctx,x0,y0,x1,y1,t){
    const R=TOPARENA,C=this.C,TH=64;
    ctx.save();
    /* halo along the rim */
    ctx.globalCompositeOperation='lighter';
    for(const [w,a] of [[150,.07],[70,.13],[26,.3],[9,.55]]){ctx.beginPath();ctx.ellipse(0,TH*.5,R.RX+4,R.RY+4,0,0,TAU);ctx.strokeStyle='rgba(60,235,200,'+a*(.85+.15*Math.sin(t*1.4))+')';ctx.lineWidth=w;ctx.stroke();}
    ctx.globalCompositeOperation='source-over';
    /* side wall: dark underside, then coloured blocks along the front half */
    ctx.beginPath();ctx.ellipse(0,TH,R.RX,R.RY,0,0,TAU);ctx.fillStyle='#2a1a10';ctx.fill();
    const NS=120,wc=[C.bl,C.cream,C.or,C.cream];
    for(let i=0;i<NS;i++){
      const a0=i/NS*Math.PI,a1=(i+1)/NS*Math.PI;if(!this.vis((a0+a1)/2,1,90,x0,y0,x1,y1+TH))continue;
      const p=this.P(a0,1),q=this.P(a1,1);ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.lineTo(q[0],q[1]+TH);ctx.lineTo(p[0],p[1]+TH);ctx.closePath();
      ctx.fillStyle=wc[i%4];ctx.fill();ctx.fillStyle='rgba(0,0,0,'+(.18+.22*Math.abs(Math.cos((a0+a1)/2)))+')';ctx.fill();
      ctx.strokeStyle=C.ln;ctx.lineWidth=2.4;ctx.stroke();
    }
    ctx.beginPath();ctx.ellipse(0,TH,R.RX,R.RY,0,0,Math.PI);ctx.strokeStyle=C.ln;ctx.lineWidth=4;ctx.stroke();
    /* top face */
    ctx.beginPath();ctx.ellipse(0,0,R.RX,R.RY,0,0,TAU);ctx.fillStyle=C.tan;ctx.fill();
    ctx.lineJoin='round';ctx.lineWidth=2.6;ctx.strokeStyle=C.ln;
    /* bands from the rim inwards, sized in world px so the detail stays fine at any arena size: the same family of bands repeats, with the colours swapped every other turn */
    const mean=Math.sqrt((R.RX*R.RX+R.RY*R.RY)/2),cnt=(rn,base)=>Math.max(16,Math.round(TAU*mean*rn/base)),vw2=Math.hypot(x1-x0,y1-y0);
    const cyc=[['teeth',170,150],['blocks',120,110],['band',46],['burst',150,130],['stripes',90,50],['band',36]];
    let rpx=R.RX,ci=0,swap=false;
    const band=(type,wpx,base)=>{
      const r1=rpx/R.RX,r0=Math.max(.0001,(rpx-wpx)/R.RX),N=type==='band'?0:cnt((r0+r1)/2,base),d=TAU/(N||1),ext=wpx+base*1.4;
      if(type==='lip'){for(let i=0;i<N;i++){const a=i*d;if(!this.vis(a+d/2,(r0+r1)/2,ext,x0,y0,x1,y1))continue;this.seg(ctx,a,a+d,r0,r1,2);ctx.fillStyle=i%2?C.orD:C.or;ctx.fill();ctx.stroke();}}
      else if(type==='band'){this.ring(ctx,r0,r1,swap?C.bl:C.or);this.line(ctx,(r0+r1)/2,'rgba(74,44,24,.55)',2);this.line(ctx,r0,C.ln,3);}
      else if(type==='teeth'||type==='burst'){
        const up=type==='teeth';
        for(let i=0;i<N;i++){const a=i*d;if(!this.vis(a+d/2,(r0+r1)/2,ext,x0,y0,x1,y1))continue;
          this.seg(ctx,a,a+d,r0,r1,3);ctx.fillStyle=swap?C.tan:C.tanL;ctx.fill();
          if(up)this.tri(ctx,a,r1,a+d,r1,a+d/2,r0);else this.tri(ctx,a,r0,a+d,r0,a+d/2,r1);
          ctx.fillStyle=swap?((i%2)?C.bl:C.blD):((i%2)?C.or:C.orD);ctx.fill();this.shade(ctx,i,ci,.1);ctx.stroke();
          if(up)this.tri(ctx,a+d,r1,a+d*1.5,r0,a+d*.5,r0);else this.tri(ctx,a+d,r0,a+d*1.5,r1,a+d*.5,r1);
          ctx.fillStyle=swap?C.tanL:C.tan;ctx.fill();}
      }
      else if(type==='blocks'){
        const rm=(r0+r1)/2;
        for(let i=0;i<N;i++){const a=i*d;if(!this.vis(a+d/2,rm,ext,x0,y0,x1,y1))continue;
          const bl=(i%2===0)!==swap;this.seg(ctx,a,a+d,rm,r1,2);ctx.fillStyle=bl?C.bl:C.or;ctx.fill();ctx.stroke();
          this.seg(ctx,a,a+d,r0,rm,2);ctx.fillStyle=bl?C.blD:C.orD;ctx.fill();this.shade(ctx,i,ci,.1);ctx.stroke();}
        this.line(ctx,rm,'rgba(74,44,24,.6)',2);
      }
      else if(type==='stripes'){
        for(let i=0;i<N;i++){const a=i*d;if(!this.vis(a+d/2,(r0+r1)/2,ext,x0,y0,x1,y1))continue;this.seg(ctx,a,a+d,r0,r1,1);ctx.fillStyle=(i%2===0)!==swap?C.bl:C.tanL;ctx.fill();ctx.stroke();}
      }
      if(type!=='band')this.line(ctx,r0,C.ln,3.6);
      rpx-=wpx;
    };
    band('lip',34,34);ctx.lineWidth=2.6;
    for(;rpx>210;){const e=cyc[ci%cyc.length];if(rpx-e[1]<130)break;band(e[0],e[1],e[2]||0);ci++;if(ci%cyc.length===0)swap=!swap;}
    this.ring(ctx,0,rpx/R.RX,C.or);this.line(ctx,rpx/R.RX,C.ln,4);this.line(ctx,rpx/R.RX*.62,C.ln,2.6);this.line(ctx,rpx/R.RX*.3,C.ln,2);
    ctx.restore();
    /* the tower's shadow, on the floor (clipped to the top face) */
    ctx.save();ctx.beginPath();ctx.ellipse(0,0,R.RX,R.RY,0,0,TAU);ctx.clip();this.shadow(ctx);ctx.restore();
  },
  shadow(ctx){
    const S=this.SH,L=Math.hypot(S.x,S.y),nx=-S.y/L,ny=S.x/L,w=44,K=TOPARENA.TR*.92;
    let q=[[nx*w,ny*w],[S.x+nx*w,S.y+ny*w],[S.x-nx*w,S.y-ny*w],[-nx*w,-ny*w]];
    const ar=q[0][0]*q[1][1]-q[1][0]*q[0][1]+q[1][0]*q[2][1]-q[2][0]*q[1][1]+q[2][0]*q[3][1]-q[3][0]*q[2][1]+q[3][0]*q[0][1]-q[0][0]*q[3][1];
    if(ar<0)q=q.reverse();
    ctx.beginPath();ctx.moveTo(q[0][0],q[0][1]);for(let i=1;i<4;i++)ctx.lineTo(q[i][0],q[i][1]);ctx.closePath();
    ctx.moveTo(K,0);ctx.ellipse(0,0,K,K*.84,0,0,TAU);
    ctx.moveTo(S.x+w,S.y);ctx.ellipse(S.x,S.y,w,w*.84,0,0,TAU);
    ctx.fillStyle='rgba(10,5,26,.5)';ctx.fill('nonzero');
  },
  /* the tower: a cylinder of coloured bands, seen from above at an angle, with a ringed top. Drawn as an entity (it hides what stands behind it); base centre at (0,0). */
  /* painted once into a canvas at 2x, then blitted */
  tower(ctx,t){
    if(!this.twc){
      const K=2,W=140,H=530,c=document.createElement('canvas');c.width=W*K;c.height=H*K;const x=c.getContext('2d');x.scale(K,K);x.translate(W/2,H-52);this.towerPaint(x);this.twc=c;this.twW=W;this.twH=H;
    }
    ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(this.twc,-this.twW/2,-(this.twH-52),this.twW,this.twH);ctx.restore();
  },
  towerPaint(ctx){
    const rx=TOPARENA.TR-2,ry=rx*.84,H=430,nb=10,bh=H/nb,C=this.C,cols=[C.bl,C.cream,C.or,C.cream],PI=Math.PI;
    ctx.save();ctx.lineJoin='round';
    for(let k=0;k<nb;k++){
      const y0=-k*bh,y1=-(k+1)*bh;
      ctx.beginPath();ctx.ellipse(0,y1,rx,ry,0,PI,0,true);ctx.lineTo(rx,y0);ctx.ellipse(0,y0,rx,ry,0,0,PI,false);ctx.closePath();
      ctx.fillStyle=cols[k%4];ctx.fill();
      const g=ctx.createLinearGradient(-rx,0,rx,0);g.addColorStop(0,'rgba(0,0,0,.34)');g.addColorStop(.45,'rgba(0,0,0,0)');g.addColorStop(.8,'rgba(255,255,255,.14)');g.addColorStop(1,'rgba(0,0,0,.22)');
      ctx.fillStyle=g;ctx.fill();ctx.strokeStyle=C.ln;ctx.lineWidth=2.4;ctx.stroke();
    }
    const ty=-H;
    ctx.beginPath();ctx.ellipse(0,ty,rx,ry,0,0,TAU);ctx.fillStyle=C.cream;ctx.fill();ctx.stroke();
    for(const [s,c] of [[.78,C.or],[.58,C.tan],[.36,C.bl],[.15,C.tanL]]){ctx.beginPath();ctx.ellipse(0,ty,rx*s,ry*s,0,0,TAU);ctx.fillStyle=c;ctx.fill();ctx.lineWidth=1.8;ctx.stroke();}
    ctx.restore();
  }
};
