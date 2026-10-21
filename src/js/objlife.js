'use strict';
/* ====== ObjLife: small animated life on the map's props (visual only): a spider wandering over a barrel (walking, rearing up, grooming) or hanging from its lid, a crow perched on a crate,
   a candle and moths on a gravestone, flies over a heap of bones, a cat asleep on the hay, a crab scuttling at the foot of a crate, twinkling crystals, flickering lanterns,
   lava that spits sparks. Called by the renderer right after a prop is drawn. Coordinates are in art units (origin: bottom centre of the sprite), U world px each. ====== */
const ObjLife={
  /* the little critters, drawn at world scale s */
  _sm(x){x=x<0?0:x>1?1:x;return x*x*(3-2*x);},
  _bump(u,a,d){return u<a||u>a+d?0:Math.sin((u-a)/d*Math.PI);},   /* 0 -> 1 -> 0 over [a, a+d] */
  /* ---- how a spider behaves (a pure function of time, so it needs no state): a cycle of 6.5 s = turn, walk to a new spot (legs follow the distance covered),
     stop and fidget: rear up on its hind legs, groom its front legs, look around, twitch a leg. Then it sets off again. ---- */
  crawl(t,sd,hw,yt,yb){
    const T=6.5,k=Math.floor(t/T),u=t-k*T,H=this._sm.bind(this),bp=this._bump;
    const wp=n=>[(hash(n*7+sd,3)*2-1)*(hw-1.3),yt+1.4+hash(n*5+sd,11)*(yb-yt-1.6)];
    const Z=wp(k-1),A=wp(k),B=wp(k+1),a0=Math.atan2(A[1]-Z[1],A[0]-Z[0]),a1=Math.atan2(B[1]-A[1],B[0]-A[0]);
    let da=a1-a0;da-=Math.PI*2*Math.round(da/(Math.PI*2));
    const dist=Math.hypot(B[0]-A[0],B[1]-A[1]),w=Math.min(3,Math.max(.6,dist/3.9)),TT=.5;
    const o={t,x:A[0],y:A[1],h:a0,amp:0,lp:0,up:0,gr:0,tw:0,tl:0,br:Math.sin(t*2.1+sd)*.5};
    if(u<TT){o.h=a0+da*H(u/TT);}
    else if(u<TT+w){const p=(u-TT)/w,e=H(p);o.h=a1;o.x=A[0]+(B[0]-A[0])*e;o.y=A[1]+(B[1]-A[1])*e;o.amp=Math.min(1,Math.sin(p*Math.PI)*2.4);o.lp=dist*e*2.1;}
    else{
      const ti=u-TT-w,v=Math.floor(hash(k+sd,2)*4),r=hash(k,sd+9);o.x=B[0];o.y=B[1];o.h=a1;
      const ev=v===0?[['up',.3,1.5],['look',2.0,.8]]:v===1?[['gr',.3,1.2],['up',1.7,1.2]]:v===2?[['look',.3,.8],['look',1.4,.9],['tw',2.5,.35]]:[['tw',.8+r,.35],['tw',2.3,.35]];
      for(const [ty,a,d] of ev){const b=bp(ti,a,d);if(!b)continue;
        if(ty==='up')o.up=Math.max(o.up,H(b*1.4));else if(ty==='gr')o.gr=Math.max(o.gr,H(b*1.4));
        else if(ty==='look')o.h+=(r<.5?1:-1)*(.35+r*.5)*b*(a>1.5?-1:1);
        else{o.tw=Math.max(o.tw,b);o.tl=Math.floor(hash(k+7,a*10|0)*8);}}
    }
    return o;
  },
  /* a spider on a thread: lets itself down, swings and turns, climbs back up in jerks, rests at the lid */
  dangle(t,sd){
    const T=14,k=Math.floor(t/T),u=t-k*T,H=this._sm.bind(this),dep=3.2+hash(k+sd,5)*3.6;
    const o={t,L:0,h:Math.PI/2,amp:0,lp:0,up:0,gr:0,tw:0,tl:0,sw:0,br:Math.sin(t*2.3+sd)*.5};
    if(u<2.6){const p=H(u/2.6);o.L=dep*p;o.amp=.8*Math.sin(p*Math.PI)+.15;o.lp=t*7;}
    else if(u<8.4){const en=H(Math.min(1,(u-2.6)/.9))*H(Math.min(1,(8.4-u)/.9));   /* settles in and out of the swing */
      o.L=dep+Math.sin(t*1.3+sd)*.35*en;o.sw=Math.sin(t*.9+sd)*.6*en;
      const ti=u-2.6;o.up=this._bump(ti,1.2,1.4)*.9;o.tw=this._bump(ti,3.6,.4);o.tl=Math.floor(hash(k,sd+3)*8);o.gr=this._bump(ti,4.4,1.2)*(hash(k,sd)<.5?1:0);
      o.h=Math.PI/2+Math.sin(t*.55+sd)*.3*en;}
    else if(u<8.4+.7){const p=H((u-8.4)/.7);o.L=dep;o.h=Math.PI/2-Math.PI*p;o.amp=.4;o.lp=t*6;}
    else if(u<11.4){const p=(u-9.1)/2.3,st=Math.floor(p*7),fr=p*7-st,m=(st+H(Math.min(1,fr*1.6)))/7;   /* up in little jerks */
      o.L=dep*(1-Math.min(1,m));o.h=-Math.PI/2;o.amp=.9;o.lp=t*12;}
    else{o.L=0;o.h=-Math.PI/2+Math.PI*H((u-12.4)/.8);o.tw=this._bump(u,11.7,.4);o.tl=Math.floor(hash(k,sd+8)*8);o.amp=0;}
    return o;
  },
  spider(c,x,y,ang,s,o){
    const lp=o.lp||0,amp=o.amp||0,up=o.up||0,gr=o.gr||0,tw=o.tw||0,t=o.t||0,br=o.br||0;
    c.save();c.translate(x,y);c.rotate(ang);c.scale(s,s);c.lineCap='round';c.lineJoin='round';
    const PHI=[.8,1.4,1.95,2.55];
    c.strokeStyle='#120a14';c.lineWidth=.85;c.beginPath();
    for(let sd=-1;sd<=1;sd+=2)for(let i=0;i<4;i++){
      const idx=i+(sd>0?4:0),front=i<2,bx=1.7-i*.75+up*.4,by=sd*.9;
      let ph=PHI[i]+Math.sin(lp+((i+(sd>0?1:0))&1)*Math.PI)*.42*amp*(front?1:-1)*.85,len=1+(front?up*.5:0);
      if(front){ph-=up*.45;ph-=gr*(.5+Math.sin(t*26+i)*.18);ph+=Math.sin(t*5+idx)*.04;}
      if(tw>0&&idx===o.tl)ph+=Math.sin(t*44)*.32*tw;
      const dx=Math.cos(ph),dy=sd*Math.sin(ph),kx=bx+dx*2.5*len,ky=by+dy*2.5*len-sd*.5;
      const f2=ph+(front?.4:-.4),fx=kx+Math.cos(f2)*2.3*len,fy=ky+sd*Math.sin(f2)*2.3*len+sd*.3;
      c.moveTo(bx,by);c.lineTo(kx,ky);c.lineTo(fx,fy);
    }
    c.stroke();
    c.fillStyle='#2a1624';c.beginPath();c.ellipse(-2.5-up*.2,0,3.1+br*.08,2.5+br*.08,0,0,TAU);c.fill();   /* abdomen */
    c.beginPath();c.ellipse(1.2+up*.5,0,2.1+up*.2,1.7+up*.15,0,0,TAU);c.fill();                          /* head and chest */
    c.fillStyle='#a23a4a';c.beginPath();c.ellipse(-2.7,0,1.1,.8,0,0,TAU);c.fill();                       /* the mark on its back */
    c.fillStyle='#ff5a4a';c.fillRect(2.7+up*.5,-.9,.6,.6);c.fillRect(2.7+up*.5,.3,.6,.6);c.fillRect(2.3+up*.5,-.4,.5,.5);
    c.restore();
  },
  bird(c,x,y,face,t,ph,col,s,sit){   /* a perched gull (white) or crow (dark): head bobs, wing twitches, sometimes it hops */
    const peck=Math.max(0,Math.sin(t*1.1+ph*3)-.78)*4.5,flap=Math.max(0,Math.sin(t*.45+ph)-.93)*14,hop=Math.max(0,Math.sin(t*.7+ph*5)-.96)*30;
    c.save();c.translate(x,y-hop*.12);c.scale(face*s,s);
    c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.ellipse(0,1.4+hop*.12,4,1,0,0,TAU);c.fill();
    c.strokeStyle='#e8a040';c.lineWidth=.8;c.beginPath();c.moveTo(-.8,-1);c.lineTo(-.8,1);c.moveTo(.8,-1);c.lineTo(.8,1);c.stroke();
    c.fillStyle=col[0];c.beginPath();c.ellipse(0,-3.2,4,2.6,-.12,0,TAU);c.fill();               /* body */
    c.fillStyle=col[1];c.beginPath();c.ellipse(-1,-3.6-flap*.08,3,1.7,-.2-flap*.05,0,TAU);c.fill();   /* wing */
    c.fillStyle=col[0];c.beginPath();c.arc(3.2,-5.3+peck,1.7,0,TAU);c.fill();                    /* head */
    c.fillStyle=col[2];c.beginPath();c.moveTo(4.6,-5.5+peck);c.lineTo(6.6,-5+peck);c.lineTo(4.6,-4.6+peck);c.fill();
    c.fillStyle='#111';c.fillRect(3.5,-5.9+peck,.7,.7);
    c.fillStyle=col[1];c.beginPath();c.moveTo(-3.6,-3.4);c.lineTo(-6,-2.6);c.lineTo(-3.4,-2.2);c.fill();   /* tail */
    c.restore();
  },
  cat(c,x,y,face,t,ph,s){
    const br=Math.sin(t*1.6+ph)*.35;
    c.save();c.translate(x,y);c.scale(face*s,s);
    c.fillStyle='#d98a3a';c.beginPath();c.ellipse(0,-2.4-br*.3,4.6,2.6+br*.3,0,0,TAU);c.fill();
    c.fillStyle='#ee9f4c';c.beginPath();c.ellipse(-.6,-3.2,3.4,1.6,0,0,TAU);c.fill();
    c.fillStyle='#d98a3a';c.beginPath();c.arc(3.8,-3.4,2.2,0,TAU);c.fill();
    c.beginPath();c.moveTo(2.6,-5.2);c.lineTo(3.2,-7.2);c.lineTo(4.4,-5.4);c.fill();c.beginPath();c.moveTo(4.4,-5.4);c.lineTo(5.6,-7);c.lineTo(5.6,-4.6);c.fill();
    c.strokeStyle='#4a2a10';c.lineWidth=.7;c.beginPath();c.moveTo(3.5,-3.6);c.lineTo(4.4,-3.6);c.moveTo(5,-3.5);c.lineTo(5.5,-3.5);c.stroke();   /* closed eyes */
    c.strokeStyle='#d98a3a';c.lineWidth=1.5;c.beginPath();c.moveTo(-4.4,-2);c.quadraticCurveTo(-8,-2+Math.sin(t*2.2+ph)*2.2,-7,-5.5+Math.sin(t*2.2+ph)*1.5);c.stroke();   /* the tail */
    c.restore();
  },
  crab(c,x,y,face,t,s){
    const w=Math.sin(t*18)*.5;
    c.save();c.translate(x,y);c.scale(s,s);
    c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.ellipse(0,1.2,4,1,0,0,TAU);c.fill();
    c.strokeStyle='#b8321e';c.lineWidth=.8;c.lineCap='round';
    for(let i=-1;i<=1;i++)for(const sd of[-1,1]){c.beginPath();c.moveTo(sd*2,0);c.lineTo(sd*(3.4+i*.2),1+w*i*sd);c.lineTo(sd*(4.6+i*.2),2+w*i*sd);c.stroke();}
    c.fillStyle='#e04a2e';c.beginPath();c.ellipse(0,-.5,3.2,2.1,0,0,TAU);c.fill();c.fillStyle='#f27a54';c.beginPath();c.ellipse(-.4,-1,2,1,0,0,TAU);c.fill();
    c.fillStyle='#e04a2e';for(const sd of[-1,1]){const o=Math.sin(t*5+sd)*.8;c.beginPath();c.arc(sd*4.4,-2.6+o,1.7,0,TAU);c.fill();c.fillStyle='#b8321e';c.fillRect(sd*4.4-.4,-3+o,.8,1.2);c.fillStyle='#e04a2e';}
    c.fillStyle='#fff';c.fillRect(-1.4,-3.2,.9,1.1);c.fillRect(.6,-3.2,.9,1.1);c.fillStyle='#111';c.fillRect(-1.2,-3,.5,.6);c.fillRect(.8,-3,.5,.6);
    c.restore();
  },
  fly(c,x,y,t,ph,r){
    const a=t*7+ph,b=t*5.3+ph*2;
    const fx=x+Math.cos(a)*r+Math.sin(b*1.7)*r*.4,fy=y+Math.sin(a*1.3)*r*.6+Math.cos(b)*r*.3;
    c.fillStyle='#16101a';c.fillRect(fx-1,fy-1,2.2,2.2);c.fillStyle='rgba(220,235,255,'+(.5+.4*Math.sin(t*90+ph))+')';c.fillRect(fx-2.8,fy-2.4,2.4,1.4);c.fillRect(fx+.4,fy-2.4,2.4,1.4);
  },
  flame(c,x,y,t,ph,s,col){   /* a candle or lantern flame with an additive glow */
    const fl=.8+.2*Math.sin(t*17+ph)+.1*Math.sin(t*29+ph*2);
    c.save();c.globalCompositeOperation='lighter';GLOW.at(c,x,y-1.5*s,13*s*fl,col||'#ffb13b',.8);GLOW.at(c,x,y-1.5*s,5*s*fl,'#fff0b0',.9);c.restore();
    c.fillStyle='#ffd23f';c.beginPath();c.moveTo(x-1.1*s,y);c.quadraticCurveTo(x-1.4*s,y-2.6*s*fl,x+Math.sin(t*9+ph)*.5*s,y-4.4*s*fl);c.quadraticCurveTo(x+1.4*s,y-2.4*s*fl,x+1.1*s,y);c.fill();
    c.fillStyle='#fff6c0';c.fillRect(x-.4*s,y-1.9*s,.8*s,1.9*s);
  },
  star(c,x,y,r,a){c.globalAlpha=a;c.fillRect(x-r,y-.5,r*2,1);c.fillRect(x-.5,y-r,1,r*2);c.globalAlpha=1;},
  /* b = the obstacle {x,y,f}, sp = its painted sprite {kind,sc}, A = the Ambient object (for particles) */
  draw(c,b,sp,t,theme,A){
    const kind=sp&&sp.kind;if(!kind)return;
    const gull=theme==='beach'||theme==='plains'||theme==='arena',U=3.1*(sp.sc||1),f=b.f||1,hb=hash(Math.round(b.x),Math.round(b.y)),ph=hb*40,ox=b.x,oy=b.y+2;
    const P=(ax,ay)=>[ox+f*ax*U,oy+ay*U];
    switch(kind){
      case'barrel':case'crate':case'crate2':{
        const top=kind==='barrel'?-16:kind==='crate2'?-22:-11,hw=kind==='barrel'?5:5.5,yb=-2.5,yt=kind==='barrel'?-13:kind==='crate2'?-20:-9;
        const v=hb<.32?'crawl':hb<.5&&kind==='barrel'?'hang':hb<.68&&!gull?'bird':hb<.84&&theme==='beach'?'crab':'none';
        if(v==='crawl'){   /* wanders over the face of it: walks, stops, rears up, grooms, looks round, walks again */
          const o=this.crawl(t,Math.round(ph*131),hw,yt,yb),[wx,wy]=P(o.x,o.y);
          this.spider(c,wx,wy,Math.atan2(Math.sin(o.h),Math.cos(o.h)*f),2.7,o);
        }else if(v==='hang'){   /* lets itself down on its thread, swings, climbs back up */
          const o=this.dangle(t,Math.round(ph*131)),[wx,wy0]=P(1.5,top+.5),L=o.L*U*.55,sw=Math.sin(o.sw)*1.4,wy=wy0+L+6,sx=wx+sw*2;
          c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=.7;c.beginPath();c.moveTo(wx,wy0);c.lineTo(sx,wy);c.stroke();
          this.spider(c,sx,wy,o.h+o.sw*.5,2.5,o);
        }else if(v==='bird'){
          const [wx,wy]=P(0,top+.5),col=['#26222c','#3c3846','#d0b060'];
          this.bird(c,wx,wy,hb<.6?1:-1,t,ph,col,2.5);
        }else if(v==='crab'){   /* a crab scuttles back and forth along the foot of it */
          const q=Math.sin(t*.45+ph),[wx,wy]=P(q*10,3);this.crab(c,wx,wy,Math.cos(t*.45+ph)>0?1:-1,t+ph,2.2);
        }
        break;}
      case'tomb':case'tomb2':{
        const [cx,cy]=P(6.5,-.5);
        c.fillStyle='#e8e0cc';c.fillRect(cx-1.6,cy-4.2,3.2,4.2);c.fillStyle='#b8b09c';c.fillRect(cx+.8,cy-4.2,.8,4.2);
        this.flame(c,cx,cy-4.2,t,ph,2.6);
        for(let i=0;i<2;i++){const a=t*(2.1+i*.7)+ph+i*3,r=6+3*Math.sin(t*.8+i);c.fillStyle='rgba(255,236,170,.9)';c.fillRect(cx+Math.cos(a)*r-.6,cy-6+Math.sin(a*1.3)*r*.6-.6,1.3,1.3);}   /* moths round the flame */
        if(hb<.4&&theme!=='beach'){const [wx,wy]=P(0,kind==='tomb2'?-17:-16.5);this.bird(c,wx,wy,hb<.2?1:-1,t,ph,['#26222c','#3c3846','#d0b060'],2.4);}
        break;}
      case'skullpile':{
        const [wx,wy]=P(0,-9);for(let i=0;i<3;i++)this.fly(c,wx,wy,t,ph+i*2.1,10+i*2);
        if(theme==='hell'){const e=Math.sin(t*3+ph)>.55;if(e){c.save();c.globalCompositeOperation='lighter';const [a,bb]=P(-1.6,-8),[a2,b2]=P(1.6,-8);GLOW.at(c,a,bb,5,'#ff3a1a',.9);GLOW.at(c,a2,b2,5,'#ff3a1a',.9);c.restore();}}
        break;}
      case'haybale':{
        if(hb<.5){const [wx,wy]=P(0,-9.5);this.cat(c,wx,wy,hb<.25?1:-1,t,ph,2.5);const z=(t*.5+ph)%1;c.fillStyle='rgba(255,255,255,'+(1-z)*.9+')';c.font='900 '+(6+z*4|0)+'px sans-serif';c.fillText('z',wx+f*(8+z*6),wy-8-z*14);}
        break;}
      case'fence':{
        if(hb<.55){const [wx,wy]=P(hb<.28?-6:6,-12.5);this.bird(c,wx,wy,hb<.28?1:-1,t,ph,['#3a3030','#5a4a46','#d0b060'],2.4);}
        break;}
      case'crystalN':case'crystalV':{
        const col=kind==='crystalN'?'#bff7ff':'#d8ccff',gl=kind==='crystalN'?'#5ad8ff':'#8a6aff';
        const [gx,gy]=P(0,-9);c.save();c.globalCompositeOperation='lighter';GLOW.at(c,gx,gy,34*(.85+.15*Math.sin(t*2+ph)),gl,.45+.2*Math.sin(t*1.6+ph));
        c.fillStyle=col;for(let i=0;i<3;i++){const k=(t*.6+ph*.1+i/3)%1,[sx,sy]=P(-5+i*5,-8-i*4);this.star(c,sx,sy,2+4*Math.sin(k*Math.PI),Math.sin(k*Math.PI));}
        c.restore();break;}
      case'lantern':{const [wx,wy]=P(0,-8);this.flame(c,wx,wy+2,t,ph,2.4,'#ffd86a');break;}
      case'spikes':{
        if(hb<.5){const [wx,wy]=P(-5+hb*20,-11);this.fly(c,wx,wy,t,ph,6);}
        break;}
      case'agave':case'cactus':{
        if(hb<.3&&theme==='beach'){const [wx,wy]=P(-8,-1);this.crab(c,wx,wy+1,1,t+ph,1.9);}   /* a crab shelters in the shade */
        break;}
    }
  }
};
