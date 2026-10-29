'use strict';
/* ====== Weapon classes. Tables have 6 entries: levels 1-5 + evolved ====== */
const WS={
  ki:{cd:[1.6,1.44,1.28,.57,.5,.45],n:[1,1,2,2,3,4],dmg:[8.5,10,12,16.2,19.2,19.5],pi:[0,0,0,0,0,0]},   /* v53: -15% damage (Ki Barrage was removed); v112: levels 1-3 fire half as often (cd .8/.72/.64 -> 1.6/1.44/1.28), levels 4-5 hit +20% */
  kame:{cd:[3.8,3.4,3,2.8,2.5,2.2],dmg:[7,8.5,10.5,13,16.5,22],wid:[30,36,40,46,52,64],len:[380,418,456,494,532,680]},
  disc:{n:[2,2,3,3,4,6],r:[80,85,95,100,110,125],dmg:[11,12.5,14,16,19,25],spd:[2.6,2.8,3,3.2,4,4.4]},
  spirit:{cd:[11,10,8.5,8,7,6.5],dmg:[62,78,95,120,155,210],rad:[110,125,135,160,185,230]},
  aura:{r:[66,80,94,108,128,170],dmg:[4.5,5.5,7,8.5,11,16]},
  flare:{cd:[15,14,13,11,9,8],stun:[1.2,1.5,1.8,2.1,2.5,3.5],dmg:[3,4.5,6,8,10,22]},
  slash:{cd:[1.5,1.35,1.2,1.05,.9,.75],dmg:[16,20,24,28,34,44],rad:[110,118,130,140,155,190],arc:[.9,1.2,1.2,1.3,1.4,3.14]},
  homing:{cd:[1.6,1.45,1.3,1.15,1,.85],n:[2,3,3,4,4,6],dmg:[7.5,8.5,10,12,14,18]},
  dbeam:{cd:[4.6,4.2,3.8,3.4,3,2.6],dmg:[26,34,44,56,72,100],wid:[9,11,13,15,18,22],len:[720,720,720,720,720,900]}
};


