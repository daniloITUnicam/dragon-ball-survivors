'use strict';
/* ====== Weapon classes. Tables have 6 entries: levels 1-5 + evolved ====== */
const WS={
  ki:{cd:[.8,.72,.64,.57,.5,.45],n:[1,1,2,2,3,4],dmg:[10,12,14,16,19,23],pi:[0,0,0,0,0,0]},
  kame:{cd:[3.8,3.4,3,2.8,2.5,2.2],dmg:[7,8.5,10.5,13,16.5,22],wid:[30,36,40,46,52,64],len:[380,420,440,520,560,680]},
  disc:{n:[2,2,3,3,4,6],r:[80,85,95,100,110,125],dmg:[11,12.5,14,16,19,25],spd:[2.6,2.8,3,3.2,4,4.4]},
  spirit:{cd:[11,10,8.5,8,7,6.5],dmg:[62,78,95,120,155,210],rad:[110,125,135,160,185,230]},
  aura:{r:[66,80,94,108,128,170],dmg:[4.5,5.5,7,8.5,11,16]},
  flare:{cd:[15,14,13,11,9,8],stun:[1.2,1.5,1.8,2.1,2.5,3.5],dmg:[3,4.5,6,8,10,22]},
  slash:{cd:[1.5,1.35,1.2,1.05,.9,.75],dmg:[16,20,24,28,34,44],rad:[110,118,130,140,155,190],arc:[.9,1.2,1.2,1.3,1.4,3.14]},
  homing:{cd:[1.6,1.45,1.3,1.15,1,.85],n:[2,3,3,4,4,6],dmg:[7.5,8.5,10,12,14,18]},
  dbeam:{cd:[4.6,4.2,3.8,3.4,3,2.6],dmg:[26,34,44,56,72,100],wid:[9,11,13,15,18,22],len:[720,720,720,720,720,900]},
  barrage:{cd:[1.2,1.1,1,.9,.75,.6],n:[5,6,7,8,10,16],dmg:[3.5,4.3,5,6,7,8.5],pi:[0,0,0,1,1,2],sp:.55}
};


