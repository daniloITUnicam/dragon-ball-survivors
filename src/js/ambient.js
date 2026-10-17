'use strict';
/* ====== Ambient: living stages (visual only, never touches gameplay).
   Organic lakes + biome tints, animated tiles/props/decor, drifting particles, wandering critters,
   parallax layers and periodic weather. Toggle: settings.ambient. Adaptive LOD keeps 60 fps. ====== */
const sstep=(a,b,x)=>{const k=clamp((x-a)/(b-a),0,1);return k*k*(3-2*k);};
const vnoise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=hash(ix,iy),b=hash(ix+1,iy),c=hash(ix,iy+1),d=hash(ix+1,iy+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;};
/* per-theme recipe: wt=lake threshold, tint=[dry,lush], parts=[kind,count], crit=[kind,count], ev=[kind,period,duration,offset] */
const AMB={
  plains:{grade:[255,160,80],wt:.74,tint:['#c9b24a','#1c7a2c'],shore:'rgba(20,40,10,.16)',parts:[['firefly',10],['butterfly',7],['seed',14],['leaf',7],['bird',2],['petal',9]],crit:[['rabbit',3]],shadow:1,rays:1,mist:['#ffffff',.07],wx:['rain','fog','storm'],flock:2,nimbus:1},
  namek:{wt:.64,tint:['#7fe0b8','#0c6652'],shore:'rgba(0,40,40,.16)',parts:[['firefly',14],['mote',8],['leaf',5],['bird',1],['petal',7]],crit:[['frog',3]],shadow:1,rays:1,grade:[255,220,120],mist:['#a6ffd8',.1],wx:['rain','storm','fog'],flock:1},
  waste:{tint:['#cfa868','#4e4034'],parts:[['firefly',5],['dust',14],['bird',2],['tumble',1]],crit:[['scorpion',3],['weed',2]],shadow:1,grade:[255,150,70],wx:['sand','sand','storm'],flock:1},
  other:{tint:['#ffc0f0','#7a58c0'],parts:[['mote',14],['sparkle',16],['feather',5],['halo',4],['petal',5]],mist:['#ffb0f0',.12],wx:['feather'],nimbus:1},
  beach:{wt:.6,tint:['#fff0b8','#c8a860'],shore:'rgba(90,60,10,.18)',parts:[['firefly',6],['bird',3],['sparkle',10],['leaf',3],['petal',4]],crit:[['crab',5]],shadow:1,rays:1,grade:[255,170,90],wx:['rain','storm','rain'],flock:3,nimbus:1},
  redrock:{tint:['#e08a5a','#6a2a1c'],parts:[['firefly',5],['dust',12],['ember',5],['bird',2],['tumble',1]],crit:[['lizard',3]],shadow:1,grade:[255,140,70],wx:['sand','storm','sand'],flock:1},
  arena:{tint:['#e8e0d0','#8a8272'],parts:[['firefly',4],['mote',10],['flash',3],['confetti',4]],crit:[['pigeon',3]],spot:1,grade:[255,200,120],mist:['#e8e0d0',.08],wx:['wind','storm','wind']},
  sky:{back:['#5c98e0',.9],tint:['#ffffff','#a8c8f0'],parts:[['bird',4],['wind',10],['sparkle',8],['feather',3],['cloudlet',3]],rays:1,hi:1,grade:[255,190,120],wx:['gale'],flock:2,nimbus:1},
  hell:{back:['hell',.84],wt:.64,tint:['#ff7a2a','#12080a'],parts:[['ember',26],['ash',14],['wisp',5],['bird',3],['soul',6]],crit:[['salamander',2]],heat:1,nn:1,wx:['ashfall']},
  void:{back:['#03051a',.8],tint:['#6a4aff','#0a0e22'],parts:[['mote',14],['sparkle',14],['meteor',1],['shard',6]],stars:1,nn:1,wx:['meteor']}
};
const WV={plains:['#ffffff',.07,1.4],namek:['#bfffe6',.08,1.1],waste:['#fff0c8',.05,1],redrock:['#ffb080',.05,1.1],other:['#ffd0ff',.07,.8],beach:['#ffffff',.06,1.2],arena:['#ffffff',.035,.6],sky:['#8fb4ec',.09,1],void:['#6a8aff',.13,1.6],hell:['#ff4a10',.1,1.5]};
const NC={plains:[8,18,62],namek:[4,22,40],waste:[26,14,40],other:[34,12,58],beach:[4,22,66],redrock:[40,12,28],arena:[12,16,40],sky:[10,24,78]};
const FFC={plains:['#d8ff7a','#fff6a8'],namek:['#9affc8','#7affd8'],beach:['#6ad0ff','#9ae8ff'],redrock:['#ffb070','#ff9a4a'],waste:['#ffd890','#ffc070'],arena:['#fff2c0','#ffe08a'],other:['#ffd0ff','#ff9ae8'],sky:['#ffffff','#cfe8ff']};
const BIRDC={plains:'#2a2a34',namek:'#e8fff4',waste:'#1a1410',beach:'#ffffff',redrock:'#3a2a20',sky:'#ffffff',hell:'#1a0a14'};
const FOOTC={plains:'#d6e8bc',namek:'#bfffe6',waste:'#d8c4a0',other:'#ffe0ff',beach:'#f4e8c0',redrock:'#d89a78',arena:'#d8d0c0',sky:'#ffffff',hell:'#ff8a3a',void:'#6ad0ff'};
const DAYK={butterfly:1,seed:1,bird:1,petal:1,flash:0},NIGHTK={firefly:1};
const ADDK={firefly:1,mote:1,sparkle:1,ember:1,wisp:1,flash:1,meteor:1,soul:1,shard:1,halo:1};
const FLOWC=['#ff6a8a','#ffd23f','#ffffff','#b890ff'];
/* animated obstacles: m=sway|bob|flag, a=amplitude (world px), g=[ax,ay,radius,colour,alpha,pulse speed] glows (art units), em=[kind,ax,ay,rate/s] emitters */
const OBA={
  plains:[{m:'sway',a:5},0,0,{em:[['smoke',-.5,-23,.8]]}],
  namek:[{m:'sway',a:4},{g:[[0,-14,16,'#9ae8ff',.22,1.6]]},0,{g:[[0,-20,12,'#6ad0e8',.5,2.2],[-14,-3,5,'#f2c230',.7,5],[14,-3,5,'#f2c230',.7,4.3]]}],
  waste:[{em:[['smoke',0,-9,1.6],['spark',3,-8,.5]]},0,0,{m:'sway',a:2}],
  other:[{g:[[0,-14,15,'#ffb0f0',.35,1.8]]},{m:'bob',a:2.5},{g:[[0,-35,15,'#ffd23f',.6,2.4]]}],
  void:[{g:[[0,-20,20,'#6ad0ff',.5,2.2]],em:[['mote',0,-30,.8]]},{g:[[2,-7,12,'#6ad0ff',.45,3]]},{g:[[0,-17,20,'#ff6aa0',.5,2.6]],em:[['mote',0,-18,.9]]}],
  beach:[{m:'sway',a:6},0,0,0],
  redrock:[0,0,{g:[[0,-14,15,'#6ad0ff',.45,2.4]]},0],
  arena:[0,0,{m:'flag'},0],
  sky:[0,{m:'bob',a:3},{g:[[0,-30,12,'#ffd23f',.6,2.2]]},0],
  hell:[{g:[[0,-4,26,'#ff7a1a',.55,2.6]],em:[['ember',0,-9,2.4]]},0,{g:[[-3.5,-12,6,'#ff2a1a',.8,6],[3.5,-12,6,'#ff2a1a',.8,5.3]],em:[['wisp',0,-18,.25]]}]
};
/* decor animation per index (originals first, then extra variants) */
const DECA={
  plains:['sway','sway',0,'sway',0,0],namek:['sway',0,'sway','glow',0,'sway'],waste:['sway',0,0,0,0,'sway'],other:['bob',0,0,'glow',0,0],
  beach:[0,'sway',0,0,0,0],redrock:[0,0,0,'sway',0,'glow'],arena:[0,0,0,'torch',0,0],sky:['bob',0,0,'bob',0,0],hell:[0,0,'glow','torch',0,0],void:[0,'glow',0,'bob','glow',0]
};
const Ambient={
  on:true,wxOn:true,dnOn:true,dnDay:.6,dnLen:300,nt:0,px:0,py:0,auto:true,lod:1,dt:.016,t:0,ps:[],cr:[],cnt:{},g:null,theme:null,cfg:null,lt:0,dbl:false,wg:null,wx0:0,wy0:0,ww:0,wh:0,
  sm:.016,slow:0,fast:0,foot:0,wd:.5,evI:0,evK:'',cx:0,cy:0,vw:800,vh:500,pre:true,
  sw(t,ph){return (Math.sin(t*1.7+ph)*.55+Math.sin(t*.63+ph*1.9)*.45)*(.55+.6*this.wd);},
  /* ---------- lakes (walkable, decorative) ---------- */
  water(theme,tx,ty){return Sea.wet(theme,tx*64+32,ty*64+32)>0;},
  beginTerrain(theme,x0,y0,x1,y1){
    const c=AMB[theme];this.wx0=x0-1;this.wy0=y0-1;this.ww=x1-x0+3;this.wh=y1-y0+3;
    const n=this.ww*this.wh;if(!this.wg||this.wg.length<n)this.wg=new Uint8Array(n);
    if(!c||!c.wt||Sea.has(theme)){this.wg.fill(0,0,n);return;}   /* the lakes are drawn by Sea, not tile by tile */
    for(let j=0;j<this.wh;j++)for(let i=0;i<this.ww;i++)this.wg[j*this.ww+i]=this.water(theme,this.wx0+i,this.wy0+j)?1:0;
  },
  isW(tx,ty){const i=tx-this.wx0,j=ty-this.wy0;return i>=0&&j>=0&&i<this.ww&&j<this.wh&&this.wg[j*this.ww+i]===1;},
  /* ---------- backdrop (sky / hell / void) ---------- */
  back(ctx,cx,cy,vw,vh,t,theme){
    const c=AMB[theme];if(!c||!c.back)return 1;
    let col=c.back[0];
    if(col==='hell'){const s=.5+.5*Math.sin(t*1.3);col='rgb('+((130+90*s)|0)+','+((24+22*s)|0)+',6)';}
    ctx.fillStyle=col;ctx.fillRect(cx-4,cy-4,vw+8,vh+8);
    if(c.stars&&this.on){
      const lay=[[.18,150,.5,'#8aa0ff',1.4],[.35,110,.6,'#c8d4ff',1.8],[.6,90,.5,'#ffffff',2.4]];
      for(const [f,cell,dn,cl,sz] of lay){
        const ox=cx*f,oy=cy*f,sx=cx-ox,sy=cy-oy;ctx.fillStyle=cl;
        for(let gx=Math.floor(ox/cell)-1;gx<=Math.floor((ox+vw)/cell)+1;gx++)for(let gy=Math.floor(oy/cell)-1;gy<=Math.floor((oy+vh)/cell)+1;gy++){
          const h=hash(gx*3+1,gy*7+f*100|0);if(h>dn)continue;
          ctx.globalAlpha=.35+.65*Math.abs(Math.sin(t*(1+h*3)+h*50));
          ctx.fillRect(sx+(gx+hash(gx,gy+9))*cell,sy+(gy+hash(gx+4,gy))*cell,sz,sz);
        }
      }
      ctx.globalAlpha=1;
      ctx.save();ctx.globalCompositeOperation='lighter';
      for(let i=0;i<4;i++){
        const f=.3,cell=520,ox=cx*f,oy=cy*f;
        const gx=Math.floor((ox-t*4)/cell)+i-1;
        for(let gy=Math.floor(oy/cell)-1;gy<=Math.floor((oy+vh)/cell)+1;gy++){
          const h=hash(gx*5+2,gy*3+8);if(h>.45)continue;
          const x=(gx+hash(gx,gy+1))*cell+t*4+cx-ox,y=(gy+hash(gx+7,gy))*cell+cy-oy,r=300+h*400;
          ctx.globalAlpha=.1+.05*Math.sin(t*.4+h*9);ctx.drawImage(GLOW.spr(h<.22?'#6a4aff':'#2a7aff'),x-r,y-r,r*2,r*2);
        }
      }
      ctx.restore();
    }
    return c.back[1];
  },
  /* biome level 0..4 (dry..lush); baked into tinted tile variants by the renderer */
  lvl(tx,ty){const n=vnoise(tx*.07+50+MAP.nx,ty*.07+9+MAP.ny);return n<.32?0:n<.43?1:n<.57?2:n<.68?3:4;},
  /* soft travelling light bands over the whole view (replaces per-tile wave fills) */
  waves(ctx,theme,cx,cy,vw,vh,t){
    const w=WV[theme];if(!w||!this.on||this.lod<.5)return;
    const sx=.915,sy=.403,K=.00853,per=TAU/K,ucen=(cx+vw/2)*sx+(cy+vh/2)*sy,D=Math.hypot(vw,vh)/2+10;
    ctx.save();ctx.translate(cx+vw/2,cy+vh/2);ctx.rotate(Math.atan2(sy,sx));
    const k0=Math.floor((ucen-D)*K/TAU-w[2]*t/TAU),k1=Math.ceil((ucen+D)*K/TAU-w[2]*t/TAU)+1;
    for(let k=k0;k<=k1;k++){
      const xc=(Math.PI/2+TAU*k+t*w[2])/K-ucen,x0=xc-per/7,x1=xc+per/7;
      if(x1<-D||x0>D)continue;
      const g=ctx.createLinearGradient(x0,0,x1,0);
      g.addColorStop(0,hexA(w[0],0));g.addColorStop(.5,hexA(w[0],w[1]*1.5));g.addColorStop(1,hexA(w[0],0));
      ctx.fillStyle=g;ctx.fillRect(x0,-D,x1-x0,D*2);
    }
    ctx.restore();
    if(theme==='void'){
      const TS=64,gx0=Math.floor(cx/TS)*TS,gy0=Math.floor(cy/TS)*TS;
      ctx.strokeStyle='rgba(106,138,255,'+(.09+.05*Math.sin(t*1.2))+')';ctx.lineWidth=1;ctx.beginPath();
      for(let x=gx0;x<=cx+vw+TS;x+=TS){ctx.moveTo(x+.5,cy-4);ctx.lineTo(x+.5,cy+vh+TS);}
      for(let y=gy0;y<=cy+vh+TS;y+=TS){ctx.moveTo(cx-4,y+.5);ctx.lineTo(cx+vw+TS,y+.5);}
      ctx.stroke();
    }
  },
  /* ---------- per-tile overlays (only edge / hash-gated tiles do any work) ---------- */
  tile(ctx,theme,tx,ty,t,TS,wat,lv){
    const c=AMB[theme];if(!c)return;const X=tx*TS,Y=ty*TS;
    if(!wat){
      if(c.wt){
        ctx.fillStyle=c.shore;
        if(this.isW(tx,ty-1))ctx.fillRect(X,Y,TS,7);if(this.isW(tx,ty+1))ctx.fillRect(X,Y+TS-7,TS,7);
        if(this.isW(tx-1,ty))ctx.fillRect(X,Y,7,TS);if(this.isW(tx+1,ty))ctx.fillRect(X+TS-7,Y,7,TS);
      }
    }else{
      const f=Math.round((.3+.2*Math.sin(t*2+tx+ty*1.3))*10)/10,o=2*Math.sin(t*1.5+tx*2+ty);
      let drawn=false;
      const e1=!this.isW(tx,ty-1),e2=!this.isW(tx,ty+1),e3=!this.isW(tx-1,ty),e4=!this.isW(tx+1,ty);
      if(e1||e2||e3||e4){ctx.fillStyle='rgba(255,255,255,'+f+')';
        if(e1)ctx.fillRect(X,Y+o+2,TS,3);if(e2)ctx.fillRect(X,Y+TS-5-o,TS,3);if(e3)ctx.fillRect(X+o+2,Y,3,TS);if(e4)ctx.fillRect(X+TS-5-o,Y,3,TS);}
    }
    if(!this.on||this.lod<.5)return;
    const h=hash(tx+5,ty+11);
    if(wat){
      if(h>.72){const r=(t*.45+h*7)%1;ctx.strokeStyle='rgba(255,255,255,'+(Math.round(32*(1-r))/100)+')';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(X+32,Y+32,r*24,r*11,0,0,TAU);ctx.stroke();}
      if(theme==='beach'&&h>.3){
        ctx.fillStyle='rgba(255,255,255,.28)';
        for(let i=0;i<2;i++){const yy=Y+10+i*28+Math.sin(t*1.8+tx*1.7+i*2)*3,xx=X+((t*14+i*30+h*60)%80)-16,xa=Math.max(X,xx),xb=Math.min(X+TS,xx+28);if(xb>xa)ctx.fillRect(xa,yy,xb-xa,1.6);}
      }
      return;
    }
    if(theme==='plains'){
      if(lv>=3&&h>.3){for(let i=0;i<3;i++){const fx=X+8+hash(tx*3+i,ty)*46,fy=Y+10+hash(tx,ty*3+i)*42,s=Math.sin(t*2+fx*.1)*1.3;
        ctx.fillStyle='#2f8a3a';ctx.fillRect(fx+s*.5,fy+3,1.4,4);ctx.fillStyle=FLOWC[(hash(tx+i,ty*7)*4)|0];ctx.fillRect(fx+s-1.5,fy-1,3.5,3.5);ctx.fillStyle='#fff6a8';ctx.fillRect(fx+s-.5,fy,1.2,1.2);}}
      else if(lv<=1&&h>.6){ctx.fillStyle='#2f6a22';for(let i=0;i<3;i++){const gx=X+6+hash(tx+i,ty*5)*50,gy=Y+10+hash(tx*5,ty+i)*44,s=Math.sin(t*2.3+gx*.2)*1.6;ctx.fillRect(gx+s,gy,1.2,5);ctx.fillRect(gx+s*.6+2,gy+1,1.2,4);}}
    }else if((theme==='waste'||theme==='redrock')&&h>.75){
      ctx.fillStyle=theme==='waste'?'rgba(255,240,200,.08)':'rgba(255,200,150,.08)';ctx.fillRect(X+h*20,Y+((t*10+h*80)%64),30,1.5);
    }
  },
  /* additive pass (glowing cracks, bulbs, glitter) */
  glow(ctx,theme,x0,y0,x1,y1,t,TS){
    if(!this.on||this.lod<.5)return;
    const c=AMB[theme];if(!c)return;
    const gl=(x,y,r,col,a)=>{ctx.globalAlpha=a;ctx.drawImage(GLOW.spr(col),x-r,y-r,r*2,r*2);};
    const crack=(X,Y,tx,ty,col,a)=>{
      let x=X+hash(tx,ty+60)*TS,y=Y+hash(tx+60,ty)*TS;ctx.strokeStyle=col;ctx.lineWidth=1.8;ctx.globalAlpha=a;ctx.beginPath();ctx.moveTo(x,y);
      for(let k=0;k<4;k++){x+=hash(tx+k,ty*3)*16-6;y+=hash(tx*3,ty+k)*14-5;ctx.lineTo(x,y);}ctx.stroke();};
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
      const w=this.isW(tx,ty),h=hash(tx*7+13,ty*3+5),X=tx*TS,Y=ty*TS,pu=.5+.5*Math.sin(t*1.8+h*40);
      if(w){if(Math.sin(t*2.2+h*60)>.93){ctx.globalAlpha=.8;ctx.fillStyle='#fff';ctx.fillRect(X+h*50,Y+hash(ty,tx)*50,2.4,2.4);}continue;}
      switch(theme){
        case'namek':if(h>.94)gl(X+32,Y+32,15,'#7affd0',(.15+.3*pu)*(1+this.nt));break;
        case'other':if(h>.9)gl(X+32,Y+32,26,'#ff9ae8',(.1+.22*pu)*(1+this.nt));break;
        case'beach':if(h>.9&&Math.sin(t*3+h*50)>.8){ctx.globalAlpha=.9;ctx.fillStyle='#fff8d0';ctx.fillRect(X+h*52,Y+hash(ty,tx+4)*52,2,2);}break;
        case'redrock':if(h>.86)crack(X,Y,tx,ty,'#ff7a2a',.12+.3*pu);break;
        case'hell':if(h>.5)crack(X,Y,tx,ty,'#ff6a1a',.2+.4*pu);if(h>.93)gl(X+32,Y+32,30,'#ff5a10',.12+.16*pu);break;
        case'sky':if(h>.93&&Math.sin(t*2+h*50)>.7){const s=3+2*pu;ctx.globalAlpha=.8;ctx.fillStyle='#fff';ctx.fillRect(X+h*50-s/2,Y+20,s,1);ctx.fillRect(X+h*50,Y+20-s/2,1,s);}break;
        case'void':if(h>.92){ctx.globalAlpha=.3+.6*Math.abs(Math.sin(t*2+h*70));ctx.fillStyle='#bfd0ff';ctx.fillRect(X+h*54,Y+hash(ty,tx+8)*54,2,2);}break;
      }
    }
    ctx.restore();ctx.globalAlpha=1;
  },
  /* ---------- decor (swaying / glowing scenery on the ground) ---------- */
  decor(ctx,theme,i,d,bx,by,k,t){
    const a=(DECA[theme]||[])[i];if(!a||!this.on)return false;
    const ph=bx*.013+by*.009;
    if(a==='sway'){ctx.save();ctx.translate(bx,by);ctx.transform(1,0,this.sw(t,ph)*.09,1,0,0);ctx.drawImage(d.c,-d.ox*k,-d.oy*k,d.c.width*k,d.c.height*k);ctx.restore();return true;}
    if(a==='bob'){ctx.drawImage(d.c,bx-d.ox*k,by-d.oy*k+Math.sin(t*1.4+ph)*2.5,d.c.width*k,d.c.height*k);return true;}
    ctx.drawImage(d.c,bx-d.ox*k,by-d.oy*k,d.c.width*k,d.c.height*k);
    if(a==='torch'){const fl=.75+.25*Math.sin(t*14+ph*5)+.1*Math.sin(t*23+ph);GLOW.at(ctx,bx,by-30,22*fl,theme==='hell'?'#ff5a1a':'#ffb13b',.85);GLOW.at(ctx,bx,by-30,8*fl,'#fff0b0',.9);if(Math.random()<this.dt*3)this.puffAt('ember',bx+rnd(-2,2),by-32);}
    else if(a==='glow'){const pu=.55+.45*Math.sin(t*2+ph);GLOW.at(ctx,bx,by-14,20,theme==='void'?'#6ad0ff':theme==='redrock'?'#ff7a5a':theme==='hell'?'#ff7a2a':theme==='other'?'#ffd0ff':'#9ae8ff',.18+.3*pu+.3*this.nt);}
    return true;
  },
  /* ---------- animated obstacles ---------- */
  prop(ctx,b,sp,k,theme,t){
    if(!this.on)return false;const L=OBA[theme],o=L&&L[b.t];if(!o)return false;
    const f=b.f,X=b.x,Y=b.y+2,ph=b.x*.013+b.y*.007,K=3.1;
    ctx.save();ctx.translate(X,Y);ctx.scale(f*k,k);
    if(o.m==='sway'){
      const cw=sp.c.width,ch=sp.c.height,N=8,sh=Math.ceil(ch/N),amp=this.sw(t,ph)*o.a/k*f;
      for(let i=0;i<N;i++){const sy=i*sh,hh=Math.min(sh+1,ch-sy);if(hh<=0)break;const fr=clamp((sp.oy-(sy+hh/2))/sp.oy,0,1);
        ctx.drawImage(sp.c,0,sy,cw,hh,-sp.ox+amp*Math.pow(fr,1.6),-sp.oy+sy,cw,hh);}
    }else ctx.drawImage(sp.c,-sp.ox,-sp.oy+(o.m==='bob'?Math.sin(t*1.1+ph)*o.a/k:0));
    ctx.restore();
    if(o.m==='flag'){
      const x0=X+f*.8*K,y0=Y-30*K;
      for(let i=0;i<10;i++){const yo=Math.sin(t*5-i*.7+ph)*(.6+i*.5);ctx.fillStyle='#e8503a';ctx.fillRect(x0+f*i*3.1-(f<0?3.2:0),y0+yo,3.2,5*K*.6);ctx.fillStyle='#f4f1ea';ctx.fillRect(x0+f*i*3.1-(f<0?3.2:0),y0+yo+10.5,3.2,2.6);}
    }
    if(o.g)for(const q of o.g){const pu=.62+.38*Math.sin(t*q[5]+ph*3);GLOW.at(ctx,X+f*q[0]*K,Y+q[1]*K+(o.m==='bob'?Math.sin(t*1.1+ph)*o.a:0),q[2]*K*.55*(.85+.3*pu),q[3],Math.min(1,q[4]*pu*(1+1.2*this.nt)));}
    if(o.em)for(const e of o.em)if(Math.random()<e[3]*this.dt)this.puffAt(e[0],X+f*e[1]*K,Y+e[2]*K);
    return true;
  },
  /* ---------- state ---------- */
  reset(g,theme){
    this.g=g;this.theme=theme;this.cfg=AMB[theme]||null;this.ps.length=0;this.cr.length=0;this.cnt={};this.lt=0;this.pre=true;this.foot=0;this.sm=.016;this.slow=0;this.fast=0;
    if(this.auto)this.lod=1;
  },
  puffAt(kind,x,y){
    const p={k:kind,x,y,vx:0,vy:0,l:0,m:1,s:2,c:'#fff',ph:Math.random()*TAU,a:0};
    if(kind==='smoke'){p.m=2.4;p.vy=-rnd(14,22);p.vx=rnd(-3,3);p.s=3;p.c=this.theme==='waste'?'#2a2622':'#c8ccd4';}
    else if(kind==='spark'){p.k='ember';p.m=1.1;p.vx=rnd(-30,30);p.vy=-rnd(30,70);p.s=1.6;p.c='#ffd23f';}
    else if(kind==='ember'){p.m=rnd(1.4,2.6);p.vx=rnd(-14,14);p.vy=-rnd(25,55);p.s=rnd(1.4,2.4);p.c=pick(['#ff8a2a','#ffd23f','#ff5a1a']);}
    else if(kind==='mote'){p.m=rnd(3,5);p.vy=-rnd(8,16);p.s=rnd(2,3.4);p.c=this.theme==='void'?'#6ad0ff':'#ffd0ff';}
    else if(kind==='wisp'){p.m=rnd(6,9);p.vx=rnd(-8,8);p.vy=-rnd(6,12);p.s=5;p.c='#6ad0ff';}
    else if(kind==='puff'){p.m=.55;p.vy=-8;p.s=2.2;p.c=FOOTC[this.theme]||'#fff';}
    else if(kind==='ring'){p.m=.7;p.s=3;}
    else return;
    if(this.ps.length<260){this.ps.push(p);this.cnt[p.k]=(this.cnt[p.k]||0)+1;}
  },
  spawn(kind,pre){
    const m=70,W=this.vw,H=this.vh,th=this.theme;
    let x=this.cx-m+Math.random()*(W+2*m),y=this.cy-m+Math.random()*(H+2*m);
    const p={k:kind,x,y,vx:0,vy:0,l:0,m:6,s:2,c:'#fff',ph:Math.random()*TAU,a:Math.random()*TAU};
    switch(kind){
      case'butterfly':p.m=16;p.c=pick(['#ffd23f','#ff7ac8','#7ad0ff','#ffffff','#ff9a3d']);break;
      case'seed':p.m=rnd(7,11);p.s=rnd(1,2.2);break;
      case'leaf':p.m=rnd(8,12);p.s=rnd(1,1.8);p.c=pick(th==='namek'?['#7bd6a6','#9ee8bf','#4fb98a']:th==='beach'?['#2f9a4a','#5ac05a','#a8c850']:['#5ac05a','#c8b040','#3f9e4a','#e08a2a']);break;
      case'firefly':p.m=rnd(7,11);p.c=pick(FFC[th]||['#d8ff7a','#fff6a8']);break;
      case'splash':p.m=.38;p.s=1;p.c='#dfeaff';break;
      case'petal':p.m=rnd(9,13);p.s=rnd(1.3,2.1);p.c=pick(th==='namek'?['#b8ffe0','#8ae8c8','#ffffff']:th==='other'?['#ffc0f0','#ffe0ff','#c8a0ff']:th==='beach'?['#ffd0a0','#ff9ab8','#ffffff']:['#ffb0c8','#ffffff','#ffe27a','#ff8aa8']);break;
      case'tumble':{const dir=Math.random()<.78?1:-1;p.m=rnd(16,24);p.vx=dir*rnd(55,95);p.s=rnd(5,8);p.c=th==='redrock'?'#7a4a30':'#a8884a';if(!pre)p.x=dir>0?this.cx-80:this.cx+W+80;break;}   /* a tumbleweed rolling past */
      case'soul':p.m=rnd(8,12);p.vx=rnd(-6,6);p.vy=-rnd(12,24);p.s=rnd(3,5);p.c=pick(['#9ae8ff','#c8f4ff','#b8a0ff']);break;
      case'shard':p.m=rnd(10,14);p.s=rnd(3,6);p.vx=rnd(-7,7);p.vy=rnd(-7,7);p.c=pick(['#8a6aff','#6ad0ff','#ff6ad8']);break;
      case'cloudlet':p.m=rnd(16,22);p.s=rnd(24,42);p.vx=rnd(34,60);p.vy=rnd(-3,3);if(!pre)p.x=this.cx-90;break;
      case'halo':p.m=rnd(7,10);p.s=rnd(5,8);p.vy=-rnd(10,18);p.vx=rnd(-4,4);break;
      case'mote':p.m=rnd(7,11);p.s=rnd(2,3.6);p.vy=-rnd(5,12);p.c=th==='namek'?'#aaffd8':th==='other'?'#ffd0ff':th==='arena'?'#ffe9a8':'#6ad0ff';if(th==='arena'){p.vy=rnd(-3,3);p.vx=rnd(-5,5);p.s=rnd(1.2,2);}break;
      case'sparkle':p.m=rnd(1.6,3);p.s=rnd(2.5,4.5);p.c=th==='void'?'#bfd0ff':th==='beach'?'#fff6c0':'#ffffff';break;
      case'dust':p.m=rnd(2,3.5);p.s=rnd(8,18);p.vy=rnd(-14,14);p.c=th==='waste'?'#e0cca8':th==='arena'?'#d8d0c0':'#e0a080';break;
      case'ember':p.m=rnd(2.5,5);p.s=rnd(1.4,2.6);p.vx=rnd(-10,10);p.vy=-rnd(22,55);p.c=pick(['#ff8a2a','#ffd23f','#ff5a1a']);break;
      case'ash':p.m=rnd(8,12);p.s=rnd(1.2,2.4);p.c='#9a9aa0';break;
      case'wisp':p.m=rnd(9,13);p.vx=rnd(-8,8);p.vy=rnd(-8,8);p.c='#6ad0ff';break;
      case'feather':p.m=rnd(9,13);p.s=rnd(3,4.6);break;
      case'confetti':p.m=rnd(6,9);p.s=rnd(2,3.2);p.c=pick(['#ff4a4a','#ffd23f','#4ad0ff','#7aff7a','#ff7ac8','#fff']);break;
      case'flash':p.m=rnd(1.2,4);break;
      case'wind':p.m=rnd(1.4,2.4);p.s=rnd(18,40);p.vy=rnd(-6,6);break;
      case'meteor':{p.m=rnd(.7,1.1);p.vx=rnd(380,520);p.vy=p.vx*rnd(.4,.7);p.s=rnd(30,70);break;}
      case'bird':{
        const dir=Math.random()<.5?1:-1,sp=rnd(46,80)*(th==='waste'?.7:1);
        p.m=40;p.vx=dir*sp;p.vy=rnd(-14,14);p.s=th==='waste'?1.5:th==='hell'?1.3:1;p.c=BIRDC[th]||'#222';
        if(!pre){p.x=dir>0?this.cx-110:this.cx+W+110;p.y=this.cy+Math.random()*H;}
        if(th==='waste'||th==='hell'){p.vx*=.5;p.vy=Math.sin(p.ph)*20;}
        break;}
    }
    if(pre)p.l=Math.random()*p.m*(kind==='bird'?.0:1);
    this.ps.push(p);this.cnt[kind]=(this.cnt[kind]||0)+1;
  },
  setCfg(s){FXL.on=!!s.reduceFx;if(FXL.on){this.auto=false;this.lod=Math.min(this.lod,.5);}else if(!this.auto){this.auto=true;this.lod=1;}this.on=s.ambient!==false;this.wxOn=s.weather!==false;this.dnOn=s.dayNight!==false;this.dnDay=(s.dnDay===undefined?60:+s.dnDay)/100;this.dnLen=+s.dnLen||300;},
  /* day/night and weather are pure functions of game time + settings (deterministic, no storage) */
  state(theme,t,dt){
    const c=this.cfg;let nt=0;
    if(this.dnOn&&!c.nn){
      const d=clamp(this.dnDay,0,1);
      if(d<=.02)nt=1;else if(d<.98){const cc=d/2,u=(t/this.dnLen+cc*.25)%1,a=Math.abs(u-cc),dist=Math.min(a,1-a),tw=Math.min(.06,d/2,(1-d)/2);nt=sstep(d/2-tw,d/2+tw,dist);}
    }
    this.nt=nt;
    let I=0,k='';
    if(this.wxOn&&c.wx){
      const L=170,sl=Math.floor(t/L),h=hash(sl*7+theme.length*13+(theme.charCodeAt(0)|0),sl+3);
      if(h>.3){k=c.wx[Math.min(c.wx.length-1,Math.floor((h-.3)/.7*c.wx.length))];const m=t-sl*L-(8+hash(sl,11)*40),dur=60+hash(sl,5)*50;if(m>=0&&m<dur){const ph=m/dur;I=sstep(0,.2,ph)*(1-sstep(.75,1,ph));}}
    }
    this.evK=k;this.evI=I;
    this.wd=.35+.65*vnoise(t*.15,7.7)+(k==='sand'||k==='gale'||k==='wind'?1.2:k==='storm'?1:k==='rain'?.35:0)*I;
    if((k==='storm'||(k==='sand'&&theme==='redrock')||(k==='rain'&&theme==='namek'))&&I>.35&&this.lt<=0&&Math.random()<dt*(k==='storm'?.35:.14)){this.lt=1;this.dbl=false;}
    if(this.lt>0){this.lt-=dt*2.4;if(this.lt<.5&&this.lt>.4&&!this.dbl&&Math.random()<.6){this.lt=1;this.dbl=true;}}
  },
  update(g,dt,t,cx,cy,vw,vh,theme,p){
    if(this.g!==g||this.theme!==theme)this.reset(g,theme);
    const c=this.cfg;this.t=t;this.cx=cx;this.cy=cy;this.vw=vw;this.vh=vh;this.px=p?p.x:cx+vw/2;this.py=p?p.y:cy+vh/2;
    dt=Math.min(dt,.05);this.dt=dt;
    if(!c){this.nt=0;this.evI=0;this.evK='';return;}
    this.state(theme,t,dt);
    if(!this.on)return;
    if(this.auto&&dt>0){
      this.sm+=(dt-this.sm)*.05;
      if(this.sm>1/38){this.slow+=dt;this.fast=0;}else if(this.sm<1/54){this.fast+=dt;this.slow=0;}else{this.slow=0;this.fast=0;}
      if(this.slow>2.5&&this.lod>.25){this.lod*=.5;this.slow=0;this.sm=.016;}else if(this.fast>14&&this.lod<1){this.lod=Math.min(1,this.lod*2);this.fast=0;}
    }
    const I=this.evI,nt=this.nt;
    /* particles */
    const ak=clamp(vw*vh/504000,.5,2.4),ps=this.ps,lod=this.lod;
    const fill=pre=>{for(const [kind,n] of c.parts){
      let tg=n*ak*lod;
      if(kind==='dust'&&this.evK==='sand')tg*=1+I*3.5;
      else if(kind==='ash'&&this.evK==='ashfall')tg*=1+I*3.5;
      else if(kind==='ember'&&this.evK==='ashfall')tg*=1+I;
      else if(kind==='feather'&&this.evK==='feather')tg*=1+I*5;
      else if(kind==='meteor'&&this.evK==='meteor')tg*=1+I*6;
      else if(kind==='wind'&&this.evK==='gale')tg*=1+I*3;
      if(DAYK[kind])tg*=1-nt*(this.evK==='storm'?1:.92)*(kind==='bird'?1:.9);
      if(kind==='firefly')tg*=this.dnOn?nt:(theme==='namek'?1:0);
      if(this.evK==='storm'&&(kind==='butterfly'||kind==='seed'||kind==='bird'||kind==='firefly'))tg=0;
      tg=Math.round(tg);let cn=this.cnt[kind]||0,guard=0;
      while(cn<tg&&guard++<(pre?60:2)){this.spawn(kind,pre);cn++;}
    }};
    if(this.pre){this.pre=false;fill(true);}else fill(false);
    /* weather-only particles */
    {const k=this.evK,ex=(kind,tg)=>{tg=Math.round(tg*ak*lod);let cn=this.cnt[kind]||0,g2=0;while(cn<tg&&g2++<3){this.spawn(kind,false);cn++;}};
     if(k==='rain')ex('splash',34*I);else if(k==='storm')ex('splash',62*I);else if(k==='wind'&&theme==='arena')ex('dust',16*I);}
    /* footsteps */
    if(p&&p.mv&&dt>0){this.foot-=dt;if(this.foot<=0){this.foot=.17;
      const onW=c.wt&&Sea.wet(theme,p.x,p.y)>.012;
      this.puffAt(onW?'ring':(theme==='hell'?'ember':theme==='void'?'mote':'puff'),p.x+rnd(-3,3),p.y+4);}}
    const px=p?p.x:cx+vw/2,py=p?p.y:cy+vh/2,wd=this.wd;
    const x0=cx-150,x1=cx+vw+150,y0=cy-150,y1=cy+vh+150;
    for(let i=ps.length-1;i>=0;i--){
      const q=ps[i];q.l+=dt;let dead=q.l>=q.m;
      switch(q.k){
        case'butterfly':{q.a+=(Math.random()-.5)*7*dt;let sp=22;const dx=q.x-px,dy=q.y-py;if(dx*dx+dy*dy<4900){q.a=Math.atan2(dy,dx)+(Math.random()-.5);sp=80;}q.vx=Math.cos(q.a)*sp;q.vy=Math.sin(q.a)*sp*.6;break;}
        case'seed':q.vx=(10+q.s*5)*(.4+wd);q.vy=-5+Math.sin(q.l*2+q.ph)*8;break;
        case'leaf':q.vx=(8+q.s*5)*(.4+wd)+Math.sin(q.l*1.6+q.ph)*12;q.vy=12+q.s*5+Math.sin(q.l*2.2+q.ph)*6;break;
        case'firefly':q.a+=(Math.random()-.5)*5*dt;q.vx=Math.cos(q.a)*9;q.vy=Math.sin(q.a)*9-1;break;
        case'mote':q.vx=Math.sin(q.l*.8+q.ph)*8;break;
        case'dust':q.vx=(70+q.s*3)*(.35+wd);break;
        case'ember':q.vx+=Math.sin(q.l*5+q.ph)*30*dt;break;
        case'ash':q.vx=(8+q.s*4)*(.4+wd)+Math.sin(q.l+q.ph)*8;q.vy=9+q.s*3;break;
        case'wisp':q.vx+=Math.sin(q.l*.9+q.ph)*10*dt;q.vy+=Math.cos(q.l*.7+q.ph)*10*dt;break;
        case'feather':q.vx=Math.sin(q.l*1.4+q.ph)*16+8*wd;q.vy=12+q.s*2;break;
        case'confetti':q.vx=Math.sin(q.l*2+q.ph)*14;q.vy=26+q.s*6;break;
        case'wind':q.vx=(220+q.s*6)*(.4+wd*.8);break;
        case'smoke':q.vx+=wd*10*dt;q.s+=dt*5;break;
        case'puff':q.s+=dt*9;break;
        case'ring':q.s+=dt*34;break;
        case'splash':q.s+=dt*36;break;
        case'bird':if(q.s>1.2)q.vy=Math.sin(q.l*.7+q.ph)*18;break;
        case'petal':q.vx=(8+q.s*4)*(.4+wd)+Math.sin(q.l*1.5+q.ph)*14;q.vy=10+q.s*5+Math.sin(q.l*2.4+q.ph)*7;break;
        case'tumble':q.vy=Math.sin(q.l*5+q.ph)*22;break;
        case'soul':q.vx+=Math.sin(q.l*1.3+q.ph)*14*dt;break;
        case'shard':q.vx+=Math.sin(q.l*.6+q.ph)*5*dt;q.vy+=Math.cos(q.l*.5+q.ph)*5*dt;break;
        case'halo':q.vx=Math.sin(q.l*.9+q.ph)*6;break;
      }
      q.x+=q.vx*dt;q.y+=q.vy*dt;
      if(q.x<x0||q.x>x1||q.y<y0||q.y>y1)dead=true;
      if(dead){this.cnt[q.k]--;ps[i]=ps[ps.length-1];ps.pop();}
    }
    this.stepCrit(dt,t,px,py,c);
  },
  /* ---------- critters ---------- */
  stepCrit(dt,t,px,py,c){
    const cr=this.cr,SP={rabbit:46,frog:34,scorpion:30,weed:0,crab:40,lizard:52,pigeon:30,salamander:34};
    let tg=0;if(c.crit)for(const q of c.crit)tg+=q[1];tg=Math.round(tg*clamp(this.vw*this.vh/504000,.6,2)*Math.min(1,this.lod*1.5));
    if(cr.length<tg&&c.crit&&Math.random()<dt*2){
      let pk=c.crit[(Math.random()*c.crit.length)|0][0];
      const side=Math.random(),m=40;let x,y;
      if(side<.5){x=this.cx+Math.random()*this.vw;y=this.cy+Math.random()*this.vh;}else{x=this.cx-m+Math.random()*(this.vw+2*m);y=Math.random()<.5?this.cy-m:this.cy+this.vh+m;}
      cr.push({k:pk,x,y,vx:0,vy:0,w:Math.random()*2,st:0,ph:Math.random()*TAU,hop:0,fl:0});
    }
    const x0=this.cx-170,x1=this.cx+this.vw+170,y0=this.cy-170,y1=this.cy+this.vh+170;
    for(let i=cr.length-1;i>=0;i--){
      const q=cr[i],sp=SP[q.k],dx=q.x-px,dy=q.y-py,d2=dx*dx+dy*dy;
      if(q.k==='weed'){q.vx=22+this.wd*70;q.vy=Math.sin(q.x*.02+q.ph)*10;q.hop+=dt*q.vx*.1;}
      else if(d2<6400){const a=Math.atan2(dy,dx);q.fl=.7;q.vx=Math.cos(a)*sp*2.7;q.vy=Math.sin(a)*sp*2.7;q.st=1;q.w=.5;}
      else{
        q.fl=Math.max(0,q.fl-dt);q.w-=dt;
        if(q.w<=0){if(q.st){q.st=0;q.w=rnd(.8,3);q.vx=q.vy=0;}else{q.st=1;q.w=rnd(.6,1.8);const a=Math.random()*TAU;q.vx=Math.cos(a)*sp*.6;q.vy=Math.sin(a)*sp*.6*(q.k==='crab'?0:1);}}
      }
      if(q.st||q.k==='weed')q.hop+=dt*(q.fl>0?16:9);
      q.x+=q.vx*dt;q.y+=q.vy*dt;
      if(q.x<x0||q.x>x1||q.y<y0||q.y>y1){cr[i]=cr[cr.length-1];cr.pop();}
    }
  },
  drawCrit(ctx,q,t){
    const f=q.vx<0?-1:1,hop=Math.abs(Math.sin(q.hop)),X=q.x,Y=q.y,R=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(X+x*f-(f<0?w:0),Y+y,w,h);};
    ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(X,Y+1,5,2.2,0,0,TAU);ctx.fill();
    switch(q.k){
      case'rabbit':{const z=q.st?-hop*5:0;R(-5,z-6,9,5,'#f4f1ea');R(2,z-9,4,4,'#f4f1ea');R(3,z-13,1.6,5,'#f4f1ea');R(5,z-12,1.4,4,'#e8d8d8');R(-6,z-5,2.5,2.5,'#fff');R(4,z-8,1,1,'#222');break;}
      case'frog':{const z=q.st?-hop*4:0;R(-4,z-5,8,4,'#3fb86a');R(2,z-7,3,3,'#5ad88a');R(3,z-7,1,1,'#fff');R(-5,z-2,3,2,'#2f9a58');R(3,z-2,3,2,'#2f9a58');break;}
      case'scorpion':{const w=Math.sin(t*10+q.ph);R(-5,-4,9,4,'#6a3a1a');R(3,-5,3,3,'#8a4a22');R(-6,-8+w,2,5,'#6a3a1a');R(-6,-9+w,4,2,'#c0501c');R(5,-7,2,2,'#c0501c');R(-3,-1,1,2+w,'#4a2a10');R(1,-1,1,2-w,'#4a2a10');break;}
      case'weed':{ctx.save();ctx.translate(X,Y-5);ctx.rotate(q.hop);ctx.strokeStyle='#8a6a3a';ctx.lineWidth=1.2;ctx.beginPath();for(let i=0;i<5;i++){ctx.moveTo(-5,0);ctx.lineTo(Math.cos(i*1.26)*6,Math.sin(i*1.26)*6);}ctx.arc(0,0,5,0,TAU);ctx.stroke();ctx.restore();break;}
      case'crab':{const w=q.st?Math.sin(q.hop*1.5):0;R(-4,-4,8,4,'#e8503a');R(-3,-6,6,2,'#f06a4a');R(-7,-7+w,2,3,'#e8503a');R(5,-7-w,2,3,'#e8503a');R(-3,-8,1,2,'#222');R(2,-8,1,2,'#222');R(-5,0,1,2,'#c03a28');R(4,0,1,2,'#c03a28');break;}
      case'lizard':{const w=Math.sin(q.hop*1.4);R(-7,-3+w*.6,5,2,'#c8a860');R(-3,-4,8,3,'#d8b870');R(4,-4,3,3,'#e8c880');R(6,-4,1,1,'#222');R(-1,-1,1,2+w,'#a88840');R(2,-1,1,2-w,'#a88840');break;}
      case'pigeon':{const z=q.st?-hop*1.6:0;R(-4,z-5,8,4,'#9a9aa8');R(2,z-8,3,3,'#7a7a88');R(4,z-7,2,1,'#e8a838');R(-1,z-5,3,2,'#b8b8c8');R(-6,z-4,3,2,'#6a6a78');R(-1,z-1,1,2,'#e8a838');break;}
      case'salamander':{const w=Math.sin(q.hop*1.4);R(-7,-3+w*.6,5,2,'#ff5a1a');R(-3,-4,8,3,'#ff8a2a');R(4,-4,3,3,'#ffc23a');R(5,-4,1,1,'#fff');ctx.save();ctx.globalCompositeOperation='lighter';GLOW.at(ctx,X,Y-3,12,'#ff6a1a',.5);ctx.restore();break;}
    }
  },
  /* ---------- ground layer (below entities): cloud shadows, spotlights, critters, ripples, bird shadows ---------- */
  ground(ctx,t){
    const c=this.cfg;if(!this.on||!c)return;
    const cx=this.cx,cy=this.cy,vw=this.vw,vh=this.vh;
    if(c.shadow&&this.lod>=.5){
      const f=1,cell=420,wdx=14+this.wd*18,sp=GLOW.spr('#000000');
      ctx.globalAlpha=.1;
      for(let gx=Math.floor((cx-wdx*t)/cell)-1;gx<=Math.floor((cx+vw-wdx*t)/cell)+1;gx++)for(let gy=Math.floor(cy/cell)-1;gy<=Math.floor((cy+vh)/cell)+1;gy++){
        const h=hash(gx*3+4,gy*5+1);if(h>.5)continue;
        const x=(gx+hash(gx,gy+3))*cell+wdx*t,y=(gy+hash(gx+8,gy))*cell,r=170+h*300;
        ctx.drawImage(sp,x-r*1.4,y-r*.8,r*2.8,r*1.6);
      }
      ctx.globalAlpha=1;
    }
    if(c.spot){
      ctx.save();ctx.globalCompositeOperation='lighter';
      for(let i=0;i<3;i++){const a=t*.35+i*2.1,x=cx+vw/2+Math.cos(a)*vw*.38,y=cy+vh/2+Math.sin(a*1.3+i)*vh*.34,r=130+30*Math.sin(t+i);
        ctx.globalAlpha=.16+.22*this.nt;ctx.drawImage(GLOW.spr(i===1?'#ffd9a0':i===2?'#a0d8ff':'#fff2c0'),x-r,y-r,r*2,r*2);}
      ctx.restore();
    }
    for(const q of this.cr)this.drawCrit(ctx,q,t);
    for(const q of this.ps){
      if(q.k==='splash'){const a=1-q.l/q.m;ctx.strokeStyle='rgba(225,236,255,'+(.55*a)+')';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(q.x,q.y,q.s,q.s*.45,0,0,TAU);ctx.stroke();}
      else if(q.k==='ring'){const a=1-q.l/q.m;ctx.strokeStyle='rgba(255,255,255,'+(.5*a)+')';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(q.x,q.y,q.s,q.s*.45,0,0,TAU);ctx.stroke();}
      else if(q.k==='bird'){const al=q.s>1.2?46:34;ctx.fillStyle='rgba(0,0,0,.16)';ctx.beginPath();ctx.ellipse(q.x+al*.5,q.y+al*.7,5*q.s,2*q.s,0,0,TAU);ctx.fill();}
      else if(q.k==='butterfly'){ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(q.x-2,q.y+9,4,1.5);}
    }
  },
  /* ---------- sky show (visual only): flocks of gulls in a V crossing the screen, and the golden Flying Nimbus every ~80 s. Born on the Snake Way, now shared by the open-sky maps ---------- */
  flocks(c,cx,cy,vw,vh,t,n,al,seed){
    c.save();c.lineCap='round';c.lineJoin='round';
    for(let f=0;f<n;f++){
      const dur=70+f*23,u=((t/dur+f*.37+(seed||0))%1),dir=f&1?-1:1,sx=cx+vw*(dir>0?-.1+1.2*u:1.1-1.2*u)-cx*.08,sy=cy+vh*(.14+.22*f)+Math.sin(t*.4+f)*14;
      for(let i=0;i<6+f;i++){
        const bx=sx-dir*(Math.abs(i-2.5)*20+((i&1)?6:0)),by=sy+(i-2.5)*9*(i&1?1:-1)*.7+Math.abs(i-2.5)*6,fl=Math.sin(t*9+i*1.3+f)*4;
        c.strokeStyle='rgba(255,255,255,'+(.85*al).toFixed(3)+')';c.lineWidth=2;c.beginPath();c.moveTo(bx-7,by-fl);c.quadraticCurveTo(bx-3,by-4-fl*.4,bx,by);c.quadraticCurveTo(bx+3,by-4-fl*.4,bx+7,by-fl);c.stroke();
      }
    }
    c.restore();
  },
  nimbus(c,cx,cy,vw,vh,t,al,seed){
    const per=80,u=((t+20+(seed||0)*per)%per)/per;if(u>=.3)return;
    const k=u/.3,x=cx+vw*(-.15+1.3*k),y=cy+vh*.3+Math.sin(k*6)*18,fade=Math.min(1,k*8,(1-k)*8)*al;
    c.save();c.globalAlpha=fade;c.globalCompositeOperation='lighter';
    for(let i=0;i<8;i++){const r=(i/8);GLOW.at(c,x-r*70,y+6+Math.sin(t*6+i)*3,8*(1-r),'#ffe26a',.6*(1-r));}
    c.globalCompositeOperation='source-over';
    c.fillStyle='#ffe58a';for(const [dx,dy,r] of[[-12,2,9],[0,-3,12],[13,1,10],[2,6,10]]){c.beginPath();c.arc(x+dx,y+dy,r,0,TAU);c.fill();}
    c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.arc(x-3,y-6,6,0,TAU);c.fill();
    c.restore();
  },
  /* ---------- air layer (above entities) ---------- */
  drawP(ctx,q,t){
    const env=clamp(Math.min(q.l/.7,(q.m-q.l)/.9),0,1),x=q.x,y=q.y;
    switch(q.k){
      case'butterfly':{const w=Math.abs(Math.sin(t*18+q.ph))*3.2+.4;ctx.fillStyle=q.c;ctx.fillRect(x-w,y-1,w,3);ctx.fillRect(x,y-1,w,3);ctx.fillStyle='#2a2a30';ctx.fillRect(x-.5,y-1,1,4);break;}
      case'petal':{const w=2.2*Math.abs(Math.cos(q.l*3+q.ph))+.7;ctx.globalAlpha=env;ctx.fillStyle=q.c;ctx.beginPath();ctx.ellipse(x,y,w*q.s*.9,1.1*q.s,q.l*1.2+q.ph,0,TAU);ctx.fill();ctx.globalAlpha=1;break;}
      case'tumble':{ctx.save();ctx.translate(x,y);ctx.rotate(q.l*(q.vx>0?4.2:-4.2));ctx.globalAlpha=env*.85;ctx.strokeStyle=q.c;ctx.lineWidth=1.3;const r=q.s;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.moveTo(-r,0);ctx.lineTo(r,0);ctx.moveTo(0,-r);ctx.lineTo(0,r);ctx.moveTo(-r*.7,-r*.7);ctx.lineTo(r*.7,r*.7);ctx.moveTo(r*.7,-r*.7);ctx.lineTo(-r*.7,r*.7);ctx.stroke();ctx.restore();ctx.globalAlpha=1;break;}
      case'cloudlet':{ctx.globalAlpha=.3*env;ctx.fillStyle='#ffffff';const s=q.s;for(const [dx,dy,r] of[[0,0,.5],[.5,.1,.42],[-.5,.1,.4],[.15,-.25,.38]]){ctx.beginPath();ctx.arc(x+dx*s,y+dy*s,r*s,0,TAU);ctx.fill();}ctx.globalAlpha=1;break;}
      case'seed':ctx.globalAlpha=.8*env;ctx.fillStyle='#fff';ctx.fillRect(x,y,q.s,q.s);ctx.fillRect(x-q.s*2,y+q.s*.4,q.s*2,.8);ctx.globalAlpha=1;break;
      case'leaf':{const w=3*Math.abs(Math.cos(q.l*3+q.ph))+.6;ctx.globalAlpha=env;ctx.fillStyle=q.c;ctx.fillRect(x,y,w*q.s,2.2*q.s);ctx.globalAlpha=1;break;}
      case'dust':ctx.globalAlpha=.3*env;ctx.strokeStyle=q.c;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-q.s,y-q.vy*.04);ctx.stroke();ctx.globalAlpha=1;break;
      case'wind':ctx.globalAlpha=.4*env;ctx.strokeStyle='#fff';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-q.s,y);ctx.stroke();ctx.globalAlpha=1;break;
      case'ash':ctx.globalAlpha=.55*env;ctx.fillStyle=q.c;ctx.fillRect(x,y,q.s,q.s*.8);ctx.globalAlpha=1;break;
      case'feather':{const w=q.s*Math.abs(Math.cos(q.l*2.2+q.ph))+.8;ctx.globalAlpha=.85*env;ctx.fillStyle='#fff';ctx.fillRect(x,y,w,1.6);ctx.globalAlpha=1;break;}
      case'confetti':{const w=3*Math.abs(Math.cos(q.l*8+q.ph))+.8;ctx.globalAlpha=env;ctx.fillStyle=q.c;ctx.fillRect(x,y,w,q.s);ctx.globalAlpha=1;break;}
      case'smoke':{const a=(1-q.l/q.m)*.4;ctx.globalAlpha=a;ctx.fillStyle=q.c;ctx.beginPath();ctx.arc(x,y,q.s,0,TAU);ctx.fill();ctx.globalAlpha=1;break;}
      case'puff':ctx.globalAlpha=.35*(1-q.l/q.m);ctx.fillStyle=q.c;ctx.beginPath();ctx.arc(x,y,q.s,0,TAU);ctx.fill();ctx.globalAlpha=1;break;
      case'bird':{
        const f=Math.sin(t*(q.s>1.2?7:13)+q.ph),s=q.s,fl=q.vx<0?-1:1;
        ctx.fillStyle=q.c;ctx.fillRect(x-1*s,y-1.5*s,2*s,4*s);
        ctx.fillRect(x-6*s,y-f*2.4*s-1,5*s,1.5*s);ctx.fillRect(x+1*s,y-f*2.4*s-1,5*s,1.5*s);
        ctx.fillRect(x-1.5*s*fl,y+2*s,1.5*s,2*s);break;}
    }
  },
  drawAdd(ctx,q,t){
    const env=clamp(Math.min(q.l/.7,(q.m-q.l)/.9),0,1),x=q.x,y=q.y;
    switch(q.k){
      case'firefly':{const pu=.5+.5*Math.sin(t*3+q.ph*4);ctx.globalAlpha=env*(.35+.65*pu);ctx.drawImage(GLOW.spr(q.c),x-9,y-9,18,18);ctx.globalAlpha=env;ctx.fillStyle='#fff';ctx.fillRect(x-.7,y-.7,1.6,1.6);break;}
      case'mote':{const r=q.s*3;ctx.globalAlpha=.7*env;ctx.drawImage(GLOW.spr(q.c),x-r,y-r,r*2,r*2);break;}
      case'sparkle':{const k=Math.sin(Math.min(1,q.l/q.m)*Math.PI),s=q.s*k;ctx.globalAlpha=.9*k;ctx.fillStyle=q.c;ctx.fillRect(x-s,y-.5,s*2,1);ctx.fillRect(x-.5,y-s,1,s*2);break;}
      case'ember':{const fl=.6+.4*Math.sin(q.l*30+q.ph),a=clamp(1-q.l/q.m,0,1);ctx.globalAlpha=a*fl;ctx.drawImage(GLOW.spr(q.c),x-q.s*4,y-q.s*4,q.s*8,q.s*8);ctx.globalAlpha=a;ctx.fillStyle='#fff3c0';ctx.fillRect(x-.7,y-.7,1.4,1.4);break;}
      case'soul':{const pu=.6+.4*Math.sin(t*3+q.ph),s=q.s;ctx.globalAlpha=env*.55*pu;ctx.drawImage(GLOW.spr(q.c),x-s*4,y-s*4,s*8,s*8);ctx.globalAlpha=env*.8;ctx.fillStyle='#f0fcff';ctx.beginPath();ctx.ellipse(x,y,s*.7,s,0,0,TAU);ctx.fill();ctx.strokeStyle=q.c;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x,y+s);for(let k=1;k<=4;k++)ctx.lineTo(x+Math.sin(t*5+k+q.ph)*s*.5,y+s+k*s*.9);ctx.stroke();break;}
      case'shard':{ctx.save();ctx.translate(x,y);ctx.rotate(q.l*.6+q.ph);const s=q.s,pu=.55+.45*Math.sin(t*2.2+q.ph);ctx.globalAlpha=env*.9*pu;ctx.fillStyle=q.c;ctx.beginPath();ctx.moveTo(0,-s*1.6);ctx.lineTo(s*.7,0);ctx.lineTo(0,s*1.6);ctx.lineTo(-s*.7,0);ctx.closePath();ctx.fill();ctx.globalAlpha=env*.5*pu;ctx.drawImage(GLOW.spr(q.c),-s*3,-s*3,s*6,s*6);ctx.restore();break;}
      case'halo':{const k=Math.min(1,q.l/q.m);ctx.globalAlpha=env*.8*(1-k*.4);ctx.strokeStyle='#ffe58a';ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(x,y,q.s,q.s*.34,0,0,TAU);ctx.stroke();ctx.strokeStyle='#ffffff';ctx.lineWidth=.7;ctx.stroke();break;}
      case'wisp':{const pu=.6+.4*Math.sin(t*4+q.ph);ctx.globalAlpha=env*.7*pu;ctx.drawImage(GLOW.spr(q.c),x-12,y-12,24,24);ctx.globalAlpha=env;ctx.fillStyle='#e8fbff';ctx.fillRect(x-1,y-2.5,2,4);break;}
      case'flash':{if(q.l>.32)break;const k=1-q.l/.32;ctx.globalAlpha=k;ctx.drawImage(GLOW.spr('#ffffff'),x-16,y-16,32,32);ctx.fillStyle='#fff';ctx.fillRect(x-14*k,y-.6,28*k,1.2);ctx.fillRect(x-.6,y-14*k,1.2,28*k);break;}
      case'meteor':{const a=1-q.l/q.m,L=q.s,nx=q.vx/Math.hypot(q.vx,q.vy),ny=q.vy/Math.hypot(q.vx,q.vy);
        const gr=ctx.createLinearGradient(x,y,x-nx*L,y-ny*L);gr.addColorStop(0,'rgba(255,255,255,'+a+')');gr.addColorStop(1,'rgba(106,160,255,0)');
        ctx.globalAlpha=1;ctx.strokeStyle=gr;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-nx*L,y-ny*L);ctx.stroke();break;}
    }
  },
  air(ctx,t){
    const c=this.cfg;if(!this.on||!c)return;
    const ps=this.ps;
    for(let i=0;i<ps.length;i++){const q=ps[i];if(!ADDK[q.k]&&q.k!=='ring'&&q.k!=='splash')this.drawP(ctx,q,t);}
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(let i=0;i<ps.length;i++){const q=ps[i];if(ADDK[q.k])this.drawAdd(ctx,q,t);}
    ctx.restore();ctx.globalAlpha=1;
    if(this.nt>.15){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.16*this.nt;ctx.drawImage(GLOW.spr('#a8c8ff'),this.px-190,this.py-210,380,380);ctx.restore();ctx.globalAlpha=1;}
    /* parallax layers moving faster than the ground (cloud decks / mist) */
    if(this.lod<.5)return;
    const cx=this.cx,cy=this.cy,vw=this.vw,vh=this.vh;
    if(c.flock&&this.evK!=='storm')this.flocks(ctx,cx,cy,vw,vh,t,c.flock,1-this.nt*.92,(this.theme.length*.173)%1);   /* gulls crossing the sky */
    if(c.nimbus)this.nimbus(ctx,cx,cy,vw,vh,t,1-this.nt*.55,(this.theme.charCodeAt(0)%7)/9);
    const lay=(f,cell,dens,wdx,col,al,rmin,rmax)=>{
      const ox=cx*f,oy=cy*f,sx=cx-ox,sy=cy-oy,sp=GLOW.spr(col);ctx.globalAlpha=al;
      for(let gx=Math.floor((ox-wdx*t)/cell)-1;gx<=Math.floor((ox+vw-wdx*t)/cell)+1;gx++)for(let gy=Math.floor(oy/cell)-1;gy<=Math.floor((oy+vh)/cell)+1;gy++){
        const h=hash(gx*11+3,gy*13+7);if(h>dens)continue;
        const r=rmin+hash(gx+2,gy+5)*(rmax-rmin),x=sx+(gx+hash(gx,gy+9))*cell+wdx*t,y=sy+(gy+hash(gx+6,gy))*cell;
        ctx.drawImage(sp,x-r*1.3,y-r*.7,r*2.6,r*1.4);
      }
      ctx.globalAlpha=1;
    };
    const fm=this.wxOn&&this.evK==='fog'?this.evI:0;
    if(c.mist)lay(1.18,520,.4,10+this.wd*14,c.mist[0],c.mist[1]+fm*.3,200,380);
    if(fm>0.02)lay(1.1,380,.6,12,this.theme==='namek'?'#bfffe6':'#eef4f4',.34*fm,240,420);
    if(c.hi){lay(1.32,380,.5,22+this.wd*30,'#ffffff',.55,150,300);lay(1.15,300,.3,15+this.wd*20,'#ffffff',.3,110,200);}
    if(this.theme==='hell')lay(1.2,460,.35,12,'#3a0a08',.22,200,360);
  },
  /* ---------- screen space: light rays, dawn/dusk, night, weather ---------- */
  screen(ctx,W,H,U,t){
    const c=this.cfg;if(!c)return;
    const nt=this.nt,I=this.wxOn?this.evI:0,k=this.evK,th=this.theme,lod=this.lod;
    if(this.on&&c.rays&&lod>=.5&&nt<.85){
      ctx.save();ctx.globalCompositeOperation='lighter';
      for(let i=0;i<3;i++){const x0=W*(.05+.32*i)+Math.sin(t*.2+i*1.7)*30*U,w=W*.09,a=(.03+.022*Math.sin(t*.5+i*2))*(1-nt)*(k==='storm'||k==='rain'||k==='fog'?1-I*.8:1);
        ctx.fillStyle='rgba(255,244,200,'+a+')';ctx.beginPath();ctx.moveTo(x0,0);ctx.lineTo(x0+w,0);ctx.lineTo(x0+w+W*.3,H);ctx.lineTo(x0+W*.3-w*.4,H);ctx.closePath();ctx.fill();}
      ctx.restore();
    }
    /* dawn / dusk glow (peaks halfway through the day<->night transition) */
    if(this.dnOn&&c.grade&&nt>.02&&nt<.98){const w=1-Math.abs(nt*2-1),a=w*w*.17;ctx.fillStyle='rgba('+c.grade[0]+','+c.grade[1]+','+c.grade[2]+','+a+')';ctx.fillRect(0,0,W,H);}
    /* night: blue tint + dark edges with a lit area around the player */
    if(nt>.01&&NC[th]){
      const n=NC[th];
      ctx.fillStyle='rgba('+n[0]+','+n[1]+','+n[2]+','+(.3*nt)+')';ctx.fillRect(0,0,W,H);
      const key=W+'x'+H+th;
      if(!this.nv||this.nv.key!==key){const r=Math.hypot(W,H)/2,gr=ctx.createRadialGradient(W/2,H*.5,Math.min(W,H)*.16,W/2,H*.5,r);
        gr.addColorStop(0,'rgba('+(n[0]*.3|0)+','+(n[1]*.3|0)+','+(n[2]*.3|0)+',0)');gr.addColorStop(.55,'rgba('+(n[0]*.3|0)+','+(n[1]*.3|0)+','+(n[2]*.3|0)+',.3)');gr.addColorStop(1,'rgba('+(n[0]*.3|0)+','+(n[1]*.3|0)+','+(n[2]*.3|0)+',.55)');this.nv={g:gr,key};}
      ctx.globalAlpha=nt;ctx.fillStyle=this.nv.g;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
    }
    if(this.on&&c.heat){
      if(!this.hv||this.hv.w!==W||this.hv.h!==H){const r=Math.hypot(W,H)/2,gr=ctx.createRadialGradient(W/2,H/2,r*.5,W/2,H/2,r);gr.addColorStop(0,'rgba(255,60,10,0)');gr.addColorStop(1,'rgba(255,60,10,.5)');this.hv={g:gr,w:W,h:H};}
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.3+.2*Math.sin(t*1.7);ctx.fillStyle=this.hv.g;ctx.fillRect(0,0,W,H);ctx.restore();
    }
    if(I>.01){
      if(k==='rain'||k==='storm'){
        const st=k==='storm',tint=th==='namek'?'159,232,208':th==='redrock'?'236,176,150':'190,215,255';
        ctx.fillStyle=th==='redrock'?'rgba(40,12,8,'+((st?.32:.2)*I)+')':'rgba(8,18,36,'+((st?.34:.2)*I)+')';ctx.fillRect(0,0,W,H);
        const n=Math.floor((st?210:120)*lod*I*clamp(W*H/(1280*720),.6,2)),sl=st?9:5;
        ctx.strokeStyle='rgba('+tint+','+(st?.55:.5)+')';ctx.lineWidth=Math.max(1,U*(st?1.3:1.1));ctx.beginPath();
        for(let i=0;i<n;i++){const sp=.8+hash(i,9)*.5,x=(((hash(i,3)*W-t*(st?260:140)*U*sp)%W)+W)%W,y=(hash(i,5)*H+t*(st?1300:1000)*U*sp)%H;ctx.moveTo(x,y);ctx.lineTo(x-sl*U,y+(st?26:22)*U);}
        ctx.stroke();
      }else if(k==='sand'){
        const col=th==='waste'?'196,160,96':'200,110,60';
        ctx.fillStyle='rgba('+col+','+(.3*I)+')';ctx.fillRect(0,0,W,H);
        const n=Math.floor(90*lod*I);ctx.strokeStyle='rgba(240,214,170,.45)';ctx.lineWidth=Math.max(1,U);ctx.beginPath();
        for(let i=0;i<n;i++){const sp=.7+hash(i,9)*.7,x=(((hash(i,3)*W-t*1500*U*sp)%W)+W)%W,y=hash(i,5)*H+Math.sin(t*3+i)*6*U;ctx.moveTo(x,y);ctx.lineTo(x+(26+hash(i,2)*30)*U,y);}
        ctx.stroke();
      }else if(k==='ashfall'){ctx.fillStyle='rgba(30,4,2,'+(.22*I)+')';ctx.fillRect(0,0,W,H);}
      else if(k==='gale'||k==='wind'){
        if(k==='wind'){ctx.fillStyle='rgba(190,170,130,'+(.14*I)+')';ctx.fillRect(0,0,W,H);}
        const n=Math.floor(50*lod*I);ctx.strokeStyle=k==='wind'?'rgba(235,222,196,.4)':'rgba(255,255,255,.4)';ctx.lineWidth=Math.max(1,U);ctx.beginPath();
        for(let i=0;i<n;i++){const sp=.8+hash(i,9),x=(((hash(i,3)*W-t*1700*U*sp)%W)+W)%W,y=hash(i,5)*H;ctx.moveTo(x,y);ctx.lineTo(x+(40+hash(i,2)*60)*U,y);}
        ctx.stroke();
      }else if(k==='fog'){ctx.fillStyle=th==='namek'?'rgba(170,235,210,'+(.26*I)+')':'rgba(214,226,232,'+(.3*I)+')';ctx.fillRect(0,0,W,H);}
    }
    if(this.lt>0){ctx.fillStyle='rgba(235,240,255,'+(this.lt*this.lt*.38)+')';ctx.fillRect(0,0,W,H);}
  }
};
