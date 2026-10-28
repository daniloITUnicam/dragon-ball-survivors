'use strict';
/* ====== Snake Way scenery (visual only): floating islands beside the body (King Kai, Kami's Lookout, Kame House...), small decorations
   floating in the cloud sea, and the life of the sky: bird flocks, drifting mist, the Flying Nimbus and a glow that travels along the snake.
   The islands themselves (geometry, walkable ground) live in world.js (Snake.island / Snake.clamp); their rewards in MapDirector.islands(). ====== */
const SnakeArt={
  col:{kingkai:['#8ede62','#4c9c3c'],kami:['#f4eedc','#c4bc9f'],kame:['#f8e8a8','#dcc276'],korin:['#dcd4c4','#a8a08c'],capsule:['#e8eef6','#a9b6c8'],
    grandkai:['#92d870','#4e9642'],shrine:['#c2b6da','#7e729e'],nimbus:['#fff4c0','#ffd45c'],temple:['#f8cdea','#c98cc2']},
  names:{kingkai:T('Pianeta di Re Kaioh','King Kai\'s Planet'),kami:T('Santuario di Dio','Kami\'s Lookout'),kame:T('Kame House','Kame House'),korin:T('Torre di Karin','Korin Tower'),
    capsule:T('Capsule Corp','Capsule Corp'),grandkai:T('Pianeta del Grande Kaioh','Grand Kai\'s Planet'),shrine:T('Altare di Shenron','Shenron\'s Altar'),nimbus:T('Nuvola Speciale','Nimbus Cloud'),temple:T('Mondo Sacro dei Kaioh','Sacred World of the Kai')},
  /* what lies on each island: three power-ups (see MapDirector.islands) */
  loot:{kingkai:['dmg','haste','xp'],kami:['heal','magnet','xp'],kame:['luck','haste','bag'],korin:['heal','heal','dmg'],capsule:['heal','magnet','xp'],
    grandkai:['dmg','xp','haste'],shrine:['luck','heal','xp'],nimbus:['haste','magnet','xp'],temple:['dmg','luck','heal']},
  cir(c,x,y,r){c.beginPath();c.arc(x,y,r,0,TAU);c.fill();},
  ell(c,x,y,rx,ry){c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();},
  tree(c,x,y,s,col){c.fillStyle='#6a4a2a';c.fillRect(x-1.6*s,y-9*s,3.2*s,10*s);c.fillStyle=col||'#3f9e4a';this.cir(c,x,y-13*s,8.5*s);c.fillStyle='rgba(255,255,255,.26)';this.cir(c,x-2.6*s,y-15.5*s,3.6*s);},
  palm(c,x,y,s,t){
    c.strokeStyle='#8a6030';c.lineWidth=2.6*s;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+3*s,y-12*s,x+1*s,y-24*s);c.stroke();
    c.strokeStyle='#2f9a4a';c.lineWidth=2.2*s;const sw=Math.sin(t*1.6+x)*.14;
    for(let i=0;i<5;i++){const a=-Math.PI/2+(i-2)*.62+sw;c.beginPath();c.moveTo(x+s,y-24*s);c.quadraticCurveTo(x+s+Math.cos(a)*9*s,y-24*s+Math.sin(a)*9*s-3*s,x+s+Math.cos(a)*15*s,y-24*s+Math.sin(a)*13*s+5*s);c.stroke();}
  },
  /* v110: the island's painted sprite (isle<kind>.png) with its walkable top on the island's ellipse; until the sheet is decoded (or headless) the old drawn island */
  /* the painting ends with a straight cut where the source picture ended (bottom of Capsule Corp, Grand Kai, the altar and the temple, the top of two of them):
     there the sprite fades out (share of its height) and the cloud puffs drawn in front cover it */
  FADE:{capsule:[0,.16],grandkai:[.06,.16],shrine:[0,.16],temple:[.05,.16],korin:[0,0]},
  spr(I){
    const S=typeof Sprites!=='undefined'&&Sprites.sheets&&Sprites.sheets['isle'+I.kind];if(!(S&&S.img))return null;
    if(!S.fc){const F=this.FADE[I.kind];
      if(F&&(F[0]||F[1])&&typeof document!=='undefined'){const im=S.img,c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='destination-out';
        if(F[1]){const h=im.height,y0=h*(1-F[1]),g=x.createLinearGradient(0,y0,0,h);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,1)');x.fillStyle=g;x.fillRect(0,y0,im.width,h-y0);}
        if(F[0]){const y1=im.height*F[0],g=x.createLinearGradient(0,0,0,y1);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,im.width,y1);}
        S.fc=c;}else S.fc=S.img;}
    const q=S.k||1;return{img:S.fc,w:S.img.width/q,h:S.img.height/q};   /* w, h in px of the 1x sprite (v112: the sheet is 2x, sprites.json k) */
  },
  /* how far the drawn island reaches above / below its centre (for culling): [top, bottom] in world px */
  ext(I){const S=this.spr(I),G=ISLE_GEO[I.kind];if(!S)return[I.r*1.1,I.r*1.6];const k=I.r/G[2];return[G[1]*k+60,(S.h-G[1])*k+90];},
  /* ---- roads (v110): a smaller copy of the snake's body along I.road. The renderer paints the body and every road one layer at a time (shadow, outline, body,
     side, belly), so the layers of a road merge into the same layers of the body like a fork, and near the body each road widens into a smooth fillet ---- */
  RF:110,RE:64,   /* fillet: length along the road after the body's edge, and how much wider (each side) it starts */
  rl(I){   /* cumulative length of the road polyline */
    if(I._cl)return I._cl;const R=I.road,L=[0];for(let j=1;j<R.length;j++)L.push(L[j-1]+Math.hypot(R[j][0]-R[j-1][0],R[j][1]-R[j-1][1]));return I._cl=L;},
  at(I,s){const R=I.road,L=this.rl(I);s=Math.max(0,Math.min(L[L.length-1],s));let j=1;while(j<L.length-1&&L[j]<s)j++;
    const a=R[j-1],b=R[j],l=(L[j]-L[j-1])||1,u=(s-L[j-1])/l,tx=(b[0]-a[0])/l,ty=(b[1]-a[1])/l;return[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,tx,ty];},
  sub(c,I,s0,s1,dy){const L=this.rl(I),R=I.road;const p=this.at(I,s0);c.moveTo(p[0],p[1]+dy);for(let j=1;j<R.length;j++)if(L[j]>s0&&L[j]<s1)c.lineTo(R[j][0],R[j][1]+dy);const q=this.at(I,s1);c.lineTo(q[0],q[1]+dy);},
  /* where the road leaves the body's edge (arc length) */
  edge(I){if(I._se!=null)return I._se;const L=this.rl(I);let s=0;for(;s<L[L.length-1];s+=6){const p=this.at(I,s);if(Math.abs(p[1]-Snake.f(p[0]))>Snake.HW*Math.sqrt(1+Snake.df(p[0])**2))break;}return I._se=s;},
  /* one layer of a road: hw = half width of the layer on the body's scale (HW = 150), col, dy = offset (shadow) */
  roadLayer(c,I,hw,col,dy){
    if(!I.road)return;const k=ISLE_RW/Snake.HW,w=hw*k,L=this.rl(I),se=this.edge(I);
    c.strokeStyle=col;c.fillStyle=col;c.lineWidth=w*2;c.beginPath();this.sub(c,I,0,L[L.length-1],dy);c.stroke();
    /* the fillet: RF px past the body's edge the road is wider and eases into its own width - nested strokes of the road's first stretch, each a bit
       longer and thinner (round caps make the curve smooth); concentric for every layer, so the bands stay parallel */
    const E=this.RE*(hw/Snake.HW+.35);
    for(let n=10,q=1;q<=n;q++){const u=q/n,ww=w+E*Math.pow(1-u+.08,2)/1.17;c.lineWidth=ww*2;c.beginPath();this.sub(c,I,0,se+this.RF*u,dy);c.stroke();}
  },
  /* scales and dorsal spikes of a road (not inside the body, nor on the fillet) */
  roadDeco(c,I){
    if(!I.road)return;const W=ISLE_RW,L=this.rl(I),se=this.edge(I);c.lineWidth=1.8;
    for(let s=se+this.RF*.35;s<L[L.length-1];s+=30){
      const [px,py,tx,ty]=this.at(I,s),nx=-ty,ny=tx,i=Math.round(s/30)+I.id*7,a=Math.atan2(ty,tx);
      for(let r=-2;r<=2;r++){const off=r*W*.3;c.strokeStyle=r%2?'rgba(23,53,108,.38)':'rgba(255,255,255,.22)';c.beginPath();c.arc(px+nx*off-tx*5,py+ny*off-ty*5,9,a-.9,a+.9);c.stroke();}
      if(s<se+this.RF*.8)continue;
      for(const sd of[-1,1]){const ex=px+nx*sd*(W+3),ey=py+ny*sd*(W+3),h=9+5*hash(i,sd+3);
        c.fillStyle='#17356c';c.beginPath();c.moveTo(ex-tx*7,ey-ty*7);c.lineTo(ex+nx*sd*h,ey+ny*sd*h);c.lineTo(ex+tx*7,ey+ty*7);c.closePath();c.fill();
        c.fillStyle='#4a86d0';c.beginPath();c.moveTo(ex-tx*4,ey-ty*4);c.lineTo(ex+nx*sd*(h-4),ey+ny*sd*(h-4));c.lineTo(ex+tx*4,ey+ty*4);c.closePath();c.fill();}
    }
  },
  /* the body's animation carried on along the road: the soft bands of light (same speed, they set off from the body towards the island) and the sparkles */
  roadLight(c,I,t){
    if(!I.road)return;const L=this.rl(I),Lt=L[L.length-1],k=ISLE_RW/Snake.HW,per=1300,len=480;
    c.save();c.lineCap='round';c.lineJoin='round';
    const off=((t*210+I.id*173)%per+per)%per;
    for(let b=off-per;b<Lt;b+=per){const s0=Math.max(0,b),s1=Math.min(Lt,b+len);if(s1<=s0)continue;
      for(const [w,a] of[[1.2,.05],[.9,.07],[.6,.09],[.34,.12]]){c.strokeStyle='rgba(255,255,255,'+a+')';c.lineWidth=Snake.HW*w*k;c.beginPath();this.sub(c,I,s0,s1,0);c.stroke();}}
    c.fillStyle='#fff';
    for(let s=40,i=0;s<Lt;s+=70,i++){const h=hash(i+I.id*31,47);if(h>.3)continue;const ph=(t*.8+h*9)%1,a=Math.sin(ph*Math.PI);if(a<.05)continue;
      const [px,py,tx,ty]=this.at(I,s+h*40),o=(hash(i,9+I.id)-.5)*ISLE_RW*1.2,x=px-ty*o,y=py+tx*o,r=2+3*a;c.globalAlpha=a*.9;c.fillRect(x-r,y-.8,r*2,1.6);c.fillRect(x-.8,y-r,1.6,r*2);}
    c.restore();
  },
  /* puffs of the cloud sea around the foot of the island: behind it (front=false), and a row over the bottom of the painting (front=true) that hides where it ends */
  puffs(c,I,t,front){
    const S=this.spr(I);if(!S)return;const G=ISLE_GEO[I.kind],k=I.r/G[2],bot=(S.h-G[1])*k,ph=I.x*.011,cut=(this.FADE[I.kind]||[0,0])[1]>0;
    c.save();
    const n=front?(cut?11:7):12;
    for(let i=0;i<n;i++){
      const u=(i+.5)/n,h=hash(i,I.id),bob=Math.sin(t*.6+i*1.7+ph)*6;let x,y,rr;
      if(front){const sp=cut?.98:.7;x=I.x+(u*2-1)*I.r*sp;y=I.y+bot*(cut?.86:.97)-Math.abs(u*2-1)*(cut?bot*.12:bot*.25);rr=I.r*(cut?.2:.13)*(.8+.45*h);}
      else{const a=Math.PI*(-.08+1.16*u);x=I.x+Math.cos(a)*I.r*1.02;y=I.y+Math.sin(a)*I.ry*1.02+bot*.35*Math.max(0,Math.sin(a));rr=.22*I.r*(.75+.5*h);}
      c.globalAlpha=1;c.fillStyle='#e8861c';this.ell(c,x,y+bob+rr*.12,rr*1.02,rr*.5);
      c.fillStyle='#f7b23a';this.ell(c,x,y+bob,rr,rr*.48);
      c.fillStyle='#ffd25c';this.ell(c,x-rr*.15,y+bob-rr*.12,rr*.7,rr*.33);
      c.fillStyle='#fff0a8';this.ell(c,x-rr*.3,y+bob-rr*.2,rr*.32,rr*.14);
    }
    c.restore();
  },
  /* Shenron's Altar: the seven Dragon Balls on the altar (sprite px of the altar top: centre 379,225, radii 70 x 42), lit and gently floating */
  /* v112: where the seven balls stand on the altar (world px, feet of each ball), 1 to 7 stars; they are real Dragon Balls you pick up by climbing the altar
     (Game.islands lays them as loot, l.alt, kept in I.alt) */
  ballPos(I){
    const G=ISLE_GEO.shrine,k=I.r/G[2],cx=I.x+(379-G[0])*k,cy=I.y+(225-G[1])*k,rx=70*k*.6,ry=42*k*.6,L=[];
    for(let i=0;i<7;i++){const a=-Math.PI/2+i/7*TAU;L.push({x:cx+Math.cos(a)*rx,y:cy+Math.sin(a)*ry,n:i+1});}
    return L;
  },
  /* the balls still on the altar (only = filter on them, for the redraw in front of who stands behind one) */
  balls(c,I,t,img,only){
    const G=ISLE_GEO.shrine,k=I.r/G[2],S=26*k;
    let L=I.alt?I.alt.filter(l=>!l.dead).map(l=>({x:l.x,y:l.y,n:l.star})):this.ballPos(I);
    if(only)L=L.filter(only);
    L.sort((p,q)=>p.y-q.y);
    for(const b of L){b.ph=b.n*.9;
      const h=6*k+Math.sin(t*2+b.ph)*3*k;
      if(!only){c.fillStyle='rgba(40,20,60,.35)';this.ell(c,b.x,b.y,S*.38,S*.14);
        GLOW.at(c,b.x,b.y-h-S*.5,S*1.25,'#ffaa28',.55+.15*Math.sin(t*3+b.ph));}   /* (the redraw in front of someone: the ball only, its glow is already there) */
      if(img){c.save();c.imageSmoothingEnabled=true;c.drawImage(img,(b.n-1)*64,0,64,64,b.x-S/2,b.y-h-S,S,S);c.restore();}
      else{c.fillStyle='#ff9d1c';this.cir(c,b.x,b.y-h-S*.5,S*.45);c.fillStyle='#d22';this.cir(c,b.x,b.y-h-S*.5,S*.12);}
    }
  },
  isle(c,I,t,ballImg){
    const S=this.spr(I);
    if(S){
      const G=ISLE_GEO[I.kind],k=I.r/G[2],bob=Math.sin(t*.9+I.x*.01)*4,ph=I.x*.013;
      c.save();c.translate(0,bob);
      const bot=(S.h-G[1])*k;c.fillStyle='rgba(150,60,0,.22)';this.ell(c,I.x,I.y+bot*.75+30,I.r*.9,I.ry*.45);   /* shadow on the clouds */
      c.imageSmoothingEnabled=true;c.drawImage(S.img,I.x-G[0]*k,I.y-G[1]*k,S.w*k,S.h*k);c.imageSmoothingEnabled=false;
      if(I.kind==='shrine')this.balls(c,I,t,ballImg);
      c.globalCompositeOperation='lighter';   /* spirit lights rising from the island */
      for(let i=0;i<4;i++){const r=(t*.3+i/4+ph)%1;GLOW.at(c,I.x+Math.sin(r*6+i*2)*I.r*.55,I.y-I.ry*.1-r*I.ry*1.3,10+6*(1-r),'#fff0b0',.6*(1-r));}
      c.restore();
      return;
    }
    this.isle0(c,I,t);
  },
  /* v112: the buildings, trees and rocks of the islands (ISLE_OBJ) painted again over whoever stands behind them. E = [{x,y,w,h}]: feet at (x,y), half width w,
     height h. Each cut-out (isleo<kind> atlas) is clipped to the boxes of the ones whose feet are above its front edge (Snake.front), so nothing else is touched */
  occlude(c,IS,E,t,ballImg){
    if(!E.length)return;
    for(const I of IS){
      const A=typeof Sprites!=='undefined'&&Sprites.sheets&&Sprites.sheets['isleo'+I.kind];if(!(A&&A.img))continue;
      const L=Snake.objs(I);if(!L.length)continue;
      const bob=Math.sin(t*.9+I.x*.01)*4;
      for(const o of L){
        let n=0;
        for(const e of E){
          if(e.x+e.w<o.x0||e.x-e.w>o.x1||e.y-e.h>o.y1+bob||e.y<o.y0+bob||e.y>=Snake.front(o,e.x)||(o.T.length&&Snake.onTop(o,e.x,e.y)))continue;
          if(!n){c.save();c.beginPath();}n++;c.rect(e.x-e.w,e.y-e.h,e.w*2,e.h+8);
        }
        if(!n)continue;
        c.clip();c.imageSmoothingEnabled=true;c.drawImage(A.img,o.r[0],o.r[1],o.r[2],o.r[3],o.x0,o.y0+bob,o.x1-o.x0,o.y1-o.y0);c.restore();
      }
      if(I.kind==='shrine'){   /* the Dragon Balls in front of who stands behind them (on the altar or behind it) are painted again over him */
        const G=ISLE_GEO.shrine,k=I.r/G[2],bx=I.x+(379-G[0])*k,by=I.y+(225-G[1])*k,R=60*k;
        for(const e of E){
          if(Math.abs(e.x-bx)>R+e.w||e.y>by+R*.6||e.y<by-R*1.4)continue;
          const B=(I.alt?I.alt.filter(l=>!l.dead):this.ballPos(I));if(!B.some(b=>b.y>e.y))continue;
          c.save();c.beginPath();c.rect(e.x-e.w,e.y-e.h,e.w*2,e.h+8);c.clip();c.translate(0,bob);this.balls(c,I,t,ballImg,b=>b.y>e.y);c.restore();
        }
      }
    }
  },
  /* the old drawn island (before v110), kept as the fallback */
  isle0(c,I,t){
    const R=I.r,[c1,c2]=this.col[I.kind],bob=Math.sin(t*.9+I.x*.01)*3,o=I.side,u=R/120,ph=I.x*.013;
    c.save();c.translate(I.x,I.y+bob);
    c.fillStyle='rgba(150,60,0,.3)';this.ell(c,0,R*.42+20,R*1.02,R*.6);
    c.fillStyle='#5a3c26';c.beginPath();c.moveTo(-R,2);c.quadraticCurveTo(-R*.85,R*.78,-R*.2,R*1.12);c.quadraticCurveTo(0,R*1.3,R*.22,R*1.1);c.quadraticCurveTo(R*.85,R*.78,R,2);c.closePath();c.fill();
    c.fillStyle='#7a5636';c.beginPath();c.moveTo(-R*.9,6);c.quadraticCurveTo(-R*.6,R*.5,-R*.1,R*.62);c.quadraticCurveTo(R*.5,R*.6,R*.9,6);c.closePath();c.fill();
    c.strokeStyle='rgba(30,16,6,.45)';c.lineWidth=2;c.beginPath();c.moveTo(-R*.4,R*.3);c.lineTo(-R*.3,R*.62);c.moveTo(R*.3,R*.34);c.lineTo(R*.38,R*.66);c.stroke();
    if(I.kind==='kame'){c.fillStyle='rgba(74,200,232,.55)';this.cir(c,0,0,R*1.12);c.strokeStyle='rgba(255,255,255,'+(.35+.2*Math.sin(t*2+ph))+')';c.lineWidth=2;c.beginPath();c.arc(0,0,R*1.12+((t*10)%8),0,TAU);c.stroke();}
    const gr=c.createRadialGradient(-R*.25,-R*.3,R*.1,0,0,R);gr.addColorStop(0,c1);gr.addColorStop(1,c2);
    c.fillStyle=gr;this.cir(c,0,0,R);c.strokeStyle='rgba(30,40,20,.38)';c.lineWidth=3;c.beginPath();c.arc(0,0,R,0,TAU);c.stroke();
    c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=2;c.beginPath();c.arc(0,0,R-3,Math.PI*1.05,Math.PI*1.55);c.stroke();
    const oy=o*R*.42;
    switch(I.kind){
      case'kingkai':{
        for(let i=0;i<7;i++){c.fillStyle='rgba(40,110,30,.4)';const a=hash(i,I.id)*TAU,d=hash(i+3,I.id)*R*.8;c.fillRect(Math.cos(a)*d,Math.sin(a)*d,3,2);}
        this.tree(c,R*.5,oy*.9,1.1*u,'#3f9e4a');
        c.fillStyle='#f6f2e8';this.cir(c,0,oy,16*u);c.strokeStyle='#5a4a3a';c.lineWidth=1.6;c.beginPath();c.arc(0,oy,16*u,0,TAU);c.stroke();   /* the round house */
        c.fillStyle='#c8452a';c.beginPath();c.arc(0,oy-2*u,16*u,Math.PI,0);c.fill();c.fillStyle='#4a2a1a';c.fillRect(-3*u,oy+4*u,6*u,9*u);
        c.strokeStyle='#4a4a52';c.lineWidth=1.4;c.beginPath();c.moveTo(0,oy-17*u);c.lineTo(0,oy-30*u);c.stroke();c.fillStyle='#e03a3a';this.cir(c,0,oy-31*u,2.6*u);
        c.fillStyle='#d8302a';c.fillRect(-R*.62,oy+8*u,18*u,7*u);c.fillStyle='#222';this.cir(c,-R*.62+4*u,oy+16*u,3*u);this.cir(c,-R*.62+14*u,oy+16*u,3*u);   /* the car */
        const hp=Math.abs(Math.sin(t*3+ph))*7;c.fillStyle='#7a4a22';this.cir(c,-R*.3,oy+20*u-hp,3.6*u);c.fillStyle='#9ad04a';this.cir(c,-R*.18,oy+22*u-Math.abs(Math.sin(t*4+ph))*5,2.4*u);   /* Bubbles and Gregory hop */
        break;}
      case'kami':{
        c.strokeStyle='rgba(120,110,80,.4)';c.lineWidth=1.6;for(let r=.32;r<.9;r+=.2){c.beginPath();c.arc(0,0,R*r,0,TAU);c.stroke();}
        this.palm(c,-R*.55,oy*.9,1.1*u,t);this.palm(c,R*.55,oy*.9,1.1*u,t+1);
        c.fillStyle='#f4f0e2';c.fillRect(-20*u,oy-22*u,40*u,24*u);c.strokeStyle='#8a8068';c.lineWidth=1.4;c.strokeRect(-20*u,oy-22*u,40*u,24*u);
        c.fillStyle='#4a78d8';c.beginPath();c.arc(0,oy-22*u,15*u,Math.PI,0);c.fill();c.fillStyle='#ffd23f';this.cir(c,0,oy-38*u,2.6*u);
        c.fillStyle='#8a7a5a';for(const dx of[-12,0,12]){c.beginPath();c.arc(dx*u,oy,4*u,Math.PI,0);c.fill();c.fillRect(dx*u-4*u,oy,8*u,2*u);}
        break;}
      case'kame':{
        this.palm(c,-R*.5,oy*.7,1.2*u,t);this.palm(c,R*.55,oy*1.1,1*u,t+2);
        c.fillStyle='#f4a2ba';c.fillRect(-22*u,oy-14*u,44*u,22*u);c.strokeStyle='#7a4a5a';c.lineWidth=1.4;c.strokeRect(-22*u,oy-14*u,44*u,22*u);
        c.fillStyle='#d8402a';c.beginPath();c.moveTo(-27*u,oy-14*u);c.lineTo(-16*u,oy-28*u);c.lineTo(16*u,oy-28*u);c.lineTo(27*u,oy-14*u);c.closePath();c.fill();
        c.fillStyle='#f8f4ea';c.fillRect(-4*u,oy-4*u,8*u,12*u);c.fillStyle='#8ad8f4';c.fillRect(-16*u,oy-9*u,7*u,6*u);c.fillRect(9*u,oy-9*u,7*u,6*u);
        c.fillStyle='#3a9a4a';this.ell(c,R*.18,-o*R*.5,10*u,6*u);c.fillStyle='#4aaa5a';this.cir(c,R*.18+11*u,-o*R*.5-2*u,3.2*u);   /* the turtle */
        break;}
      case'korin':{
        c.fillStyle='rgba(255,255,255,.65)';for(const [dx,dy,r] of[[-.55,-.2,14],[.5,.25,12],[.1,.55,10]])this.cir(c,R*dx,R*dy,r*u);
        c.fillStyle='#cfc7b4';c.fillRect(-11*u,oy-74*u,22*u,80*u);c.fillStyle='#b4ab96';c.fillRect(2*u,oy-74*u,9*u,80*u);
        c.strokeStyle='rgba(90,80,60,.45)';c.lineWidth=1.2;for(let y=-66;y<4;y+=12){c.beginPath();c.moveTo(-11*u,oy+y*u);c.lineTo(11*u,oy+y*u);c.stroke();}
        c.fillStyle='#e8e0cc';this.ell(c,0,oy-76*u,20*u,7*u);c.fillStyle='#f4f0e4';this.ell(c,0,oy-78*u,13*u,4*u);
        c.fillStyle='#3a9a4a';for(const dx of[-.5,.55])this.cir(c,R*dx,-oy*.5,4*u);
        break;}
      case'capsule':{
        c.strokeStyle='rgba(90,110,140,.35)';c.lineWidth=1.4;for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(i*R*.28,-R);c.lineTo(i*R*.28,R);c.stroke();}
        c.fillStyle='#f4f7fb';c.beginPath();c.arc(0,oy,24*u,Math.PI,0);c.fill();c.fillRect(-24*u,oy,48*u,10*u);c.strokeStyle='#5a6a80';c.lineWidth=1.6;c.beginPath();c.arc(0,oy,24*u,Math.PI,0);c.stroke();c.strokeRect(-24*u,oy,48*u,10*u);
        c.fillStyle='#3a78d8';c.fillRect(-24*u,oy+2*u,48*u,4*u);c.fillStyle='#d83a3a';c.font='900 '+(11*u|0)+'px sans-serif';c.textAlign='center';c.fillText('CC',0,oy-6*u);
        c.strokeStyle='#8a96a8';c.lineWidth=1.4;c.beginPath();c.moveTo(14*u,oy-20*u);c.lineTo(20*u,oy-34*u);c.stroke();this.cir(c,20*u,oy-35*u,2.4*u);
        c.fillStyle='#f46a9a';const fy=Math.sin(t*2+ph)*3;c.fillRect(R*.36,oy+14*u+fy,20*u,8*u);c.fillStyle='#fff';c.fillRect(R*.36+3*u,oy+11*u+fy,10*u,4*u);   /* a hovering car */
        break;}
      case'grandkai':{
        for(let i=0;i<4;i++)this.tree(c,(i-1.5)*R*.34,-o*R*.5+(i&1)*7,.9*u,'#3a9040');
        c.fillStyle='#f0a020';c.fillRect(-26*u,oy-20*u,52*u,24*u);c.strokeStyle='#7a4a10';c.lineWidth=1.4;c.strokeRect(-26*u,oy-20*u,52*u,24*u);
        for(const [w,y2,col] of[[34,-20,'#3a64c8'],[24,-34,'#2d52b0']]){c.fillStyle=col;c.beginPath();c.moveTo(-w*u,oy+y2*u);c.lineTo(0,oy+(y2-14)*u);c.lineTo(w*u,oy+y2*u);c.closePath();c.fill();}
        c.fillStyle='#ffd23f';c.fillRect(-4*u,oy-2*u,8*u,6*u);c.fillStyle='#d8402a';c.beginPath();c.moveTo(0,oy-48*u);c.lineTo(10*u,oy-44*u+Math.sin(t*5)*1.5);c.lineTo(0,oy-40*u);c.fill();c.strokeStyle='#5a4a3a';c.beginPath();c.moveTo(0,oy-50*u);c.lineTo(0,oy-38*u);c.stroke();
        break;}
      case'shrine':{
        c.strokeStyle='rgba(60,40,90,.4)';c.lineWidth=2;for(let r=.3;r<.95;r+=.22){c.beginPath();c.arc(0,0,R*r,0,TAU);c.stroke();}
        for(const [dx,dy] of[[-.62,-.5],[.62,-.5],[-.62,.5],[.62,.5]]){c.fillStyle='#8a7eaa';c.fillRect(R*dx-4*u,R*dy-14*u,8*u,18*u);c.fillStyle='#a89cc6';c.fillRect(R*dx-4*u,R*dy-14*u,8*u,3*u);}
        c.fillStyle='#6a5e8a';this.cir(c,0,0,26*u);c.fillStyle='#8a7eaa';this.cir(c,0,-2*u,22*u);
        const gl=.6+.4*Math.sin(t*2.4+ph);c.save();c.globalCompositeOperation='lighter';for(let i=0;i<7;i++){const a=i/7*TAU+t*.4,px=Math.cos(a)*13*u,py=Math.sin(a)*8*u-2*u;GLOW.at(c,px,py,9*u,'#ffaa28',.5*gl);}c.restore();
        for(let i=0;i<7;i++){const a=i/7*TAU+t*.4;c.fillStyle='#ff9d1c';this.cir(c,Math.cos(a)*13*u,Math.sin(a)*8*u-2*u,3*u);c.fillStyle='#d22';this.cir(c,Math.cos(a)*13*u,Math.sin(a)*8*u-2*u,1*u);}
        break;}
      case'nimbus':{
        c.fillStyle='rgba(255,255,255,.55)';for(let i=0;i<9;i++){const a=i/9*TAU;this.cir(c,Math.cos(a)*R*.86,Math.sin(a)*R*.86,R*.2);}
        c.fillStyle='#fffbe0';this.cir(c,-R*.12,oy*.7,R*.26);this.cir(c,R*.14,oy*.7,R*.22);this.cir(c,0,oy*.7+R*.1,R*.24);
        c.save();c.globalCompositeOperation='lighter';for(let i=0;i<4;i++){const a=t*1.4+i*1.6+ph;GLOW.at(c,Math.cos(a)*R*.5,Math.sin(a)*R*.5,10*u,'#ffe26a',.8);}c.restore();
        break;}
      case'temple':{
        for(let i=0;i<4;i++){const a=i/4*TAU+.78,cx=Math.cos(a)*R*.62,cy=Math.sin(a)*R*.62;c.fillStyle='#f4f0f8';c.fillRect(cx-4*u,cy-24*u,8*u,28*u);c.fillStyle='#fff';c.fillRect(cx-6*u,cy-26*u,12*u,4*u);c.fillRect(cx-6*u,cy+2*u,12*u,3*u);}
        c.fillStyle='#8a8aa4';this.cir(c,0,0,16*u);c.fillStyle='#a8a8c4';this.cir(c,0,-2*u,13*u);
        c.strokeStyle='#8ad0ff';c.lineWidth=3*u;c.beginPath();c.moveTo(0,-4*u);c.lineTo(0,-30*u);c.stroke();c.strokeStyle='#e8f4ff';c.lineWidth=1.2*u;c.beginPath();c.moveTo(0,-4*u);c.lineTo(0,-30*u);c.stroke();   /* the sword in the stone */
        c.save();c.globalCompositeOperation='lighter';GLOW.at(c,0,-20*u,20*u,'#8ad0ff',.4+.2*Math.sin(t*3+ph));c.restore();
        break;}
    }
    /* spirit lights rising from the island */
    c.save();c.globalCompositeOperation='lighter';
    for(let i=0;i<3;i++){const r=(t*.35+i/3+ph)%1;GLOW.at(c,Math.sin(r*6+i*2)*R*.5,-R*.2-r*R*.9,7+4*(1-r),'#fff0b0',.7*(1-r));}
    c.restore();
    c.restore();
  },
  /* small things floating in the cloud sea away from the body: rocks with a tuft, a lantern, a tiny pagoda */
  decor(c,cx,cy,vw,vh,t){
    const C=620,g0=Math.floor((cx-100)/C),g1=Math.floor((cx+vw+100)/C),h0=Math.floor((cy-300)/C),h1=Math.floor((cy+vh+150)/C);
    for(let gx=g0;gx<=g1;gx++)for(let gy=h0;gy<=h1;gy++){
      const h=hash(gx*13+5,gy*7+3);if(h>.34)continue;
      const x=(gx+.15+hash(gx+2,gy+9)*.7)*C,y=(gy+.15+hash(gx+8,gy+1)*.7)*C;
      if(Math.abs(x)>Snake.XMAX||Math.abs(y-Snake.f(x))<Snake.HW+120)continue;
      let near=false;for(const I of Snake.isleNear(x)){if(Snake.inIsle(I,x,y,-260)<1.25||(I.road&&Snake.roadNear(I,x,y)[2]<ISLE_RW+120)){near=true;break;}}if(near)continue;
      const k=Math.floor(h*3/.34),bob=Math.sin(t*.8+h*40)*3;
      c.save();c.translate(x,y+bob);c.fillStyle='rgba(150,60,0,.25)';this.ell(c,0,26,26,9);
      c.fillStyle='#6a4a30';c.beginPath();c.moveTo(-22,0);c.lineTo(-10,24);c.lineTo(0,16);c.lineTo(11,26);c.lineTo(22,0);c.closePath();c.fill();
      c.fillStyle=k===1?'#d8d0c0':'#7fd05a';this.ell(c,0,-1,23,9);
      if(k===0)this.tree(c,-4,-2,.9,'#3f9e4a');
      else if(k===1){c.strokeStyle='#8a4a2a';c.lineWidth=2;c.beginPath();c.moveTo(0,-4);c.lineTo(0,-30);c.stroke();c.fillStyle='#e03a3a';c.beginPath();c.ellipse(0,-32,6,8,0,0,TAU);c.fill();c.fillStyle='rgba(255,220,120,.9)';this.cir(c,0,-32,3);}   /* lantern */
      else{c.fillStyle='#f4f0e2';c.fillRect(-8,-16,16,14);c.fillStyle='#d83a3a';c.beginPath();c.moveTo(-13,-16);c.lineTo(0,-28);c.lineTo(13,-16);c.closePath();c.fill();c.fillStyle='#ffd23f';this.cir(c,0,-30,2);}   /* pagoda */
      c.restore();
    }
  },
  /* the sky above the entities: drifting mist, the Flying Nimbus now and then (the bird flocks are just shadows now, see Ambient.flockShadows) */
  air(c,cx,cy,vw,vh,t){
    c.save();c.lineCap='round';c.lineJoin='round';
    for(let i=0;i<4;i++){   /* mist banks slipping past faster than the ground */
      const per=vw+900,x=cx+((i*per*.37+t*(16+i*6)-cx*.45)%per+per)%per-450,y=cy+vh*(.1+.27*i)+Math.sin(t*.3+i*2)*10,w=300+i*60;
      const gr=c.createRadialGradient(x,y,10,x,y,w);gr.addColorStop(0,'rgba(255,248,224,.2)');gr.addColorStop(1,'rgba(255,248,224,0)');c.fillStyle=gr;c.fillRect(x-w,y-w*.4,w*2,w*.8);
    }
    Ambient.nimbus(c,cx,cy,vw,vh,t,1,0);   /* Flying Nimbus: a little golden cloud crossing the sky every ~80 s */
    c.restore();
  },
  /* sparkles running along the body, and a soft band of light travelling down it */
  body(c,x0,x1,t){
    c.save();c.lineCap='round';
    const per=2600,off=(t*210)%per;
    for(let k=Math.floor((x0-off-500)/per);k<=Math.ceil((x1-off)/per);k++){
      const xa=k*per+off;if(xa>x1||xa+500<x0)continue;
      for(const [w,a] of[[1.2,.05],[.9,.07],[.6,.09],[.34,.12]]){
        c.strokeStyle='rgba(255,255,255,'+a+')';c.lineWidth=Snake.HW*w;c.beginPath();
        const s0=Math.max(x0,xa),s1=Math.min(x1,xa+480);c.moveTo(s0,Snake.f(s0));for(let x=s0+24;x<s1+24;x+=24){const xx=Math.min(x,s1);c.lineTo(xx,Snake.f(xx));}c.stroke();
      }
    }
    c.fillStyle='#fff';
    for(let i=Math.ceil(x0/90);i<=Math.floor(x1/90);i++){
      const h=hash(i,31);if(h>.22)continue;const ph=(t*.8+h*9)%1,a=Math.sin(ph*Math.PI);if(a<.05)continue;
      const x=i*90+h*60,y=Snake.f(x)+(hash(i,5)-.5)*Snake.HW*1.2,r=2+3*a;c.globalAlpha=a*.9;c.fillRect(x-r,y-.8,r*2,1.6);c.fillRect(x-.8,y-r,1.6,r*2);
    }
    c.restore();
  }
};
