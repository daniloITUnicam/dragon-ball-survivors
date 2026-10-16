'use strict';
/* ====== Electric overlay for the player's abilities: it grows with every transformation (g.formIdx+1 = 0..6) ======
   Jagged flickering arcs + moving spark sprites around projectiles, beams, discs, rings and bombs. */
const ELEC={
  n:0,max:130,                                  /* per-frame budget of drawn arcs (keeps big barrages cheap) */
  lvl(g){if(FXL.on)return 0;return Math.max(0,Math.min(6,(g.formIdx|0)+1));},
  r(i,s){const x=Math.sin(i*127.1+s*311.7)*43758.5453;return x-Math.floor(x);},   /* deterministic noise: arcs flicker ~22 times a second */
  col(c,lv,i){return lv>=5&&i%3===0?'#ffe066':lv>=3&&i%4===1?'#b8f0ff':c;},
  zig(ctx,x0,y0,x1,y1,seg,jit,seed,fr){
    ctx.moveTo(x0,y0);const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
    for(let i=1;i<=seg;i++){const k=i/seg,o=i===seg?0:(ELEC.r(i,seed+fr)-.5)*2*jit;ctx.lineTo(x0+dx*k+nx*o,y0+dy*k+ny*o);}
  },
  stroke(ctx,c,lv,w){
    ctx.strokeStyle=hexA(c,.55);ctx.lineWidth=w+1.6+lv*.35;ctx.stroke();
    ctx.strokeStyle='#ffffff';ctx.lineWidth=Math.max(.9,w*.55);ctx.stroke();
  },
  /* orbiting sparks: little crackling stars that travel round (or along) the ability */
  spark(ctx,x,y,s,t,i){VFX.star(ctx,x,y,s,'rgba(215,240,255,.95)',t*9+i*1.7);GLOW.at(ctx,x,y,s*2.4,'#9fe8ff',.55);},
  /* around a point (projectile, disc, bomb, meteor...) */
  pt(ctx,x,y,R,c,t,lv,seed){
    if(lv<=0||ELEC.n>ELEC.max)return;
    const fr=(t*22)|0,n=Math.min(7,1+((lv*1.2)|0));ELEC.n+=n;seed=seed||0;
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineJoin='round';ctx.lineCap='round';
    for(let i=0;i<n;i++){
      const a=ELEC.r(i,seed+fr*1.7)*TAU,len=R*(1.05+.55*ELEC.r(i+9,seed+fr))*(1+.1*lv),r0=R*.35;
      ctx.beginPath();ELEC.zig(ctx,x+Math.cos(a)*r0,y+Math.sin(a)*r0,x+Math.cos(a)*len,y+Math.sin(a)*len,5,R*.38,seed+i,fr);
      ELEC.stroke(ctx,ELEC.col(c,lv,i),1.3,lv);
      if(lv>=4&&i%2===0){ /* fork */
        const b=a+(ELEC.r(i,seed+fr)-.5)*1.4,mx=x+Math.cos(a)*len*.6,my=y+Math.sin(a)*len*.6;
        ctx.beginPath();ELEC.zig(ctx,mx,my,mx+Math.cos(b)*len*.55,my+Math.sin(b)*len*.55,3,R*.2,seed+i+5,fr);ELEC.stroke(ctx,c,.9,lv);
      }
    }
    const m=lv>=2?Math.min(5,lv-1):0;
    for(let i=0;i<m;i++){const a=t*(6+i*2.3)+i*TAU/m,rr=R*(1.25+.25*Math.sin(t*8+i));ELEC.spark(ctx,x+Math.cos(a)*rr,y+Math.sin(a)*rr*.85,2.4+lv*.5,t,i);}
    if(lv>=4){ctx.globalAlpha=.4;ctx.strokeStyle=c;ctx.lineWidth=1.4;ctx.setLineDash([5,7]);ctx.lineDashOffset=-t*60;ctx.beginPath();ctx.arc(x,y,R*1.55,0,TAU);ctx.stroke();ctx.setLineDash([]);}
    ctx.restore();
  },
  /* along a beam: (x,y) origin, angle a, length len, half-width w */
  seg(ctx,x,y,a,len,w,c,t,lv,k,seed){
    if(lv<=0||k<=.02||ELEC.n>ELEC.max)return;
    const fr=(t*22)|0;seed=seed||0;ELEC.n+=3+lv*2;
    ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.globalCompositeOperation='lighter';ctx.lineJoin='round';ctx.lineCap='round';ctx.globalAlpha=Math.min(1,k*1.2);
    const n=2+lv*2;
    for(let i=0;i<n;i++){
      const side=i%2?1:-1,x0=ELEC.r(i,seed+fr)*len*.82,span=len*(.08+.14*ELEC.r(i+4,seed+fr)),off=w*(.55+.5*ELEC.r(i+7,seed+fr));
      ctx.beginPath();ELEC.zig(ctx,x0,side*off*.4,x0+span,side*off*(1.1+.3*ELEC.r(i,fr)),6,w*.28,seed+i,fr);ELEC.stroke(ctx,ELEC.col(c,lv,i),1.4,lv);
    }
    if(lv>=3){ /* long bolts running the whole beam */
      const nb=lv>=5?2:1;
      for(let i=0;i<nb;i++){ctx.beginPath();ELEC.zig(ctx,0,0,len,(ELEC.r(i,fr)-.5)*w*.6,Math.max(8,(len/38)|0),w*.5,seed+40+i,fr);ELEC.stroke(ctx,i?'#ffe066':c,1.7,lv);}
    }
    const m=lv+1;
    for(let i=0;i<m;i++){const ph=(t*(1.6+i*.2)+i/m)%1,sy=Math.sin(t*14+i*2.1)*w*.7;ELEC.spark(ctx,len*ph,sy,2.6+lv*.5,t,i);}
    ctx.restore();
  },
  /* around a circle (aura, shockwave) */
  ring(ctx,x,y,R,c,t,lv,k,seed){
    if(lv<=0||k<=.02||ELEC.n>ELEC.max)return;
    const fr=(t*22)|0;seed=seed||0;ELEC.n+=3+lv*2;
    ctx.save();ctx.translate(x,y);ctx.globalCompositeOperation='lighter';ctx.lineJoin='round';ctx.lineCap='round';ctx.globalAlpha=Math.min(1,k*1.2);
    const n=3+lv*2;
    for(let i=0;i<n;i++){
      const a=ELEC.r(i,seed+fr*1.3)*TAU,da=.12+.12*ELEC.r(i+3,seed+fr),r1=R*(.96+.06*ELEC.r(i,fr)),out=R*(1.1+.2*ELEC.r(i+6,seed+fr));
      ctx.beginPath();ELEC.zig(ctx,Math.cos(a)*r1,Math.sin(a)*r1,Math.cos(a+da)*out,Math.sin(a+da)*out,4,R*.07,seed+i,fr);ELEC.stroke(ctx,ELEC.col(c,lv,i),1.3,lv);
    }
    const m=Math.min(8,lv+2);
    for(let i=0;i<m;i++){const a=t*(2.2+i*.35)+i*TAU/m;ELEC.spark(ctx,Math.cos(a)*R,Math.sin(a)*R*.95,2.4+lv*.45,t,i);}
    ctx.restore();
  }
};

