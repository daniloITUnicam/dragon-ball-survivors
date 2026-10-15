'use strict';
/* ====== Renderer: world, entities, effects, HUD. Camera is always centred on the player. ====== */
const THEMES={
  plains:{ground:['#4f9b4a','#56a552','#489244','#5aa955'],hi:'#7acb6a',lo:'#2f6a30',sky:'#1d3a2a'},
  namek:{ground:['#3f9e6e','#46a877','#3a9567','#4aae7e'],hi:'#7ad6a6',lo:'#1f6a4a',water:['#2f86b8','#3790c4','#2a7aaa'],sky:'#14342c'},
  waste:{ground:['#8a7a68','#948472','#7e6e5c','#9a8a78'],hi:'#b8a890',lo:'#4a3e32',sky:'#2a2420'},
  other:{ground:['#a888c8','#b496d4','#9c7cbc','#bca0dc'],hi:'#e8d0ff',lo:'#6a4a8a',sky:'#2a1a3a'},
  beach:{ground:['#e8d49a','#eddba4','#e0cb8e','#f0dfae'],hi:'#fff4cc',lo:'#b89a58',water:['#3aa8d8','#42b2e2','#2f9ccc'],sky:'#164a5c'},
  redrock:{ground:['#b2543a','#bc5e42','#a64a32','#c4664a'],hi:'#e8946a',lo:'#6a2a1a',sky:'#3a1610'},
  arena:{ground:['#b8b2a4','#c2bcae','#aea898','#c8c2b4'],hi:'#e8e2d4',lo:'#6a6458',sky:'#24262e'},
  sky:{ground:['#e8f0fa','#f0f6fc','#dce8f6','#f4f8fe'],hi:'#ffffff',lo:'#a8c0e0',sky:'#2a4a78'},
  hell:{ground:['#3a1a1c','#441e20','#301418','#4a2224'],hi:'#ff7a2a',lo:'#12080a',sky:'#2a0a0a'},
  void:{ground:['#1a2244','#1e2850','#161e3c','#222c58'],hi:'#4a6aff',lo:'#0a0e22',sky:'#05081a'}
};
class Renderer{
  constructor(canvas,save){
    this.cv=canvas;this.ctx=canvas.getContext('2d');this.save=save;this.W=1;this.H=1;this.Z=1;
    this.tiles={};this.decor={};this.vign=null;this.menuT=0;this.fps=60;this.fa=0;this.fn=0;
    this.hint=null;this.joy=null;this.keyHints={};this.tr=(x)=>typeof x==='string'?x:x.it;this.tt=(k)=>k;
  }
  resize(){
    const s=this.save.d.settings,cw=window.innerWidth,ch=window.innerHeight;
    let iw,ih;
    if(s.res==='720'){ih=720;iw=Math.round(720*cw/ch);}
    else if(s.res==='1080'){ih=1080;iw=Math.round(1080*cw/ch);}
    else{const sc=clamp(s.scale||1,.5,2)*Math.min(2,window.devicePixelRatio||1);iw=Math.round(cw*sc);ih=Math.round(ch*sc);}
    this.cv.width=iw;this.cv.height=ih;this.cv.style.width=cw+'px';this.cv.style.height=ch+'px';
    this.W=iw;this.H=ih;this.Z=clamp(Math.min(iw,ih)/560,.6,3.4);this.vign=null;
    this.U=Math.max(.8,ih/720);
  }
  /* ---------- terrain ---------- */
  getTiles(theme){
    if(this.tiles[theme])return this.tiles[theme];
    const th=THEMES[theme],mk=(base,seed,water)=>{
      const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
      g.fillStyle=base;g.fillRect(0,0,64,64);
      for(let i=0;i<46;i++){
        const x=Math.floor(hash(seed,i)*62),y=Math.floor(hash(i,seed+7)*62),r=hash(seed+3,i);
        g.fillStyle=r<.5?th.lo:th.hi;g.globalAlpha=water?.16:.2+r*.14;g.fillRect(x,y,2+(r>.8?2:0),2);
      }
      g.globalAlpha=1;
      if(!water){
        if(theme==='plains'||theme==='namek'){g.strokeStyle=th.lo;g.globalAlpha=.4;g.lineWidth=1.5;for(let i=0;i<4;i++){const x=hash(seed,i+40)*58+3,y=hash(i+9,seed)*54+6;g.beginPath();g.moveTo(x,y+5);g.lineTo(x-1,y);g.moveTo(x+3,y+5);g.lineTo(x+4,y+1);g.stroke();}g.globalAlpha=1;}
        else if(theme==='waste'){g.strokeStyle=th.lo;g.globalAlpha=.55;g.lineWidth=1.4;for(let i=0;i<2;i++){let x=hash(seed,i+50)*64,y=hash(i,seed+3)*64;g.beginPath();g.moveTo(x,y);for(let k=0;k<4;k++){x+=hash(seed+k,i)*14-4;y+=hash(i+k,seed)*14-4;g.lineTo(x,y);}g.stroke();}g.globalAlpha=1;}
        else if(theme==='other'){const gr=g.createRadialGradient(32,32,2,32,32,40);gr.addColorStop(0,'rgba(255,255,255,.18)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);}
        else if(theme==='beach'){g.strokeStyle=th.lo;g.globalAlpha=.35;g.lineWidth=1.3;for(let i=0;i<3;i++){const y=hash(seed,i+60)*54+6,x=hash(i,seed+8)*20;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+16,y-4,x+34,y);g.stroke();}g.globalAlpha=1;}
        else if(theme==='redrock'){g.strokeStyle=th.lo;g.globalAlpha=.6;g.lineWidth=1.5;for(let i=0;i<2;i++){let x=hash(seed,i+70)*64,y=hash(i,seed+9)*64;g.beginPath();g.moveTo(x,y);for(let k=0;k<5;k++){x+=hash(seed+k,i+1)*12-3;y+=hash(i+k,seed+2)*10-2;g.lineTo(x,y);}g.stroke();}g.globalAlpha=1;}
        else if(theme==='arena'){g.strokeStyle=th.lo;g.globalAlpha=.5;g.lineWidth=2;g.strokeRect(1,1,62,62);g.globalAlpha=.25;g.beginPath();g.moveTo(32,1);g.lineTo(32,63);g.moveTo(1,32);g.lineTo(63,32);g.stroke();if(hash(seed,77)>.5){g.globalAlpha=.6;g.beginPath();g.moveTo(10,10);g.lineTo(22,24);g.lineTo(18,38);g.stroke();}g.globalAlpha=1;}
        else if(theme==='sky'){g.fillStyle='#ffffff';g.globalAlpha=.55;for(let i=0;i<3;i++){const x=hash(seed,i+80)*50,y=hash(i,seed+4)*50;g.beginPath();g.ellipse(x+8,y+5,9,4,0,0,TAU);g.fill();}g.globalAlpha=1;}
        else if(theme==='hell'){g.strokeStyle='#ff6a1a';g.globalAlpha=.55;g.lineWidth=1.6;for(let i=0;i<2;i++){let x=hash(seed,i+90)*64,y=hash(i,seed+6)*64;g.beginPath();g.moveTo(x,y);for(let k=0;k<4;k++){x+=hash(seed+k,i+5)*12-4;y+=hash(i+k,seed+1)*12-4;g.lineTo(x,y);}g.stroke();}g.globalAlpha=1;}
        else if(theme==='void'){g.strokeStyle=th.hi;g.globalAlpha=.16;g.lineWidth=1;g.strokeRect(.5,.5,63,63);g.globalAlpha=1;if(hash(seed,99)>.6){g.fillStyle='#bfd0ff';g.fillRect(Math.floor(hash(seed,3)*60),Math.floor(hash(3,seed)*60),2,2);}}
      }
      return c;
    };
    const t={ground:th.ground.map((b,i)=>mk(b,i*13+1,false)),water:(th.water||[]).map((b,i)=>mk(b,i*7+90,true))};
    this.tiles[theme]=t;return t;
  }
  getDecor(theme){
    if(this.decor[theme])return this.decor[theme];
    const P=(W,H,ox,oy,fn)=>Sprites.paint(W,H,ox,oy,fn),C=Sprites.circ,out=[];
    if(theme==='plains'){
      out.push(P(26,34,13,33,R=>{R(-1.5,-15,3,15,'#6a4a2a');C(R,0,-22,9,'#3f9e4a');C(R,-3,-25,5,'#5ac05a');}));
      out.push(P(16,10,8,9,R=>{C(R,0,-4,5,'#2f8a3a');C(R,-2,-5,3,'#4aaa4a');}));
      out.push(P(18,12,9,11,R=>{R(-6,-6,12,6,'#8a8f98');R(-4,-9,8,4,'#a0a6b0');R(-2,-8,3,2,'#c0c6d0');}));
    }else if(theme==='namek'){
      out.push(P(30,46,15,45,R=>{R(-1.5,-28,3,28,'#b8d7c0');C(R,0,-33,10,'#7bd6a6');C(R,-3,-36,6,'#9ee8bf');}));
      out.push(P(18,12,9,11,R=>{R(-6,-6,12,6,'#78a8b4');R(-4,-9,8,4,'#a6cdd6');}));
      out.push(P(24,30,12,29,R=>{R(-1,-20,2,20,'#b8d7c0');C(R,0,-24,7,'#5fc08e');}));
    }else if(theme==='waste'){
      out.push(P(26,30,13,29,R=>{R(-1,-20,2,20,'#4a3a2a');R(-7,-15,6,1.4,'#4a3a2a');R(1,-11,6,1.4,'#4a3a2a');R(-5,-19,1.4,5,'#4a3a2a');}));
      out.push(P(22,14,11,13,R=>{R(-8,-5,16,5,'#6a6460');R(-4,-9,8,4,'#7a746e');R(2,-7,5,2,'#8a847e');}));
      out.push(P(26,34,13,33,R=>{R(-6,-26,12,26,'#5a5650');R(-4,-22,3,4,'#2a2622');R(1,-14,3,4,'#2a2622');R(-6,-28,5,3,'#5a5650');}));
    }else if(theme==='other'){
      out.push(P(30,22,15,21,R=>{C(R,-6,-6,6,'#fff0ff');C(R,3,-8,8,'#ffe0ff');C(R,10,-5,5,'#fff0ff');}));
      out.push(P(18,30,9,29,R=>{R(-2,-24,4,24,'#ff9ad8');R(-4,-16,8,16,'#ff7ac0');R(-1,-22,1.5,12,'#ffd0f0');}));
      out.push(P(16,34,8,33,R=>{R(-3,-30,6,30,'#d8b0ff');R(-4,-32,8,3,'#f0d8ff');}));
    }else if(theme==='beach'){
      out.push(P(16,8,8,7,R=>{R(-6,-3,12,3,'#f4d8e0');R(-4,-5,8,3,'#e8a8c0');R(-1,-6,2,2,'#fff');}));
      out.push(P(14,10,7,9,R=>{C(R,0,-4,4,'#2f9a4a');C(R,-2,-5,2,'#5ac05a');}));
      out.push(P(14,8,7,7,R=>{R(-5,-3,10,3,'#c8a868');R(-3,-5,6,3,'#d8b878');}));
    }else if(theme==='redrock'){
      out.push(P(14,8,7,7,R=>{R(-5,-3,10,3,'#8a3a22');R(-3,-5,6,3,'#a8482a');}));
      out.push(P(16,6,8,5,R=>{R(-6,-2,12,2,'#5a2010');R(-3,-4,5,2,'#6a2a18');}));
      out.push(P(10,14,5,13,R=>{R(-1,-10,2,10,'#6a3a1a');R(-4,-8,3,1,'#6a3a1a');R(1,-6,3,1,'#6a3a1a');}));
    }else if(theme==='arena'){
      out.push(P(14,8,7,7,R=>{R(-5,-3,10,3,'#9a9284');R(-3,-5,5,3,'#b0a898');}));
      out.push(P(12,6,6,5,R=>{R(-4,-2,8,2,'#8a8274');R(-2,-4,3,2,'#a8a090');}));
      out.push(P(10,8,5,7,R=>{R(-3,-4,6,4,'#c8c0b0');R(-2,-6,4,2,'#d8d0c0');}));
    }else if(theme==='sky'){
      out.push(P(20,10,10,9,R=>{C(R,-3,-3,3,'#fff');C(R,2,-4,4,'#f4f8ff');C(R,6,-2,2,'#fff');}));
      out.push(P(8,10,4,9,R=>{R(-.5,-7,1,7,'#ffd23f');R(-2,-8,4,2,'#fff6a8');}));
    }else if(theme==='hell'){
      out.push(P(12,8,6,7,R=>{R(-4,-3,8,3,'#2a1214');R(-2,-5,5,3,'#3a1a1c');R(-1,-3,2,1,'#ff7a1a');}));
      out.push(P(10,12,5,11,R=>{R(-1,-9,2,9,'#e8e0d0');R(-3,-9,6,2,'#e8e0d0');}));
      out.push(P(16,6,8,5,R=>{R(-6,-2,12,2,'#ff5a1a');R(-3,-3,6,1,'#ffd23f');}));
    }else{
      out.push(P(18,40,9,39,R=>{R(-4,-34,8,34,'#2a3a6a');R(-.6,-34,1.2,34,'#6ad0ff');R(-5,-36,10,3,'#3a4a8a');}));
      out.push(P(18,10,9,9,R=>{R(-5,-5,10,5,'#3a4a8a');R(-3,-7,6,3,'#4a5a9a');}));
      out.push(P(14,26,7,25,R=>{R(-2,-20,4,20,'#2a3a6a');R(-.5,-20,1,20,'#ff6aa0');}));
    }
    this.decor[theme]=out;return out;
  }
  getObst(theme){
    this.obst=this.obst||{};
    if(this.obst[theme])return this.obst[theme];
    const C=Sprites.circ,out=(OBSTACLES[theme]||[]).map(d=>Sprites.paint(d.W,d.H,d.W/2,d.H-1,R=>d.art(R,C)));
    this.obst[theme]=out;return out;
  }
  terrain(cx,cy,vw,vh,t,theme){
    const ctx=this.ctx,TS=64,tl=this.getTiles(theme),dec=this.getDecor(theme),th=THEMES[theme];
    const x0=Math.floor(cx/TS),y0=Math.floor(cy/TS),x1=Math.floor((cx+vw)/TS),y1=Math.floor((cy+vh)/TS+1.6);
    const water=th.water&&tl.water.length;
    for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
      const h=hash(tx,ty),w=water&&hash(tx>>2,ty>>2)>.87;
      if(w){
        ctx.drawImage(tl.water[(h*3)|0],tx*TS,ty*TS);
        if(Math.sin(t*1.5+h*30)>.55){ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(tx*TS+h*30,ty*TS+hash(ty,tx)*40,14,2);}
      }else{
        ctx.drawImage(tl.ground[(h*tl.ground.length)|0],tx*TS,ty*TS);
        if(hash(tx+99,ty-7)>.955){
          const d=dec[(hash(tx*3+1,ty*5+2)*dec.length)|0],k=2/Sprites.S;
          ctx.save();ctx.globalAlpha=1;
          ctx.drawImage(d.c,tx*TS+32-d.ox*k,ty*TS+56-d.oy*k,d.c.width*k,d.c.height*k);ctx.restore();
        }
      }
    }
  }
  /* ---------- menu background ---------- */
  drawMenuBg(dt){if(!this.menuBg)this.menuBg=new MenuBg(this);this.menuBg.draw(dt);}
  vignette(a){
    const ctx=this.ctx;
    if(!this.vign||this.vign.a!==a){const r=Math.hypot(this.W,this.H)/2,g=ctx.createRadialGradient(this.W/2,this.H/2,r*.45,this.W/2,this.H/2,r);g.addColorStop(0,'rgba(4,12,24,0)');g.addColorStop(1,'rgba(4,12,24,'+a+')');this.vign={g,a};}
    ctx.fillStyle=this.vign.g;ctx.fillRect(0,0,this.W,this.H);
  }

