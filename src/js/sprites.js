'use strict';
/* ====== Pixel sprite factory: art-unit painters -> outlined, shaded, cached canvases ====== */
const hexA=(h,a)=>{const n=parseInt(h.slice(1,7),16);return 'rgba('+(n>>16)+','+((n>>8)&255)+','+(n&255)+','+a+')';};
const shadeHex=(h,a)=>{
  const n=parseInt(h.slice(1,7),16);let r=n>>16,g=(n>>8)&255,b=n&255;const f=a<0?0:255,t=Math.abs(a);
  r=Math.round(r+(f-r)*t);g=Math.round(g+(f-g)*t);b=Math.round(b+(f-b)*t);
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
};
const GLOW={
  cache:new Map(),
  spr(col){
    let c=this.cache.get(col);
    if(!c){
      c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
      const gr=g.createRadialGradient(32,32,0,32,32,32);
      gr.addColorStop(0,hexA(col,.95));gr.addColorStop(.35,hexA(col,.4));gr.addColorStop(1,hexA(col,0));
      g.fillStyle=gr;g.fillRect(0,0,64,64);this.cache.set(col,c);
    }
    return c;
  },
  at(ctx,x,y,r,col,alpha){
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha===undefined?1:alpha;
    ctx.drawImage(this.spr(col),x-r,y-r,r*2,r*2);ctx.restore();
  }
};