/* ====== shared VFX helpers (additive glow, comet trails, wavy beams) ====== */
const VFX={
  star(ctx,x,y,r,c,rot){ /* 4-point sparkle */
    ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);ctx.globalCompositeOperation='lighter';ctx.fillStyle=c;
    ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.14,-r*.14);ctx.lineTo(r,0);ctx.lineTo(r*.14,r*.14);ctx.lineTo(0,r);ctx.lineTo(-r*.14,r*.14);ctx.lineTo(-r,0);ctx.lineTo(-r*.14,-r*.14);ctx.closePath();ctx.fill();ctx.restore();
  },
  orb(ctx,x,y,r,c,t){ /* layered energy orb */
    GLOW.at(ctx,x,y,r*3.2,c,.75);GLOW.at(ctx,x,y,r*1.9,c,.9);
    ctx.save();ctx.globalCompositeOperation='lighter';
    ctx.fillStyle=c;ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
    ctx.fillStyle='#fff';ctx.globalAlpha=1;ctx.beginPath();ctx.arc(x,y,r*.58,0,TAU);ctx.fill();
    ctx.restore();VFX.star(ctx,x,y,r*2.1,'rgba(255,255,255,.8)',t*3);
  },
  trail(ctx,pts,r,c){ /* tapered additive comet tail */
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
    for(let i=1;i<pts.length;i++){
      const k=i/pts.length;ctx.globalAlpha=k*.7;ctx.strokeStyle=c;ctx.lineWidth=r*2*k;
      ctx.beginPath();ctx.moveTo(pts[i-1][0],pts[i-1][1]);ctx.lineTo(pts[i][0],pts[i][1]);ctx.stroke();
    }
    ctx.restore();
  },
  /* energy beam along +x: wavy outer shell, bright core, travelling streaks, flares at both ends */
  beam(ctx,len,wid,c,k,t,seed,elec){
    ctx.save();ctx.globalCompositeOperation='lighter';
    const w=wid*(.35+.65*k),N=18,s=seed||0;
    /* soft outer halo */
    ctx.globalAlpha=.13;ctx.fillStyle=c;ctx.fillRect(-w*.3,-w*1.15,len+w*.3,w*2.3);
    /* wavy shell */
    for(const [sc,al,col] of [[.62,.35,c],[.45,.6,c],[.28,.85,'#ffffff']]){
      ctx.globalAlpha=al;ctx.fillStyle=col;
      ctx.beginPath();
      for(let i=0;i<=N;i++){const x=len*i/N,env=Math.min(1,i/3),y=-(w*sc*env+Math.sin(x*.05-t*32+s)*w*.07*sc*3);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
      for(let i=N;i>=0;i--){const x=len*i/N,env=Math.min(1,i/3),y=(w*sc*env+Math.sin(x*.05-t*28+s*2)*w*.07*sc*3);ctx.lineTo(x,y);}
      ctx.closePath();ctx.fill();
    }
    /* travelling streaks */
    ctx.globalAlpha=.9;ctx.strokeStyle='#fff';ctx.lineCap='round';
    for(let i=0;i<7;i++){
      const ph=((t*(2.2+i*.3)+i*.37+s)%1),x0=len*ph,ln=len*.16,y=Math.sin(i*2.4+s)*w*.3;
      ctx.lineWidth=1.2+(i%3);ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(Math.min(len,x0+ln),y);ctx.stroke();
    }
    /* electric arcs crackling around the beam */
    if(elec){
      ctx.lineJoin='round';ctx.lineCap='round';
      for(let q=0;q<7;q++){
        const side=q%2?1:-1,x0=Math.random()*len*.8,span=len*(.12+Math.random()*.18),n=7;
        for(const [lw,col,al] of [[4.2,c,.5],[1.5,'#ffffff',1]]){
          ctx.globalAlpha=al*k;ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();
          for(let i=0;i<=n;i++){const x=x0+span*i/n,y=side*(w*.62+Math.random()*w*.45)*(i===0||i===n?.7:1)+(Math.random()-.5)*w*.25;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
          ctx.stroke();
        }
      }
      for(let q=0;q<10;q++){ctx.globalAlpha=k;ctx.fillStyle='#fff';const x=Math.random()*len,y=(Math.random()-.5)*w*2.3;ctx.fillRect(x,y,2.6,2.6);}
    }
    /* muzzle + tip flares */
    GLOW.at(ctx,0,0,w*2.1,c,1);GLOW.at(ctx,0,0,w*1.1,'#fff',.9);
    GLOW.at(ctx,len,0,w*1.6,c,.85*k);VFX.star(ctx,len,0,w*1.5*k,'rgba(255,255,255,.85)',t*4);
    ctx.restore();
  }
};

class Weapon{
  constructor(g,id){this.g=g;this.id=id;this.lv=1;this.evo=false;this.cd=.3;this.def=WEAPONS[id];}
  get L(){return this.evo?5:Math.min(4,this.lv-1);}
  /* every tier has 5 levels: base (table), evolution 1 and evolution 2 (each level of an evolution: damage, cooldown, area) */
  get lvB(){return this.evo?Math.max(0,this.lv-1):0;}
  get tier(){return this.evo>=2?1.1+.05*this.lvB:this.evo?.8+.05*this.lvB:1;}
  get st(){return WS[this.id];}
  get color(){return this.g.formColor||this.def.c;}
  get maxed(){return this.lv>=WMAX;}
  /* evolved weapons scale with the active transformation */
  get dm(){return(this.evo?1+.04*(this.g.formIdx+1):1)*this.tier;}
  get e2c(){return(this.evo>=2?.85:1)*(1-.015*this.lvB);}
  get e2a(){return(this.evo>=2?1.2:1)*(1+.02*this.lvB);}
  get e2n(){return this.evo>=2?2:0;}
  get evoName(){return this.evo>=2?this.def.evo2:this.def.evo;}
  upgrade(){if(this.lv<WMAX)this.lv++;}
  evolve(){this.lv=1;this.evo=(this.evo||0)+1;}
  update(dt){}
  draw(ctx){}
  static create(g,id){const C={ki:KiWeapon,kame:KameWeapon,disc:DiscWeapon,spirit:SpiritWeapon,aura:AuraWeapon,flare:FlareWeapon,slash:SlashWeapon,homing:HomingWeapon,dbeam:DeathBeamWeapon,barrage:BarrageWeapon}[id]||NEWW[id];return new C(g,id);}
}

class KiWeapon extends Weapon{
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.cd-=dt;if(this.cd>0)return;
    const t=g.nearest(p.x,p.y,640);
    if(!t){this.cd=.1;return;}
    /* few shots on purpose: 1 -> 3 before evolving, 4 once evolved; a single pierce only on the 2nd evolution */
    const base=Math.atan2(t.y-p.y,t.x-p.x),n=s.n[L],pi=this.evo>=2?1:0;
    for(let i=0;i<n;i++){
      const a=base+(i-(n-1)/2)*.17;
      g.pr.push({x:p.x,y:p.y-18,vx:Math.cos(a)*380,vy:Math.sin(a)*380,r:7*(g.S.area*this.e2a),dmg:s.dmg[L]*this.dm,pi,life:1.5,hit:[],c:this.color});
    }
    g.audio.sfx('shot');this.cd=s.cd[L]*g.S.cd*this.e2c;
  }
}