/* every weapon class reports where its attack currently is; the renderer calls this right after the weapon's own draw */
Weapon.prototype.elecOverlay=function(ctx){};
KameWeapon.prototype.elecOverlay=function(ctx){
  const g=this.g,p=g.p,lv=ELEC.lvl(g);if(!lv)return;
  for(const b of this.beams){const k=Math.sin(Math.min(1,b.t/b.dur)*Math.PI);ELEC.seg(ctx,p.x+Math.cos(b.a)*14,p.y-18+Math.sin(b.a)*14,b.a,b.len*(b.ext||.01),b.wid*.5,this.color,g.rt,lv,k,b.a*3);}
};
DiscWeapon.prototype.elecOverlay=function(ctx){
  const g=this.g,lv=ELEC.lvl(g);if(!lv)return;const k=this.evo?1.5:1;
  for(let i=0;i<this.pos.length;i++)ELEC.pt(ctx,this.pos[i][0],this.pos[i][1],13*k,this.color,g.rt,lv,i*7);
};
SpiritWeapon.prototype.elecOverlay=function(ctx){
  const g=this.g,lv=ELEC.lvl(g);if(!lv)return;
  for(const b of this.bombs){const k=b.t/b.fall,r=b.vr*(.45+.55*k);ELEC.pt(ctx,b.x,b.y-(1-k)*(480+b.vr)-r*.6,r*.9,'#9ae8ff',g.rt,lv,b.x);}
};
AuraWeapon.prototype.elecOverlay=function(ctx){
  const g=this.g,p=g.p,lv=ELEC.lvl(g);if(!lv)return;
  ELEC.ring(ctx,p.x,p.y-10,this.st.r[this.L]*(g.S.area*this.e2a),this.color,g.rt,lv,1,3);
};
SlashWeapon.prototype.elecOverlay=function(ctx){
  const g=this.g,p=g.p,lv=ELEC.lvl(g);if(!lv)return;
  for(const sl of this.slashes){const k=sl.t/sl.dur,r=sl.rad*(.7+.3*k)*1.05;
    for(let j=-1;j<=1;j++){const a=sl.a+j*sl.half*.8;ELEC.pt(ctx,p.x+Math.cos(a)*r,p.y-14+Math.sin(a)*r,10+8*(1-k),this.color,g.rt,lv,j*5+sl.a);}}
};
DeathBeamWeapon.prototype.elecOverlay=function(ctx){
  const g=this.g,p=g.p,lv=ELEC.lvl(g);if(!lv)return;
  for(const l of this.lines)ELEC.seg(ctx,p.x,p.y-18,l.a,l.len,l.wid,this.color,g.rt,lv,1-l.t/l.dur,l.a*5);
};
BoomerWeapon.prototype.elecOverlay=function(ctx){
  const g=this.g,lv=ELEC.lvl(g);if(!lv)return;
  for(const b of this.bs)if(b.t>=0)ELEC.pt(ctx,b.x,b.y,22,this.color,g.rt,lv,b.a*9);
};
HakaiWeapon.prototype.elecOverlay=function(ctx){
  const g=this.g,lv=ELEC.lvl(g);if(!lv)return;
  for(const b of this.sp){const k=Math.min(1,b.t/.4,(b.life-b.t)/.6);ELEC.pt(ctx,b.x,b.y,b.rad*.62*k,'#c070ff',g.rt,lv,b.t*3);}
};
MeteorWeapon.prototype.elecOverlay=function(ctx){
  const g=this.g,lv=ELEC.lvl(g);if(!lv)return;
  for(const m of this.ms){if(m.t<0)continue;const k=m.t/m.fall;ELEC.pt(ctx,m.x+(1-k)*260,m.y-(1-k)*520,16,'#ffb13b',g.rt,lv,m.x);}
};
SweepWeapon.prototype.elecOverlay=function(ctx){
  if(!this.act)return;const g=this.g,p=g.p,lv=ELEC.lvl(g);if(!lv)return;
  const a=this.act,k=Math.min(1,a.t/.25,(a.dur-a.t)/.3),s=this.st,L=this.L,len=s.len[L]*this.area()*this.reach()*SweepWeapon.ext(a),wid=s.wid[L]*this.area();
  const angs=this.evo>=2?[a.cur,a.cur+TAU/3,a.cur+TAU*2/3]:this.evo?[a.cur,a.cur+Math.PI]:[a.cur];
  for(const ang of angs)ELEC.seg(ctx,p.x,p.y-18,ang,len,wid*.5,this.color,g.rt,lv,Math.max(0,k),ang);
};
DynWeapon.prototype.elecOverlay=function(ctx){
  const g=this.g,p=g.p,lv=ELEC.lvl(g);if(!lv)return;
  for(const b of this.bs){if(b.t<0)continue;const k=b.t/.3;ELEC.ring(ctx,p.x,p.y-14,b.R*(.4+.6*k),this.color,g.rt,lv,1-k,b.R);}
};
