'use strict';
/* ====== drawing of the map events (see events.js): the animated markers on the ground and the sky tint / Full Moon ====== */
Object.assign(Renderer.prototype,{
  drawEvents(g,t){
    const ev=g.ev;if(!ev||!ev.spots.length)return;
    const ctx=this.ctx,p=g.p,sm=(a)=>a*a*(3-2*a);
    for(const s of ev.spots){
      if(s.t<0)continue;
      const k=Math.min(1,s.t/s.tel),x=s.x,y=s.y,col=s.col,ph=s.ph,fall=(1-k)*(1-k);
      ctx.save();ctx.translate(x,y);
      /* ground: a soft shadow + a dashed ring that closes in */
      ctx.globalAlpha=.35+.35*k;ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(0,0,10+16*k,4+6*k,0,0,TAU);ctx.fill();
      ctx.globalAlpha=.85;ctx.strokeStyle=col;ctx.lineWidth=1.6;ctx.setLineDash([5,5]);ctx.lineDashOffset=-t*30;ctx.beginPath();ctx.ellipse(0,0,30-10*k,12-4*k,0,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
      switch(s.kind){
        case'seed':{   /* a Saibaman seedling grows out of the soil */
          ctx.fillStyle='#3a2a18';ctx.beginPath();ctx.ellipse(0,0,13,5,0,0,TAU);ctx.fill();
          const h=4+k*22,sw=Math.sin(t*3+ph)*1.6*k,sh=k>.85?(Math.random()-.5)*2.4:0;ctx.translate(sh,0);
          ctx.strokeStyle='#58b03c';ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(sw,-h*.5,sw*1.4,-h);ctx.stroke();
          ctx.fillStyle='#7fd05a';for(const d of[-1,1]){ctx.beginPath();ctx.ellipse(d*5*(.4+k),-h*.45,4+3*k,2+1.4*k,d*-.5,0,TAU);ctx.fill();}
          if(k>.5){const r=2.5+k*5.5;ctx.fillStyle='#8be05a';ctx.beginPath();ctx.arc(sw*1.4,-h-r*.6,r,0,TAU);ctx.fill();ctx.fillStyle='#3f8a2e';ctx.beginPath();ctx.arc(sw*1.4-r*.3,-h-r*.9,r*.45,0,TAU);ctx.fill();
            if(k>.78){ctx.fillStyle='#ff4a2a';ctx.fillRect(sw*1.4-r*.55,-h-r*.7,2,2);ctx.fillRect(sw*1.4+r*.2,-h-r*.7,2,2);}}
          break;}
        case'pod':case'meteor':{   /* Frieza's attack pod / a burning rock falling from the sky */
          const oy=-fall*520;ctx.translate(0,oy);
          GLOW.at(ctx,0,-26,34,s.kind==='pod'?'#ffb04a':'#ff7a2a',.85);
          ctx.fillStyle=s.kind==='pod'?'#dfe6f2':'#7a4426';ctx.strokeStyle=s.kind==='pod'?'#8a94ac':'#3a1c0c';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-12,s.kind==='pod'?11:10,14,0,0,TAU);ctx.fill();ctx.stroke();
          if(s.kind==='pod'){ctx.fillStyle='#7a3a8a';ctx.beginPath();ctx.ellipse(0,-15,6,5,0,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillRect(-3,-18,3,2);}
          else{ctx.fillStyle='#ff9a3a';ctx.beginPath();ctx.arc(-3,-14,3,0,TAU);ctx.arc(4,-9,2.2,0,TAU);ctx.fill();}
          ctx.globalCompositeOperation='lighter';const gr=ctx.createLinearGradient(0,-26,0,-110);gr.addColorStop(0,'rgba(255,200,90,.7)');gr.addColorStop(1,'rgba(255,90,20,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(-9,-24);ctx.lineTo(0,-110);ctx.lineTo(9,-24);ctx.closePath();ctx.fill();
          break;}
        case'capsule':{   /* a lab capsule powers up and cracks */
          const glow=.35+.25*Math.sin(t*8+ph)+(k>.85?.5:0);
          GLOW.at(ctx,0,-18,26+10*k,'#7aff9a',glow);
          ctx.fillStyle='#2a3240';ctx.fillRect(-11,-4,22,5);ctx.fillRect(-11,-40,22,4);
          ctx.fillStyle='rgba(120,255,170,'+(.2+.15*k)+')';ctx.fillRect(-9,-38,18,34);ctx.strokeStyle='#7aff9a';ctx.lineWidth=1.6;ctx.strokeRect(-9,-38,18,34);
          ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(220,255,230,.9)';ctx.lineWidth=1.3;
          for(let j=0;j<2;j++){ctx.beginPath();let yy=-36;ctx.moveTo(-6+j*12,yy);for(let q=0;q<5;q++){yy+=6.5;ctx.lineTo(-6+j*12+(Math.random()-.5)*10*(.4+k),yy);}ctx.stroke();}
          if(k>.8){ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(0,-38);ctx.lineTo(-3,-26);ctx.lineTo(3,-16);ctx.lineTo(-2,-6);ctx.stroke();}
          break;}
        case'portal':{   /* Majin Buu's pink portal */
          const r=(6+22*sm(k));ctx.translate(0,-10);ctx.scale(1,1.35);
          GLOW.at(ctx,0,0,r*1.9,'#ff9ae0',.7);
          ctx.fillStyle='rgba(50,6,60,.85)';ctx.beginPath();ctx.arc(0,0,r*.8,0,TAU);ctx.fill();
          ctx.lineWidth=2.4;for(let j=0;j<3;j++){ctx.strokeStyle=j%2?'#ffe0f6':'#ff9ae0';ctx.beginPath();ctx.arc(0,0,r*(1-j*.22),t*(3+j)+ph+j,t*(3+j)+ph+j+3.6);ctx.stroke();}
          break;}
        case'march':{   /* the line is coming: red chevrons pointing at you */
          const a=Math.atan2(p.y-y,p.x-x);ctx.rotate(a);ctx.globalAlpha=.4+.5*k;ctx.strokeStyle=col;ctx.lineWidth=2.6;ctx.lineCap='round';
          for(let j=0;j<3;j++){const o=((t*3+j*.33)%1)*26-6;ctx.beginPath();ctx.moveTo(o-6,-7);ctx.lineTo(o+2,0);ctx.lineTo(o-6,7);ctx.stroke();}
          break;}
        case'chute':{   /* a paratrooper descends */
          const oy=-fall*430;ctx.translate(Math.sin(t*2+ph)*4*(1-k),oy);
          ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1;ctx.beginPath();for(const d of[-15,-5,5,15]){ctx.moveTo(d,-44);ctx.lineTo(0,-14);}ctx.stroke();
          ctx.fillStyle='#e03a3a';ctx.beginPath();ctx.ellipse(0,-46,17,12,0,Math.PI,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(0,-46,6,12,0,Math.PI,TAU);ctx.fill();
          ctx.fillStyle='#2a2a34';ctx.fillRect(-3,-16,6,10);ctx.fillStyle='#e8c8a0';ctx.beginPath();ctx.arc(0,-19,3,0,TAU);ctx.fill();
          break;}
        case'egg':{   /* a Cell Jr. egg wobbles and cracks */
          const wob=Math.sin(t*(6+14*k)+ph)*.16*k;ctx.rotate(wob);GLOW.at(ctx,0,-12,22+8*k,'#8be05a',.35+.4*k);
          ctx.fillStyle='#d8ecc8';ctx.strokeStyle='#5a8a3a';ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(0,-13,9,13,0,0,TAU);ctx.fill();ctx.stroke();
          ctx.fillStyle='#6ab04a';for(const [dx,dy,r] of[[-3,-18,2.2],[4,-10,2.6],[-4,-8,1.8]]){ctx.beginPath();ctx.arc(dx,dy,r,0,TAU);ctx.fill();}
          if(k>.45){ctx.strokeStyle='#243818';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-2,-26);ctx.lineTo(1,-20);ctx.lineTo(-3,-15);ctx.lineTo(2,-9);ctx.stroke();}
          if(k>.85){ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(200,255,160,.7)';ctx.beginPath();ctx.ellipse(0,-13,10,14,0,0,TAU);ctx.fill();}
          break;}
        case'pillar':{   /* a column of golden light */
          const w=8+16*sm(k),h=250;ctx.globalCompositeOperation='lighter';
          const gr=ctx.createLinearGradient(0,0,0,-h);gr.addColorStop(0,'rgba(255,240,170,'+(.2+.5*k)+')');gr.addColorStop(1,'rgba(255,240,170,0)');ctx.fillStyle=gr;ctx.fillRect(-w,-h,w*2,h);
          ctx.fillStyle='rgba(255,255,255,'+(.25+.4*k)+')';ctx.fillRect(-w*.3,-h*.8,w*.6,h*.8);
          GLOW.at(ctx,0,-4,30+14*k,'#ffe9a0',.8);
          for(let j=0;j<5;j++){const q=(t*.9+j*.2+ph)%1;ctx.fillStyle='rgba(255,250,210,'+(1-q)+')';ctx.fillRect(Math.sin(j*2.3+ph)*w*.8-1,-q*h*.7,2.4,2.4);}
          break;}
        case'hakai':{   /* a sphere of destruction */
          const oy=-fall*380-24;ctx.translate(0,oy);
          GLOW.at(ctx,0,0,44,'#c060ff',.8);
          const gr=ctx.createRadialGradient(-3,-3,1,0,0,14);gr.addColorStop(0,'#f2d0ff');gr.addColorStop(.5,'#9a3ae0');gr.addColorStop(1,'#2a0850');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,14,0,TAU);ctx.fill();
          ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(230,170,255,.85)';ctx.lineWidth=1.6;for(let j=0;j<3;j++){ctx.beginPath();ctx.arc(0,0,17+j*3+Math.sin(t*14+j)*1.4,t*4+j*2,t*4+j*2+1.6);ctx.stroke();}
          break;}
        case'fissure':{   /* the ground cracks open and glows */
          GLOW.at(ctx,0,0,10+26*k,'#ff5a1a',.55+.3*k);
          ctx.strokeStyle='#ff9a3a';ctx.lineWidth=2.4;ctx.lineCap='round';
          for(let j=0;j<5;j++){const a=ph+j*1.26,L=8+24*k;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*L*.5+Math.sin(j*5)*3,Math.sin(a)*L*.5*.5);ctx.lineTo(Math.cos(a+.3)*L,Math.sin(a+.3)*L*.5);ctx.stroke();}
          ctx.globalCompositeOperation='lighter';ctx.fillStyle='#ffd27a';for(let j=0;j<4;j++){const q=(t*1.1+j*.25+ph)%1;ctx.globalAlpha=1-q;ctx.fillRect(Math.sin(j*3+ph)*10-1,-q*34,2.2,2.2);}
          break;}
      }
      ctx.restore();
    }
  },
  /* screen space: the sky colour of the event (Full Moon) */
  eventOverlay(g,t){
    const ev=g.ev;if(!ev||!ev.tint)return;
    const ctx=this.ctx,W=this.W,H=this.H,U=this.U,tn=ev.tint,u=ev.t-tn.t0,a=Math.min(1,u/2.5)*Math.min(1,Math.max(0,(tn.dur-u)/3));
    if(a<=0)return;
    ctx.save();ctx.globalAlpha=tn.k*a;ctx.fillStyle=tn.col;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;
    if(tn.moon){
      const mx=W*.84,my=H*.2,mr=62*U;ctx.globalAlpha=a;
      GLOW.at(ctx,mx,my,mr*3.2,'#c8b8ff',.6);
      const gr=ctx.createRadialGradient(mx-mr*.25,my-mr*.25,mr*.1,mx,my,mr);gr.addColorStop(0,'#ffffff');gr.addColorStop(.7,'#efe6ff');gr.addColorStop(1,'#bfaee8');
      ctx.fillStyle=gr;ctx.beginPath();ctx.arc(mx,my,mr,0,TAU);ctx.fill();
      ctx.fillStyle='rgba(150,130,200,.35)';for(const [dx,dy,r] of[[-.3,-.1,.2],[.25,.25,.28],[.1,-.4,.14],[-.35,.35,.12]]){ctx.beginPath();ctx.arc(mx+dx*mr,my+dy*mr,r*mr,0,TAU);ctx.fill();}
      ctx.globalAlpha=1;
    }
    ctx.restore();
  }
});
