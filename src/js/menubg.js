'use strict';
/* ====== Main-menu background: a fast panoramic fly-over of the stages with random fighters that appear,
   power up, transform, use their special abilities and emote. The canvas is blurred by CSS while a menu is open. ====== */
class MenuBg{
  constructor(r){
    this.r=r;this.t=0;this.sc=null;this.prev=null;this.wipe=1;this.actors=[];this.fx=[];this.spawnT=.3;this.recent=[];
    this.themes=Object.keys(THEMES);this.last='';this.newScene();this.wipe=1;
  }
  newScene(){
    const th=pick(this.themes.filter(t=>t!==this.last));this.last=th;
    const dir=Math.random()<.5?-1:1;
    this.prev=this.sc;
    this.sc={theme:th,cx:rnd(0,6000),cy:rnd(0,4000),vx:dir*rnd(120,190),vy:rnd(-30,30),t:0,dur:rnd(8.5,11.5),dir};
    this.wipe=this.prev?0:1;
  }
  /* ---- actors ---- */
  pickChar(){
    let c;for(let i=0;i<6;i++){c=pick(CHARS);if(!this.recent.includes(c.id))break;}
    this.recent.push(c.id);if(this.recent.length>12)this.recent.shift();return c;
  }
  spawn(vw,vh){
    const c=this.pickChar(),line=LINES[c.line||'saiyan'],ab=ABIL[c.id],sc=this.sc;
    let x=0,y=0,bd=-1;
    for(let i=0;i<8;i++){const tx=rnd(vw*.08,vw*.92),ty=vh*rnd(.5,.93),md=Math.min(999,...this.actors.map(o=>Math.hypot((o.x-tx)*1.3,o.y-ty)));if(md>bd){bd=md;x=tx;y=ty;}}
    const s=.75+.85*(y/vh),face=Math.random()<.7?sc.dir:-sc.dir;
    const segs=[{k:'in',d:.7}],pool=['run','idle','ki','beam','ability','dash','transform','transform'];
    const n=3+((Math.random()*2)|0);
    for(let i=0;i<n;i++){
      let k=pick(pool);
      if(k==='transform'&&(segs.some(q=>q.k==='transform')||line.length<2))k=pick(['run','idle','beam','ability']);
      if(k==='ability'&&!ab)k='ki';
      segs.push({k,d:k==='run'?rnd(1.4,2.4):k==='idle'?rnd(1.2,1.9):k==='ki'?1.7:k==='beam'?2.5:k==='ability'?2:k==='dash'?1.1:3.8});
    }
    segs.push({k:'out',d:.55});
    const a={c,line,x,y,s,face,segs,si:-1,t:0,segT:0,form:-1,vx:0,vy:0,ex:null,ph:rnd(0,9),au:0,chg:0,fired:false,ab};
    this.actors.push(a);this.nextSeg(a);
  }
  nextSeg(a){
    a.si++;a.segT=0;const sg=a.segs[a.si];if(!sg){a.dead=true;return;}
    a.seg=sg.k;a.fired=false;a.ex=null;a.vx=a.vy=0;a.chg=0;
    const sd=this.sc.dir;
    if(sg.k==='in'){this.ring(a.x,a.y-24*a.s*.5,10,70*a.s*.5,'#ffffff',.5);this.burst(a.x,a.y-30,10,'#ffe9a0');}
    else if(sg.k==='run'){a.face=Math.random()<.75?sd:-sd;a.vx=a.face*rnd(60,110);a.vy=rnd(-14,14);}
    else if(sg.k==='idle'){a.ex=pick(['happy','smug','wow','blink','surprised']);}
    else if(sg.k==='dash'){a.vx=a.face*rnd(420,560);this.trailT=0;}
    else if(sg.k==='out'){this.ring(a.x,a.y-24,10,70,'#ffffff',.4);}
  }
  ring(x,y,r0,r1,col,d){this.fx.push({t:'ring',x,y,r0,r1,col,life:d,d});}
  burst(x,y,n,col){for(let i=0;i<n;i++){const an=rnd(0,TAU),v=rnd(30,120);this.fx.push({t:'spark',x,y,vx:Math.cos(an)*v,vy:Math.sin(an)*v-20,life:rnd(.4,.9),d:.9,col,sz:rnd(1.5,3)});}}
  /* mechanic -> visual style of the special ability */
  abStyle(m){
    return{beam:'beam',nova:'nova',dash:'dash',clones:'clones',barrier:'barrier',regen:'heal',absorb:'nova',blind:'nova',erase:'nova',timestop:'ring',
      rewind:'ring',jackpot:'sparkle',crit:'aura',buff:'aura',kaioken:'aura',berserk:'aura'}[m]||'aura';
  }
  /* ---- update ---- */
  update(dt,vw,vh){
    this.t+=dt;
    const sc=this.sc;sc.t+=dt;sc.cx+=sc.vx*dt;sc.cy+=sc.vy*dt;
    if(this.prev){this.prev.cx+=this.prev.vx*dt;this.prev.cy+=this.prev.vy*dt;}
    if(this.wipe<1){this.wipe=Math.min(1,this.wipe+dt/1.15);if(this.wipe>=1)this.prev=null;}
    else if(sc.t>sc.dur)this.newScene();
    const maxN=vw<520?3:vw<900?5:7;
    this.spawnT-=dt;if(this.spawnT<=0){this.spawnT=rnd(.9,1.9);if(this.actors.length<maxN)this.spawn(vw,vh);}
    for(const a of this.actors){
      a.t+=dt;a.segT+=dt;const sg=a.segs[a.si];
      a.x+=a.vx*dt;a.y=clamp(a.y+a.vy*dt,vh*.42,vh*.95);
      if(a.x<-60)a.x=vw+40;else if(a.x>vw+60)a.x=-40;
      const k=a.seg,p=a.segT/sg.d,ac=a.form>=0?a.line[a.form].aura:null;
      if(k==='ki'){
        if(!a.fired&&a.segT>.5){a.fired=true;a.shots=3;a.shotT=0;}
        if(a.fired&&a.shots>0){a.shotT-=dt;if(a.shotT<=0){a.shotT=.22;a.shots--;this.fx.push({t:'ball',x:a.x+a.face*16*a.s*.5,y:a.y-26*a.s*.5+rnd(-8,8),vx:a.face*rnd(380,480),vy:rnd(-30,30),life:1.5,col:ac||(a.ab?a.ab.c:'#ffd23f'),r:7*a.s*.5});}}
      }else if(k==='beam'){
        a.chg=Math.min(1,a.segT/1.0);
        if(a.segT>1.0&&!a.fired){a.fired=true;this.ring(a.x,a.y-24,10,110,a.ab?a.ab.c:'#6ad0ff',.5);this.fx.push({t:'beam',x:a.x+a.face*14,y:a.y-26*a.s*.5,dir:a.face,w:20*a.s*.5,col:a.ab&&a.ab.m==='beam'?a.ab.c:'#6ad0ff',life:1.25,d:1.25,s:a.s});}
      }else if(k==='ability'){
        const st=this.abStyle(a.ab.m);a.chg=Math.min(1,a.segT/.6);
        if(!a.fired&&a.segT>.6){a.fired=true;
          const col=a.ab.c;
          if(st==='beam')this.fx.push({t:'beam',x:a.x+a.face*14,y:a.y-26*a.s*.5,dir:a.face,w:24*a.s*.5,col,life:1.1,d:1.1,s:a.s});
          else if(st==='nova'||st==='ring'){this.ring(a.x,a.y-20,10,190,col,.7);this.ring(a.x,a.y-20,10,130,'#ffffff',.5);this.burst(a.x,a.y-24,24,col);}
          else if(st==='dash'){a.vx=a.face*520;}
          else if(st==='clones'){a.clones=1.2;}
          else if(st==='barrier'){a.barrier=1.4;}
          else if(st==='heal'){a.heal=1.5;}
          else if(st==='sparkle'){this.burst(a.x,a.y-30,34,'#ffd23f');}
          else{a.buff=1.4;this.burst(a.x,a.y-24,18,col);}
        }
        if(a.vx&&p>.8)a.vx*=.85;
        if(a.heal>0)this.fx.push({t:'spark',x:a.x+rnd(-14,14),y:a.y-4,vx:0,vy:-rnd(40,70),life:.7,d:.7,col:a.ab.c,sz:2.4});
      }else if(k==='transform'){
        const stepD=1.9,step=Math.min(1,Math.floor(a.segT/stepD)),sp=a.segT-step*stepD;
        a.chg=sp<1.4?sp/1.4:1;
        if(!a.stepDone)a.stepDone=[];
        if(sp>=1.4&&!a.stepDone[step]&&a.form+1<a.line.length){
          a.stepDone[step]=true;a.form++;const col=a.line[a.form].aura;
          this.ring(a.x,a.y-24,10,200,col,.7);this.ring(a.x,a.y-24,10,130,'#ffffff',.5);this.burst(a.x,a.y-30,30,col);a.flash=.35;
        }
        if(sp<1.4&&Math.random()<dt*40)this.fx.push({t:'spark',x:a.x+rnd(-18,18)*a.s*.5,y:a.y-4,vx:rnd(-8,8),vy:-rnd(60,130),life:.8,d:.8,col:a.form+1<a.line.length?a.line[a.form+1].aura:'#ffe24d',sz:2.4});
        if(sp<1.4)a.ex='pain';else a.ex='smug';
      }else if(k==='dash'){
        if(Math.random()<dt*50)this.fx.push({t:'ghost',x:a.x,y:a.y,face:a.face,a:.5,life:.35,d:.35,ref:a});
      }
      if(a.clones>0)a.clones-=dt;if(a.barrier>0)a.barrier-=dt;if(a.heal>0)a.heal-=dt;if(a.buff>0)a.buff-=dt;if(a.flash>0)a.flash-=dt;
      if(a.segT>=sg.d)this.nextSeg(a);
    }
    this.actors=this.actors.filter(a=>!a.dead);
    for(const f of this.fx){
      f.life-=dt;
      if(f.t==='spark'){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=30*dt;}
      else if(f.t==='ball'){f.x+=f.vx*dt;f.y+=f.vy*dt;}
    }
    this.fx=this.fx.filter(f=>f.life>0&&!(f.t==='ball'&&(f.x<-50||f.x>vw+50)));
    if(this.fx.length>260)this.fx.splice(0,this.fx.length-260);
  }
  /* ---- drawing ---- */
  drawScene(sc,vw,vh){
    const r=this.r,ctx=r.ctx,Z=r.Z;
    ctx.setTransform(Z,0,0,Z,-sc.cx*Z,-sc.cy*Z);
    r.terrain(sc.cx,sc.cy,vw,vh,this.t,sc.theme);
    ctx.setTransform(Z,0,0,Z,0,0);
    /* fast speed streaks sell the sense of travel */
    ctx.fillStyle='rgba(255,255,255,.10)';
    for(let i=0;i<18;i++){
      const sp=1.4+(i%5)*.5,x=((i*173.3-sc.cx*sp)%(vw+260)+(vw+260))%(vw+260)-130,y=(i*61.7+Math.sin(i)*20)%vh,len=70+(i%4)*40;
      ctx.fillRect(sc.dir>0?x:x-len,y,len,1.6);
    }
    ctx.setTransform(1,0,0,1,0,0);
  }
  drawActor(a){
    const r=this.r,ctx=r.ctx,Z=r.Z,c=a.c,k=(c.u||1.95)/Sprites.S*a.s*1.05;
    const seg=a.seg,p=a.segT/a.segs[a.si].d;
    let alpha=1;if(seg==='in')alpha=clamp(p*1.6,0,1);else if(seg==='out')alpha=clamp(1-p,0,1);
    let frame=0;
    if(seg==='run')frame=1+((this.t*10+a.ph)|0)%4;
    else if(seg==='dash')frame=6;
    else if(seg==='ki')frame=a.fired?6:5;
    else if(seg==='beam')frame=a.fired?6:5;
    else if(seg==='ability')frame=a.fired?6:5;
    else if(seg==='transform')frame=a.chg>0&&a.chg<1?5:0;
    let ex=a.ex;if(!ex&&seg==='idle')ex=null;
    if(!ex&&(this.t+a.ph)%4.3>4.15)ex='blink';
    const cfg=cfgForForm(c,a.form),key='bg:'+c.id+':'+a.form;
    const sp=Sprites.player(key,cfg,frame,false,ex);
    const bob=seg==='run'?-Math.abs(Math.sin((this.t+a.ph)*9))*1.2*a.s:(seg==='idle'||seg==='transform'?Math.sin((this.t+a.ph)*3)*1.2:0);
    const au=a.form>=0?a.line[a.form].aura:null,cy=a.y-26*a.s*.5;
    ctx.setTransform(Z,0,0,Z,0,0);
    ctx.globalAlpha=alpha*.35;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(a.x,a.y,8*a.s,2.6*a.s,0,0,TAU);ctx.fill();ctx.globalAlpha=1;
    /* persistent form aura + charge glow */
    if(au)GLOW.at(ctx,a.x,cy,(44+Math.sin(this.t*9+a.ph)*4)*a.s*.55,au,.5*alpha);
    if(seg==='transform'&&a.chg<1)GLOW.at(ctx,a.x,cy,(36+a.chg*90)*a.s*.55,a.form+1<a.line.length?a.line[a.form+1].aura:'#ffe24d',.55+.3*Math.sin(this.t*30));
    if(seg==='beam'&&!a.fired)GLOW.at(ctx,a.x+a.face*14,cy,(10+a.chg*34)*a.s*.55,'#9ae0ff',.9);
    if(seg==='ability'&&!a.fired)GLOW.at(ctx,a.x,cy,(20+a.chg*60)*a.s*.55,a.ab.c,.7);
    if(a.buff>0)GLOW.at(ctx,a.x,cy,70*a.s*.55,a.ab.c,.6);
    if(a.flash>0)GLOW.at(ctx,a.x,cy,150*a.s*.55,'#ffffff',a.flash*2);
    if(a.clones>0)for(const o of[-1,1]){ctx.save();ctx.globalAlpha=.5*alpha*Math.min(1,a.clones*2);ctx.translate(a.x+o*34*a.s*.6,a.y);ctx.scale(a.face*k,k);ctx.drawImage(sp.c,-sp.ox,-sp.oy);ctx.restore();GLOW.at(ctx,a.x+o*34*a.s*.6,cy,30*a.s*.5,a.ab.c,.3);}
    ctx.save();ctx.globalAlpha=alpha;ctx.translate(a.x,a.y+bob);ctx.scale(a.face*k,k);ctx.drawImage(sp.c,-sp.ox,-sp.oy);ctx.restore();
    if(a.barrier>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.5*Math.min(1,a.barrier*2);ctx.strokeStyle=a.ab.c;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(a.x,cy,36*a.s*.55,0,TAU);ctx.stroke();ctx.restore();}
    /* lightning while charging a transformation */
    if(seg==='transform'&&a.chg>0&&a.chg<1){
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=a.form+1<a.line.length?a.line[a.form+1].aura:'#ffe24d';ctx.lineWidth=1.6;
      for(let i=0;i<3;i++){ctx.beginPath();let x=a.x+rnd(-14,14),y=a.y-4;ctx.moveTo(x,y);for(let j=0;j<5;j++){x+=rnd(-9,9)*a.s*.5;y-=rnd(10,20)*a.s*.5;ctx.lineTo(x,y);}ctx.stroke();}
      ctx.restore();
    }
    /* emote bubble */
    if(seg==='idle'&&p>.1&&p<.85&&a.ex&&a.ex!=='blink'){
      const sym={happy:'♪',smug:'…',wow:'!',surprised:'?'}[a.ex]||'!',bx=a.x+a.face*-14*a.s*.5,by=a.y-62*a.s*.5-Math.sin(p*3)*3;
      ctx.save();ctx.globalAlpha=Math.min(1,p*6)*Math.min(1,(.85-p)*8);ctx.fillStyle='#fff';ctx.strokeStyle='#0a0f1c';ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(bx,by,10,8,0,0,TAU);ctx.fill();ctx.stroke();
      ctx.fillStyle='#0a0f1c';ctx.font='bold 13px "Rajdhani",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(sym,bx,by+1);ctx.restore();
    }
  }
  drawFx(){
    const r=this.r,ctx=r.ctx,Z=r.Z;ctx.setTransform(Z,0,0,Z,0,0);
    for(const f of this.fx){
      const k=1-f.life/f.d;
      if(f.t==='ring'){const rad=f.r0+(f.r1-f.r0)*(1-Math.pow(1-k,2));ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(1-k)*.9;ctx.strokeStyle=f.col;ctx.lineWidth=3.5*(1-k)+1;ctx.beginPath();ctx.arc(f.x,f.y,rad,0,TAU);ctx.stroke();ctx.restore();}
      else if(f.t==='spark'){ctx.globalAlpha=Math.max(0,f.life/f.d);ctx.fillStyle=f.col;ctx.fillRect(f.x,f.y,f.sz,f.sz);ctx.globalAlpha=1;}
      else if(f.t==='ball'){GLOW.at(ctx,f.x,f.y,f.r*2.6,f.col,.9);GLOW.at(ctx,f.x,f.y,f.r*1.2,'#ffffff',.9);}
      else if(f.t==='beam'){
        const vw=r.W/Z,len=f.dir>0?vw-f.x+40:f.x+40,grow=Math.min(1,k*8),fade=Math.min(1,f.life/.35),w=f.w*(.6+.4*Math.sin(this.t*50))*grow*fade;
        ctx.save();ctx.globalCompositeOperation='lighter';
        const x0=f.dir>0?f.x:f.x-len*grow;
        ctx.fillStyle=hexA(f.col,.45);ctx.fillRect(x0,f.y-w*1.5,len*grow,w*3);
        ctx.fillStyle=hexA(f.col,.9);ctx.fillRect(x0,f.y-w*.8,len*grow,w*1.6);
        ctx.fillStyle='rgba(255,255,255,.95)';ctx.fillRect(x0,f.y-w*.35,len*grow,w*.7);
        ctx.restore();GLOW.at(ctx,f.x,f.y,w*3.2,f.col,.9);
      }
      else if(f.t==='ghost'){const a=f.ref;if(!a)continue;const sp=Sprites.player('bg:'+a.c.id+':'+a.form,cfgForForm(a.c,a.form),6,false,null),kk=(a.c.u||1.95)/Sprites.S*a.s*1.05;ctx.save();ctx.globalAlpha=(1-k)*.45;ctx.translate(f.x,f.y);ctx.scale(f.face*kk,kk);ctx.drawImage(sp.c,-sp.ox,-sp.oy);ctx.restore();}
    }
  }
  draw(dt){
    const r=this.r,ctx=r.ctx,Z=r.Z,vw=r.W/Z,vh=r.H/Z;
    dt=Math.min(dt,.05);this.update(dt,vw,vh);
    ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
    if(this.prev&&this.wipe<1){
      this.drawScene(this.prev,vw,vh);
      /* diagonal wipe: the new stage slides in over the old one */
      const w=r.W,h=r.H,sk=h*.35,xe=-sk+(w+sk*2)*(this.sc.dir>0?this.wipe:1-this.wipe);
      ctx.save();ctx.beginPath();
      if(this.sc.dir>0){ctx.moveTo(0,0);ctx.lineTo(xe+sk,0);ctx.lineTo(xe,h);ctx.lineTo(0,h);}
      else{ctx.moveTo(w,0);ctx.lineTo(xe,0);ctx.lineTo(xe+sk,h);ctx.lineTo(w,h);}
      ctx.closePath();ctx.clip();this.drawScene(this.sc,vw,vh);ctx.restore();
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(255,240,200,.85)';ctx.lineWidth=5;
      ctx.beginPath();if(this.sc.dir>0){ctx.moveTo(xe+sk,0);ctx.lineTo(xe,h);}else{ctx.moveTo(xe,0);ctx.lineTo(xe+sk,h);}ctx.stroke();ctx.restore();
    }else this.drawScene(this.sc,vw,vh);
    const list=this.actors.slice().sort((a,b)=>a.y-b.y);
    for(const a of list)this.drawActor(a);
    this.drawFx();
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;
    r.vignette(.5);
  }
}