class KameWeapon extends Weapon{
  constructor(g,id){super(g,id);this.beams=[];this.charge=null;}
  fire(a){
    const g=this.g,s=this.st,L=this.L,A=g.S.area*this.e2a;
    const angs=this.evo>=2?[a,a+Math.PI]:this.evo?[a]:this.lv>=5?[a,a+Math.PI]:[a];
    const WM=this.evo?(this.evo>=2?2.1:1.8):1,LM=this.evo?1.12:1;
    for(const ang of angs)this.beams.push({a:ang,t:0,dur:this.evo?.8:.6,tk:0,dmg:s.dmg[L]*this.dm,wid:s.wid[L]*A*WM,len:s.len[L]*A*LM,elec:!!this.evo});
  }
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    if(!this.charge){
      this.cd-=dt;
      if(this.cd<=0){
        const t=g.nearest(p.x,p.y,600);
        if(t){this.charge={t:0,dur:this.evo?.65:.5,a:Math.atan2(t.y-p.y,t.x-p.x)};g.audio.sfx(this.evo?'kameChargeEvo':'kameCharge');}
        else this.cd=.1;
      }
    }else{
      const c=this.charge,t=g.nearest(p.x,p.y,700);
      if(t)c.a=Math.atan2(t.y-p.y,t.x-p.x);
      c.t+=dt;g.cast={a:c.a,t:c.t,dur:c.dur,color:this.color,kind:'kame'};
      if(c.t>=c.dur){this.fire(c.a);g.audio.sfx(this.evo?'kameFireEvo':'kameFire');this.charge=null;g.cast=null;this.cd=s.cd[L]*g.S.cd*this.e2c;g.shake=Math.max(g.shake,.15);}
    }
    for(const b of this.beams){
      b.t+=dt;b.tk-=dt;
      if(b.tk<=0){
        b.tk=.1;const cs=Math.cos(b.a),sn=Math.sin(b.a),ox=p.x,oy=p.y-18;
        for(const e of g.en){
          if(e.dead)continue;
          const dx=e.x-ox,dy=e.y-8-oy,al=dx*cs+dy*sn,pe=-dx*sn+dy*cs;
          if(al>-10&&al<b.len&&Math.abs(pe)<b.wid/2+e.r)g.hit(e,b.dmg,cs*40,sn*40);
        }
      }
    }
    this.beams=this.beams.filter(b=>b.t<b.dur);
  }
  draw(ctx){
    const g=this.g,p=g.p,c=this.color;
    for(const b of this.beams){
      const k=Math.sin(Math.min(1,b.t/b.dur)*Math.PI);
      ctx.save();ctx.translate(p.x+Math.cos(b.a)*14,p.y-18+Math.sin(b.a)*14);ctx.rotate(b.a);
      VFX.beam(ctx,b.len,b.wid,c,k,g.rt,b.a*3,b.elec);
      ctx.restore();
      if(Math.random()<.9&&g.fx.length<420){const d=rnd(30,b.len),cs=Math.cos(b.a),sn=Math.sin(b.a),o=rnd(-.5,.5)*b.wid;g.fx.push({x:p.x+cs*d-sn*o,y:p.y-18+sn*d+cs*o,vx:cs*60+rnd(-40,40),vy:sn*60+rnd(-40,40)-20,l:rnd(.25,.5),m:.5,c:Math.random()<.5?'#ffffff':c,s:rnd(2,4)});}
    }
  }
}

