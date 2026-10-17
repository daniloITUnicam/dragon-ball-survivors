'use strict';
/* ====== ObjLife: small animated life on the map's props (visual only): a spider crawling round a barrel or hanging from its lid, a gull or a crow perched on a crate,
   a candle and moths on a gravestone, flies over a heap of bones, a cat asleep on the hay, a crab scuttling at the foot of a crate, twinkling crystals, flickering lanterns,
   lava that spits sparks. Called by the renderer right after a prop is drawn. Coordinates are in art units (origin: bottom centre of the sprite), U world px each. ====== */
const ObjLife={
  /* the little critters, drawn at world scale s */
  spider(c,x,y,ang,t,s){
    c.save();c.translate(x,y);c.rotate(ang);c.scale(s,s);c.lineCap='round';c.lineJoin='round';
    c.strokeStyle='#120a14';c.lineWidth=.9;
    for(let side=-1;side<=1;side+=2)for(let i=0;i<4;i++){
      const a0=(i-1.5)*.62,ph=Math.sin(t*16+i*1.9+(side>0?Math.PI:0))*.4,kx=Math.cos(a0)*2.6,ky=side*(2.2+Math.abs(Math.sin(a0))*1.6);
      c.beginPath();c.moveTo(.4,0);c.lineTo(kx*.7+ph,side*2.5);c.lineTo(kx*1.7+ph*2,ky+side*1.8);c.stroke();
    }
    c.fillStyle='#2a1624';c.beginPath();c.ellipse(-1.1,0,2.5,2,0,0,TAU);c.fill();c.beginPath();c.ellipse(1.7,0,1.5,1.3,0,0,TAU);c.fill();
    c.fillStyle='#a23a4a';c.beginPath();c.arc(-1.3,0,.9,0,TAU);c.fill();   /* the mark on its back */
    c.fillStyle='#ff5a4a';c.fillRect(2.4,-.8,.7,.7);c.fillRect(2.4,.1,.7,.7);
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
    const U=3.1*(sp.sc||1),f=b.f||1,hb=hash(Math.round(b.x),Math.round(b.y)),ph=hb*40,ox=b.x,oy=b.y+2;
    const P=(ax,ay)=>[ox+f*ax*U,oy+ay*U];
    switch(kind){
      case'barrel':case'crate':case'crate2':{
        const top=kind==='barrel'?-16:kind==='crate2'?-22:-11,hw=kind==='barrel'?5:5.5,yb=-2.5,yt=kind==='barrel'?-13:kind==='crate2'?-20:-9;
        const v=hb<.32?'crawl':hb<.5&&kind==='barrel'?'hang':hb<.68?'bird':hb<.84&&theme==='beach'?'crab':'none';
        if(v==='crawl'){   /* the spider walks the rim of the face, pausing now and then */
          const per=2*(hw*2+(yb-yt)*-1),W2=hw*2,H2=yb-yt,sp0=4.2,u=((t*sp0+ph)%per+per)%per;
          let ax,ay,dx,dy;
          if(u<H2){ax=-hw;ay=yb-u;dx=0;dy=-1;}else if(u<H2+W2){ax=-hw+(u-H2);ay=yt;dx=1;dy=0;}else if(u<2*H2+W2){ax=hw;ay=yt+(u-H2-W2);dx=0;dy=1;}else{ax=hw-(u-2*H2-W2);ay=yb;dx=-1;dy=0;}
          const [wx,wy]=P(ax,ay);this.spider(c,wx,wy,Math.atan2(dy,dx*f),t+ph,2.7);
        }else if(v==='hang'){   /* hanging from its thread, bobbing */
          const L=4+3.2*(1+Math.sin(t*.9+ph)),[wx,wy0]=P(1.5,top+.5),wy=wy0+L*U*.4;
          c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=.7;c.beginPath();c.moveTo(wx,wy0);c.lineTo(wx,wy);c.stroke();
          this.spider(c,wx,wy+2,Math.PI/2,t*.2+ph,2.5);
        }else if(v==='bird'){
          const [wx,wy]=P(0,top+.5),col=theme==='beach'||theme==='plains'||theme==='arena'?['#f4f4f0','#b8bcc4','#f0a030']:['#26222c','#3c3846','#d0b060'];
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
        if(hb<.4){const [wx,wy]=P(0,kind==='tomb2'?-17:-16.5);this.bird(c,wx,wy,hb<.2?1:-1,t,ph,theme==='beach'?['#f4f4f0','#b8bcc4','#f0a030']:['#26222c','#3c3846','#d0b060'],2.4);}
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
      case'lavarock':{
        const [wx,wy]=P(0,-5);c.save();c.globalCompositeOperation='lighter';GLOW.at(c,wx,wy,40*(.85+.15*Math.sin(t*3+ph)),'#ff6a1a',.5);c.restore();
        if(A&&Math.random()<.9*A.dt)A.puffAt('ember',wx+(Math.random()-.5)*20,wy-6);
        break;}
      case'spikes':{
        if(hb<.5){const [wx,wy]=P(-5+hb*20,-11);this.fly(c,wx,wy,t,ph,6);}
        break;}
      case'agave':case'cactus':{
        if(hb<.3&&theme==='beach'){const [wx,wy]=P(-8,-1);this.crab(c,wx,wy+1,1,t+ph,1.9);}   /* a crab shelters in the shade */
        break;}
    }
  }
};
