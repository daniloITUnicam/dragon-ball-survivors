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
  /* a small island: shadow on the clouds, rock underside, the top with a lighter rim, then its landmark (drawn outward, away from the body) */
  isle(c,I,t){
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
      let near=false;for(const I of Snake.islandsIn(x-400,x+400))if(Math.hypot(I.x-x,I.y-y)<I.r+160){near=true;break;}if(near)continue;
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
  /* the sky above the entities: bird flocks, drifting mist, the Flying Nimbus now and then */
  air(c,cx,cy,vw,vh,t){
    c.save();c.lineCap='round';c.lineJoin='round';
    Ambient.flocks(c,cx,cy,vw,vh,t,3,1,0);   /* the gull flocks (shared with the open-sky maps, see Ambient.flocks) */
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