class DiscWeapon extends Weapon{
  constructor(g,id){super(g,id);this.a=0;this.pos=[];}
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.a+=dt*s.spd[L];
    const n=s.n[L]+(this.evo>=2?2:0),r=s.r[L]*(g.S.area*this.e2a);this.pos.length=0;
    for(let i=0;i<n;i++){
      const a=this.a+i*TAU/n,dx=p.x+Math.cos(a)*r,dy=p.y-14+Math.sin(a)*r;
      this.pos.push([dx,dy]);
      for(const e of g.en){
        if(e.dead)continue;
        const ex=e.x-dx,ey=e.y-8-dy,rr=e.r+11*(this.evo?1.5:1);
        if(ex*ex+ey*ey<rr*rr&&g.rt-(e.dh||0)>.35){e.dh=g.rt;g.hit(e,s.dmg[L]*this.dm,ex*3,ey*3);}
      }
    }
  }
  draw(ctx){
    const g=this.g,c=this.color,k=this.evo?1.5:1,t=g.rt;
    for(let i=0;i<this.pos.length;i++){
      const q=this.pos[i];
      ctx.save();ctx.translate(q[0],q[1]);
      /* trailing afterimages behind the rotation */
      ctx.globalCompositeOperation='lighter';
      for(let a=1;a<=4;a++){ctx.save();ctx.rotate(-a*.16*Math.sign(this.st.spd[this.L]));ctx.translate(-a*3,0);ctx.globalAlpha=.16/a;ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,0,11*k,0,TAU);ctx.fill();ctx.restore();}
      ctx.globalCompositeOperation='source-over';
      GLOW.at(ctx,0,0,26*k,c,.8);
      ctx.rotate(t*14);
      ctx.fillStyle=c;ctx.beginPath();
      for(let s=0;s<16;s++){const r2=(s%2?8.5:13.5)*k,a=s/16*TAU;ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);}
      ctx.closePath();ctx.fill();
      ctx.fillStyle='#fff6d8';ctx.beginPath();ctx.arc(0,0,7*k,0,TAU);ctx.fill();
      ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,0,3.4*k,0,TAU);ctx.fill();
      ctx.strokeStyle='#fff';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,0,10*k,0,TAU);ctx.stroke();
      ctx.restore();
      VFX.star(ctx,q[0],q[1],20*k,'rgba(255,255,255,.7)',t*5+i);
    }
  }
}