class Sprites{
  static paint(W,H,ox,oy,draw){
    const S=Sprites.S,pad=Math.round(S*.6);
    const c=document.createElement('canvas');c.width=W*S;c.height=H*S;const g=c.getContext('2d');
    const R=(ax,ay,aw,ah,col)=>{g.fillStyle=col;g.fillRect(Math.round((ax+ox)*S),Math.round((ay+oy)*S),Math.max(1,Math.round(aw*S)),Math.max(1,Math.round(ah*S)));};
    draw(R);
    const o=document.createElement('canvas');o.width=c.width+pad*2;o.height=c.height+pad*2;const og=o.getContext('2d');
    const sil=document.createElement('canvas');sil.width=c.width;sil.height=c.height;const sg=sil.getContext('2d');
    sg.drawImage(c,0,0);sg.globalCompositeOperation='source-in';sg.fillStyle='#0a0f1c';sg.fillRect(0,0,sil.width,sil.height);
    for(let dx=-pad;dx<=pad;dx++)for(let dy=-pad;dy<=pad;dy++)if(dx||dy)og.drawImage(sil,pad+dx,pad+dy);
    og.drawImage(c,pad,pad);
    og.globalCompositeOperation='source-atop';
    const gr=og.createLinearGradient(0,0,o.width,o.height);
    gr.addColorStop(0,'rgba(255,255,255,.16)');gr.addColorStop(.5,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(0,0,40,.30)');
    og.fillStyle=gr;og.fillRect(0,0,o.width,o.height);
    return{c:o,ox:ox*S+pad,oy:oy*S+pad};
  }
  static flashOf(sp){
    const c=document.createElement('canvas');c.width=sp.c.width;c.height=sp.c.height;const g=c.getContext('2d');
    g.drawImage(sp.c,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='#ffffff';g.fillRect(0,0,c.width,c.height);
    return{c,ox:sp.ox,oy:sp.oy,s:sp.s,px:sp.px};
  }
  static circ(R,cx,cy,r,col){for(let y=-r;y<=r;y++){const hw=Math.sqrt(r*r-y*y);R(cx-hw,cy+y,hw*2,1,col);}}

  static build(kind,sp,f){
    const S=Sprites.hdS(sp.u||1.6),P=(W,H,ox,oy,fn)=>Sprites.paintHD(W,H,ox,oy,fn,S),HD=Sprites.hd;
    switch(kind){
      case'human':return P(36,48,18,47,R=>Sprites.humanArt(R,sp.cfg,f,null,true));
      case'pdragon':return P(30,24,15,23,R=>Sprites.pdragonArt(R,f));
      case'pmonkey':return P(24,26,12,25,R=>Sprites.pmonkeyArt(R,f));
      case'saiba':return P(26,34,13,33,R=>HD.saiba(R,sp.pal,f,sp.robot));
      case'celljr':return P(24,34,12,33,R=>HD.celljr(R,f));
      case'beast':return sp.v==='trex'?P(60,46,30,45,R=>HD.trex(R,f,sp.pal)):sp.v==='raptor'?P(46,32,23,31,R=>HD.raptor(R,f,sp.pal)):P(52,32,26,31,R=>HD.wolf(R,f,sp.pal,sp.eye,sp.mech));
      case'ghost':return P(24,34,12,33,R=>HD.ghost(R,f));
      case'drone':return P(30,32,15,29,R=>HD.drone(R,f));
      case'golem':return P(42,52,21,51,R=>HD.golem(R,sp.pal,f));
      case'blob':return P(26,26,13,24,R=>HD.blob(R,sp.pal,f));
      case'orb':return P(30,30,15,28,R=>HD.orb(R,f));
      case'ape':return P(72,56,36,55,R=>HD.ape(R,f));
      case'bird':return P(44,34,22,28,R=>HD.bird(R,sp.pal,f));
    }
    return Sprites.paint(10,10,5,9,R=>R(-4,-8,8,8,'#f0f'));
  }
  static forSp(sp,frame,flash){
    const c=sp._c||(sp._c={}),k=frame*2+(flash?1:0);
    if(c[k])return c[k];
    const base=c[frame*2]||(c[frame*2]=Sprites.build(sp.k,sp,frame));
    return flash?(c[k]=Sprites.flashOf(base)):base;
  }
  static player(key,cfg,frame,flash,ex){
    const m=Sprites.pcache||(Sprites.pcache=new Map()),k=key+'|'+frame+(ex?'|'+ex:'')+(flash?'f':'');
    let s=m.get(k);
    if(!s){
      if(flash){const b=Sprites.player(key,cfg,frame,false,ex);s=Sprites.flashOf(b);}
      else{
        /* an imported sprite sheet (assets/sprites) wins; otherwise the HD procedural painter */
        const id=Sprites.sheetFor&&Sprites.sheetFor(key);
        s=(id&&Sprites.sheetFrame(id,frame))||Sprites.paintHD(36,48,18,47,R=>Sprites.humanArt(R,cfg,frame,ex,true),Sprites.PS);
      }
      m.set(k,s);
    }
    return s;
  }
  /* multiplier callers apply on top of (u / Sprites.S) because sprites can be painted at different pixel densities */
  static pk(sp){return Sprites.S/(sp.s||Sprites.S);}

  /* frames: 0 idle, 1-4 walk cycle, 5 attack wind-up, 6 attack thrust */
  static pose(f){
    const W=[null,[1.6,0,1,0],[0,0,0,-.6],[0,1.6,-1,0],[0,0,0,-.6]];
    if(f>=1&&f<=4){const w=W[f];return{l:w[0],r:w[1],sw:w[2],bob:w[3],atk:0};}
    return{l:0,r:0,sw:0,bob:0,atk:f===5?1:f===6?2:0};
  }
  /* pet art: mini Shenron and Bubbles the monkey */
  static pdragonArt(R,f){
    const g='#4fbf5a',gl='#9aef9a',gd='#2f8a3a',bel='#f0e48a',w=Math.sin(f*1.7)*1.1;
    R(-13+w,-9,6,4,g);R(-16+w,-11,4,3,g);R(-17+w,-12,2,2,gd);
    R(-11,-8,20,6,g);R(-11,-8,20,1.6,gl);R(-9,-4,16,2.2,bel);
    R(-7,-2,3,3,gd);R(2,-2,3,3,gd);
    R(5,-14,9,9,g);R(5,-14,9,2,gl);R(12,-11,5,4,g);R(12,-8,4,1.2,bel);
    R(8,-12,2.4,2.4,'#fff');R(9,-11.4,1.2,1.4,'#c22');
    R(6,-17,1.6,4,'#f0e0a0');R(10,-17,1.6,4,'#f0e0a0');
    R(16,-13,5,.9,'#f0e0a0');R(16,-10.5,5,.9,'#f0e0a0');
    for(let i=0;i<4;i++)R(-9+i*4,-9.4+(i%2)*.4,1.4,1.6,gd);
  }
  static pmonkeyArt(R,f){
    const b='#6a4a2a',bl='#8a6a42',fc='#e0bc90',sw=Sprites.pose(f).sw;
    R(5,-8+sw*.3,7,1.6,b);R(10,-11+sw*.3,2,3.4,b);
    R(-4.4,-11,8.8,8,b);R(-4.4,-11,2,8,bl);R(-2.4,-9,4.8,5,fc);
    R(-3.4,-4,2.6,4,b);R(1,-4,2.6,4,b);R(-3.8,-1.4,3.4,1.4,fc);R(.8,-1.4,3.4,1.4,fc);
    R(-7.4,-10+sw*.5,3,5.6,b);R(4.4,-10-sw*.5,3,5.6,b);
    R(-6,-21,12,10,b);R(-6,-21,12,2.4,bl);
    R(-8.4,-18,3,4.6,b);R(5.4,-18,3,4.6,b);R(-7.6,-17,1.6,2.8,fc);R(6,-17,1.6,2.8,fc);
    R(-4.4,-18.6,8.8,7,fc);R(-3.4,-16.2,1.6,1.9,'#111');R(1.8,-16.2,1.6,1.9,'#111');R(-2.8,-15.8,.6,.6,'#fff');R(2.4,-15.8,.6,.6,'#fff');
    R(-1.6,-13.4,3.2,2,'#c8987a');R(-1,-12.6,2,.8,'#7a3a2a');R(-.6,-14.2,1.2,.8,'#7a5a42');
  }
  static humanArt(R0,c,f,ex,hq){
    const sh=shadeHex,ps=Sprites.pose(f),wd=c.wide?2.4:0,by=ps.bob;
    const R=(x,y,w,h,col)=>R0(x,y+by,w,h,col),RB=R0;           /* RB: no body bob (feet stay planted) */
    const skin=c.skin,skD=sh(skin,-.2),skL=sh(skin,.18),out=c.outfit,outD=sh(out,-.25),outL=sh(out,.18),lg=c.legs||out,lgD=sh(lg,-.26),bt=c.boot||'#222';
    const lean=ps.atk===1?-1:ps.atk===2?1.2:0;                     /* body leans back / forward when attacking */
    const X=x=>x+lean*.5;
    if(c.wings){R(-15-wd,-30,7,17,'#262626');R(8+wd,-30,7,17,'#262626');R(-14,-28,3,13,'#3a3a3a');R(11,-28,3,13,'#3a3a3a');}
    if(c.cape){R(-9-wd,-22,18+2*wd,21,c.cape);R(-9-wd,-22,3.4,21,sh(c.cape,-.2));R(5+wd,-22,3,21,sh(c.cape,-.1));}
    if(c.gsword){R(-17,-54,4,46,'#b8c8e8');R(-17,-54,1.4,46,'#ffffff');R(-20,-11,10,3,'#f2c230');R(-16.6,-9,4.8,6,'#5a1a1a');R(-17,-57,4,3,'#e8f0ff');}
    if(c.sword){R(-11,-40,2,26,'#dfe9f2');R(-11,-40,.8,26,'#fff');R(-13,-15,6,2,'#8a5a2a');R(-11.4,-13.5,2.8,3,'#5a3a1a');}
    /* legs + boots: short chibi legs, walking cycle */
    for(let s2=0;s2<2;s2++){
      const x=s2?.8+wd/2:-4.6-wd/2,r=s2?ps.r:ps.l,ex=ps.atk===2?(s2?1.2:-1):ps.atk===1?(s2?-.6:.8):0;
      RB(x+ex,-6.4-r,3.8,4.4,lg);RB(x+ex+2.6,-6.4-r,1.2,4.4,lgD);
      RB(x+ex-.5,-3.2-r,4.8,3.2,bt);RB(x+ex-.5,-3.2-r,4.8,1,c.bootTop||sh(bt,.32));RB(x+ex+3.6,-2.2-r,.9,2.2,sh(bt,-.32));RB(x+ex-.2,-.8-r,4.4,.8,sh(bt,-.2));
      if(hq){RB(x+ex+.4,-6.2-r,.7,2.6,sh(lg,.24));RB(x+ex+.2,-4.2-r,3.4,.5,lgD);RB(x+ex+.6,-1.6-r,.8,.6,sh(bt,.5));RB(x+ex+2.4,-1.6-r,.8,.6,sh(bt,.5));}
    }
    /* back arm (behind torso) */
    const sl=c.sleeve||c.under||out,gl=c.gloves||skin;
    const arm=(front)=>{
      const sg=front?1:-1,bx=front?5.2+wd:-8-wd;
      if(ps.atk===2&&front){R(4.4+wd,-14.4,7.6,3,sl);R(4.4+wd,-11.8,7.6,.8,sh(sl,-.25));R(11.6+wd,-15,3.6,4.2,gl);R(11.6+wd,-15,3.6,1,sh(gl,.25));if(c.wrist)R(9.2+wd,-14.4,1.6,3,c.wrist);return;}
      if(ps.atk===1){const dx=front?-1.2:-3.2;R(bx+dx,-14.8,3,6,front?sh(sl,-.2):sl);R(bx+dx,-9,3,3.2,gl);return;}
      const sw=front?-ps.sw*1.1:ps.sw*1.1;
      R(bx,-14.6+sw*.5,3,5.6,front?sh(sl,-.2):sl);if(c.wrist)R(bx-.2,-9.8+sw*.5,3.4,1.5,c.wrist);
      R(bx+.1,-9+sw,2.8,3.2,gl);R(bx+.1,-9+sw,2.8,.8,sh(gl,.25));
    };
    arm(false);
    /* torso */
    R(X(-5.4)-wd,-15.4,10.8+2*wd,9.4,out);R(X(2.6)+wd,-15.4,2.8,9.4,outD);R(X(-5.4)-wd,-15.4,1.8,9.4,outL);
    if(c.under){R(X(-2.6),-15.4,5.2,4.6,c.under);R(X(-1.6),-15.4,3.2,3,skin);}else R(X(-1.8),-15.4,3.6,2.4,skin);
    if(c.armor){R(X(-5)-wd,-15,10+2*wd,6.4,c.armor);R(X(-5)-wd,-9.2,10+2*wd,.9,sh(c.armor,-.3));R(X(2.4)+wd,-15,2.6,6.4,sh(c.armor,-.15));R(X(-5)-wd,-15,1.6,6.4,sh(c.armor,.2));}
    if(c.emblem){R(X(-4.8),-14,3.8,3.8,'#f4f1ea');R(X(-4),-13.2,.8,1.8,'#222');R(X(-3),-13.2,1.8,.8,'#222');R(X(-3),-11.7,1.8,.8,'#222');}
    R(X(-5.4)-wd,-8,10.8+2*wd,2.2,c.belt||outD);if(c.belt){R(X(2.4),-6.2,1.8,4.2,c.belt);R(X(-5.4)-wd,-8,10.8+2*wd,.6,sh(c.belt,.3));}
    if(c.spots){R(X(-3),-13,2,2,'#222');R(X(2.4),-9.4,2,2,'#222');}
    if(hq){
      R(X(-5.4)-wd,-15.4,10.8+2*wd,.7,sh(out,.3));
      if(!c.armor){R(X(-.2),-13.4,.5,5.4,outD);R(X(-4.4)-wd,-11.4,3.4,.5,outD);R(X(1),-11.4,3.4,.5,outD);R(X(-4.8)-wd,-9.2,2.4,.5,outL);R(X(2.4)+wd,-9.2,2.4,.5,outL);}
      else{const ar=c.armor;R(X(-5)-wd,-12.2,10+2*wd,.5,sh(ar,-.3));R(X(-.3),-15,.6,6.4,sh(ar,-.3));
        R(X(-4.2)-wd,-14.4,.8,.8,sh(ar,.5));R(X(3.4)+wd,-14.4,.8,.8,sh(ar,.5));R(X(-4.2)-wd,-10.4,.8,.8,sh(ar,-.45));R(X(3.4)+wd,-10.4,.8,.8,sh(ar,-.45));
        R(X(-5)-wd,-15,10+2*wd,.6,sh(ar,.4));}
      if(c.belt){const bk='#e8c860';R(X(-1.2),-8.1,2.4,2.2,bk);R(X(-.6),-7.5,1.2,1,sh(bk,-.4));R(X(-1.2),-8.1,2.4,.5,sh(bk,.4));}
      else R(X(-.4),-7.6,.8,.9,outL);
    }
    arm(true);
    if(c.shoulder){R(X(-9.6)-wd,-16.4,5,3.6,c.shoulder);R(X(4.6)+wd,-16.4,5,3.6,c.shoulder);R(X(-9.6)-wd,-13.4,5,.8,sh(c.shoulder,-.3));R(X(4.6)+wd,-13.4,5,.8,sh(c.shoulder,-.3));R(X(-9.6)-wd,-16.4,5,.8,sh(c.shoulder,.3));R(X(4.6)+wd,-16.4,5,.8,sh(c.shoulder,.3));}
    /* head: big chibi head */
    const hx=lean*.9;const H=(x,y,w,h,col)=>R(x+hx,y,w,h,col);
    H(-1.8,-16.4,3.6,2,skD);
    H(-8.6,-23.6,1.6,3.4,skin);H(7.2,-23.6,1.6,3.4,skD);
    if(c.pointy){H(-11.2,-26,3.4,2.6,skin);H(8.2,-26,3.4,2.6,skD);H(-11.2,-26,3.4,.7,skL);}
    if(hq){
      H(-7.4,-27.8,14.8,9.8,skin);H(-6.4,-29,12.8,1.4,skin);H(-5,-29.4,10,.6,skin);
      H(4.6,-27.8,2.8,9.8,skD);H(4.6,-29,1.8,1.4,skD);H(-7.4,-27.8,1.6,9.8,skL);H(-6.4,-29,1.2,1.4,skL);
      H(-6.8,-18.2,13.6,.8,skin);H(5.2,-18.2,1.6,.8,skD);H(-6,-17.4,12,.8,skD);H(-5,-16.6,10,.8,skD);H(-3.6,-15.9,7.2,.6,sh(skD,-.15));
    }else{H(-7.4,-29,14.8,13.4,skin);H(4.6,-29,2.8,13.4,skD);H(-7.4,-29,1.6,13.4,skL);H(-6,-17.4,12,1.8,skD);}
    H(-5.8,-19.4,2.2,1.2,'#ff8a7a88');H(3.6,-19.4,2.2,1.2,'#ff8a7a88');
    const brow=(c.hs&&c.hs!=='bald'&&c.hair)?sh(c.hair,-.35):'#2a1a14',eyc=c.eye||'#1a1a22',ay=ps.atk===2?-.6:0;
    const dk='#1a1216',mo='#5a1a1a';
    if(ex==='blink'){
      H(-5.4,-22.2,4.4,.9,dk);H(1,-22.2,4.4,.9,dk);H(-6,-26.2,5,1.1,brow);H(1,-26.2,5,1.1,brow);H(-.5,-20.8,1,1,skD);H(-1.4,-18.8,2.8,.8,'#7a2a2a');
    }else if(ex==='happy'){
      for(const x of[-5.4,1.2]){H(x,-21.8,1.4,1,dk);H(x+1.4,-22.9,2,1,dk);H(x+3.4,-21.8,1.4,1,dk);}
      H(-6,-27.2,5,1.1,brow);H(1,-27.2,5,1.1,brow);H(-.5,-20.8,1,1,skD);
      H(-2.8,-19.6,5.6,2.4,mo);H(-2.8,-19.6,5.6,.9,'#fff');H(-1.4,-18,2.8,.8,'#e0707a');
    }else if(ex==='hurt'||ex==='pain'){
      for(const m of[1,-1]){const bx=m>0?-5.6:5.2;
        H(bx+(m>0?0:0),-24.4,1.7,1.1,dk);H(bx+(m>0?1.5:-1.5),-23.3,1.7,1.1,dk);H(bx+(m>0?3:-3),-22.2,1.7,1.1,dk);}
      H(-6,-26,2.4,1.1,brow);H(-3.8,-25,2.4,1.1,brow);H(3.6,-26,2.4,1.1,brow);H(1.4,-25,2.4,1.1,brow);
      H(-.5,-20.8,1,1,skD);
      if(ex==='pain'){H(-2.6,-19.6,5.2,3,mo);H(-1.2,-17.8,2.4,1,'#e0707a');H(7.2,-27.4,1.4,2.6,'#8ad8ff');H(7.6,-28.6,.8,1.2,'#d8f4ff');}
      else{H(-1.8,-19.2,3.6,2.2,mo);}
    }else if(ex==='surprised'){
      H(-5.8,-25.4,5.2,6.2,'#fff');H(.6,-25.4,5.2,6.2,'#fff');H(-4,-23.4,2,2.6,eyc);H(2.2,-23.4,2,2.6,eyc);H(-3.6,-23,.9,.9,'#fff');H(2.6,-23,.9,.9,'#fff');
      H(-6,-27.6,5,1.1,brow);H(1,-27.6,5,1.1,brow);H(-.5,-20.8,1,1,skD);H(-1.3,-19.4,2.6,2.8,mo);
    }else if(ex==='smug'){
      H(-5.6,-24.4,4.8,5,'#fff');H(.8,-24.4,4.8,5,'#fff');H(-4.4,-23.4,3,3.6,eyc);H(1.6,-23.4,3,3.6,eyc);H(-3.9,-22.8,1.2,1.2,'#fff');H(2.1,-22.8,1.2,1.2,'#fff');
      H(-5.6,-24.4,4.8,1.9,skin);H(.8,-24.4,4.8,1.9,skin);H(-5.6,-22.6,4.8,.5,dk);H(.8,-22.6,4.8,.5,dk);
      H(-6,-25.4,5,1.1,brow);H(1,-27.2,5,1.1,brow);H(-.5,-20.8,1,1,skD);H(-1,-18.8,3.4,.9,'#7a2a2a');H(2.2,-19.7,1.2,.9,'#7a2a2a');
    }else if(ex==='wow'){
      for(const x of[-5.4,1.2]){H(x,-24.4,4.6,4.6,'#fff');H(x+.8,-24,3,4,eyc);H(x+1.2,-23.6,1.2,1.2,'#fff');H(x+2.4,-22.6,.8,.8,'#fff');}
      H(-6,-27.4,5,1.1,brow);H(1,-27.4,5,1.1,brow);H(-.5,-20.8,1,1,skD);H(-2.4,-19.4,4.8,2.6,mo);H(-2.4,-19.4,4.8,.8,'#fff');
    }else{
    H(-5.6,-24.4+ay,4.8,5,'#fff');H(.8,-24.4+ay,4.8,5,'#fff');
      H(-4.4,-24+ay,3,4.6,eyc);H(1.6,-24+ay,3,4.6,eyc);H(-4.4,-24+ay,3,1,sh(eyc,-.5));H(1.6,-24+ay,3,1,sh(eyc,-.5));
      H(-3.9,-23.4+ay,1.2,1.2,'#fff');H(2.1,-23.4+ay,1.2,1.2,'#fff');H(-2.6,-21.4+ay,.8,.8,'#ffffffaa');H(3.4,-21.4+ay,.8,.8,'#ffffffaa');
      if(ps.atk===2){H(-6,-26.2,5.2,1.1,brow);H(.8,-26.2,5.2,1.1,brow);H(-1.4,-25.2,1.2,1,brow);H(.2,-25.2,1.2,1,brow);}
      else{H(-6,-26.2,5,1.1,brow);H(1,-26.2,5,1.1,brow);}
      H(-.5,-20.8,1,1,skD);
      if(ps.atk===2)H(-1.6,-19,3.2,1.8,'#5a1a1a');else H(-1.4,-18.8,2.8,.8,'#7a2a2a');
      if(hq){
        H(-5.8,-24.7+ay,5.2,.6,dk);H(.6,-24.7+ay,5.2,.6,dk);H(-5.6,-20.2+ay,4.8,.4,skD);H(.8,-20.2+ay,4.8,.4,skD);
        H(-3.4,-22.6+ay,.8,.8,sh(eyc,.5));H(2.6,-22.6+ay,.8,.8,sh(eyc,.5));H(-4.4,-21+ay,3,.5,sh(eyc,-.3));H(1.6,-21+ay,3,.5,sh(eyc,-.3));
        H(-.3,-22,.7,1.4,skD);H(-1.8,-17.8,3.6,.4,sh(skin,-.3));H(-6.4,-21,.7,1.8,skD);H(6,-21,.7,1.8,skD);
        H(-6.4,-19.4,1.4,.7,'#ff8a7a66');H(5,-19.4,1.4,.7,'#ff8a7a66');H(-7.4,-27.8,14.8,.6,skL);
      }
    }
    if(c.mask){H(-7.4,-21.6,14.8,5.4,out);H(-7.4,-21.6,14.8,.8,sh(out,.25));}
    if(c.scouter){if(hq){H(.8,-26,5.4,4.4,'#1d4a30aa');H(1.2,-25.6,.8,3.4,'#e8fff0');H(3.2,-24.8,2,.5,'#e8fff0');}H(.8,-26,5.4,4.4,'#7dff9a99');H(1,-26,5.4,1.2,'#d8ffe4');H(6.4,-27,1.1,6,'#444');H(7.2,-22.4,1.4,1.4,'#444');}
    if(c.shades){H(-6.4,-25,12.8,3.4,'#111');H(-5.8,-24.6,4,.9,'#556');H(1.6,-24.6,4,.9,'#556');}
    if(c.beard){const bc=c.beardC||'#f4f1ea';H(-5.6,-20,11.2,5.4,bc);H(-5.6,-20,11.2,1,sh(bc,.3));H(-5.6,-16.6,11.2,.9,sh(bc,-.2));H(-2,-19.2,4,.9,'#9a6a5a');}
    if(c.stache){H(-5,-20.6,10,1.8,c.stache);H(-5,-20.6,2,3,c.stache);H(3,-20.6,2,3,c.stache);}
    if(c.dots){for(let i=0;i<3;i++){H(-2.8+i*1.9,-27.4,1,1,'#7a4a2a');H(-1.8+i*1.9,-26.2,1,1,'#7a4a2a');}}
    if(c.third)H(-.7,-28,1.4,1.8,'#e33');
    const h=c.hair,hl=h?sh(h,.32):null,hd=h?sh(h,-.2):null;
    switch(c.hs){
      case'goku':H(-7.8,-32,15.6,4.2,h);H(-9.8,-36,3.6,7,h);H(-6,-40,3.6,10,h);H(-1.4,-42.6,4,12.8,h);H(3,-40,3.6,10,h);H(6.6,-36,3.6,7,h);H(-8,-31,2,6.6,h);H(6,-31,2,6.6,h);H(-4,-30,2.4,3.4,h);H(1,-30,2.4,3.8,h);H(-1.4,-30,1.6,2.6,h);H(-.4,-41.6,1,8,hl);H(-4.6,-38,1,5,hl);H(4,-34,2.8,4,hd);break;
      case'vegeta':H(-7.8,-32,15.6,3.6,h);H(-5.6,-37.6,3.2,6.4,h);H(-2.2,-44,4.4,13,h);H(2.4,-37.6,3.2,6.4,h);H(-8,-31,2,5,h);H(6,-31,2,5,h);H(-6,-30,4,2.4,h);H(2,-30,4,2.4,h);H(-.6,-43,1,8,hl);H(2.6,-36,2.6,4,hd);break;
      case'long':H(-7.8,-32,15.6,4.2,h);H(-9.6,-31,3.4,17,h);H(6.2,-31,3.4,17,h);H(-5.6,-37,3.2,6,h);H(-1.6,-38.6,3.6,7.6,h);H(2.6,-37,3.2,6,h);H(-1.4,-37.6,1,5,hl);H(6.6,-26,2.8,10,hd);break;
      case'afro':H(-10.4,-42,20.8,9,h);H(-11.6,-37,23.2,8,h);H(-10,-30.6,3.6,4,h);H(6.4,-30.6,3.6,4,h);H(-7,-44,14,3,h);H(-8,-43,3,3,hl);H(2,-40,6,5,hd);break;
      case'horns':H(-6.4,-36.4,2.8,7,h);H(3.6,-36.4,2.8,7,h);H(-5.8,-38.4,1.6,2.4,h);H(4.2,-38.4,1.6,2.4,h);H(-6.4,-36.4,.8,6,hl);break;
      case'twin':H(-7.8,-32,15.6,4.4,h);H(-8.4,-31,2.6,6,h);H(5.8,-31,2.6,6,h);H(-6,-30,12,2,h);H(-2.6,-31,5.2,2.8,h);H(-12.4,-31.4,4.6,2.6,h);H(-13.6,-29.2,3.2,7.6,h);H(-12.8,-22,2.2,2.4,h);H(7.8,-31.4,4.6,2.6,h);H(10.4,-29.2,3.2,7.6,h);H(10.6,-22,2.2,2.4,h);H(-.6,-31.6,1,4,hl);H(-13.2,-29,.8,6,hl);break;
      case'bob':H(-7.8,-32,15.6,4.4,h);H(-9.2,-31,3.6,10.4,h);H(5.6,-31,3.6,10.4,h);H(-6.6,-30,13.2,2.2,h);H(-3,-31,6,3.4,h);H(-7.8,-31,1,9,hl);H(6.6,-26,2.4,5,hd);break;
      case'mohawk':H(-7.8,-31.6,15.6,3.4,h);H(-8,-30,1.8,3.2,h);H(6.2,-30,1.8,3.2,h);H(-1.6,-36.4,3.2,5.4,h);H(-1,-39.8,2,4,h);H(-.4,-38.6,.8,5,hl);break;
      case'antenna':H(-4.8,-36.4,1.8,7.4,h);H(3,-36.4,1.8,7.4,h);H(-5.4,-37.8,1,1.8,h);H(4.4,-37.8,1,1.8,h);H(-4.8,-36.4,.6,7,hl);break;
      case'trunks':H(-7.8,-32.6,15.6,4.2,h);H(-8.6,-31,3.4,9,h);H(-6,-36,4,4,h);H(-1.6,-37.6,4.2,5,h);H(3,-36,4.4,4.2,h);H(-6.4,-30.6,6,2.8,h);H(-1.6,-36.6,1,4,hl);H(4.4,-34,2.6,4,hd);break;
    }
    if(hq&&h&&c.hs&&c.hs!=='bald'){
      for(let i=0;i<5;i++)H(-6+i*3,-31.4,.6,1.4+(i%2)*1.2,i%2?hl:hd);
      if(c.hs==='goku'){H(-2.6,-37,.6,6,hd);H(2.4,-38,.6,7,hd);H(7.4,-34,.6,4,hd);H(-8.2,-34,.6,4,hl);H(-5,-36,.6,4,hd);}
      else if(c.hs==='vegeta'){H(-4.2,-38,.6,6,hd);H(.8,-42,.6,9,hd);H(4.4,-38,.6,6,hl);H(-3,-41,.5,4,hl);}
      else if(c.hs==='long'){H(-8.6,-27,.6,10,hl);H(-7.2,-24,.6,8,hd);H(7.2,-27,.6,10,hd);H(8.4,-22,.6,6,hl);H(-3,-36,.6,4,hd);H(1.6,-37,.6,5,hd);}
      else if(c.hs==='afro'){for(let i=0;i<6;i++)H(-9+i*3.2,-40+(i%2)*3,1.2,1.2,i%2?hl:hd);}
      else if(c.hs==='trunks'){H(-4,-35,.6,4,hd);H(1,-36.4,.6,4,hd);H(4,-34.6,.6,3,hl);H(-7.4,-27,.6,5,hd);}
      else if(c.hs==='horns'){H(4,-35,.5,4,hd);H(-5.2,-35.4,.5,4,hl);}
      else if(c.hs==='antenna'){H(3.4,-35,.5,5,hd);H(-4.4,-35,.4,4,hl);}
    }
    if(c.ears){H(-7.4,-38.4,3.8,7,c.skin);H(3.6,-38.4,3.8,7,c.skin);H(-6.6,-37.4,2,5,sh(c.skin,-.35));H(4.4,-37.4,2,5,sh(c.skin,-.35));H(-7.4,-38.4,3.8,.9,sh(c.skin,.2));}
    if(c.band){H(-7.6,-29.2,15.2,2.2,c.band);H(-7.6,-29.2,15.2,.6,sh(c.band,.3));}
    if(c.halo){H(-4.8,-46.5,9.6,1.3,'#ffe86a');H(-4.8,-43.6,9.6,1.3,'#ffe86a');H(-5.9,-45.2,1.4,2,'#ffe86a');H(4.5,-45.2,1.4,2,'#ffe86a');}
    if(c.staff){R(12,-40,1.6,36,'#e8e0f4');R(10.6,-43,4.4,4.4,'#7ad0ff');R(11.4,-42.2,2.8,2.8,'#fff');}
    if(c.hs==='bald'&&!c.turban&&!c.shades&&!c.mask){H(-7.4,-29,14.8,1.2,sh(skin,.1));}
    if(c.turban){const t=c.turban;H(-8,-33,16,5.4,t);H(-6,-35.6,12,3.2,t);H(-8,-29.2,16,1,sh(t,-.24));H(3.2,-33,4.8,5.4,sh(t,-.12));H(-8,-33,1.6,5.4,sh(t,.15));}
  }
  /* shared walk/attack helper for creature painters: returns leg lifts and a forward lunge */
  static saibaArt(R,pal,f,robot){
    const[c1,c2,dk,ac]=pal,ps=Sprites.pose(f),lx=ps.atk===2?2:ps.atk===1?-1:0;
    R(-4.4,-6-ps.l,3.4,6+ps.l,c2);R(1,-6-ps.r,3.4,6+ps.r,c2);R(-4.8,-1.2-ps.l,4.2,1.2,robot?'#2a2a3a':'#dfe6d0');R(.6,-1.2-ps.r,4.2,1.2,robot?'#2a2a3a':'#dfe6d0');
    R(-4+lx*.4,-13,8,8,c1);R(1.8+lx*.4,-13,2.2,8,c2);
    R(-4.4+lx*.4,-12.4,8.8,5,'#2a2a30');R(-4.4+lx*.4,-12.4,8.8,1,'#4a4a52');
    R(-1.6+lx*.4,-11.6,3.2,3.2,ac);R(-.8+lx*.4,-10.8,1.6,1.6,'#fff');R(-3.4,-8.2,1.2,1.2,ac);R(2.2,-8.2,1.2,1.2,ac);
    const ar=ps.atk===2?3:0;
    R(-7.6+lx,-12.5-ps.sw,3.8,2,c1);R(-9.8+lx,-12.9-ps.sw,2.4,1.4,c1);R(-10.2+lx,-13.6-ps.sw,.9,1,'#fff');R(-10.2+lx,-12.3-ps.sw,.9,1,'#fff');
    R(3.8+lx,-12.5+ps.sw,3.8+ar,2,c2);R(7.4+lx+ar,-12.9+ps.sw,2.4,1.4,c2);R(9.4+lx+ar,-13.6+ps.sw,.9,1,'#fff');R(9.4+lx+ar,-12.3+ps.sw,.9,1,'#fff');
    const by=ps.bob,hx=lx*.7;
    R(-5.4+hx,-23.6+by,10.8,11,c1);R(3.4+hx,-23.6+by,2,11,c2);R(-5.4+hx,-23.6+by,1.4,11,shadeHex(c1,.2));
    if(robot){R(-5.4+hx,-23.6+by,10.8,2,c2);R(-4.4+hx,-19.4+by,8.8,3,dk);R(-3.8+hx,-19+by,7.6,1.8,ac);R(-.5+hx,-27.6+by,1,4,'#7a8498');R(-1.4+hx,-28.4+by,2.8,1.4,ac);R(-6+hx,-18.4+by,1,3,c2);R(5+hx,-18.4+by,1,3,c2);}
    else{
      R(-3.4+hx,-24.8+by,6.8,1.4,c2);R(-1.8+hx,-26+by,3.6,1.4,c2);R(-5.4+hx,-22+by,10.8,.8,c2);
      R(-9+hx,-20.4+by,3.8,2.4,c1);R(-10.4+hx,-21+by,1.8,1.4,c1);R(5.2+hx,-20.4+by,3.8,2.4,c2);R(8.6+hx,-21+by,1.8,1.4,c2);
      R(-4.6+hx,-19.6+by,3.8,4.2,dk);R(.8+hx,-19.6+by,3.8,4.2,dk);R(-3.6+hx,-19.2+by,1.2,1.2,'#fff');R(1.8+hx,-19.2+by,1.2,1.2,'#fff');
      const m=ps.atk===2?2.6:1.8;R(-3.8+hx,-15+by,7.6,m,dk);R(-3.2+hx,-15+by,1,1.2,'#fff');R(-1+hx,-15+by,1,1.2,'#fff');R(1+hx,-15+by,1,1.2,'#fff');R(2.4+hx,-15+by,.8,1.2,'#fff');
    }
  }
  static cellJrArt(R,f){
    const g1='#4a8a3a',g2='#2f6a28',ps=Sprites.pose(f),lx=ps.atk===2?2:0;
    R(-4.4,-5-ps.l,3.4,5+ps.l,g2);R(1,-5-ps.r,3.4,5+ps.r,g2);
    R(-9+lx,-14-ps.sw,3,8,g1);R(6+lx,-14+ps.sw,3,8,g1);R(-6+lx*.4,-15,12,11,g1);R(5,-15,1,11,g2);R(-5,-12,2,2,'#1a1a1a');R(2,-9,2,2,'#1a1a1a');
    const by=ps.bob;R(-5.4+lx*.6,-26+by,10.8,11,g1);R(-3.8+lx*.6,-29+by,7.6,3,'#1a1a1a');R(-4.8+lx*.6,-23+by,9.6,.9,g2);
    R(-3.4+lx*.6,-22+by,2.8,2.8,'#fff');R(.8+lx*.6,-22+by,2.8,2.8,'#fff');R(-2.4+lx*.6,-21.6+by,1.4,2.2,'#c22');R(1.6+lx*.6,-21.6+by,1.4,2.2,'#c22');
    R(-2+lx*.6,-17.4+by,4,ps.atk?2:1,'#1a1a1a');
  }
  static beastArt(R,f,pal){
    const[c,c2,bl]=pal||['#7a6a3a','#5a4a28','#c9b070'],ps=Sprites.pose(f),lx=ps.atk===2?3:ps.atk===1?-2:0;
    const a=ps.l,b=ps.r;
    R(-9,-5-b,3.2,5+b,c2);R(-2,-5-a,3.2,5+a,c2);R(5,-5-b,3.2,5+b,c2);R(10,-5-a,3,5+a,c2);
    R(-11+lx*.4,-15,22,11,c);R(-9,-7,18,3,bl);R(-11+lx*.4,-15,22,1.4,shadeHex(c,.2));R(8,-15,3,11,shadeHex(c,-.2));
    R(-20,-14+ps.bob-(ps.atk===1?3:0),10,3,c);R(-24,-13-(ps.atk===1?4:0),5,2,c2);
    R(8+lx,-19,6,9,c);R(11+lx,-21,9,9,c);R(18+lx,-18,5.4,4.4,c2);R(11+lx,-21,9,1.2,shadeHex(c,.22));
    R(13+lx,-20,2.2,2.2,'#f22');R(13.4+lx,-20,.8,.8,'#fff');R(18.6+lx,-14,1.2,ps.atk?3:1.8,'#fff');R(21.2+lx,-14,1.2,ps.atk?3:1.8,'#fff');
    R(9+lx,-23,2.2,3,c2);R(14+lx,-23,2.2,3,c2);
    R(-8,-17,2,2,c2);R(-3,-17,2,2,c2);R(2,-17,2,2,c2);
  }
  static birdArt(R,pal,f){
    const[c1,c2,bl,ac]=pal||['#8a9a5a','#5a6a38','#e8d890','#d94a3a'],ps=Sprites.pose(f),fl=[0,-5,-1,5,-1,-8,3][f]||0;
    const lx=ps.atk===2?3:0;
    R(-5,-12,12,7,c1);R(-5,-12,12,1.2,shadeHex(c1,.22));R(-5,-7,12,2,bl);R(-9,-11,5,3,c2);R(-13,-10,5,2,c2);
    R(5+lx,-17,6,8,c1);R(9+lx,-18,9,4,c1);R(16+lx,-16.5,5,2.4,ac);R(9+lx,-18,9,1,shadeHex(c1,.22));R(7+lx,-16,2,2,'#fff');R(7.6+lx,-15.6,1,1,'#111');R(10+lx,-20,3,3,ac);
    /* wings: flapping */
    R(-4,-13+fl,4,2,c2);R(-14,-13+fl*1.2,10,3,c1);R(-20,-12+fl*1.5,6,2.4,c2);R(-8,-13+fl*1.2,2,3,shadeHex(c1,-.2));
    R(-2,-6,1.4,4,ac);R(2,-6,1.4,4,ac);R(-3,-2.4,3,1,'#222');R(1,-2.4,3,1,'#222');
  }
  static ghostArt(R,f){
    const w='#eae4ff',w2='#cfc4f0',dk='#2a1a4a',ps=Sprites.pose(f),o=ps.l?1:0,sw=ps.atk===2?3:0;
    R(-4,-26+ps.bob,8,3,w);R(-6,-24+ps.bob,12,12,w);R(-7,-21,14,8,w);R(-6,-24+ps.bob,1.6,12,'#fff');R(4.6,-24+ps.bob,1.4,12,w2);
    R(-6,-12,3,6+o,w2);R(-1,-12,3,8-o,w2);R(4,-12,3,6+o,w2);
    R(-10+sw,-19+ps.sw,3,7,w2);R(7+sw,-19-ps.sw,3,7+sw,w2);
    R(-4,-20+ps.bob,3,4,dk);R(1,-20+ps.bob,3,4,dk);R(-3.4,-19.6+ps.bob,1,1,'#fff');R(1.6,-19.6+ps.bob,1,1,'#fff');R(-2,-14,4,ps.atk?4:3,dk);
  }
  static droneArt(R,f){
    const ps=Sprites.pose(f),b=ps.bob?1:0,ax=ps.atk===2?2:0;
    R(-9,-14+b,18,6,'#9aa6b8');R(-9,-14+b,18,1.2,'#c9d4e4');R(6,-14+b,3,6,'#6a7488');R(-5,-18+b,10,4,'#c9d4e4');R(-2+ax,-13+b,4,3,ps.atk?'#ffffff':'#ff3b3b');
    R(-.5,-23+b,1,5,'#aaa');R(-1.5,-24+b,3,1.5,ps.atk?'#fff':'#ff9d1c');
    R(-7,-8+b,3,3+(ps.l?1:0),'#ff9d1c');R(4,-8+b,3,3+(ps.r?1:0),'#ff9d1c');R(-11,-12+b-ps.sw,3,2,'#6a7488');R(8,-12+b+ps.sw,3,2,'#6a7488');
  }
  static golemArt(R,pal,f){
    const[a,b,eye]=pal||['#7a8290','#5a6270','#ffb13b'],ps=Sprites.pose(f),lx=ps.atk===2?3:0;
    R(-8,-9,7,9,b);R(1,-9,7,9,b);R(-8,-9-ps.l,7,9,b);R(1,-9-ps.r,7,9,b);R(-8,-9,7,1.4,a);R(1,-9,7,1.4,a);
    R(-10+lx*.4,-28,20,19,a);R(-10+lx*.4,-28,20,2,shadeHex(a,.25));R(7+lx*.4,-28,3,19,b);R(-8+lx*.4,-26,16,3,b);R(-2+lx*.4,-22,1,10,b);
    R(-17+lx,-26-ps.sw,7,16,a);R(10+lx,-26+ps.sw,7,16,a);R(-18+lx,-12-ps.sw,9,5,b);R(9+lx+(ps.atk===2?4:0),-12+ps.sw,9,5,b);
    R(-6+lx*.6,-37+ps.bob,12,9,a);R(-6+lx*.6,-37+ps.bob,12,1.4,shadeHex(a,.25));R(-4+lx*.6,-34+ps.bob,3,2,eye);R(1+lx*.6,-34+ps.bob,3,2,eye);R(-3+lx*.6,-30+ps.bob,6,1.4,b);
  }
  static blobArt(R,pal,f){
    const[c1,c2,dk]=pal,ps=Sprites.pose(f),sq=ps.bob?1:0,jp=(f===2||f===4)?-1.5:0,at=ps.atk===2?2:0;
    R(-9-sq,-8+jp,18+2*sq,8,c1);R(-8-sq,-14+jp,16+2*sq,7,c1);R(-6,-18+jp-sq,12,5+sq,c1);R(-9-sq,-3,18+2*sq,3,c2);R(5,-14+jp,3,11,c2);
    R(-4,-16+jp,3,2,'#ffffffaa');R(-4.5+at,-11+jp,3,3,dk);R(1.5+at,-11+jp,3,3,dk);R(-3.6+at,-10.6+jp,1,1,'#fff');R(2.4+at,-10.6+jp,1,1,'#fff');R(-2,-7+jp,4,ps.atk?2.6:1.4,dk);
  }
  static orbArt(R,f){
    const ps=Sprites.pose(f),s=ps.bob?1:0,gl=ps.atk?2:0;
    Sprites.circ(R,0,-14,9+gl,'#6a5af0');Sprites.circ(R,-1,-15,6+gl,'#9a8aff');Sprites.circ(R,-2,-16,3,'#e8e0ff');
    R(-13,-14.5,26,1.2,'#8a7aff');R(-3,-14.5+s,6,2,ps.atk?'#ffffff':'#11081f');
  }
  static apeArt(R,f){
    const fur='#7a5230',fur2='#5a3a1e',skin='#c9a070',ps=Sprites.pose(f),lx=ps.atk===2?4:0;
    R(-13,-11,10,11,fur2);R(3,-11,10,11,fur2);R(-13,-11-ps.l,10,11,fur2);R(3,-11-ps.r,10,11,fur2);
    R(-15,-32,30,22,fur);R(-15,-32,30,2,'#9a6a3e');R(12,-32,3,22,fur2);R(-9,-28,18,13,skin);R(-14,-31,5,4,fur2);R(9,-31,5,4,fur2);
    R(-24+lx*.5,-32-ps.sw,9,26,fur);R(15+lx,-32+ps.sw,9,26,fur);R(-26+lx*.5,-8-ps.sw,11,7,fur2);R(15+lx+(ps.atk===2?5:0),-8+ps.sw,11,7,fur2);
    R(-10+lx*.5,-45+ps.bob,20,15,fur);R(-10+lx*.5,-45+ps.bob,20,2,'#9a6a3e');R(-7+lx*.5,-39+ps.bob,14,9,skin);
    R(-6+lx*.5,-42+ps.bob,3.4,2.4,'#ff2a2a');R(2.6+lx*.5,-42+ps.bob,3.4,2.4,'#ff2a2a');
    R(-4+lx*.5,-35+ps.bob,8,ps.atk?4.4:3,'#2a1a10');R(-3.5+lx*.5,-36.5+ps.bob,1.6,2,'#fff');R(1.9+lx*.5,-36.5+ps.bob,1.6,2,'#fff');
    R(-8+lx*.5,-47+ps.bob,4,3,fur2);R(4+lx*.5,-47+ps.bob,4,3,fur2);
  }
}
Sprites.S=5;Sprites.PS=6;   /* PS: pixel density of playable characters (HD painter) */
Sprites.FR=7;
