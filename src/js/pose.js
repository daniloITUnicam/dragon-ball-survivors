'use strict';
/* ====== Pose: the arms of the player, per weapon ======
   The procedural characters are painted with a "no arms" body (Sprites.pose: frame 20+ = body without arms, 30+ = the same with a fierce
   face) and the arms are drawn here on top: two-bone limbs (shoulder - elbow - wrist - hand) solved with inverse kinematics toward a
   target hand position. So the legs keep their walking cycle while the arms do what the weapon asks (the Kamehameha is charged with both
   hands while moving, the Ki Blast grows on the palm and is thrown with the arm; ...). Imported sprite sheets keep their own frames.
   Units: sprite units (the character is ~30 units tall; 1 unit = g.C.u screen pixels), origin at the feet, y down, x already mirrored.
   A pose is started by the weapons (g.armAct) or read from the cast state (g.cast: Kamehameha / Big Bang charge). Layout:
     phases: 0 wind-up (w seconds, optional ball growing on the hand), 1 hold (h: arm extended), 2 retract (r). */
const POSE_L1=4.4,POSE_L2=3.8,POSE_HAND=1.7,POSE_SY=-14.2,POSE_SX=6.5,POSE_CY=-11.2;
/* weapons without an own wind-up: when one fires (its cooldown jumps back up) the character plays this pose toward the nearest enemy */
const ARM_FIRE={
  homing:{st:'shoot',h:.16,r:.16},dbeam:{st:'shoot',h:.2,r:.16},javelin:{st:'shoot',h:.22,r:.18},spiral:{st:'shoot',h:.14,r:.14},
  barrage:{st:'shoot',h:.12,r:.12,alt:1},boomer:{st:'shoot',h:.2,r:.18},hellzone:{st:'sky',w:.1,h:.7,r:.25},hakai:{st:'shoot',h:.22,r:.2},
  dsunday:{st:'both',h:.2,r:.16},breaker:{st:'both',h:.24,r:.2},
  chain:{st:'sky',w:.1,h:.3,r:.2},meteor:{st:'sky',w:.1,h:.34,r:.22},shock:{st:'slam',w:.08,h:.2,r:.2},
  spirit:{st:'raise2',w:.42,h:.26,r:.26,ball:1},flare:{st:'face',w:.05,h:.3,r:.2}
};
const POSE_FIERCE={kamec:1,kamef:1,both:1,slam:1};
const poseE3=x=>1-Math.pow(1-Math.max(0,Math.min(1,x)),3);
let POSE_ON=false;   /* (the tests turn it on to check the old poses still work) */
const Pose={
  /* which way the character looks while acting: toward the aim (horizontal), otherwise the way it walks */
  fdOf(g,a){const c=Math.cos(a);return Math.abs(c)>.2?(c>0?1:-1):(g.p.face||1);},
  /* where a ki ball leaves the hand (the shoulder of the aim side + the full arm + the hand) */
  tip(g,a){
    const sid=typeof Sprites!=='undefined'&&Sprites.sheetFor?Sprites.sheetFor(g.pcKey):null;   /* (the headless simulator has no Sprites) */
    if(sid){   /* an imported sheet: the hand anchor of its throw frame (13), otherwise the old origin at the chest */
      const S=Sprites.sheets[sid],h=S.hand&&S.hand[13],U2=g.C.u||1.95;
      if(h&&Sprites.sheetHas(g.pcKey,13)){const fd=Pose.fdOf(g,a),k=U2/S.ppu;return{x:g.p.x+fd*(h[0]-S.ax)*k,y:g.p.y+(h[1]-S.ay)*k};}
      return{x:g.p.x,y:g.p.y-18};
    }
    const U=g.C.u||1.95,wd=(g.pc&&g.pc.wide)?2.4:0,fd=Pose.fdOf(g,a),R=(POSE_L1+POSE_L2+POSE_HAND+1.2)*U;
    return{x:g.p.x+fd*(POSE_SX+wd)*U+Math.cos(a)*R,y:g.p.y+POSE_SY*U+Math.sin(a)*R};
  },
  /* the current pose of the player (null = none): {st, a, ph, u, e, ...} */
  cur(g){
    if(!POSE_ON)return null;   /* v123: the arm poses are off (no arms stretched toward the target) */
    const c=g.cast;
    if(c)return g.fireT>0?{st:'kamef',a:c.a,ph:1,u:1,e:.5,x:1,col:c.color}:{st:'kamec',a:c.a,ph:0,u:Math.min(1,c.t/c.dur),kk:Math.min(1,c.t/c.dur),col:c.color};
    const pa=g.pa;if(!pa)return null;
    const e=g.rt-pa.t0,tot=pa.w+pa.h+pa.r;
    if(e>=tot||e<0){if(e>=tot)g.pa=null;return null;}
    const ph=e<pa.w?0:e<pa.w+pa.h?1:2,u=ph===0?e/pa.w:ph===1?(e-pa.w)/Math.max(.001,pa.h):(e-pa.w-pa.h)/Math.max(.001,pa.r);
    return{st:pa.st,a:pa.a,ph,u,kk:u,e,w:pa.w,h:pa.h,r:pa.r,col:pa.col,alt:pa.alt,ball:pa.ball,ballR:pa.ballR,x:ph===2?1-poseE3(u):1};
  },
  /* imported sprite sheets (optional frames 10-15, see sheets.js): which frame shows a pose, and where the ball goes (hand anchors of sprites.json) */
  sheetFrame(s){
    switch(s.st){case 'kamec':return 10;case 'kamef':case 'both':return 11;case 'shoot':return s.ph===0?12:13;case 'raise2':return 14;case 'sky':return 15;}
    return 0;
  },
  sheetBall(g,s,frame,fd,U,bob){
    const sid=Sprites.sheetFor(g.pcKey),S=sid&&Sprites.sheets[sid],h=S&&S.hand&&S.hand[frame];
    if(!h)return null;
    const k=U/S.ppu,x=g.p.x+fd*(h[0]-S.ax)*k,y=g.p.y+bob+(h[1]-S.ay)*k;
    if(s.st==='kamec')return{x,y,r:4+9*s.kk};
    if(s.st==='shoot'&&s.ph===0&&s.ball)return{x,y,r:Math.max(1.4,(s.ballR||7)*(.16+.84*poseE3(s.u*1.1)))};
    if(s.st==='raise2'&&s.ph===0&&s.ball)return{x,y,r:3+12*s.u};
    return null;
  },
  /* two-bone IK: shoulder S, wrist target T. Returns elbow and the (clamped) wrist. down: the elbow prefers to be lower; side: x direction the elbow goes when it is a tie */
  ik(sx,sy,tx,ty,down,side){
    const l1=POSE_L1,l2=POSE_L2;let dx=tx-sx,dy=ty-sy,d=Math.hypot(dx,dy);
    if(d<1e-4){dx=0;dy=1;d=1;}
    const mx=l1+l2-.04,mn=Math.abs(l1-l2)+.5;
    const ux=dx/d,uy=dy/d;
    if(d>mx){tx=sx+ux*mx;ty=sy+uy*mx;d=mx;}else if(d<mn){tx=sx+ux*mn;ty=sy+uy*mn;d=mn;}
    const a=(d*d+l1*l1-l2*l2)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-a*a));
    const ax=sx+ux*a,ay=sy+uy*a,e1=[ax-uy*h,ay+ux*h],e2=[ax+uy*h,ay-ux*h];
    let pick;
    if(Math.abs(e1[1]-e2[1])<.5)pick=(e1[0]-e2[0])*(side||1)>0?e1:e2;
    else pick=down?(e1[1]>e2[1]?e1:e2):(e1[1]<e2[1]?e1:e2);
    return{S:[sx,sy],E:pick,W:[tx,ty]};
  },
  /* the targets of both hands for a pose: {A, B, tb (how far the far shoulder is pulled to the middle), ball, fierce} (sprite units) */
  solve(s,fd,by,wd){
    const a=s.a,dx=Math.cos(a),dy=Math.sin(a),sxs=POSE_SX+wd,SY=POSE_SY+by,Cy=POSE_CY+by,lerp=(p,q,k)=>[p[0]+(q[0]-p[0])*k,p[1]+(q[1]-p[1])*k];
    const SA=[fd*sxs,SY],SBx=(tb)=>[fd*(-sxs+(sxs+3)*tb),SY+tb*.8]   /* tb: the far shoulder turns toward the middle / the aim side (the body is front-facing, so a two-handed pose needs the far arm to reach across) */;
    const rest=(S,sg)=>[S[0]+sg*fd*.8,S[1]+7.2],out={tb:0,ta:0,ball:null,fierce:!!POSE_FIERCE[s.st],down:1};
    const hold=s.ph===1?1:s.ph===2?s.x:0;
    switch(s.st){
      case 'shoot':{
        /* the aim-side arm: rest -> raised (palm in front of the shoulder) -> extended; the other arm swings back as a counterweight */
        const farE=!!s.alt,SE=farE?SBx(.85):SA,Sg=farE?SA:SBx(0);
        const rs=rest(SE,farE?-1:1),rz=[SE[0]+fd*3.6,SE[1]+1.4],ex=[SE[0]+dx*8.1,SE[1]+dy*8.1];
        let T;
        if(s.ph===0){const kr=poseE3(s.u/.7),kt=poseE3((s.u-.8)/.2);T=lerp(lerp(rs,rz,kr),ex,kt);}
        else if(s.ph===1)T=(s.w>0)?ex:lerp(rz,ex,poseE3(s.e/.05));
        else T=lerp(rs,ex,s.x);
        const kb=s.ph===0?poseE3(s.u/.7)*.6+poseE3((s.u-.8)/.2)*.4:hold;
        const Tg=lerp(rest(Sg,farE?1:-1),[Sg[0]-(farE?-1:1)*fd*2.4,Sg[1]+6],kb);
        if(farE){out.B=T;out.A=Tg;out.tb=.85;out.SBx=SBx(.85);}else{out.A=T;out.B=Tg;}
        out.ext=farE?'B':'A';out.tipOnly=1;
        break;}
      case 'kamec':{
        /* both hands cup the energy ball in front of the chest; it gets bigger and the hands pull slightly back and down */
        const kk=s.kk,sh=kk>.7?(kk-.7)*.9:0,dist=13.2+(11.8-13.2)*kk,Q=[dx*dist+(Math.random()-.5)*sh,Cy+dy*dist+(-.4+2.4*kk)+(Math.random()-.5)*sh];
        const q=poseE3(kk/.22);   /* the arms come up from the sides in the first ~0.1 s */
        out.A=lerp(rest(SA,1),[Q[0]-dx*1.2,Q[1]-dy*1.2-1.1],q);out.B=lerp(rest(SBx(0),-1),[Q[0]-dx*1.2,Q[1]-dy*1.2+1.1],q);out.tb=q;
        out.ball={x:Q[0]+dx*1.1,y:Q[1]+dy*1.1,rpx:4+9*kk};break;}
      case 'kamef':case 'both':{
        /* arms thrown forward, hands together where the beam / the shots leave */
        const kick=s.st==='kamef'&&s.ph===1?poseE3(s.e/.09):1,Sb=SBx(1),R=lerp([4.4,4.4],[7.7,7.7],kick)[0];
        const T1=[SA[0]+dx*R,SA[1]+dy*R-.7],T2=[Sb[0]+dx*R,Sb[1]+dy*R+.5];
        out.A=lerp(rest(SA,1),T1,hold);out.B=lerp(rest(SBx(0),-1),T2,hold);out.tb=1;
        if(s.st==='both'&&s.ph===0){out.A=lerp(rest(SA,1),T1,poseE3(s.u));out.B=lerp(rest(SBx(0),-1),T2,poseE3(s.u));}
        break;}
      case 'sky':{
        const q=s.ph===0?poseE3(s.u):hold;
        out.A=lerp(rest(SA,1),[SA[0]+fd*1.2,SA[1]-7.4],q);out.B=lerp(rest(SBx(0),-1),[-fd*(sxs+2),SY+4.6],q*.5);break;}
      case 'slam':{
        const q=s.ph===0?poseE3(s.u):hold,P=[dx*5.6,Cy+dy*5.6+3.4];
        out.A=lerp(rest(SA,1),[P[0],P[1]-.5],q);out.B=lerp(rest(SBx(0),-1),[P[0],P[1]+.6],q);out.tb=.8;break;}
      case 'raise2':{
        /* both arms up beside the head toward the sphere that gathers above it */
        const q=s.ph===0?poseE3(s.u):hold;
        out.A=lerp(rest(SA,1),[fd*5.6,SY-8.2],q);out.B=lerp(rest(SBx(0),-1),[-fd*5.6,SY-8.2],q);
        if(s.ph===0&&s.ball)out.ball={x:0,y:by-36,rpx:3+12*s.u};
        break;}
      case 'face':{
        const q=s.ph===0?poseE3(s.u):hold;
        out.A=lerp(rest(SA,1),[fd*1.3,-21.6+by],q);out.B=lerp(rest(SBx(0),-1),[-fd*1.3,-21.6+by],q);out.tb=.7;break;}
      default:{out.A=rest(SA,1);out.B=rest(SBx(0),-1);}
    }
    out.SA=SA;if(!out.SBx)out.SBx=SBx(out.tb);
    return out;
  },
  /* the limbs in screen pixels: {A, B: {S,E,W,H}, ball:{x,y,r}, fierce} */
  build(g,s,U,fd,bobU,bobPx){
    const wd=(g.pc&&g.pc.wide)?2.4:0,Z=Pose.solve(s,fd,bobU,wd),X=g.p.x,Y=g.p.y+bobPx;
    const mk=(S,T,side)=>{const r=Pose.ik(S[0],S[1],T[0],T[1],1,side),dxw=r.W[0]-r.E[0],dyw=r.W[1]-r.E[1],dl=Math.hypot(dxw,dyw)||1;
      const H=[r.W[0]+dxw/dl*POSE_HAND,r.W[1]+dyw/dl*POSE_HAND];
      const P=(p)=>[X+p[0]*U,Y+p[1]*U];return{S:P(r.S),E:P(r.E),W:P(r.W),H:P(H),dir:[dxw/dl,dyw/dl]};};
    const A=mk(Z.SA,Z.A,fd),B=mk(Z.SBx,Z.B,-fd);
    let ball=null;
    if(Z.ball)ball={x:X+Z.ball.x*U,y:Y+Z.ball.y*U,r:Z.ball.rpx};
    else if(s.st==='shoot'&&s.ball&&s.ph===0){   /* the ball grows on the palm of the throwing hand, up to the size of the shot */
      const L=Z.ext==='B'?B:A,R=s.ballR||7,rb=Math.max(1.4,R*(.16+.84*poseE3(s.u*1.1)));
      ball={x:L.H[0]+L.dir[0]*rb*.55,y:L.H[1]+L.dir[1]*rb*.55,r:rb};
    }
    return{A,B,ball,fierce:Z.fierce};
  },
  /* one arm: sleeve (two segments), wrist band and hand. front arm is a bit darker (as in the painted sprite) */
  limb(ctx,L,c,U,front,flash){
    const sh=shadeHex,sl=flash?'#ffffff':(c.sleeve||c.under||c.outfit),gl=flash?'#ffffff':(c.gloves||c.skin);
    const col=flash?sl:front?sh(sl,-.2):sl,edge=flash?sl:sh(sl,-.42);
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    const seg=(w,col2)=>{ctx.strokeStyle=col2;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(L.S[0],L.S[1]);ctx.lineTo(L.E[0],L.E[1]);ctx.lineTo(L.W[0],L.W[1]);ctx.stroke();};
    seg(3.5*U,edge);seg(2.8*U,col);
    if(!flash){ctx.globalAlpha=.35;ctx.strokeStyle=sh(sl,.3);ctx.lineWidth=.8*U;ctx.beginPath();ctx.moveTo(L.S[0]-.4*U,L.S[1]-.5*U);ctx.lineTo(L.E[0]-.4*U,L.E[1]-.5*U);ctx.stroke();ctx.globalAlpha=1;}
    if(c.wrist&&!flash){ctx.strokeStyle=c.wrist;ctx.lineWidth=3.1*U;ctx.lineCap='butt';ctx.beginPath();ctx.moveTo(L.W[0]-L.dir[0]*1.5*U,L.W[1]-L.dir[1]*1.5*U);ctx.lineTo(L.W[0],L.W[1]);ctx.stroke();ctx.lineCap='round';}
    ctx.fillStyle=flash?gl:sh(gl,-.38);ctx.beginPath();ctx.arc(L.H[0],L.H[1],1.95*U,0,6.2832);ctx.fill();
    ctx.fillStyle=gl;ctx.beginPath();ctx.arc(L.H[0]-.1*U,L.H[1]-.2*U,1.65*U,0,6.2832);ctx.fill();
    if(!flash){ctx.fillStyle=sh(gl,.3);ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(L.H[0]-.5*U,L.H[1]-.7*U,.7*U,0,6.2832);ctx.fill();}
    ctx.restore();
  }
};