class SpiritWeapon extends Weapon{
  constructor(g,id){super(g,id);this.bombs=[];this.burns=[];}
  /* sphere gets bigger with every level; the evolutions are much bigger still */
  get sizeK(){return(this.evo>=2?1.3:this.evo?1.15:1)*(1+.04*this.lvB);}
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.cd-=dt;
    if(this.cd<=0){
      const k=this.evo>=2?5:this.evo?3:this.lv>=5?2:1;
      for(let i=0;i<k;i++){
        const live=g.en.filter(e=>!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<420);
        let x,y;
        if(live.length){const t=pick(live);x=t.x;y=t.y;}else{const a=rnd(0,TAU);x=p.x+Math.cos(a)*180;y=p.y+Math.sin(a)*180;}
        const rad=s.rad[L]*(g.S.area*this.e2a)*(this.evo?1.12:1);
        this.bombs.push({x,y,t:0,fall:1.1+(this.evo?.25:0),dmg:s.dmg[L]*this.dm,rad,vr:(14+rad*.42)*this.sizeK});
      }
      this.cd=s.cd[L]*g.S.cd*this.e2c;g.audio.sfx('spirit');
    }
    for(const b of this.bombs){
      b.t+=dt;
      if(b.t>=b.fall){
        b.done=true;g.audio.sfx('thunder');g.shake=Math.max(g.shake,this.evo?.9:.5);g.ring(b.x,b.y,b.rad,this.color,.6);g.burst(b.x,b.y,30+(this.evo?30:0),'#ffffff');g.bolt(b.x,b.y,b.rad,'#8ae0ff',16);g.pillar(b.x,b.y,'#8ae0ff',.7);
        for(const e of g.en){if(e.dead)continue;const dx=e.x-b.x,dy=e.y-b.y,rr=b.rad+e.r;if(dx*dx+dy*dy<rr*rr)g.hit(e,b.dmg,dx*.5,dy*.5);}
        if(this.evo){
          /* evolved: the ground trembles and is scorched; mild damage over time */
          g.ring(b.x,b.y,b.rad*1.5,'#ffb13b',.9);g.ring(b.x,b.y,b.rad*.8,'#ffffff',.5);g.burst(b.x,b.y,28,'#ff8a2a');g.audio.sfx('boom');g.flash=Math.max(g.flash,.25);g.flashC='#cfeeff';
          const cr=[];const n=9+(this.evo>=2?4:0);for(let i=0;i<n;i++)cr.push({a:i/n*TAU+rnd(-.2,.2),l:rnd(.55,1.05),w:rnd(.6,1.4)});
          this.burns.push({x:b.x,y:b.y,t:0,life:this.evo>=2?7:5,rad:b.rad*.92,tk:.2,dmg:b.dmg*(this.evo>=2?.11:.13),q:0,quakes:this.evo>=2?6:4,cr});
        }
      }
    }
    this.bombs=this.bombs.filter(b=>!b.done);
    for(const z of this.burns){
      z.t+=dt;
      /* aftershocks: the screen keeps shaking for a short while */
      z.q-=dt;if(z.q<=0&&z.quakes>0){z.quakes--;z.q=.42;g.shake=Math.max(g.shake,.45+.05*z.quakes);g.ring(z.x,z.y,z.rad*(.5+.12*(6-z.quakes)),'#ff9a3a',.35);}
      z.tk-=dt;
      if(z.tk<=0){z.tk=.5;for(const e of g.en){if(e.dead)continue;const dx=e.x-z.x,dy=e.y-z.y,rr=z.rad+e.r;if(dx*dx+dy*dy<rr*rr)g.hit(e,z.dmg,0,0);}}
      if(g.fx.length<420&&Math.random()<dt*34){const a=rnd(0,TAU),d=rnd(0,z.rad);g.fx.push({x:z.x+Math.cos(a)*d,y:z.y+Math.sin(a)*d*.8,vx:rnd(-12,12),vy:-rnd(50,120),l:rnd(.35,.7),m:.7,c:Math.random()<.5?'#ffb13b':'#ff5a1a',s:rnd(2,4)});}
    }
    this.burns=this.burns.filter(z=>z.t<z.life);
  }
  drawGround(ctx){
    const g=this.g,tt=g.rt;
    for(const z of this.burns){
      const fade=Math.min(1,(z.life-z.t)/1.2),grow=Math.min(1,z.t/.25),R=z.rad*(.6+.4*grow);
      ctx.save();ctx.translate(z.x,z.y);ctx.scale(1,.8);ctx.globalAlpha=fade;
      let gr=ctx.createRadialGradient(0,0,R*.05,0,0,R);gr.addColorStop(0,'rgba(20,8,4,.75)');gr.addColorStop(.7,'rgba(40,14,6,.55)');gr.addColorStop(1,'rgba(40,14,6,0)');
      ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.fill();
      ctx.globalCompositeOperation='lighter';
      gr=ctx.createRadialGradient(0,0,R*.1,0,0,R);gr.addColorStop(0,'rgba(255,200,90,'+(.35+.1*Math.sin(tt*9))+')');gr.addColorStop(.6,'rgba(255,90,30,.25)');gr.addColorStop(1,'rgba(160,30,10,0)');
      ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.fill();
      for(const c of z.cr){
        const L2=R*c.l*grow;let x=0,y=0,a=c.a;
        ctx.strokeStyle='rgba(255,150,50,'+(.7+.3*Math.sin(tt*7+c.a*3))+')';ctx.lineWidth=2.4*c.w;ctx.beginPath();ctx.moveTo(0,0);
        for(let k=1;k<=6;k++){a+=Math.sin(c.a*13+k*2.1)*.35;x+=Math.cos(a)*L2/6;y+=Math.sin(a)*L2/6;ctx.lineTo(x,y);}
        ctx.stroke();ctx.strokeStyle='rgba(255,240,190,.8)';ctx.lineWidth=.9*c.w;ctx.stroke();
      }
      ctx.restore();
    }
    for(const b of this.bombs){
      const k=b.t/b.fall;
      ctx.fillStyle='rgba(90,208,255,'+(.1+.2*k)+')';ctx.beginPath();ctx.arc(b.x,b.y,b.rad,0,TAU);ctx.fill();
      ctx.strokeStyle='rgba(200,245,255,.9)';ctx.lineWidth=2;ctx.setLineDash([4+k*10,6]);ctx.lineDashOffset=-this.g.rt*40;ctx.beginPath();ctx.arc(b.x,b.y,b.rad,0,TAU);ctx.stroke();ctx.setLineDash([]);
    }
  }
  draw(ctx){
    for(const b of this.bombs){
      const k=b.t/b.fall,r=b.vr*(.45+.55*k),cx=b.x,cy=b.y-(1-k)*(480+b.vr)-r*.6;
      GLOW.at(ctx,cx,cy,r*2.1,'#3aa8ff',.5);GLOW.at(ctx,cx,cy,r*1.4,'#9ae8ff',.55);
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineJoin='round';
      for(let i=0;i<12+(this.evo?6:0);i++){
        let a=Math.random()*TAU,x=cx+Math.cos(a)*r*.5,y=cy+Math.sin(a)*r*.5;const len=r*(.8+Math.random()*1.0);
        ctx.strokeStyle=i%3?'#8ae0ff':'#ffffff';ctx.lineWidth=1+Math.random()*2.2;ctx.globalAlpha=.9;ctx.beginPath();ctx.moveTo(x,y);
        for(let s=1;s<=7;s++){a+=(Math.random()-.5)*1.2;x+=Math.cos(a)*len/7;y+=Math.sin(a)*len/7;ctx.lineTo(x,y);}
        ctx.stroke();
      }
      if(this.evo){ctx.globalAlpha=.5;ctx.strokeStyle='#ffe9a0';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,r*(1.15+.06*Math.sin(this.g.rt*10)),0,TAU);ctx.stroke();}
      if(k>.45){ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.globalAlpha=.6*k;ctx.beginPath();ctx.moveTo(cx,cy);let x=cx,y=cy;const n=8;for(let s=1;s<=n;s++){x=cx+(b.x-cx)*s/n+(Math.random()-.5)*18;y=cy+(b.y-cy)*s/n+(Math.random()-.5)*10;ctx.lineTo(x,y);}ctx.stroke();}
      ctx.restore();
      const gr=ctx.createRadialGradient(cx,cy,r*.05,cx,cy,r*.9);gr.addColorStop(0,'#ffffff');gr.addColorStop(.35,'#d4f6ff');gr.addColorStop(.75,'#6cc8ff');gr.addColorStop(1,'rgba(60,160,255,.55)');
      ctx.fillStyle=gr;ctx.beginPath();ctx.arc(cx,cy,r*.9,0,TAU);ctx.fill();
    }
  }
}

