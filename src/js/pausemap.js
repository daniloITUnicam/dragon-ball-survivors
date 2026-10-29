'use strict';
/* ====== the pause map: a big overview centred on the player that shows where the pickups are (UI.pauseMap builds the panel, this draws it) ====== */
const MAP_ZOOMS=[.06,.1,.17,.3,.5,.8,1.2],MAP_ZOOM0=3,MAP_W=960,MAP_H=600;
Object.assign(Renderer.prototype,{
  /* draws the whole map on a canvas: zi = index in MAP_ZOOMS (map px per world px). Every pickup is drawn with the game's own drawing code (drawLoot / drawChest / drawFeature), shrunk */
  drawPauseMap(cv,g,zi){
    const c2=cv.getContext('2d'),W=cv.width,H=cv.height,k=MAP_ZOOMS[Math.max(0,Math.min(MAP_ZOOMS.length-1,zi))],p=g.p,th=g.stage.theme;
    const sx=x=>W/2+(x-p.x)*k,sy=y=>H/2+(y-p.y)*k;
    const keep=this.ctx;this.ctx=c2;   /* the drawing helpers use this.ctx: point them at the map canvas for the duration */
    try{
      c2.imageSmoothingEnabled=false;c2.textAlign='left';c2.globalAlpha=1;
      const gr=c2.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#10241c');gr.addColorStop(1,'#0a1620');c2.fillStyle=gr;c2.fillRect(0,0,W,H);
      /* world limits of the finite maps: the Tournament of Power arena and the Snake Way body */
      if(th==='void'&&typeof TOPARENA!=='undefined'){c2.fillStyle='rgba(120,200,190,.10)';c2.strokeStyle='rgba(150,230,220,.55)';c2.lineWidth=2;c2.beginPath();c2.ellipse(sx(0),sy(0),TOPARENA.RX*k,TOPARENA.RY*k,0,0,TAU);c2.fill();c2.stroke();}
      if(th==='snake'&&typeof Snake!=='undefined'){
        c2.fillStyle='rgba(120,200,120,.14)';c2.strokeStyle='rgba(150,230,150,.5)';c2.lineWidth=1.5;c2.beginPath();
        const x0=p.x-W/2/k,x1=p.x+W/2/k,st=Math.max(20,12/k);let first=true;
        for(let x=x0;x<=x1;x+=st){const yy=sy(Snake.f(x)-Snake.HW);if(first){c2.moveTo(sx(x),yy);first=false;}else c2.lineTo(sx(x),yy);}
        for(let x=x1;x>=x0;x-=st)c2.lineTo(sx(x),sy(Snake.f(x)+Snake.HW));
        c2.closePath();c2.fill();c2.stroke();
        /* v110: the islands and their roads */
        for(const I of Snake.islandsIn(x0-ISLE_RMAX,x1+ISLE_RMAX)){
          if(I.road){c2.lineWidth=Math.max(2,ISLE_RW*2*k);c2.strokeStyle='rgba(150,230,150,.32)';c2.lineCap='round';c2.beginPath();I.road.forEach(([x,y],j)=>j?c2.lineTo(sx(x),sy(y)):c2.moveTo(sx(x),sy(y)));c2.stroke();c2.lineWidth=1.5;}
          c2.fillStyle=(SnakeArt.col[I.kind]||['#ffe9a0'])[0]+'55';c2.strokeStyle='rgba(255,233,160,.7)';c2.beginPath();c2.ellipse(sx(I.x),sy(I.y),Math.max(3,I.r*k),Math.max(2,I.ry*k),0,0,TAU);c2.fill();c2.stroke();
          if(I.r*k>26){c2.fillStyle='rgba(255,240,200,.85)';c2.font='700 11px sans-serif';c2.textAlign='center';c2.fillText(this.tr(SnakeArt.names[I.kind]),sx(I.x),sy(I.y)+4);c2.textAlign='left';}
        }
      }
      /* grid every 25 / 50 / 100 / 200 / 500 m (1 m = 10 world px) */
      const steps=[250,500,1000,2000,5000],stp=steps.find(s=>s*k>=80)||5000;
      c2.strokeStyle='rgba(255,255,255,.07)';c2.lineWidth=1;c2.beginPath();
      for(let gx=Math.floor((p.x-W/2/k)/stp)*stp;gx<=p.x+W/2/k;gx+=stp){const X=Math.round(sx(gx))+.5;c2.moveTo(X,0);c2.lineTo(X,H);}
      for(let gy=Math.floor((p.y-H/2/k)/stp)*stp;gy<=p.y+H/2/k;gy+=stp){const Y=Math.round(sy(gy))+.5;c2.moveTo(0,Y);c2.lineTo(W,Y);}
      c2.stroke();
      /* distance rings around the hero */
      c2.font='700 11px sans-serif';c2.fillStyle='rgba(255,255,255,.35)';c2.strokeStyle='rgba(255,255,255,.14)';c2.setLineDash([4,5]);
      for(const m of [stp,stp*2,stp*3]){const r=m*k;if(r<30||r>W)continue;c2.beginPath();c2.arc(W/2,H/2,r,0,TAU);c2.stroke();c2.fillText(Math.round(m/10)+' m',W/2+r*.71+3,H/2-r*.71-3);}
      c2.setLineDash([]);
      /* the part of the world the game screen shows */
      c2.strokeStyle='rgba(255,255,255,.45)';c2.lineWidth=1.5;c2.setLineDash([6,4]);c2.strokeRect(W/2-g.vw*k/2,H/2-g.vh*k/2,g.vw*k,g.vh*k);c2.setLineDash([]);
      const draw=(x,y,s,fn)=>{const X=sx(x),Y=sy(y);if(X<-40||X>W+40||Y<-40||Y>H+60)return;c2.save();c2.translate(X,Y);c2.scale(s,s);fn();c2.restore();};
      /* healing pools */
      const zs=Sprites.sheets.zonesprites;
      for(const z of World.zonesNear(th,p.x,p.y,Math.max(W,H)/k/2+200)){
        if(z.kind!=='heal')continue;
        draw(z.x,z.y,.3,()=>{if(zs&&zs.rects&&zs.rects.length>=24){const rc=zs.rects[12],an=zs.anch[12];c2.imageSmoothingEnabled=true;c2.drawImage(zs.img,rc[0],rc[1],rc[2],rc[3],-an[0],-an[1],rc[2],rc[3]);c2.imageSmoothingEnabled=false;}else{c2.fillStyle='#8be07a';c2.beginPath();c2.ellipse(0,0,40,26,0,0,TAU);c2.fill();}});
      }
      for(const f of g.feat){if(f.dead||f.fade!==undefined)continue;draw(f.x,f.y,.3,()=>this.drawFeature({kind:f.kind,x:0,y:0,t:9,ttl:1e9,pressed:f.pressed,used:false},9,g));}
      for(const ch of g.chests){if(ch.dead||ch.op!==undefined)continue;draw(ch.x,ch.y,.8,()=>this.drawChest({x:0,y:0,rar:ch.rar||0,final:ch.final,elite:ch.elite,t:9},9));}
      for(const l of g.loot){
        if(l.dead||l.held)continue;
        const s=l.k==='sball'?.32:l.k==='ball'?.55:.85;
        draw(l.x,l.y,s,()=>this.drawLoot({k:l.k,x:0,y:0,t:9,v:l.v,star:l.star,tama:l.tama,ttl:0,lock:l.lock,flat:1},9));
      }
      c2.font='700 11px sans-serif';c2.textAlign='right';c2.fillStyle='rgba(255,255,255,.5)';c2.fillText(this.tr(T('centrata su di te · riquadro tratteggiato = ciò che vede lo schermo · 1 m = 10 px','centred on you · dashed box = what the screen shows · 1 m = 10 px')),W-10,H-9);c2.textAlign='left';
      /* the hero: a pulsing marker */
      const pu=.5+.5*Math.sin(performance.now()/260);
      c2.save();c2.translate(W/2,H/2);GLOW.at(c2,0,0,22+6*pu,'#ffe24d',.7);c2.fillStyle='#ffe24d';c2.strokeStyle='#1a1208';c2.lineWidth=2.5;c2.beginPath();c2.arc(0,0,7,0,TAU);c2.fill();c2.stroke();
      c2.fillStyle='#fff';c2.beginPath();c2.arc(0,0,2.6,0,TAU);c2.fill();c2.restore();
    }finally{this.ctx=keep;}
  }
});