  /* ---------- game ---------- */
  draw(g,dt){
    Sprites.warmStep();
    const ctx=this.ctx,s=this.save.d.settings,t=g.t,p=g.p;
    ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
    g.vw=this.W/this.Z;g.vh=this.H/this.Z;
    let sx=0,sy=0;if(g.shake>0&&s.shake){sx=rnd(-1,1)*g.shake*14;sy=rnd(-1,1)*g.shake*14;}
    const cx=p.x-g.vw/2+sx,cy=p.y-14-g.vh/2+sy;
    ctx.setTransform(this.Z,0,0,this.Z,-cx*this.Z,-cy*this.Z);
    const theme=g.stage.theme;
    if(g.trial)this.trialRoom(cx,cy,g.vw,g.vh,t,g.trial);else this.terrain(cx,cy,g.vw,g.vh,t,theme);
    const vx0=cx-90,vx1=cx+g.vw+90,vy0=cy-130,vy1=cy+g.vh+90;
    for(const w of g.weapons.values())if(w.drawGround)w.drawGround(ctx);
    const au=g.weapons.get('aura');if(au)au.draw(ctx);
    /* ground items */
    for(const gm of (g.trial?[]:g.gm)){
      const col=gm.v<2.2?'#5ad0ff':gm.v<11?'#ffb13b':'#ff5a3d',r=gm.v<2.2?4:gm.v<11?6:9;
      ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(gm.x,gm.y-r);ctx.lineTo(gm.x+r*.8,gm.y);ctx.lineTo(gm.x,gm.y+r);ctx.lineTo(gm.x-r*.8,gm.y);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillRect(gm.x-1,gm.y-r*.5,2,r*.5);
    }
    if(g.rg&&!g.trial){const r=g.rg,pu=1+.12*Math.sin(t*6),R=(13+Math.min(9,Math.log10(1+r.v)*3))*pu;
      GLOW.at(ctx,r.x,r.y,R*3.2,'#ff3b2f',.75);
      ctx.fillStyle='#b3150c';ctx.beginPath();ctx.moveTo(r.x,r.y-R);ctx.lineTo(r.x+R*.85,r.y);ctx.lineTo(r.x,r.y+R);ctx.lineTo(r.x-R*.85,r.y);ctx.closePath();ctx.fill();
      ctx.fillStyle='#ff5a3d';ctx.beginPath();ctx.moveTo(r.x,r.y-R*.78);ctx.lineTo(r.x+R*.62,r.y);ctx.lineTo(r.x,r.y+R*.78);ctx.lineTo(r.x-R*.62,r.y);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.8)';ctx.fillRect(r.x-R*.14,r.y-R*.55,R*.28,R*.5);
    }
    if(!g.trial)this.drawZones(g,cx,cy,t);
    this.drawDanger(g,t);
    for(const l of (g.trial?[]:g.loot))this.drawLoot(l,t);
    for(const f of (g.trial?[]:g.feat))this.drawFeature(f,t,g);
    for(const c of (g.trial?[]:g.chests))this.drawChest(c,t);
    /* entities, depth sorted */
    const list=g.en.slice();
    if(!g.trial){const os=this.getObst(theme);for(const b of World.visible(theme,vx0-60,vy0-60,vx1+60,vy1+60))list.push({ob:b,y:b.y,spr:os[b.t]});}
    if(g.trial)for(const ob of g.trial.obs)list.push({pil:ob,y:ob.y});
    if(g.pet)list.push({pet:g.pet,y:g.pet.y});
    list.sort((a,b)=>a.y-b.y);
    for(const e of list){
      if(e.pil){this.drawPillar(e.pil);continue;}
      if(e.pet){this.drawPet(e.pet,t,g);continue;}
      if(e.ob){const k=3.1/Sprites.S,b=e.ob,sp=e.spr;ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(b.x,b.y,b.r*1.1,b.r*.5,0,0,TAU);ctx.fill();ctx.save();ctx.translate(b.x,b.y+2);ctx.scale(b.f*k,k);ctx.drawImage(sp.c,-sp.ox,-sp.oy);ctx.restore();continue;}
      if(e.x<vx0||e.x>vx1||e.y<vy0||e.y>vy1)continue;
      this.drawEnemy(e,t);
    }
    for(const w of g.weapons.values())if(w.draw&&w.id!=='aura')w.draw(ctx);
    this.drawPlayer(g,t);
    /* projectiles */
    for(const b of g.pr){
      if(b.tr)VFX.trail(ctx,b.tr,b.r*.9,b.c);
      if(b.spear!==undefined){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.spear);GLOW.at(ctx,0,0,b.r*3.4,b.c,.7);ctx.globalCompositeOperation='lighter';ctx.fillStyle=b.c;ctx.fillRect(-30,-2.2,38,4.4);ctx.fillStyle='#fff';ctx.fillRect(-26,-1,34,2);ctx.beginPath();ctx.moveTo(8,-6);ctx.lineTo(24,0);ctx.lineTo(8,6);ctx.closePath();ctx.fillStyle='#fff';ctx.fill();ctx.restore();}
      else VFX.orb(ctx,b.x,b.y,b.r,b.c,t);
    }
    for(const b of g.eb){GLOW.at(ctx,b.x,b.y,b.r*3,b.c,.9);ctx.fillStyle=b.c;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x,b.y,b.r*.45,0,TAU);ctx.fill();}
    /* fx */
    for(const f of g.fx){
      if(f.beam){
        const k=1-f.l/f.m,a=clamp(f.l/f.m,0,1),w=f.w*(k<.15?k/.15:1)*(.4+.6*a);
        ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.a);ctx.globalCompositeOperation='lighter';
        let gr=ctx.createLinearGradient(0,-w,0,w);gr.addColorStop(0,hexA(f.c,0));gr.addColorStop(.35,hexA(f.c,.75));gr.addColorStop(.5,'rgba(255,255,255,.95)');gr.addColorStop(.65,hexA(f.c,.75));gr.addColorStop(1,hexA(f.c,0));
        ctx.globalAlpha=Math.min(1,a*1.3);ctx.fillStyle=gr;ctx.fillRect(0,-w,f.len,w*2);
        GLOW.at(ctx,0,0,w*1.8,f.c,.9);GLOW.at(ctx,f.len,0,w*1.1,f.c,.6);
        ctx.strokeStyle='#ffffff';ctx.lineWidth=2;for(let q=0;q<6;q++){const x0=Math.random()*f.len,sp=w*.9;ctx.beginPath();ctx.moveTo(x0,(Math.random()-.5)*sp*2);for(let i=1;i<=4;i++)ctx.lineTo(x0+i*22,(Math.random()-.5)*sp*2);ctx.stroke();}
        ctx.restore();continue;
      }
      if(f.bolt){
        const a=clamp(f.l/f.m,0,1);ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineJoin='round';ctx.globalAlpha=a;
        for(const [lw,col] of [[5,f.c],[2,'#ffffff']]){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(f.pts[0][0],f.pts[0][1]);for(let i=1;i<f.pts.length;i++)ctx.lineTo(f.pts[i][0],f.pts[i][1]);ctx.stroke();}
        ctx.restore();continue;
      }
      if(f.pillar){
        const k=1-f.l/f.m,w=44*(1-k*.75),h=360;
        ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-k;
        const gr=ctx.createLinearGradient(0,f.y-h,0,f.y);gr.addColorStop(0,hexA(f.c,0));gr.addColorStop(.7,hexA(f.c,.55));gr.addColorStop(1,hexA(f.c,.9));
        ctx.fillStyle=gr;ctx.fillRect(f.x-w/2,f.y-h,w,h);ctx.fillStyle='#ffffff';ctx.globalAlpha=(1-k)*.6;ctx.fillRect(f.x-w*.18,f.y-h*.8,w*.36,h*.8);ctx.restore();continue;
      }
      if(f.shock){
        const k=1-f.l/f.m,R=f.max*(1-Math.pow(1-k,2.2)),a=1-k;
        ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(f.x,f.y);ctx.scale(1,.8);
        const w=70+110*(1-k),r0=Math.max(1,R-w),gr=ctx.createRadialGradient(0,0,r0,0,0,R+8);
        gr.addColorStop(0,hexA(f.c,0));gr.addColorStop(.72,hexA(f.c,.45*a));gr.addColorStop(.94,hexA('#ffffff',.95*a));gr.addColorStop(1,hexA(f.c,0));
        ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,R+8,0,TAU);ctx.fill();
        ctx.lineWidth=3+5*(1-k);ctx.strokeStyle=hexA('#ffffff',.8*a);ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.stroke();
        ctx.lineWidth=2;ctx.strokeStyle=hexA(f.c,.6*a);ctx.beginPath();ctx.arc(0,0,R*.82,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(0,0,R*.64,0,TAU);ctx.stroke();
        ctx.lineWidth=2;ctx.strokeStyle=hexA('#ffffff',.5*a);
        for(let i=0;i<28;i++){const an=i/28*TAU+f.max*.01,r1=R-30-((i*37)%60),r2=R+6;ctx.beginPath();ctx.moveTo(Math.cos(an)*r1,Math.sin(an)*r1);ctx.lineTo(Math.cos(an)*r2,Math.sin(an)*r2);ctx.stroke();}
        ctx.restore();continue;
      }
      if(f.ring){const k=1-f.l/f.m;ctx.strokeStyle=f.c;ctx.globalAlpha=1-k;ctx.lineWidth=5*(1-k)+1;ctx.beginPath();ctx.arc(f.x,f.y,f.r*k,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
      else{ctx.fillStyle=f.c;ctx.globalAlpha=clamp(f.l/f.m*1.4,0,1);ctx.fillRect(f.x-f.s/2,f.y-f.s/2,f.s,f.s);ctx.globalAlpha=1;}
    }
    /* damage numbers */
    ctx.textAlign='center';ctx.font='700 13px "Rajdhani",sans-serif';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.7)';
    for(const d of g.tx){
      const a=1-d.t/.8;ctx.globalAlpha=a;const y=d.y-d.t*34;
      ctx.fillStyle=d.c===1?'#ffd23f':d.c===4?'#ff6b6b':d.c===2?'#ffb0b0':d.c===3?'#9fe8ff':'#fff';
      const txt=String(d.s);
      ctx.font=(d.c===1?'900 17px':(typeof d.s==='string'?'700 14px':'700 13px'))+' "Rajdhani",sans-serif';
      ctx.strokeText(txt,d.x,y);ctx.fillText(txt,d.x,y);
    }
    ctx.globalAlpha=1;
    ctx.setTransform(1,0,0,1,0,0);
    this.vignette(.5);
    if(g.tsT>0){ctx.fillStyle='rgba(215,225,255,'+Math.min(.3,g.tsT*.3)+')';ctx.fillRect(0,0,this.W,this.H);}
    if(g.xform&&!g.xform.released){const c=g.xform.t/g.xform.rel;ctx.fillStyle='rgba(2,4,18,'+(.42*c)+')';ctx.fillRect(0,0,this.W,this.H);ctx.globalAlpha=.25*c;ctx.fillStyle=g.xform.col;ctx.fillRect(0,0,this.W,this.H);ctx.globalAlpha=1;}
    if(g.flash>0){ctx.globalAlpha=clamp(g.flash*1.5,0,.8);ctx.fillStyle=g.flashC;ctx.fillRect(0,0,this.W,this.H);ctx.globalAlpha=1;}
    this.hud(g,dt,cx,cy);
  }
  drawPlayer(g,t){
    const ctx=this.ctx,p=g.p,u=(g.C.u||1.95),k=u/Sprites.S;
    const frame=g.cast?6:p.atk>0?(p.atk>.17?5:6):p.mv?1+((t*10)|0)%4:0,flash=p.inv>0&&((t*20)|0)%2===0&&p.inv<.45;
    let ex=null;
    if(g.emo&&g.emoT>0)ex=g.emo;else if(!g.cast&&!(p.atk>0)&&(g.rt%4.3)>4.17)ex='blink';
    const xf=g.xform,old=xf&&!xf.released?xf.old:null,pcc=old?old.pc:g.pc,pck=old?old.key:g.pcKey;
    const sp=Sprites.player(pck,pcc,frame,false,ex);
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(p.x,p.y,7*u,2.4*u,0,0,TAU);ctx.fill();
    if(xf){
      const rt=g.rt,ch=xf.released?1:xf.t/xf.rel,ak=xf.released?1+Math.max(0,1-(xf.t-xf.rel)/(xf.dur-xf.rel))*1.7:.35+ch*2.1;
      const col=xf.col,R0=(46+xf.idx*5)*ak;
      GLOW.at(ctx,p.x,p.y-26,R0*1.5,col,.7);GLOW.at(ctx,p.x,p.y-26,R0*.9,'#ffffff',.35+.3*ch*(xf.released?0:1));
      ctx.save();ctx.globalCompositeOperation='lighter';
      ctx.strokeStyle=hexA(col,.8);ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y,R0*.8,R0*.26,0,0,TAU);ctx.stroke();
      ctx.strokeStyle=hexA('#ffffff',.5);ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(p.x,p.y,R0*.55,R0*.18,0,0,TAU);ctx.stroke();
      const nF=16;
      for(let i=0;i<nF;i++){
        const u=i/(nF-1)-.5,bx=p.x+u*R0*1.5,by=p.y-2-Math.abs(u)*8,h=(54+xf.idx*7)*ak*(1-Math.abs(u)*.9)*(.65+.35*Math.sin(rt*17+i*1.9)),w=7+4*ak,sw=Math.sin(rt*13+i*2.3)*6;
        ctx.fillStyle=hexA(i%3?col:'#ffffff',i%3?.38:.22);
        ctx.beginPath();ctx.moveTo(bx-w,by);ctx.quadraticCurveTo(bx-w*.4+sw,by-h*.55,bx+sw*1.4,by-h);ctx.quadraticCurveTo(bx+w*.4+sw,by-h*.5,bx+w,by);ctx.closePath();ctx.fill();
      }
      ctx.restore();
    }else if(g.bers>0){
      const rt=g.rt,R0=74,fl=1+Math.sin(rt*16)*.08;
      GLOW.at(ctx,p.x,p.y-26,R0*1.9*fl,'#4aff2a',.85);GLOW.at(ctx,p.x,p.y-26,R0*1.0,'#eaffb0',.4);
      ctx.save();ctx.globalCompositeOperation='lighter';
      for(let i=0;i<3;i++){const kk=(rt*1.5+i/3)%1;ctx.strokeStyle=hexA('#b8ff6a',(1-kk)*.8);ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y,24+R0*1.5*kk,(24+R0*1.5*kk)*.32,0,0,TAU);ctx.stroke();}
      for(let i=0;i<20;i++){const u=i/19-.5,bx=p.x+u*R0*1.7,by=p.y-2-Math.abs(u)*6,h=(78+10*Math.sin(i))*(1-Math.abs(u)*.85)*(.6+.4*Math.sin(rt*21+i*2.2)),w=8,sw=Math.sin(rt*15+i*1.9)*7;
        ctx.fillStyle=hexA(i%3===0?'#eaffb0':i%2?'#5aff2a':'#9aff4a',.42);ctx.beginPath();ctx.moveTo(bx-w,by);ctx.quadraticCurveTo(bx-w*.4+sw,by-h*.55,bx+sw*1.4,by-h);ctx.quadraticCurveTo(bx+w*.4+sw,by-h*.5,bx+w,by);ctx.closePath();ctx.fill();}
      ctx.restore();
    }else if(g.kai>0){
      const rt=g.rt,k2=g.kai===2?1.6:1,R0=(50+(g.formIdx>=0?g.formIdx*4:0))*k2,fl=1+Math.sin(rt*20)*.1;
      GLOW.at(ctx,p.x,p.y-26,R0*1.5*fl,'#ff2a1a',.8);GLOW.at(ctx,p.x,p.y-26,R0*.8,'#ffb0a0',.35);
      ctx.save();ctx.globalCompositeOperation='lighter';
      for(let i=0;i<10;i++){const u=i/9-.5,bx=p.x+u*R0*1.2,by=p.y-2,h=(46+k2*14)*(1-Math.abs(u)*.9)*(.6+.4*Math.sin(rt*19+i*2.1)),w=6+3*k2,sw=Math.sin(rt*14+i*1.7)*5;
        ctx.fillStyle=hexA(i%2?'#ff3b2f':'#ff9a7a',.4);ctx.beginPath();ctx.moveTo(bx-w,by);ctx.quadraticCurveTo(bx-w*.4+sw,by-h*.55,bx+sw*1.3,by-h);ctx.quadraticCurveTo(bx+w*.4+sw,by-h*.5,bx+w,by);ctx.closePath();ctx.fill();}
      ctx.restore();
    }else if(g.formIdx>=0){
      const f=1+Math.sin(t*14)*.07;
      GLOW.at(ctx,p.x,p.y-24,(40+g.formIdx*5)*f,g.formColor,.65);
      GLOW.at(ctx,p.x,p.y-24,(26+g.formIdx*3)*f,'#ffffff',.2);
    }
    if(g.barrierReady){ctx.strokeStyle='rgba(138,216,255,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y-20,30,0,TAU);ctx.stroke();}
    {const ab=g.abil;
      if(g.regenT>0)GLOW.at(ctx,p.x,p.y-24,48,ab.c,.45+.15*Math.sin(t*10));
      if(g.abBuf){const f2=1+Math.sin(t*16)*.08;GLOW.at(ctx,p.x,p.y-24,58*f2,ab.c,.55);GLOW.at(ctx,p.x,p.y-24,30*f2,'#ffffff',.25);}
      if(g.critT>0)GLOW.at(ctx,p.x,p.y-24,50,ab.c,.5);
      if(g.shieldT>0){const a2=Math.min(1,g.shieldT*2);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55*a2;const gr=ctx.createRadialGradient(p.x,p.y-22,6,p.x,p.y-22,40);gr.addColorStop(0,hexA(ab.c,.05));gr.addColorStop(.8,hexA(ab.c,.35));gr.addColorStop(1,hexA('#ffffff',.8));ctx.fillStyle=gr;ctx.beginPath();ctx.arc(p.x,p.y-22,40,0,TAU);ctx.fill();ctx.restore();}
      if(g.clones){for(const q of g.clones){if(q.x===undefined)continue;const s2=Sprites.player(pck,pcc,frame,false,null);ctx.save();ctx.globalAlpha=.55;ctx.translate(q.x,q.y);ctx.scale(p.face*k,k);ctx.drawImage(s2.c,-s2.ox,-s2.oy);ctx.restore();GLOW.at(ctx,q.x,q.y-22,26,ab.c,.35);}}
    }
    const bob=p.mv?-Math.abs(Math.sin(t*9))*1.2:0;
    ctx.save();ctx.translate(p.x,p.y+bob);ctx.scale(p.face*k,k);
    if(p.inv>0&&p.inv<.45)ctx.globalAlpha=.55;
    ctx.drawImage((flash?Sprites.player(pck,pcc,frame,true,ex):sp).c,-sp.ox,-sp.oy);
    ctx.restore();
    if(g.emo&&g.emoT>0)this.drawEmote(g.emo,p.x+13,p.y-58*(u/1.95)-8-Math.sin(g.rt*8)*1.5,t);
    if(g.cast){
      const c=g.cast,kk=clamp(c.t/c.dur,0,1),a=c.a,ca=Math.cos(a),sa=Math.sin(a),d=9+9*kk,hx=p.x+ca*d,hy=p.y-17+sa*d;
      ctx.lineCap='round';ctx.strokeStyle=g.pc.skin;ctx.lineWidth=3.4;
      for(const sd of[-1,1]){ctx.beginPath();ctx.moveTo(p.x+sd*4,p.y-18);ctx.lineTo(hx-sa*sd*2.4,hy+ca*sd*2.4);ctx.stroke();}
      VFX.orb(ctx,hx,hy,4+9*kk,c.color,g.rt);
      ctx.save();ctx.globalCompositeOperation='lighter';
      for(let i=0;i<10;i++){const aa=g.rt*7+i*.63,rr=(1-kk)*46+10+((i*13)%7),px=hx+Math.cos(aa)*rr,py=hy+Math.sin(aa)*rr*.8;ctx.globalAlpha=.5+.4*kk;ctx.strokeStyle=i%2?c.color:'#fff';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+(hx-px)*.22,py+(hy-py)*.22);ctx.stroke();}
      ctx.globalAlpha=.35*kk;ctx.strokeStyle=c.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(hx,hy,16+30*(1-kk),0,TAU);ctx.stroke();
      ctx.restore();
    }
  }
  drawDanger(g,t){
    const ctx=this.ctx;
    for(const z of g.bz){
      const k=Math.min(1,z.t/z.dur),pul=.5+.5*Math.sin(t*18);
      ctx.save();ctx.translate(z.x,z.y);ctx.scale(1,.8);
      ctx.fillStyle='rgba(255,50,40,'+(.08+.12*k)+')';ctx.beginPath();ctx.arc(0,0,z.r,0,TAU);ctx.fill();
      ctx.fillStyle='rgba(255,90,50,'+(.16+.22*k)+')';ctx.beginPath();ctx.arc(0,0,z.r*k,0,TAU);ctx.fill();
      ctx.strokeStyle='rgba(255,'+(120+pul*100|0)+',80,.95)';ctx.lineWidth=2.5;ctx.setLineDash([8,6]);ctx.lineDashOffset=-t*50;ctx.beginPath();ctx.arc(0,0,z.r,0,TAU);ctx.stroke();ctx.setLineDash([]);
      ctx.restore();
    }
  }
  drawEnemy(e,t){
    const ctx=this.ctx,def=e.boss?e.bd:e.def,sd=def.sp,u=sd.u||def.u||1.6;
    const frame=e.atk>0?(e.atk>.18?5:6):(e.fuse>0?5:(e.st===2&&e.ai==='charge')?6:1+((t*8+e.ph)|0)%4);
    const fuseFlash=e.fuse>0&&((e.fuse*12)|0)%2===0,warn=(e.st===1&&e.ai==='charge')||(e.xf&&!e.xf.released&&((t*14)|0)%2===0)||(e.st===1&&(e.ai==='slam'||e.ai==='leap')&&((t*16)|0)%2===0);
    const flash=e.fl>0||fuseFlash||warn;
    const sp=Sprites.forSp(sd,frame,flash),k=u/(sp.s||Sprites.S);
    const zo=e.zoff||0,bsz=e.boss?1+.1*(e.tf||0):1,sqx=e.sq?1.1:1,sqy=e.sq?.8:1;
    ctx.fillStyle='rgba(0,0,0,'+(.28-Math.min(.14,zo/500))+')';ctx.beginPath();ctx.ellipse(e.x,e.y,e.r*.95*(1-Math.min(.3,zo/300)),e.r*.32,0,0,TAU);ctx.fill();
    if(e.boss){
      GLOW.at(ctx,e.x,e.y-e.r,e.r*2.8,e.bd.c,.35+.1*Math.sin(t*5));
      if(e.tf>0||e.xf){
        /* powered-up aura: flames + pulsing glow; during the charge it swells and rings expand */
        const c=e.xf&&!e.xf.released?Math.min(1,e.xf.t/e.xf.rel):1,ar=e.r*(2.6+.5*(e.tf||0))*(.7+.5*c);
        GLOW.at(ctx,e.x,e.y-e.r,ar*1.5,'#ff3b2a',.35+.2*c);GLOW.at(ctx,e.x,e.y-e.r,ar,e.bd.c,.55);
        ctx.save();ctx.globalCompositeOperation='lighter';
        for(let i=0;i<11;i++){const a=i/11*TAU+t*.7,bx=e.x+Math.cos(a)*e.r*1.05,by=e.y-e.r*.2+Math.sin(a)*e.r*.3,h=ar*(.55+.45*Math.sin(t*9+i*2.3))*.9;
          ctx.fillStyle=i%2?'rgba(255,120,60,.45)':'rgba(255,230,160,.4)';ctx.beginPath();ctx.moveTo(bx-e.r*.22,by);ctx.lineTo(bx+Math.sin(t*7+i)*e.r*.15,by-h);ctx.lineTo(bx+e.r*.22,by);ctx.closePath();ctx.fill();}
        if(e.xf&&!e.xf.released){ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=3;for(let q=0;q<3;q++){const rr=((t*1.6+q/3)%1);ctx.globalAlpha=1-rr;ctx.beginPath();ctx.ellipse(e.x,e.y-e.r*.3,e.r*(1+rr*5),e.r*(.4+rr*1.6),0,0,TAU);ctx.stroke();}}
        ctx.restore();
      }
    }
    if(e.ai==='explode'&&sd.pal){GLOW.at(ctx,e.x,e.y-e.r,e.r*(2.6+Math.sin(t*12+e.ph)*.5)*(e.fuse>0?1.5:1),sd.pal[3],e.fuse>0?.85:.5);}
    if(e.fuse>0){ctx.strokeStyle='rgba(255,80,60,.75)';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.beginPath();ctx.arc(e.x,e.y,e.def.rad,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='rgba(255,60,40,.12)';ctx.fill();}
    const fly=def.fly||(e.def&&e.def.fly),bob=fly?Math.sin(t*4+e.ph)*3-8:0;
    ctx.save();ctx.translate(e.x,e.y+bob-zo);ctx.scale(e.face*k*bsz*sqx,k*bsz*sqy);
    if(e.def&&e.def.alpha)ctx.globalAlpha=e.def.alpha;
    ctx.imageSmoothingEnabled=true;ctx.drawImage(sp.c,-sp.ox,-sp.oy);ctx.imageSmoothingEnabled=false;ctx.restore();
    if(e.stun>0){ctx.fillStyle='#fff7b0';for(let i=0;i<3;i++){const a=t*6+i*TAU/3;ctx.fillRect(e.x+Math.cos(a)*10-1.5,e.y-e.r*2.4+Math.sin(a)*3,3,3);}}
    if(!e.boss&&e.max>=100&&e.hp<e.max){ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(e.x-e.r,e.y-e.r*2.6,e.r*2,3);ctx.fillStyle='#e9503f';ctx.fillRect(e.x-e.r,e.y-e.r*2.6,e.r*2*clamp(e.hp/e.max,0,1),3);}
  }
  drawLoot(l,t){
    const ctx=this.ctx,b=Math.sin(l.t*5)*2,x=l.x,y=l.y+b-6;
    if(l.ttl&&l.ttl-l.t<8&&((l.t*6)|0)%2===0)ctx.globalAlpha=.4;
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(l.x,l.y+4,7,2.5,0,0,TAU);ctx.fill();
    switch(l.k){
      case'coin':GLOW.at(ctx,x,y,14,'#ffd23f',.7);ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.arc(x,y,6,0,TAU);ctx.fill();ctx.fillStyle='#b8860b';ctx.fillRect(x-1,y-3,2,6);ctx.fillStyle='#fff3b0';ctx.fillRect(x-4,y-4,2,3);break;
      case'heal':GLOW.at(ctx,x,y,16,'#8be07a',.8);ctx.fillStyle='#8be07a';ctx.beginPath();ctx.ellipse(x,y,7,5,.5,0,TAU);ctx.fill();ctx.fillStyle='#d8ffc8';ctx.fillRect(x-3,y-3,3,2);break;
      case'magnet':GLOW.at(ctx,x,y,18,'#ff5a5a',.7);ctx.lineWidth=4;ctx.strokeStyle='#d8d8e0';ctx.beginPath();ctx.arc(x,y,6,Math.PI,0);ctx.stroke();ctx.fillStyle='#e03a3a';ctx.fillRect(x-8,y,4,6);ctx.fillStyle='#3a6ae0';ctx.fillRect(x+4,y,4,6);break;
      case'dmg':GLOW.at(ctx,x,y,18,'#ff5a3d',.8);ctx.fillStyle='#ff5a3d';ctx.beginPath();ctx.moveTo(x,y-9);ctx.lineTo(x+7,y+1);ctx.lineTo(x+2.5,y+1);ctx.lineTo(x+2.5,y+8);ctx.lineTo(x-2.5,y+8);ctx.lineTo(x-2.5,y+1);ctx.lineTo(x-7,y+1);ctx.closePath();ctx.fill();break;
      case'haste':GLOW.at(ctx,x,y,18,'#ffe24d',.8);ctx.fillStyle='#ffe24d';ctx.beginPath();ctx.moveTo(x+2,y-9);ctx.lineTo(x-5,y+1);ctx.lineTo(x-.5,y+1);ctx.lineTo(x-3,y+9);ctx.lineTo(x+5,y-2);ctx.lineTo(x,y-2);ctx.closePath();ctx.fill();break;
      case'xp':GLOW.at(ctx,x,y,16,'#5ad0ff',.8);ctx.fillStyle='#5ad0ff';ctx.beginPath();ctx.moveTo(x,y-8);ctx.lineTo(x+6,y);ctx.lineTo(x,y+8);ctx.lineTo(x-6,y);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(x-1,y-4,2,4);break;
      case'capsule':GLOW.at(ctx,x,y,20,'#ffffff',.8);ctx.fillStyle='#f4f1ea';ctx.fillRect(x-7,y-4,14,8);ctx.fillStyle='#e03a6a';ctx.fillRect(x-7,y-4,7,8);ctx.fillStyle='#fff';ctx.fillRect(x-5,y-3,2,2);ctx.strokeStyle='#222';ctx.lineWidth=1;ctx.strokeRect(x-7,y-4,14,8);break;
      case'luck':GLOW.at(ctx,x,y,20,'#8be07a',.8);ctx.fillStyle='#3fbf5a';for(const [dx,dy] of [[-4,0],[4,0],[0,-4],[0,4]]){ctx.beginPath();ctx.arc(x+dx,y+dy,4,0,TAU);ctx.fill();}ctx.fillStyle='#ff9d1c';ctx.beginPath();ctx.arc(x,y,3,0,TAU);ctx.fill();ctx.fillStyle='#d22';ctx.fillRect(x-.8,y-.8,1.6,1.6);break;
      case'ball':GLOW.at(ctx,x,y-4,22,'#ffaa28',.7);ctx.fillStyle='#ff9d1c';ctx.beginPath();ctx.arc(x,y-4,10,0,TAU);ctx.fill();ctx.fillStyle='#ffd27a';ctx.beginPath();ctx.arc(x-3,y-7,3.5,0,TAU);ctx.fill();ctx.fillStyle='#d22';for(let i=0;i<4;i++){const a=i/4*TAU+.6;ctx.fillRect(x+Math.cos(a)*4-1,y-4+Math.sin(a)*4-1,2,2);}break;
    }
    ctx.globalAlpha=1;
  }
  trialRoom(cx,cy,vw,vh,t,tr){
    const ctx=this.ctx,TS=64;
    ctx.fillStyle='#f3efe4';ctx.fillRect(cx-10,cy-10,vw+20,vh+20);
    const x0=Math.floor(cx/TS),y0=Math.floor(cy/TS),x1=Math.floor((cx+vw)/TS),y1=Math.floor((cy+vh)/TS);
    for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)if((tx+ty)&1){ctx.fillStyle='rgba(190,178,150,.25)';ctx.fillRect(tx*TS,ty*TS,TS,TS);}
    const gr=ctx.createRadialGradient(tr.cx,tr.cy,tr.R*.75,tr.cx,tr.cy,tr.R*1.3);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(255,255,255,.96)');
    ctx.fillStyle=gr;ctx.fillRect(cx-10,cy-10,vw+20,vh+20);
    ctx.strokeStyle='rgba(255,180,60,.85)';ctx.lineWidth=4;ctx.setLineDash([14,10]);ctx.lineDashOffset=-t*30;ctx.beginPath();ctx.arc(tr.cx,tr.cy,tr.R,0,TAU);ctx.stroke();ctx.setLineDash([]);
    for(const tp of tr.trp){
      const on=tp.armed>0,warn=on&&tp.tick<.45;
      ctx.fillStyle=on?'rgba(255,120,50,.22)':'rgba(120,110,150,.18)';ctx.beginPath();ctx.ellipse(tp.x,tp.y,tp.r,tp.r*.62,0,0,TAU);ctx.fill();
      ctx.strokeStyle=warn?'rgba(255,60,40,.95)':on?'rgba(255,170,60,.9)':'rgba(120,110,150,.55)';ctx.lineWidth=3;ctx.setLineDash(on?[]:[8,6]);ctx.beginPath();ctx.ellipse(tp.x,tp.y,tp.r,tp.r*.62,0,0,TAU);ctx.stroke();ctx.setLineDash([]);
      for(let i=0;i<6;i++){const a=i/6*TAU,px=tp.x+Math.cos(a)*tp.r*.55,py=tp.y+Math.sin(a)*tp.r*.34,h2=tp.fl>0?18:warn?8:on?4:2;ctx.fillStyle=tp.fl>0?'#fff2e0':'#9a94b4';ctx.beginPath();ctx.moveTo(px-4,py);ctx.lineTo(px,py-h2);ctx.lineTo(px+4,py);ctx.closePath();ctx.fill();}
      if(tp.fl>0)GLOW.at(ctx,tp.x,tp.y-8,tp.r*1.4,'#ff7a3a',.5);
    }
    for(const b of tr.btn){
      const ready=b.cd<=0;
      ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(b.x,b.y+3,b.r*1.05,b.r*.55,0,0,TAU);ctx.fill();
      ctx.fillStyle='#6a6488';ctx.beginPath();ctx.ellipse(b.x,b.y,b.r,b.r*.55,0,0,TAU);ctx.fill();
      ctx.fillStyle=ready?'#ff4a3a':'#6a6a70';ctx.beginPath();ctx.ellipse(b.x,b.y-(ready?4:1),b.r*.72,b.r*.4,0,0,TAU);ctx.fill();
      ctx.fillStyle=ready?'#ff9a8a':'#8a8a92';ctx.beginPath();ctx.ellipse(b.x-b.r*.2,b.y-(ready?6:3),b.r*.3,b.r*.14,0,0,TAU);ctx.fill();
      if(ready)GLOW.at(ctx,b.x,b.y-6,b.r*1.6,'#ff4a3a',.3+.15*Math.sin(t*5));
    }
    for(let i=0;i<16;i++){const a=t*.25+i*.4,rr=60+((i*53+t*18)%(tr.R-40));ctx.fillStyle='rgba(255,210,120,.55)';ctx.fillRect(tr.cx+Math.cos(a)*rr,tr.cy+Math.sin(a*1.3)*rr,3,3);}
  }
  drawZones(g,cx,cy,t){
    const ctx=this.ctx,th=g.stage.theme,hot=['hell','redrock','waste','arena'].includes(th);
    for(const z of World.zonesNear(th,cx+g.vw/2,cy+g.vh/2,Math.hypot(g.vw,g.vh)/2+120)){
      if(z.kind==='heal'){
        const pl=.5+.5*Math.sin(t*2.4+z.x);
        const gr=ctx.createRadialGradient(z.x,z.y,4,z.x,z.y,z.r);gr.addColorStop(0,'rgba(170,255,190,.55)');gr.addColorStop(.75,'rgba(90,210,130,.38)');gr.addColorStop(1,'rgba(90,210,130,0)');
        ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(z.x,z.y,z.r,z.r*.62,0,0,TAU);ctx.fill();
        ctx.strokeStyle='rgba(200,255,210,'+(.35+.3*pl)+')';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(z.x,z.y,z.r*(.55+.25*pl),z.r*(.55+.25*pl)*.62,0,0,TAU);ctx.stroke();
        ctx.fillStyle='rgba(235,255,240,.9)';for(let i=0;i<5;i++){const a=t*.9+i*1.26,rr=z.r*.6*(((t*.35+i*.2)%1));ctx.fillRect(z.x+Math.cos(a)*rr-1.5,z.y+Math.sin(a)*rr*.6-((t*30+i*9)%24),3,3);}
        ctx.fillStyle='#e8ffe8';ctx.fillRect(z.x-1.5,z.y-8,3,16);ctx.fillRect(z.x-8,z.y-1.5,16,3);
      }else{
        const st=World.trapState(z,g.rt),r=z.r,bc=hot?'#ff7a2a':'#c9d4e8';
        ctx.fillStyle='rgba(20,16,24,.55)';ctx.beginPath();ctx.ellipse(z.x,z.y,r,r*.6,0,0,TAU);ctx.fill();
        ctx.strokeStyle=st===0?'rgba(255,255,255,.18)':st===1?'rgba(255,200,60,.9)':'rgba(255,60,40,.95)';ctx.lineWidth=st===0?2:3;ctx.beginPath();ctx.ellipse(z.x,z.y,r,r*.6,0,0,TAU);ctx.stroke();
        const n=7;
        for(let i=0;i<n;i++){
          const a=i/n*TAU+z.ph,rr=i===0?0:r*.62,px=z.x+(i===0?0:Math.cos(a)*rr),py=z.y+(i===0?0:Math.sin(a)*rr*.6);
          const hgt=st===2?15:st===1?4+((t*14)|0)%2*2:2;
          ctx.fillStyle=st===2?'#ffe8e0':bc;ctx.beginPath();ctx.moveTo(px-4,py);ctx.lineTo(px,py-hgt);ctx.lineTo(px+4,py);ctx.closePath();ctx.fill();
          if(st===2){ctx.fillStyle='rgba(255,70,50,.9)';ctx.fillRect(px-1,py-hgt,2,3);}
        }
        if(st===2){GLOW.at(ctx,z.x,z.y-6,r*1.2,'#ff4a30',.35);}
      }
    }
  }
  drawEmote(k,x,y,t){
    const ctx=this.ctx;ctx.save();ctx.textAlign='center';ctx.font='900 17px "Bangers",sans-serif';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.85)';
    const sym={happy:['★','#ffd23f'],hurt:['!','#ff6b6b'],pain:['!!','#ff3b3b'],smug:['♪','#ffd23f'],wow:['?!','#8ad8ff']}[k];
    if(sym){ctx.strokeText(sym[0],x,y);ctx.fillStyle=sym[1];ctx.fillText(sym[0],x,y);}
    ctx.restore();
  }
  drawPet(q,t,g){
    const ctx=this.ctx,d=q.d,sd=d.sp,mv=Math.abs(q.x-(q.px===undefined?q.x:q.px))>.2;
    q.px=q.x;
    const fr=q.act>0?6:mv?1+((t*9)|0)%4:0,sp=Sprites.forSp(sd,fr,q.fl>0&&((t*20)|0)%2===0),k=(sd.u||1.4)/(sp.s||Sprites.S);
    const fly=d.id==='shenron'||d.id==='droid'||d.id==='buu',bob=fly?Math.sin(t*4+q.t)*3-8:Math.abs(Math.sin(q.t*(mv?9:2)))*(mv?-2:-.8);
    ctx.fillStyle='rgba(0,0,0,.26)';ctx.beginPath();ctx.ellipse(q.x,q.y,7,2.4,0,0,TAU);ctx.fill();
    if(q.cd<=0)GLOW.at(ctx,q.x,q.y-12+bob,20+3*Math.sin(t*5),d.c,.45);
    ctx.save();ctx.translate(q.x,q.y+bob);ctx.scale(q.face*k,k);ctx.drawImage(sp.c,-sp.ox,-sp.oy);ctx.restore();
  }
  drawPillar(o){
    const ctx=this.ctx,x=o.x,y=o.y,r=o.r;
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(x,y+2,r*1.15,r*.5,0,0,TAU);ctx.fill();
    ctx.fillStyle='#8c84a8';ctx.fillRect(x-r*.95,y-r*.5,r*1.9,r*.6);
    ctx.fillStyle='#d8d4e8';ctx.fillRect(x-r*.62,y-r*2.6,r*1.24,r*2.2);ctx.fillStyle='#b4aed0';ctx.fillRect(x+r*.15,y-r*2.6,r*.47,r*2.2);
    ctx.fillStyle='#f4f2fc';ctx.fillRect(x-r*.62,y-r*2.6,r*.22,r*2.2);
    ctx.fillStyle='#a49cc4';ctx.fillRect(x-r*.85,y-r*2.85,r*1.7,r*.34);ctx.fillStyle='#8c84a8';ctx.fillRect(x-r*.85,y-r*.55,r*1.7,r*.2);
    if(o.v===0){ctx.fillStyle='#6a64c8';ctx.fillRect(x-r*.1,y-r*1.9,r*.2,r*.9);ctx.fillRect(x-r*.3,y-r*1.6,r*.6,r*.18);}
  }
  drawChest(c,t){
    const ctx=this.ctx,x=c.x,y=c.y,s=c.final?1.5:1,pulse=.5+.5*Math.sin(t*4);
    GLOW.at(ctx,x,y-10*s,(34+8*pulse)*s,c.final?'#ff7ad0':'#ffd23f',.9);
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(x,y+3,14*s,4*s,0,0,TAU);ctx.fill();
    ctx.fillStyle='#7a4a1e';ctx.fillRect(x-12*s,y-14*s,24*s,14*s);ctx.fillStyle='#a8682a';ctx.fillRect(x-12*s,y-20*s,24*s,7*s);
    ctx.fillStyle='#ffd23f';ctx.fillRect(x-12*s,y-9*s,24*s,2.5*s);ctx.fillRect(x-2*s,y-18*s,4*s,10*s);ctx.fillStyle='#fff3b0';ctx.fillRect(x-1*s,y-12*s,2*s,3*s);
  }
  drawFeature(f,t,g){
    const ctx=this.ctx,x=f.x,y=f.y,pulse=.5+.5*Math.sin(t*3+x);
    if(f.ttl-f.t<10&&((f.t*5)|0)%2===0)ctx.globalAlpha=.5;
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(x,y+2,22,7,0,0,TAU);ctx.fill();
    switch(f.kind){
      case'shrine':GLOW.at(ctx,x,y-20,40+8*pulse,'#ffd23f',.7);ctx.fillStyle='#8a8f98';ctx.fillRect(x-9,y-34,18,34);ctx.fillStyle='#a8aeb8';ctx.fillRect(x-9,y-34,18,5);ctx.fillStyle='#ffd23f';ctx.fillRect(x-3,y-24,6,2);ctx.fillRect(x-1,y-28,2,10);break;
      case'spring':GLOW.at(ctx,x,y-4,46,'#8be07a',.5);ctx.fillStyle='#2f86b8';ctx.beginPath();ctx.ellipse(x,y-2,22,9,0,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y-2,10+pulse*8,4+pulse*3,0,0,TAU);ctx.stroke();break;
      case'altar':GLOW.at(ctx,x,y-26,38+6*pulse,'#ff5a5a',.7);ctx.fillStyle='#3a3340';ctx.fillRect(x-16,y-14,32,14);ctx.fillStyle='#4a4250';ctx.fillRect(x-16,y-14,32,4);ctx.fillStyle='#ff5a5a';ctx.beginPath();ctx.moveTo(x,y-34-pulse*3);ctx.lineTo(x+6,y-24);ctx.lineTo(x,y-16);ctx.lineTo(x-6,y-24);ctx.closePath();ctx.fill();break;
      case'font':GLOW.at(ctx,x,y-30,50,'#8ad8ff',.6);{const gr=ctx.createLinearGradient(0,y-80,0,y);gr.addColorStop(0,'rgba(138,216,255,0)');gr.addColorStop(1,'rgba(138,216,255,.55)');ctx.fillStyle=gr;ctx.fillRect(x-12,y-80,24,80);}ctx.fillStyle='#fff';ctx.fillRect(x-2,y-40-pulse*10,4,4);break;
      case'chamber':GLOW.at(ctx,x,y-34,70+10*pulse,'#ffffff',.8);GLOW.at(ctx,x,y-34,44,'#ffd27a',.6);
        ctx.fillStyle='#e9e1cf';ctx.fillRect(x-22,y-64,44,64);ctx.fillStyle='#c9bfa6';ctx.fillRect(x-22,y-64,6,64);ctx.fillRect(x+16,y-64,6,64);ctx.fillRect(x-22,y-68,44,6);
        ctx.fillStyle='#fffbe8';ctx.fillRect(x-14,y-58,28,58);ctx.fillStyle='#ffd23f';ctx.fillRect(x-1,y-58,2,58);
        ctx.strokeStyle='rgba(255,210,63,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y-34,24+pulse*4,0,TAU);ctx.stroke();break;
      case'totem':{GLOW.at(ctx,x,y-34,48+8*pulse,'#8be07a',.7);ctx.fillStyle='#6a4a2a';ctx.fillRect(x-9,y-52,18,52);ctx.fillStyle='#8a6a3a';ctx.fillRect(x-9,y-52,5,52);ctx.fillStyle='#4a3018';ctx.fillRect(x-12,y-56,24,5);
        ctx.fillStyle='#8be07a';ctx.fillRect(x-6,y-44,4,5);ctx.fillRect(x+2,y-44,4,5);ctx.fillRect(x-5,y-34,10,3);ctx.fillStyle='#ffd23f';ctx.fillRect(x-3,y-22,6,6);
        ctx.strokeStyle='rgba(139,224,122,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y-30,28+pulse*5,0,TAU);ctx.stroke();break;}
      case'cache':GLOW.at(ctx,x,y-8,30,'#ffd23f',.6);for(let i=0;i<6;i++){ctx.fillStyle=i%2?'#ffd23f':'#e8b020';ctx.beginPath();ctx.arc(x-12+i*5,y-4-(i%3)*3,5,0,TAU);ctx.fill();}break;
    }
    ctx.globalAlpha=1;
  }

  /* ---------- HUD (screen space) ---------- */
  hud(g,dt,cx,cy){
    const ctx=this.ctx,U=this.U,W=this.W,H=this.H,p=g.p,tt=this.tt,tr=this.tr;
    ctx.setTransform(1,0,0,1,0,0);ctx.textBaseline='alphabetic';ctx.lineJoin='round';
    const F=(sz,wt)=>(wt||700)+' '+Math.round(sz*U)+'px "Rajdhani",sans-serif';
    const txt=(s,x,y,col,al,font)=>{ctx.font=font;ctx.textAlign=al||'left';ctx.lineWidth=3*U;ctx.strokeStyle='rgba(0,0,0,.8)';ctx.strokeText(s,x,y);ctx.fillStyle=col||'#fff';ctx.fillText(s,x,y);};
    const m=10*U;
    /* xp bar */
    ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(0,0,W,11*U);
    const xr=clamp(g.xp/g.need,0,1);ctx.fillStyle='#4ac8ff';ctx.fillRect(0,0,W*xr,11*U);ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(0,0,W*xr,3*U);
    txt(tt('lv')+' '+g.lvl,m,30*U,'#fff','left',F(16));
    /* hp */
    const bw=Math.min(250*U,W*.4),hy=38*U;
    ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(m,hy,bw,15*U);
    const hr=clamp(p.hp/p.maxHp,0,1);ctx.fillStyle=hr>.3?'#e9503f':'#ff2a2a';ctx.fillRect(m,hy,bw*hr,15*U);ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillRect(m,hy,bw*hr,4*U);
    txt(Math.ceil(p.hp)+' / '+p.maxHp,m+6*U,hy+12*U,'#fff','left',F(11));
    /* weapons */
    let ix=m;const wy=hy+22*U,sz=32*U;
    for(const w of g.weapons.values()){
      ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(ix,wy,sz,sz);
      ctx.strokeStyle=w.evo?'#ffd23f':'rgba(255,255,255,.25)';ctx.lineWidth=(w.evo?2.5:1.5)*U;ctx.strokeRect(ix,wy,sz,sz);
      txt(w.def.k,ix+sz/2,wy+sz*.72,w.color,'center',F(21,900).replace('"Rajdhani",sans-serif','"Noto Sans JP","Hiragino Sans",sans-serif'));
      {const pw=(sz-6*U)/WMAX;for(let i=0;i<WMAX;i++){ctx.fillStyle=i<w.lv?(w.evo?'#ffd23f':'#fff'):'rgba(255,255,255,.2)';ctx.fillRect(ix+3*U+i*pw,wy+sz-4*U,pw-1.2*U,2.4*U);}}
      if(w.evo)txt(w.evo>=2?'★★':'★',ix+sz-7*U,wy+10*U,'#ffd23f','center',F(11));
      if(w.maxed&&w.evo<g.maxEvo(w.id)){
        if(g.evoReady(w))txt('!',ix+5*U,wy+10*U,'#ff9d1c','center',F(12));
        else{const pn=PASS[evoPass(w.id,w.evo)];if(pn)txt(pn.k,ix+7*U,wy+10*U,pn.c,'center',F(11,900).replace('"Rajdhani",sans-serif','"Noto Sans JP","Hiragino Sans",sans-serif'));}
      }
      ix+=sz+4*U;
    }
    /* trinkets */
    let tx2=m;const ty=wy+sz+6*U,ts=22*U;
    for(const id of g.trinkets){
      const t=TRINKETS.find(x=>x.id===id);
      ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(tx2,ty,ts,ts);ctx.strokeStyle=RARITY[t.r].c;ctx.lineWidth=2*U;ctx.strokeRect(tx2,ty,ts,ts);
      txt(t.k,tx2+ts/2,ty+ts*.76,RARITY[t.r].c,'center',F(15,900).replace('"Rajdhani",sans-serif','"Noto Sans JP","Hiragino Sans",sans-serif'));
      tx2+=ts+3*U;
    }
    /* form label */
    const fe=g.formEntry,nxt=g.formsUnlocked<g.formMax?FORM_TIERS[g.formsUnlocked].lvl:null;
    const fy=ty+ts+16*U;
    txt((fe?tr(fe.n):tt('baseForm'))+(nxt?'  ·  '+tt('nextForm')+' '+nxt:''),m,fy,fe?fe.aura:'#fff','left',F(12));
    /* pet ability button (bottom-left) */
    this.petBtn=null;
    if(g.pet&&!g.ended){
      const q=g.pet,d=q.d,rr=24*U,bx=m+rr+4*U,by=H-m-rr-8*U,ready=q.cd<=0;
      this.petBtn={x:bx,y:by,r:rr};
      ctx.fillStyle='rgba(0,0,0,.6)';ctx.beginPath();ctx.arc(bx,by,rr,0,TAU);ctx.fill();
      if(!ready){ctx.fillStyle='rgba(255,255,255,.14)';ctx.beginPath();ctx.moveTo(bx,by);ctx.arc(bx,by,rr-3*U,-Math.PI/2,-Math.PI/2+TAU*(1-q.cd/d.cd));ctx.closePath();ctx.fillStyle=hexA(d.c,.45);ctx.fill();}
      ctx.lineWidth=3*U;ctx.strokeStyle=ready?d.c:'rgba(255,255,255,.3)';ctx.beginPath();ctx.arc(bx,by,rr,0,TAU);ctx.stroke();
      if(ready){ctx.globalAlpha=.3+.25*Math.sin(g.rt*6);ctx.strokeStyle=d.c;ctx.lineWidth=2*U;ctx.beginPath();ctx.arc(bx,by,rr+4*U,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
      txt(d.k,bx,by+8*U,ready?d.c:'#9aa6b8','center',F(22,900).replace('"Rajdhani",sans-serif','"Noto Sans JP","Hiragino Sans",sans-serif'));
      txt(ready?'['+(this.keyHints.pet||'Q')+']':Math.ceil(q.cd)+'s',bx,by+rr+13*U,ready?'#fff':'#9aa6b8','center',F(11));
    }
    /* Senzu bag button (after the pet and ability buttons) */
    this.szBtn=null;
    if(!g.ended){
      const rr=24*U,bx=m+rr+4*U+(rr*2+12*U)*((g.pet?1:0)+1),by=H-m-rr-8*U,n=g.senzu,ok=n>0&&g.p.hp<g.p.maxHp-.5&&g.senzuCd<=0,col='#8be07a';
      this.szBtn={x:bx,y:by,r:rr};
      ctx.fillStyle='rgba(0,0,0,.6)';ctx.beginPath();ctx.arc(bx,by,rr,0,TAU);ctx.fill();
      ctx.lineWidth=3*U;ctx.strokeStyle=n>0?col:'rgba(255,255,255,.3)';ctx.beginPath();ctx.arc(bx,by,rr,0,TAU);ctx.stroke();
      if(ok){ctx.globalAlpha=.3+.25*Math.sin(g.rt*6);ctx.strokeStyle=col;ctx.lineWidth=2*U;ctx.beginPath();ctx.arc(bx,by,rr+4*U,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
      txt('豆',bx,by+8*U,n>0?col:'#6a7688','center',F(22,900).replace('"Rajdhani",sans-serif','"Noto Sans JP","Hiragino Sans",sans-serif'));
      for(let i=0;i<SENZU_MAX;i++){ctx.fillStyle=i<n?col:'rgba(255,255,255,.22)';ctx.beginPath();ctx.arc(bx+(i-1)*8*U,by-rr+5*U,2.6*U,0,TAU);ctx.fill();}
      txt('['+(this.keyHints.senzu||'H')+']',bx,by+rr+13*U,n>0?'#fff':'#9aa6b8','center',F(11));
    }
    /* character ability button (next to the pet button) */
    this.abBtn=null;
    if(!g.ended){
      const a=g.abil,rr=24*U,bx=(g.pet?m+rr+4*U+rr*2+12*U:m+rr+4*U),by=H-m-rr-8*U,ready=g.abReady,col=a.c;
      let prog=1,label,act=false;
      if(a.m==='berserk'){act=g.bers>0;prog=act?g.bers/10:g.bersCd>0?1-g.bersCd/45:1;label=act?Math.ceil(g.bers)+'s':g.bersCd>0?Math.ceil(g.bersCd)+'s':'['+(this.keyHints.kaioken||'R')+']';}
      else if(a.m==='kaioken'){act=g.kai>0;prog=1;label=g.kai?'x'+(g.kai===1?10:20):g.kaiAvail?'['+(this.keyHints.kaioken||'R')+']':'Lv '+FORM_TIERS[0].lvl;}
      else{prog=g.abCd>0?1-g.abCd/a.cd:1;label=g.abCd>0?Math.ceil(g.abCd)+'s':'['+(this.keyHints.kaioken||'R')+']';act=!!(g.regenT>0||g.abBuf||g.clones||g.critT>0||g.shieldT>0||g.tsT>0);}
      const usable=a.m==='kaioken'?g.kaiAvail:ready;
      this.abBtn={x:bx,y:by,r:rr};
      ctx.fillStyle='rgba(0,0,0,.6)';ctx.beginPath();ctx.arc(bx,by,rr,0,TAU);ctx.fill();
      if(prog<1){ctx.beginPath();ctx.moveTo(bx,by);ctx.arc(bx,by,rr-3*U,-Math.PI/2,-Math.PI/2+TAU*prog);ctx.closePath();ctx.fillStyle=hexA(col,.45);ctx.fill();}
      ctx.lineWidth=3*U;ctx.strokeStyle=usable?col:'rgba(255,255,255,.3)';ctx.beginPath();ctx.arc(bx,by,rr,0,TAU);ctx.stroke();
      if(usable||act){ctx.globalAlpha=.3+.25*Math.sin(g.rt*(act?12:6));ctx.strokeStyle=col;ctx.lineWidth=2*U;ctx.beginPath();ctx.arc(bx,by,rr+4*U,0,TAU);ctx.stroke();ctx.globalAlpha=1;}
      txt(a.k,bx,by+8*U,usable||act?col:'#9aa6b8','center',F(22,900).replace('"Rajdhani",sans-serif','"Noto Sans JP","Hiragino Sans",sans-serif'));
      txt(label,bx,by+rr+13*U,usable?'#fff':'#9aa6b8','center',F(11));
      txt(this.tr(a.n),bx,by-rr-7*U,usable||act?col:'#9aa6b8','center',F(10));
    }
    /* timer + progress */
    const stg=g.stage;
    txt(fmtT(g.t),W/2,42*U,'#ffd23f','center',F(30,400).replace('"Rajdhani"','"Bangers"'));
    const pw=Math.min(300*U,W*.34),px=W/2-pw/2,py=52*U;
    ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(px,py,pw,6*U);ctx.fillStyle='#ffd23f';ctx.fillRect(px,py,pw*clamp(g.t/g.dur,0,1),6*U);
    for(const b of g.bossQ){ctx.fillStyle=b.final?'#ff3b3b':'#ffffff';ctx.fillRect(px+pw*clamp(b.t/g.dur,0,1)-1*U,py-2*U,2.5*U,10*U);}
    /* right side: kills, zenny, buffs */
    txt(g.kills+' '+tt('kills'),W-m,30*U,'#fff','right',F(15));
    {const zs=String(Math.floor(g.run.coins));txt(zs,W-m,50*U,'#ffd23f','right',F(14));ctx.font=F(14);const zw=ctx.measureText(zs).width,cr=7*U,cx0=W-m-zw-cr-4*U,cy0=45*U;
      ctx.fillStyle='#7a4e0c';ctx.beginPath();ctx.arc(cx0,cy0,cr,0,TAU);ctx.fill();ctx.fillStyle='#f2b51c';ctx.beginPath();ctx.arc(cx0,cy0,cr*.84,0,TAU);ctx.fill();
      ctx.strokeStyle='#7a4e0c';ctx.lineWidth=1.6*U;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx0-cr*.38,cy0-cr*.38);ctx.lineTo(cx0+cr*.38,cy0-cr*.38);ctx.lineTo(cx0-cr*.38,cy0+cr*.38);ctx.lineTo(cx0+cr*.38,cy0+cr*.38);ctx.stroke();}
    let by=70*U;
    if(g.buffs.dmg>0){txt(tt('buffDmg')+' '+Math.ceil(g.buffs.dmg)+'s',W-m,by,'#ff7b4a','right',F(12));by+=16*U;}
    if(g.buffs.haste>0){txt(tt('buffHaste')+' '+Math.ceil(g.buffs.haste)+'s',W-m,by,'#ffe24d','right',F(12));by+=16*U;}
    if(g.riskT>0){txt(tt('buffRisk')+' '+Math.ceil(g.riskT)+'s',W-m,by,'#ff7a3a','right',F(12));by+=16*U;}
    if(g.totemTag){const d=g.totemFx.storm?Math.ceil(Math.max(0,g.stormT)):g.totemFx.spirit?Math.ceil(Math.max(0,g.pulseT)):0;txt(this.tr(g.totemTag)+(g.totemLuck>0?' x'+g.totemLuck:'')+(d?' '+d+'s':''),W-m,by,'#8be07a','right',F(12));by+=16*U;}
    if(g.inHeal){txt(tt('inHeal'),W-m,by,'#8be07a','right',F(12));by+=16*U;}
    if(g.bers>0){txt('BERSERK '+Math.ceil(g.bers)+'s',W-m,by,'#8aff3a','right',F(14,900));by+=17*U;}
    else if(g.berAvail){txt(g.bersCd>0?'Berserk '+Math.ceil(g.bersCd)+'s':'['+(this.keyHints.kaioken||'R')+'] Berserk',W-m,by,g.bersCd>0?'#8a9a8a':'#b8ff8a','right',F(11));by+=15*U;}
    if(g.kai>0){txt('KAIOKEN x'+(g.kai===1?10:20)+'  -'+(g.kai===1?4:8)+' HP/s  ['+(this.keyHints.kaioken||'R')+']',W-m,by,'#ff3b2f','right',F(13,900));by+=17*U;}
    else if(g.kaiAvail){txt('['+(this.keyHints.kaioken||'R')+'] Kaioken x10 / x20',W-m,by,'#d89a8a','right',F(11));by+=15*U;}
    if(g.slowT>0){txt(tt('buffSlow'),W-m,by,'#9fe8ff','right',F(12));by+=16*U;}
    if(g.x2)txt('x2',W-m,by+4*U,'#ff7ad0','right',F(16,900));
    /* dragon balls: tiny, bottom-right */
    for(let i=0;i<7;i++){const x=W-m-(6-i)*13*U-5*U,y=H-m-4*U,on=i<g.balls;ctx.fillStyle=on?'#ff9d1c':'rgba(0,0,0,.45)';ctx.beginPath();ctx.arc(x,y,5*U,0,TAU);ctx.fill();ctx.strokeStyle=on?'#ffd27a':'rgba(255,255,255,.2)';ctx.lineWidth=1;ctx.stroke();if(on){ctx.fillStyle='#d22';ctx.fillRect(x-1,y-1,2,2);}}
    /* boss bars */
    let yb=70*U;const bosses=g.en.filter(e=>(e.boss||e.sparring)&&!e.dead);
    for(const b of bosses.slice(0,2)){
      const bw2=Math.min(620*U,W*.72),bx=(W-bw2)/2,bh=18*U;
      b.hpLag=b.hpLag===undefined?b.hp:lerp(b.hpLag,b.hp,Math.min(1,dt*3));
      ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(bx-3*U,yb-3*U,bw2+6*U,bh+6*U);
      ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillRect(bx,yb,bw2*clamp(b.hpLag/b.max,0,1),bh);
      const gr=ctx.createLinearGradient(0,yb,0,yb+bh);gr.addColorStop(0,b.bd.c);gr.addColorStop(1,'#7a1a1a');ctx.fillStyle=gr;ctx.fillRect(bx,yb,bw2*clamp(b.hp/b.max,0,1),bh);
      ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(bx+bw2*.33,yb,2*U,bh);ctx.fillRect(bx+bw2*.66,yb,2*U,bh);
      txt(tr(b.bd.n)+(b.final?'  ★':'')+(b.tf?'  '+'★'.repeat(b.tf):''),bx,yb-6*U,'#fff','left',F(14));
      txt(fmtN(Math.max(0,b.hp))+' / '+fmtN(b.max),bx+bw2,yb-6*U,'#ffd0d0','right',F(12));
      yb+=bh+22*U;
    }
    /* beacons for off-screen map items */
    const tgts=[];for(const f of g.feat)if(!f.used)tgts.push([f.x,f.y,f.kind==='chamber'?'#ffffff':f.kind==='totem'?'#8be07a':f.kind==='altar'?'#ff5a5a':f.kind==='spring'?'#8be07a':f.kind==='font'?'#8ad8ff':'#ffd23f']);
    for(const c of g.chests)tgts.push([c.x,c.y,'#ffd23f']);
    for(const l of g.loot)if(l.k==='ball'||l.k==='capsule')tgts.push([l.x,l.y,l.k==='ball'?'#ff9d1c':'#ffffff']);
    for(const [tx3,ty3,col] of (g.trial?[]:tgts)){
      const sxp=(tx3-cx)*this.Z,syp=(ty3-cy)*this.Z;
      if(sxp>20&&sxp<W-20&&syp>20&&syp<H-20)continue;
      const a=Math.atan2(ty3-(p.y-14),tx3-p.x),r=Math.min(W,H)/2-30*U,ex=W/2+Math.cos(a)*Math.min(r*W/H*.9,W/2-26*U),ey=H/2+Math.sin(a)*Math.min(r,H/2-26*U);
      /* big, glowing, outlined arrow that pulses; the distance sits next to it */
      const pu=1+.13*Math.sin(g.rt*6+tx3*.01),k2=1.75*pu,dist=Math.hypot(tx3-p.x,ty3-p.y);
      GLOW.at(ctx,ex,ey,34*U*pu,col,.7);
      ctx.save();ctx.translate(ex,ey);ctx.rotate(a);ctx.scale(k2,k2);
      ctx.beginPath();ctx.moveTo(12*U,0);ctx.lineTo(-8*U,-9*U);ctx.lineTo(-4*U,0);ctx.lineTo(-8*U,9*U);ctx.closePath();
      ctx.lineJoin='round';ctx.lineWidth=4.5*U;ctx.strokeStyle='#0a0f1c';ctx.stroke();ctx.lineWidth=1.6*U;ctx.strokeStyle='#ffffff';ctx.stroke();
      ctx.fillStyle=col;ctx.globalAlpha=1;ctx.fill();ctx.restore();
      txt(Math.round(dist/10)+'m',clamp(ex-Math.cos(a)*34*U,26*U,W-26*U),clamp(ey-Math.sin(a)*26*U+4*U,18*U,H-8*U),'#ffffff','center',F(12));
    }
    /* altar prompt */
    for(const f of g.feat)if((f.kind==='altar'||f.kind==='chamber'||f.kind==='totem')&&f.near&&!f.used){
      txt('['+(this.keyHints.interact||'E')+'] '+tt(f.kind==='altar'?'altarPrompt':f.kind==='totem'?'totemPrompt':'chamberPrompt'),W/2,H*.7,'#ff8a8a','center',F(16));
    }
    if(g.trial&&g.trial.phase==='train'){
      const tr=g.trial,rem=Math.max(0,Math.ceil(tr.dur-tr.t)),bw=Math.min(360*U,W*.5);
      txt(tt('trialTrain')+' '+rem+'s',W/2,H*.18,'#5a64c8','center',F(26,400).replace('"Rajdhani"','"Bangers"'));
      txt(tt('trialHint'),W/2,H*.18+38*U,'#cfd8ff','center',F(13));
      ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(W/2-bw/2,H*.18+10*U,bw,8*U);ctx.fillStyle='#aab4ff';ctx.fillRect(W/2-bw/2,H*.18+10*U,bw*clamp(1-tr.t/tr.dur,0,1),8*U);
    }
    /* banner */
    if(g.banner){
      const b=g.banner,k=b.t/b.dur,a=k<.1?k/.1:k>.8?(1-k)/.2:1;
      ctx.globalAlpha=clamp(a,0,1);
      txt(b.txt,W/2,H*.3,b.col,'center',F(Math.min(34,Math.max(18,W/U/24)),400).replace('"Rajdhani"','"Bangers"'));
      ctx.globalAlpha=1;
    }
    if(this.joy&&this.joy.on){
      const j=this.joy;ctx.globalAlpha=.3;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(j.ox,j.oy,48*U,0,TAU);ctx.fill();
      ctx.globalAlpha=.6;ctx.beginPath();ctx.arc(j.ox+j.x*38*U,j.oy+j.y*38*U,22*U,0,TAU);ctx.fill();ctx.globalAlpha=1;
    }
    if(this.save.d.settings.fps){this.fa+=dt;this.fn++;if(this.fa>.5){this.fps=Math.round(this.fn/this.fa);this.fa=0;this.fn=0;}txt(this.fps+' FPS',W-m,H-26*U,'#9fe8ff','right',F(11));}
    if(g.sandbox)txt('SANDBOX',W/2,H-10*U,'#ff7ad0','center',F(12));
  }
}