class AuraWeapon extends Weapon{
  constructor(g,id){super(g,id);this.tk=0;}
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.tk-=dt;if(this.tk>0)return;
    this.tk=.4;const r=s.r[L]*(g.S.area*this.e2a);
    for(const e of g.en){
      if(e.dead)continue;
      const dx=e.x-p.x,dy=e.y-p.y,rr=r+e.r;
      if(dx*dx+dy*dy<rr*rr){g.hit(e,s.dmg[L]*this.dm,dx*.8,dy*.8);if(this.evo)e.slow=1.2;}
    }
  }
  draw(ctx){
    const g=this.g,p=g.p,r=this.st.r[this.L]*(g.S.area*this.e2a),t=g.rt,c=this.color;
    ctx.save();ctx.translate(p.x,p.y-10);ctx.globalCompositeOperation='lighter';
    const f=1+Math.sin(t*10)*.04;
    const gr=ctx.createRadialGradient(0,0,r*.2,0,0,r*f);gr.addColorStop(0,hexA(c,0));gr.addColorStop(.75,hexA(c,.16));gr.addColorStop(1,hexA(c,.42));
    ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,r*f,0,TAU);ctx.fill();
    ctx.strokeStyle=c;ctx.globalAlpha=.8;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,r*f,0,TAU);ctx.stroke();
    /* licking flames around the rim */
    ctx.globalAlpha=.55;
    const nf=Math.max(10,Math.round(r/6));
    for(let i=0;i<nf;i++){
      const a=i/nf*TAU+t*.6,h=r*(.14+.1*Math.sin(t*9+i*1.7)),bx=Math.cos(a)*r*f,by=Math.sin(a)*r*f;
      ctx.fillStyle=i%3?c:'#fff6b0';
      ctx.beginPath();ctx.moveTo(bx-Math.sin(a)*5,by+Math.cos(a)*5);ctx.lineTo(bx+Math.cos(a)*h,by+Math.sin(a)*h-6);ctx.lineTo(bx+Math.sin(a)*5,by-Math.cos(a)*5);ctx.closePath();ctx.fill();
    }
    ctx.restore();
    /* rising embers */
    if(Math.random()<.5&&g.fx.length<420){const a=rnd(0,TAU),d=r*rnd(.3,.95);g.fx.push({x:p.x+Math.cos(a)*d,y:p.y-10+Math.sin(a)*d,vx:rnd(-15,15),vy:rnd(-110,-50),l:rnd(.3,.7),m:.7,c:Math.random()<.4?'#ffffff':c,s:rnd(2,4)});}
  }
}