/* ====== shared VFX helpers (additive glow, comet trails, wavy beams) ====== */
const VFX={
  star(ctx,x,y,r,c,rot){ /* 4-point sparkle (v109: rotated by hand, no save/restore) */
    const cs=Math.cos(rot||0)*r,sn=Math.sin(rot||0)*r,k=.14,c0=ctx.globalCompositeOperation;ctx.globalCompositeOperation='lighter';ctx.fillStyle=c;ctx.beginPath();
    for(let j=0;j<8;j++){const P=VFX.SP[j],px=x+(P[0]*cs-P[1]*sn),py=y+(P[0]*sn+P[1]*cs);if(j)ctx.lineTo(px,py);else ctx.moveTo(px,py);}
    ctx.closePath();ctx.fill();ctx.globalCompositeOperation=c0;
  },
  SP:[[0,-1],[.14,-.14],[1,0],[.14,.14],[0,1],[-.14,.14],[-1,0],[-.14,-.14]],
  orb(ctx,x,y,r,c,t){ /* layered energy orb */
    GLOW.at(ctx,x,y,r*3.2,c,.75);GLOW.at(ctx,x,y,r*1.9,c,.9);
    const c0=ctx.globalCompositeOperation,a0=ctx.globalAlpha;ctx.globalCompositeOperation='lighter';
    ctx.fillStyle=c;ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
    ctx.fillStyle='#fff';ctx.globalAlpha=1;ctx.beginPath();ctx.arc(x,y,r*.58,0,TAU);ctx.fill();
    ctx.globalCompositeOperation=c0;ctx.globalAlpha=a0;VFX.star(ctx,x,y,r*2.1,'rgba(255,255,255,.8)',t*3);
  },
  trail(ctx,pts,r,c){ /* tapered additive comet tail */
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
    for(let i=1;i<pts.length;i++){
      const k=i/pts.length;ctx.globalAlpha=k*.7;ctx.strokeStyle=c;ctx.lineWidth=r*2*k;
      ctx.beginPath();ctx.moveTo(pts[i-1][0],pts[i-1][1]);ctx.lineTo(pts[i][0],pts[i][1]);ctx.stroke();
    }
    ctx.restore();
  },
  /* Kamehameha 'life': energy pulses rippling along the beam, a restless bright core, a bulging head with rings and sparks, a pulsing muzzle burst */
  kameFlow(ctx,len,wid,c,k,t){
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
    const hw=Math.max(4,wid*.5*(.35+.65*k));
    for(let i=0;i<7;i++){   /* pulses travelling outward, widening then thinning like in the anime */
      const ph=(t*1.9+i/7)%1,x=len*ph,sw=Math.sin(ph*Math.PI),a=.4*sw*k;
      if(a<.02)continue;
      const gr=ctx.createLinearGradient(x-hw*.7,0,x+hw*.7,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.5,hexA('#ffffff',a));gr.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(x,0,hw*.7,hw*(.38+.2*sw),0,0,TAU);ctx.fill();
    }
    ctx.strokeStyle=hexA('#ffffff',.55*k);ctx.lineWidth=Math.max(1.5,hw*.22);   /* core filament, gently undulating */
    ctx.beginPath();for(let x=0;x<=len;x+=len/16){const y=Math.sin(x*.045-t*30)*hw*.18;x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
    /* head: swelling energy ball with echo rings */
    const hp=1+.12*Math.sin(t*26);
    GLOW.at(ctx,len,0,hw*2.1*hp,c,.8*k);GLOW.at(ctx,len,0,hw*1.1*hp,'#ffffff',.7*k);
    for(let i=0;i<2;i++){const r=((t*1.6+i*.5)%1);ctx.strokeStyle=hexA(c,(1-r)*.7*k);ctx.lineWidth=2.2*(1-r)+.6;ctx.beginPath();ctx.ellipse(len,0,hw*(.5+1.2*r)*.55,hw*(.5+1.2*r),0,0,TAU);ctx.stroke();}
    for(let i=0;i<6;i++){const a=t*7+i*1.047,r=hw*(1+.5*Math.sin(t*12+i));ctx.fillStyle=hexA('#ffffff',.8*k);ctx.fillRect(len+Math.cos(a)*r-1.3,Math.sin(a)*r-1.3,2.6,2.6);}
    /* muzzle: pulsing flare at the hands */
    const mp=1+.18*Math.sin(t*34);GLOW.at(ctx,0,0,hw*1.9*mp,c,.9*k);GLOW.at(ctx,0,0,hw*.95*mp,'#ffffff',.8*k);VFX.star(ctx,0,0,hw*1.6*mp,'rgba(255,255,255,.7)',t*5);
    ctx.restore();
  },
  /* energy beam along +x: wavy outer shell, bright core, travelling streaks, flares at both ends */
  beam(ctx,len,wid,c,k,t,seed,elec,spr){
    let sp=false;
    if(spr&&k>.02){ /* pack sprite beam when available (Kamehameha): sprite body + additive glow and electric arcs on top */
      ctx.save();ctx.globalCompositeOperation='lighter';const gr=ctx.createLinearGradient(0,-wid*.75*k,0,wid*.75*k);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.5,c);gr.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=.3*k;ctx.fillStyle=gr;ctx.fillRect(0,-wid*.75*k,len,wid*1.5*k);ctx.restore();
      if(Sprites.drawBeam&&Sprites.drawBeam(ctx,len,wid,c,k,t)){
        ctx.save();ctx.globalCompositeOperation='lighter';GLOW.at(ctx,0,0,wid*1.5,c,.9*k);GLOW.at(ctx,len,0,wid*1.1,c,.6*k);ctx.restore();
        VFX.kameFlow(ctx,len,wid,c,k,t);
        if(!elec)return;sp=true;
      }
    }
    ctx.save();ctx.globalCompositeOperation='lighter';
    const w=wid*(.35+.65*k),N=18,s=seed||0;
    /* soft outer halo */
    if(!sp){ctx.globalAlpha=.13;ctx.fillStyle=c;ctx.fillRect(-w*.3,-w*1.15,len+w*.3,w*2.3);}
    /* wavy shell */
    if(!sp)for(const [sc,al,col] of [[.62,.35,c],[.45,.6,c],[.28,.85,'#ffffff']]){
      ctx.globalAlpha=al;ctx.fillStyle=col;
      ctx.beginPath();
      for(let i=0;i<=N;i++){const x=len*i/N,env=Math.min(1,i/3),y=-(w*sc*env+Math.sin(x*.05-t*32+s)*w*.07*sc*3);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
      for(let i=N;i>=0;i--){const x=len*i/N,env=Math.min(1,i/3),y=(w*sc*env+Math.sin(x*.05-t*28+s*2)*w*.07*sc*3);ctx.lineTo(x,y);}
      ctx.closePath();ctx.fill();
    }
    /* travelling streaks */
    ctx.globalAlpha=.9;ctx.strokeStyle='#fff';ctx.lineCap='round';
    if(!sp)for(let i=0;i<7;i++){
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
    if(!sp){GLOW.at(ctx,0,0,w*2.1,c,1);GLOW.at(ctx,0,0,w*1.1,'#fff',.9);
    GLOW.at(ctx,len,0,w*1.6,c,.85*k);VFX.star(ctx,len,0,w*1.5*k,'rgba(255,255,255,.85)',t*4);}
    ctx.restore();
  }
};

const XQ_GAP=.16;   /* seconds between a hit and the next extra hit given by Quantità */
class Weapon{
  constructor(g,id){this.g=g;this.id=id;this.lv=1;this.evo=false;this.cd=.3;this.def=WEAPONS[id];this.xl=0;}
  get L(){return this.evo?5:Math.min(4,this.lv-1);}
  /* every tier has 5 levels: base (table), evolution 1 and evolution 2 (each level of an evolution: damage, cooldown, area) */
  get lvB(){return this.evo?Math.max(0,this.lv-1):0;}
  get tier(){return this.evo>=2?1.1+.05*this.lvB:this.evo?.8+.05*this.lvB:1;}
  get st(){return WS[this.id];}
  get color(){return this.g.formColor||this.def.c;}
  get maxed(){return this.lv>=WMAX;}
  /* evolved weapons scale with the active transformation */
  /* Endless extra levels (xl, see WXL): damage, size and cooldown; in Endless the total cooldown (stat x weapon) never goes below ENDLESS_CD_MIN */
  get xlD(){return 1+XL_DMG*this.xl;}
  get xlA(){return 1+XL_AREA*this.xl;}
  cdXl(k){const g=this.g;k*=1-XL_CD*this.xl;return g.endless?Math.max(k,ENDLESS_CD_MIN/Math.max(ENDLESS_CD_MIN,g.S.cd)):k;}
  canXl(){return !!this.g.endless&&this.lv>=WMAX&&this.evo>=this.g.maxEvo(this.id)&&this.xl<WXL;}
  get lvShow(){return this.lv+this.xl;}
  get dm(){return(this.evo?1+.04*(this.g.formIdx+1):1)*this.tier*this.xlD*(this.fz?FUSION_DMG:1);}
  get e2c(){return this.cdXl((this.evo>=2?.85:1)*(1-.015*this.lvB)*(this.fz?FUSION_CD:1));}
  get e2a(){return(this.evo>=2?1.2:1)*(1+.02*this.lvB)*this.xlA;}
  get e2n(){return this.evo>=2?2:0;}
  get evoName(){return this.evo>=2?this.def.evo2:this.def.evo;}
  upgrade(){if(this.lv<WMAX)this.lv++;else if(this.canXl())this.xl++;}
  evolve(){this.lv=1;this.evo=(this.evo||0)+1;}
  /* Quantità (shop, trinkets, forms: g.S.proj): the extra hits are never fired on top of the first one. Each follows the previous after a short gap and is aimed again,
     so they read as separate hits and may even reach another enemy. extras(fn,gap) queues them, tickQ(dt) (first line of update) fires them when due */
  get xn(){return Math.max(0,Math.round(this.g.S.proj||0));}
  extras(fn,gap){const n=this.xn,q=this.q||(this.q=[]);for(let k=1;k<=n;k++)q.push({t:k*(gap||XQ_GAP),k,fn});}
  tickQ(dt){const q=this.q;if(!q||!q.length)return;let due=null;for(const o of q){o.t-=dt;if(o.t<=0)(due||(due=[])).push(o);}if(!due)return;this.q=q.filter(o=>o.t>0);for(const o of due)o.fn(o.k);}
  update(dt){}
  draw(ctx){}
  static create(g,id){const C={ki:KiWeapon,kame:KameWeapon,disc:DiscWeapon,spirit:SpiritWeapon,aura:AuraWeapon,flare:FlareWeapon,slash:SlashWeapon,homing:HomingWeapon,dbeam:DeathBeamWeapon}[id]||NEWW[id];return new C(g,id);}
}

const KI_EVO_DMG=.5;   /* both evolutions of the Ki Blast hit for half (it was far too strong) */
/* v112: an enemy's body, for the Ki Blast: the sprites stand about 4.4 radii tall and 2.6 wide above the feet (e.x, e.y; flyers e.zoff higher) */
const KI_BODY_H=2.1,KI_BODY_W=1.15;
class KiWeapon extends Weapon{
  static aim(tip,t,jit){return Math.atan2(t.y-(t.zoff||0)-t.r*KI_BODY_H-tip.y,t.x-tip.x)+(jit||0);}
  /* does shot b touch enemy e's body (an ellipse from the feet to the head, widened by the shot's radius)? */
  static hits(b,e){const rx=e.r*KI_BODY_W+b.r,ry=e.r*KI_BODY_H+b.r*.6,dx=(b.x-e.x)/rx,dy=(b.y-(e.y-(e.zoff||0)-e.r*KI_BODY_H))/ry;return dx*dx+dy*dy<1;}
  /* The shot is a visible gesture: while the cooldown runs out the ball gathers on the palm (g.pa 'shoot' with ball), the arm snaps toward the
     target and the blasts leave the hand (Pose.tip). The wind-up ends exactly when the cooldown reaches 0, so the rate of fire is the same. */
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.tickQ(dt);
    this.cd-=dt;
    const wu=Math.min(.24,(this.cdMax||.3)*.8);
    if(!this.wu&&this.cd>0&&this.cd<=wu){
      const t=g.nearest(p.x,p.y,640);
      if(t){const a=Math.atan2(t.y-p.y,t.x-p.x);this.wu={a};g.armAct('shoot',a,{w:this.cd,h:.2,r:.18,col:this.color,ball:1,ballR:7*(g.S.area*this.e2a)});}
    }
    if(this.wu){   /* follow the target while the ball grows */
      const t=g.nearest(p.x,p.y,640);if(t){this.wu.a=Math.atan2(t.y-p.y,t.x-p.x);if(g.pa&&g.pa.st==='shoot')g.pa.a=this.wu.a;}
    }
    if(this.cd>0)return;
    this.wu=null;
    const t=g.nearest(p.x,p.y,640);
    if(!t){this.cd=.1;return;}
    /* few shots on purpose: 1 -> 3 before evolving, 4 once evolved; a single pierce only on the 2nd evolution */
    const ang=Math.atan2(t.y-p.y,t.x-p.x),base=ang+g.aimJit(),n=s.n[L],pi=this.evo>=2?1:0;
    if(!g.pa||g.pa.st!=='shoot'||g.rt-g.pa.t0>g.pa.w+.05)g.armAct('shoot',base,{w:0,h:.2,r:.18,col:this.color});   /* no wind-up was possible: throw at once */
    else{g.pa.a=base;g.pa.t0=g.rt-g.pa.w;}
    const tip=Pose.tip(g,base),fa=KiWeapon.aim(tip,t,base-ang);   /* v112: from the hand to the middle of the target's body (it aimed at the feet, a hand's height too low) */
    for(let i=0;i<n;i++){
      const a=fa+(i-(n-1)/2)*.17;
      g.pr.push({x:tip.x,y:tip.y,vx:Math.cos(a)*380,vy:Math.sin(a)*380,r:7*(g.S.area*this.e2a),dmg:s.dmg[L]*this.dm*(this.evo?KI_EVO_DMG:1),pi,life:1.5,hit:[],c:this.color,kb:1});
    }
    this.extras(()=>{   /* Quantità: one more blast per level, thrown a moment later at the nearest target */
      const t2=g.nearest(p.x,p.y,640),a=t2?Math.atan2(t2.y-p.y,t2.x-p.x)+g.aimJit():base;
      g.armAct('shoot',a,{w:0,h:.2,r:.18,col:this.color});const tp=Pose.tip(g,a),a2=t2?KiWeapon.aim(tp,t2,0):a;
      g.pr.push({x:tp.x,y:tp.y,vx:Math.cos(a2)*380,vy:Math.sin(a2)*380,r:7*(g.S.area*this.e2a),dmg:s.dmg[L]*this.dm*(this.evo?KI_EVO_DMG:1),pi,life:1.5,hit:[],c:this.color,kb:1});g.audio.sfx('shot');
    });
    g.audio.sfx('shot');this.cd=this.cdMax=s.cd[L]*g.S.cd*this.e2c;
  }
}

/* Kamehameha: beam duration per base level, and the width of the beam (hit box and art) of the base weapon and of its two evolutions */
const KAME_DUR=[.95,.88,.8,.72,.64],KAME_WM0=1.2,KAME_WM1=2.6,KAME_WM2=3.1;
class KameWeapon extends Weapon{
  constructor(g,id){super(g,id);this.beams=[];this.charge=null;}
  /* how long the beam stays out: longer at the first levels (the weapon struggled early on), shorter at the last ones to compensate (it ticks every 0.1 s, so this is its damage per cast) */
  get fireDur(){const b=this.lvB;return this.evo>=2?.78-.04*b:this.evo?.8-.03*b:KAME_DUR[Math.min(4,this.lv-1)];}
  /* the head shoots out of the hands in the first ~22% of the beam's life (ease-out), then the beam stays at full reach */
  static ext(b){const u=Math.min(1,b.t/(b.dur*.22));return 1-Math.pow(1-u,3);}
  fire(a){
    const g=this.g,s=this.st,L=this.L,A=g.S.area*this.e2a;
    const angs=this.evo>=2?[a,a+Math.PI]:this.evo?[a]:this.lv>=5?[a,a+Math.PI]:[a];
    const WM=this.evo?(this.evo>=2?KAME_WM2:KAME_WM1):KAME_WM0,LM=(this.evo?1.12:1)*(1+Math.min(.3,.01*(g.lvl-1)));   /* +1% reach per character level, capped at +30% */
    const dur=this.fireDur;
    g.fireT=Math.max(g.fireT||0,dur);   /* arm extended while the beam is out */
    g.armAct('kamef',a,{w:0,h:dur,r:.22,col:this.color});
    const B=EXTRAS.takeBoost(g),bd=dur*(1+.2*B);   /* v117: a charged beam (held ability key) */
    if(B>0){g.fireT=Math.max(g.fireT,bd);g.shake=Math.max(g.shake,.3+.5*B);g.flash=.25*B;g.flashC=this.color;if(B>.6)g.hitStop(.05,.04);}
    for(const ang of angs)this.beams.push({a:ang,t:0,dur:bd,ext:0,tk:0,dmg:s.dmg[L]*this.dm*(1+1.5*B),wid:s.wid[L]*A*WM*(1+.8*B),len:s.len[L]*A*LM,elec:!!this.evo,evo:this.evo|0});
  }
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.tickQ(dt);
    if(!this.charge){
      this.cd-=dt;
      if(this.cd<=0){
        const t=g.nearest(p.x,p.y,600);
        if(t){this.charge={t:0,dur:this.evo?.65:.5,jit:g.aimJit(),a:Math.atan2(t.y-p.y,t.x-p.x)};g.audio.sfx(this.evo?'kameChargeEvo':'kameCharge');}
        else this.cd=.1;
      }
    }else{
      const c=this.charge,t=g.nearest(p.x,p.y,700);
      if(t)c.a=Math.atan2(t.y-p.y,t.x-p.x)+c.jit;
      c.t+=dt;g.cast={a:c.a,t:c.t,dur:c.dur,color:this.color,kind:'kame'};
      if(c.t>=c.dur){this.fire(c.a);g.audio.sfx(this.evo?'kameFireEvo':'kameFire');this.extras(k=>{const t2=g.nearest(p.x,p.y,700),a=(t2?Math.atan2(t2.y-p.y,t2.x-p.x):c.a)+(k%2?1:-1)*Math.ceil(k/2)*.4;this.fire(a);g.audio.sfx(this.evo?'kameFireEvo':'kameFire');g.shake=Math.max(g.shake,.1);},.4);this.charge=null;g.cast=null;this.cd=s.cd[L]*g.S.cd*this.e2c;g.shake=Math.max(g.shake,.15);}
    }
    for(const b of this.beams){
      b.t+=dt;b.tk-=dt;b.ext=KameWeapon.ext(b);
      if(g.eb.length)g.cutBeam(p.x,p.y-18,Math.cos(b.a),Math.sin(b.a),b.len*b.ext,b.wid);   /* the beam wipes out enemy bullets */
      if(b.tk<=0){
        b.tk=.1;const cs=Math.cos(b.a),sn=Math.sin(b.a),ox=p.x,oy=p.y-18;
        for(const e of g.en){
          if(e.dead)continue;
          const dx=e.x-ox,dy=e.y-8-oy,al=dx*cs+dy*sn,pe=-dx*sn+dy*cs;
          if(al>-10&&al<b.len*b.ext&&Math.abs(pe)<b.wid/2+e.r)g.hit(e,b.dmg,cs*40,sn*40);
        }
      }
    }
    this.beams=this.beams.filter(b=>b.t<b.dur);
  }
  draw(ctx){
    const g=this.g,p=g.p;
    for(const b of this.beams){
      const k=Math.sin(Math.min(1,b.t/b.dur)*Math.PI);
      /* the original Kamehameha is a lighter sky blue with a dense, deep blue glow around it; a transformation still tints it */
      const c=b.evo?this.color:(g.formColor||'#8fe3ff');
      const off=WFX.has('kame')?26:14;   /* v123: the painted beam starts in front of the hero, not inside */
      ctx.save();ctx.translate(p.x+Math.cos(b.a)*off,p.y-18+Math.sin(b.a)*off);ctx.rotate(b.a);
      const L=Math.max(0,b.len*(b.ext||.01)-(off-14));
      if(!b.evo&&k>.02){   /* dense blue glow under the beam */
        ctx.save();ctx.globalCompositeOperation='lighter';
        const gr=ctx.createLinearGradient(0,-b.wid*1.1*k,0,b.wid*1.1*k);gr.addColorStop(0,'rgba(20,70,255,0)');gr.addColorStop(.32,'rgba(30,90,255,.5)');gr.addColorStop(.5,'rgba(90,170,255,.6)');gr.addColorStop(.68,'rgba(30,90,255,.5)');gr.addColorStop(1,'rgba(20,70,255,0)');
        ctx.globalAlpha=.85*k;ctx.fillStyle=gr;ctx.fillRect(-6,-b.wid*1.1*k,L+8,b.wid*2.2*k);
        GLOW.at(ctx,0,0,b.wid*1.9,'#2a63ff',.8*k);GLOW.at(ctx,L,0,b.wid*1.6,'#2a63ff',.7*k);ctx.restore();
      }
      if(!WFX.beam(ctx,'kame',L,b.wid*(.55+.4*k)*(b.evo?.72:1),g.rt,Math.min(1,k*2.5),3,5))VFX.beam(ctx,L,b.wid,c,k,g.rt,b.a*3,b.elec,true);   /* v123: painted beam */
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
    const n=s.n[L]+(this.evo>=2?2:0)+this.xn,r=s.r[L]*(g.S.area*this.e2a);this.pos.length=0;   /* Quantità: more discs around you, evenly spaced */
    for(let i=0;i<n;i++){
      const a=this.a+i*TAU/n,dx=p.x+Math.cos(a)*r,dy=p.y-14+Math.sin(a)*r;
      this.pos.push([dx,dy]);if(g.eb.length)g.cutC(dx,dy,11*(this.evo?1.5:1));
      for(const e of g.en){
        if(e.dead)continue;
        const ex=e.x-dx,ey=e.y-8-dy,rr=e.r+11*(this.evo?1.5:1);
        if(ex*ex+ey*ey<rr*rr&&g.rt-(e.dh||0)>.35){e.dh=g.rt;g.hit(e,s.dmg[L]*this.dm,ex*3,ey*3);}
      }
    }
  }
  draw(ctx){
    const g=this.g,c=this.color,k=this.evo?1.5:1,t=g.rt;
    if(WFX.has('disc')){for(let i=0;i<this.pos.length;i++){const q=this.pos[i];WFX.draw(ctx,'disc',t*16+i*3,q[0],q[1],72*k*(this.evo>=2?1.15:1));}return;}   /* v123: painted disc */
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
    if(g.trial&&g.trial.zeno){this.bombs=[];this.burns=[];return;}   /* switched off inside Zeno's Shop: no sphere falls on the shop (its cooldown waits) */
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
        b.done=true;g.cutC(b.x,b.y,b.rad);g.audio.sfx('thunder');g.shake=Math.max(g.shake,this.evo?.9:.5);g.ring(b.x,b.y,b.rad,this.color,.6);g.burst(b.x,b.y,30+(this.evo?30:0),'#ffffff');g.bolt(b.x,b.y,b.rad,'#8ae0ff',16);g.pillar(b.x,b.y,'#8ae0ff',.7);
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
      z.t+=dt;if(g.eb.length)g.cutC(z.x,z.y,z.rad);
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
      if(WFX.draw(ctx,'spirit',this.g.rt*12,cx,cy,r*(this.evo?2.15:2.5)))continue;   /* v123: painted sphere */
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
    if(g.eb.length)g.cutC(p.x,p.y-8,s.r[L]*(g.S.area*this.e2a));   /* the aura burns enemy bullets before they reach you */
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
    if(WFX.has('aura')){WFX.draw(ctx,'aura',t*12,p.x,p.y-10-r*.5,r*2.25*(1+Math.sin(t*10)*.02));if(Math.random()<.4&&g.fx.length<420){const a=rnd(0,TAU),d=r*rnd(.3,.95);g.fx.push({x:p.x+Math.cos(a)*d,y:p.y-10+Math.sin(a)*d*.8,vx:rnd(-15,15),vy:rnd(-110,-50),l:rnd(.3,.7),m:.7,c:Math.random()<.4?'#ffffff':c,s:rnd(2,4)});}return;}   /* v123: painted ring of fire */
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
    let any=false;const vr=g.viewR;g.cutC(p.x,p.y,vr);
    for(const e of g.en){
      if(e.dead)continue;
      if(Math.hypot(e.x-p.x,e.y-p.y)<vr){e.stun=Math.max(e.stun,e.boss?s.stun[L]*.4:s.stun[L]);any=true;g.hit(e,s.dmg[L]*this.dm);}
    }
    if(any){g.flash=.5;g.flashC='#fffbd0';g.audio.sfx('flare');this.cd=s.cd[L]*g.S.cd*this.e2c;this.fl={t0:g.rt};}else this.cd=.5;
  }
  /* v123: the painted starburst over the hero (half a second) */
  draw(ctx){const f=this.fl;if(!f)return;const k=(this.g.rt-f.t0)/.55;if(k>=1){this.fl=null;return;}const p=this.g.p;WFX.draw(ctx,'flare',k*8,p.x,p.y-30,(260+80*this.evo)*(.8+.4*k));}
}

class SlashWeapon extends Weapon{
  constructor(g,id){super(g,id);this.slashes=[];}
  swing(a){
    const g=this.g,p=g.p,s=this.st,L=this.L,rad=s.rad[L]*(g.S.area*this.e2a),half=s.arc[L];
    for(const ang of(this.lv>=5&&!this.evo?[a,a+Math.PI]:[a])){
      this.slashes.push({a:ang,half,rad,t:0,dur:.22});g.cutArc(p.x,p.y-14,rad,ang,half);
      for(const e of g.en){
        if(e.dead)continue;
        const dx=e.x-p.x,dy=e.y-8-(p.y-14),d=Math.hypot(dx,dy)||1;
        if(d>rad+e.r)continue;
        if(Math.abs(angDiff(Math.atan2(dy,dx),ang))<=half)g.hit(e,s.dmg[L]*this.dm,dx/d*120,dy/d*120);
      }
    }
    g.audio.sfx('slash');
  }
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.tickQ(dt);
    this.cd-=dt;
    if(this.cd<=0){
      const rad=s.rad[L]*(g.S.area*this.e2a),t=g.nearest(p.x,p.y,rad+20);
      if(t){
        const a=Math.atan2(t.y-p.y,t.x-p.x)+g.aimJit();
        this.swing(a);
        this.extras(()=>{const t2=g.nearest(p.x,p.y,rad+20);this.swing(t2?Math.atan2(t2.y-p.y,t2.x-p.x)+g.aimJit():a);},.2);   /* Quantità: one more swing after the first */
        this.cd=s.cd[L]*g.S.cd*this.e2c;
      }else this.cd=.1;
    }
    for(const sl of this.slashes)sl.t+=dt;
    this.slashes=this.slashes.filter(sl=>sl.t<sl.dur);
  }
  draw(ctx){
    const p=this.g.p,c=this.color;
    if(WFX.has('slash')){for(const sl of this.slashes){const k=sl.t/sl.dur,n=Math.max(1,Math.round(sl.half*2/(Math.PI*.62)));   /* v123: painted arc (several around for the 360-degree slash) */
      for(let i=0;i<n;i++)WFX.draw(ctx,'slash',k*6,p.x,p.y-14,sl.rad*2.5,sl.a+(n>1?(i-(n-1)/2)*2*sl.half/n:0));}return;}
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
    this.tickQ(dt);
    this.cd-=dt;if(this.cd>0)return;
    if(!g.en.length){this.cd=.2;return;}
    const n=s.n[L]+this.e2n,one=()=>{const a=rnd(0,TAU);g.pr.push({x:p.x,y:p.y-18,vx:Math.cos(a)*230,vy:Math.sin(a)*230,r:7*(g.S.area*this.e2a),dmg:s.dmg[L]*this.dm,pi:this.evo?1:0,life:3,hit:[],c:this.color,home:true});};
    for(let i=0;i<n;i++)one();
    this.extras(()=>{one();g.audio.sfx('shot');});   /* Quantità: the extra seekers leave one after the other */
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
        const ang=Math.atan2(best.y-8-(p.y-18),best.x-p.x)+g.aimJit(),n=(this.evo>=2?5:this.evo?3:this.lv>=5?2:1)+this.xn;   /* Quantità: more beams in the fan */
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
    for(const l of this.lines){l.t+=dt;if(this.g.eb.length)this.g.cutBeam(this.g.p.x,this.g.p.y-18,Math.cos(l.a),Math.sin(l.a),l.len,l.wid);}
    this.lines=this.lines.filter(l=>l.t<l.dur);
  }
  draw(ctx){
    const g=this.g,p=g.p,c=this.color;
    for(const l of this.lines){
      const k=l.t/l.dur,wd=l.wid*(1-k*.45);
      if(WFX.has('dbeam')){ctx.save();ctx.translate(p.x+Math.cos(l.a)*16,p.y-18+Math.sin(l.a)*16);ctx.rotate(l.a);WFX.beam(ctx,'dbeam',l.len,Math.max(8,wd*4),this.g.rt,1-k*.8,0,5);ctx.restore();continue;}   /* v123: painted beam */
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