class FlareWeapon extends Weapon{
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.cd-=dt;if(this.cd>0)return;
    let any=false;const vr=g.viewR;
    for(const e of g.en){
      if(e.dead)continue;
      if(Math.hypot(e.x-p.x,e.y-p.y)<vr){e.stun=Math.max(e.stun,e.boss?s.stun[L]*.4:s.stun[L]);any=true;g.hit(e,s.dmg[L]*this.dm);}
    }
    if(any){g.flash=.5;g.flashC='#fffbd0';g.audio.sfx('flare');this.cd=s.cd[L]*g.S.cd*this.e2c;}else this.cd=.5;
  }
}

class SlashWeapon extends Weapon{
  constructor(g,id){super(g,id);this.slashes=[];}
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.cd-=dt;
    if(this.cd<=0){
      const rad=s.rad[L]*(g.S.area*this.e2a),t=g.nearest(p.x,p.y,rad+20);
      if(t){
        const a=Math.atan2(t.y-p.y,t.x-p.x),half=s.arc[L];
        for(const ang of(this.lv>=5&&!this.evo?[a,a+Math.PI]:[a])){
          this.slashes.push({a:ang,half,rad,t:0,dur:.22});
          for(const e of g.en){
            if(e.dead)continue;
            const dx=e.x-p.x,dy=e.y-8-(p.y-14),d=Math.hypot(dx,dy)||1;
            if(d>rad+e.r)continue;
            if(Math.abs(angDiff(Math.atan2(dy,dx),ang))<=half)g.hit(e,s.dmg[L]*this.dm,dx/d*120,dy/d*120);
          }
        }
        g.audio.sfx('slash');this.cd=s.cd[L]*g.S.cd*this.e2c;
      }else this.cd=.1;
    }
    for(const sl of this.slashes)sl.t+=dt;
    this.slashes=this.slashes.filter(sl=>sl.t<sl.dur);
  }
  draw(ctx){
    const p=this.g.p,c=this.color;
    for(const sl of this.slashes){
      const k=sl.t/sl.dur,r=sl.rad*(.7+.3*k);
      ctx.save();ctx.translate(p.x,p.y-14);ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
      /* crescent: outer glow, body, white edge, thin echo arcs */
      for(const [lw,al,col,rr] of [[34,.18,c,1],[22,.45,c,.97],[9,.95,'#fff',.99],[3,.7,c,1.14],[2,.5,'#fff',1.2]]){
        ctx.globalAlpha=(1-k)*al;ctx.strokeStyle=col;ctx.lineWidth=lw*(1-k*.55);
        ctx.beginPath();ctx.arc(0,0,r*rr,sl.a-sl.half*(.55+.45*k),sl.a+sl.half*(.55+.45*k));ctx.stroke();
      }
      /* sparks flying off the tip */
      ctx.globalAlpha=1-k;ctx.fillStyle='#fff';
      for(let i=0;i<7;i++){const aa=sl.a-sl.half+(2*sl.half)*((i*.37+k*.4)%1),rr=r*(1+k*.25+i*.015);ctx.fillRect(Math.cos(aa)*rr-1,Math.sin(aa)*rr-1,2.4,2.4);}
      ctx.restore();
    }
  }
}

class HomingWeapon extends Weapon{
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.cd-=dt;if(this.cd>0)return;
    if(!g.en.length){this.cd=.2;return;}
    const n=s.n[L]+g.S.proj+this.e2n;
    for(let i=0;i<n;i++){const a=rnd(0,TAU);g.pr.push({x:p.x,y:p.y-18,vx:Math.cos(a)*230,vy:Math.sin(a)*230,r:7*(g.S.area*this.e2a),dmg:s.dmg[L]*this.dm,pi:this.evo?1:0,life:3,hit:[],c:this.color,home:true});}
    g.audio.sfx('shot');this.cd=s.cd[L]*g.S.cd*this.e2c;
  }
}

class DeathBeamWeapon extends Weapon{
  constructor(g,id){super(g,id);this.lines=[];}
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.cd-=dt;
    if(this.cd<=0){
      let best=null,bh=-1;
      for(const e of g.en){if(e.dead)continue;const dx=e.x-p.x,dy=e.y-p.y;if(dx*dx+dy*dy<520*520&&e.hp>bh){bh=e.hp;best=e;}}
      if(best){
        const ang=Math.atan2(best.y-8-(p.y-18),best.x-p.x),n=this.evo>=2?5:this.evo?3:this.lv>=5?2:1;
        for(let k=0;k<n;k++){
          const a=ang+(k===0?0:(k%2?1:-1)*Math.ceil(k/2)*.3),cs=Math.cos(a),sn=Math.sin(a),ox=p.x,oy=p.y-18,wd=s.wid[L]*(g.S.area*this.e2a),len=s.len[L];
          this.lines.push({a,t:0,dur:.28,len,wid:wd});
          for(const e of g.en){
            if(e.dead)continue;
            const dx=e.x-ox,dy=e.y-8-oy,al=dx*cs+dy*sn,pe=-dx*sn+dy*cs;
            if(al>-10&&al<len&&Math.abs(pe)<wd/2+e.r)g.hit(e,s.dmg[L]*this.dm,cs*60,sn*60);
          }
        }
        g.audio.sfx('kame');this.cd=s.cd[L]*g.S.cd*this.e2c;
      }else this.cd=.2;
    }
    for(const l of this.lines)l.t+=dt;
    this.lines=this.lines.filter(l=>l.t<l.dur);
  }
  draw(ctx){
    const g=this.g,p=g.p,c=this.color;
    for(const l of this.lines){
      const k=l.t/l.dur,wd=l.wid*(1-k*.45);
      ctx.save();ctx.translate(p.x,p.y-18);ctx.rotate(l.a);ctx.globalCompositeOperation='lighter';
      ctx.globalAlpha=(1-k)*.35;ctx.fillStyle=c;ctx.fillRect(0,-wd*1.8,l.len,wd*3.6);
      ctx.globalAlpha=(1-k)*.9;ctx.fillStyle=c;ctx.fillRect(0,-wd,l.len,wd*2);
      ctx.fillStyle='#fff';ctx.fillRect(0,-wd*.28,l.len,wd*.56);
      /* crackling lightning along the beam */
      ctx.strokeStyle='#ffd0f0';ctx.lineWidth=1.6;ctx.globalAlpha=(1-k);
      for(let q=0;q<2;q++){ctx.beginPath();ctx.moveTo(0,0);for(let x=30;x<l.len;x+=30)ctx.lineTo(x,(Math.random()-.5)*wd*2.6);ctx.stroke();}
      GLOW.at(ctx,0,0,wd*3,c,1-k);GLOW.at(ctx,l.len*.5*(1+k),0,wd*2,'#fff',(1-k)*.7);
      ctx.restore();
    }
  }
}

class BarrageWeapon extends Weapon{
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.cd-=dt;if(this.cd>0)return;
    const t=g.nearest(p.x,p.y,380);
    if(!t){this.cd=.1;return;}
    const base=Math.atan2(t.y-p.y,t.x-p.x),n=s.n[L]+g.S.proj*2+this.e2n*2;
    for(let i=0;i<n;i++){
      const a=base+rnd(-s.sp,s.sp),sp2=rnd(380,460);
      g.pr.push({x:p.x,y:p.y-18,vx:Math.cos(a)*sp2,vy:Math.sin(a)*sp2,r:5*(g.S.area*this.e2a),dmg:s.dmg[L]*this.dm,pi:s.pi[L],life:.85,hit:[],c:this.color});
    }
    g.audio.sfx('shot');this.cd=s.cd[L]*g.S.cd*this.e2c;
  }
}
