'use strict';
/* ====== Roster-signature weapons (unlocked by reaching level 50 with their owner). Balanced a bit below the classics. ====== */
Object.assign(WS,{
  javelin:{cd:[1.5,1.4,1.25,1.1,1,.9],n:[1,1,2,2,3,4],dmg:[14,16,18,21,24,27],pi:[2,2,3,3,4,6]},
  dsunday:{cd:[1.5,1.4,1.3,1.2,1.1,1],n:[2,2,2,3,3,4],dmg:[9,10.5,12,13.5,15,17],rad:[36,40,44,48,54,64]},
  breaker:{cd:[2.8,2.6,2.4,2.2,2,1.8],n:[1,1,1,1,2,2],dmg:[18,22,26,30,35,42],rad:[60,66,72,80,90,110]},
  spiral:{iv:[.34,.3,.27,.24,.22,.2],arms:[1,2,2,3,3,4],dmg:[6,6.5,7,8,9,10],pi:[0,0,0,0,1,1]},
  boomer:{cd:[2.4,2.2,2,1.8,1.6,1.4],n:[1,1,2,2,3,4],dmg:[11,13,15,17,20,24],dist:[230,250,270,290,320,380]},
  hellzone:{cd:[5,4.6,4.2,3.8,3.4,3],n:[1,1,2,2,3,4],dmg:[6,7,8,9.5,11,13],rad:[62,68,74,82,92,108],life:[3,3,3.2,3.4,3.6,4]},
  chrono:{cd:[8,7.5,7,6.5,6,5],rad:[150,165,180,200,220,260],dmg:[10,12,14,16,19,22],hits:[3,3,3,4,4,6],stun:[1,1.1,1.2,1.3,1.4,1.6]},
  shock:{cd:[3.4,3.1,2.8,2.5,2.2,1.9],rad:[170,190,210,235,260,310],dmg:[14,17,20,24,28,34]},
  hakai:{cd:[9,8.5,8,7.5,7,6],n:[1,1,1,1,2,2],dmg:[4.5,5.5,6.5,7.5,9,10.5],rad:[56,62,68,76,86,100],life:[4,4.2,4.4,4.6,4.8,5]},
  chain:{cd:[1.4,1.3,1.2,1.1,1,.9],jumps:[3,4,4,5,6,8],dmg:[10,12,14,16,19,22]},
  meteor:{cd:[3.2,3,2.8,2.6,2.4,2.1],n:[2,3,3,4,5,6],dmg:[14,16,18,21,24,28],rad:[50,54,58,64,70,80]},
  sweep:{cd:[7.5,7,6.5,6,5.5,4.8],dur:[2.2,2.3,2.4,2.5,2.6,2.8],dmg:[4.5,5,5.6,6.4,7.4,8.6],len:[300,320,340,360,390,440],wid:[26,28,30,32,35,40]},
  dyn:{cd:[1.2,1.1,1,.9,.8,.7],rad:[72,80,88,98,110,130],dmg:[13,16,19,23,27,32]}
});
/* second evolutions hit a bit softer than the classic x1.5 */
class NW extends Weapon{
  get dm(){return(this.evo?1+.03*(this.g.formIdx+1):1)*(this.evo>=2?1.28:1);}
  get e2c(){return this.evo>=2?.88:1;}
  get e2a(){return this.evo>=2?1.15:1;}
  get e2n(){return this.evo>=2?1:0;}
  area(){return this.g.S.area*this.e2a;}
  cdv(){return this.st.cd[this.L]*this.g.S.cd*this.e2c;}
  inView(e,r){return !e.dead&&Math.hypot(e.x-this.g.p.x,e.y-this.g.p.y)<r;}
}
const unit=(a,b)=>{const d=Math.hypot(a,b)||1;return[a/d,b/d];};

class JavelinWeapon extends NW{
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.cd-=dt;if(this.cd>0)return;
    const t=g.nearest(p.x,p.y,600);if(!t){this.cd=.1;return;}
    const base=Math.atan2(t.y-8-(p.y-18),t.x-p.x),n=s.n[L]+g.S.proj+this.e2n;
    for(let i=0;i<n;i++){
      const a=base+(i-(n-1)/2)*.15;
      g.pr.push({x:p.x,y:p.y-18,vx:Math.cos(a)*540,vy:Math.sin(a)*540,r:8*this.area(),dmg:s.dmg[L]*this.dm,pi:s.pi[L]+(this.evo?2:0),life:1.15,hit:[],c:this.color,spear:a});
    }
    g.audio.sfx('slash');this.cd=this.cdv();
  }
}
class DSundayWeapon extends NW{
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.cd-=dt;if(this.cd>0)return;
    const cands=g.en.filter(e=>this.inView(e,560)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
    if(!cands.length){this.cd=.1;return;}
    const n=s.n[L]+g.S.proj+this.e2n;
    for(let i=0;i<n;i++){
      const t=cands[i%cands.length],a=Math.atan2(t.y-8-(p.y-18),t.x-p.x)+(i>=cands.length?rnd(-.15,.15):0);
      g.pr.push({x:p.x,y:p.y-18,vx:Math.cos(a)*470,vy:Math.sin(a)*470,r:7,dmg:s.dmg[L]*this.dm,pi:0,life:1.3,hit:[],c:this.color,expl:s.rad[L]*this.area(),ex:.6});
    }
    g.audio.sfx('shot');this.cd=this.cdv();
  }
}
class BreakerWeapon extends NW{
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.cd-=dt;if(this.cd>0)return;
    const t=g.nearest(p.x,p.y,520);if(!t){this.cd=.1;return;}
    const base=Math.atan2(t.y-8-(p.y-18),t.x-p.x),n=s.n[L]+(this.evo>=2?1:0);
    for(let i=0;i<n;i++){
      const a=base+(i-(n-1)/2)*.3;
      g.pr.push({x:p.x,y:p.y-18,vx:Math.cos(a)*320,vy:Math.sin(a)*320,r:11,dmg:s.dmg[L]*this.dm*.45,pi:0,life:1.4,hit:[],c:this.color,expl:s.rad[L]*this.area(),ex:1.25});
    }
    g.audio.sfx('shot');this.cd=this.cdv();
  }
}
class SpiralWeapon extends NW{
  constructor(g,id){super(g,id);this.ang=0;this.iv=.2;}
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.ang+=dt*(2.4+L*.2);this.iv-=dt;if(this.iv>0)return;
    if(!g.nearest(p.x,p.y,520)){this.iv=.15;return;}
    const arms=s.arms[L]+g.S.proj+this.e2n;
    for(let i=0;i<arms;i++){const a=this.ang+i*TAU/arms;g.pr.push({x:p.x,y:p.y-18,vx:Math.cos(a)*260,vy:Math.sin(a)*260,r:6*this.area(),dmg:s.dmg[L]*this.dm,pi:s.pi[L],life:1.35,hit:[],c:this.color});}
    this.iv=s.iv[L]*g.S.cd*this.e2c;
  }
}
class BoomerWeapon extends NW{
  constructor(g,id){super(g,id);this.bs=[];}
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.cd-=dt;
    if(this.cd<=0){
      const t=g.nearest(p.x,p.y,520);
      if(t){
        const base=Math.atan2(t.y-(p.y-14),t.x-p.x),n=s.n[L]+g.S.proj+this.e2n;
        for(let i=0;i<n;i++)this.bs.push({a:base+(i-(n-1)/2)*.5,t:-i*.14,dur:1.5,d:s.dist[L]*this.area(),hit:new Set(),x:p.x,y:p.y});
        g.audio.sfx('slash');this.cd=this.cdv();
      }else this.cd=.15;
    }
    for(const b of this.bs){
      b.t+=dt;if(b.t<0)continue;
      const k=b.t/b.dur;if(k>=1){b.done=true;continue;}
      if(k>.5&&!b.turn){b.turn=true;b.hit.clear();}
      const r=Math.sin(k*Math.PI)*b.d;
      b.x=p.x+Math.cos(b.a)*r;b.y=p.y-14+Math.sin(b.a)*r*.9;
      for(const e of g.en){
        if(e.dead||b.hit.has(e))continue;
        const dx=e.x-b.x,dy=e.y-8-b.y,rr=e.r+17*this.area();
        if(dx*dx+dy*dy<rr*rr){b.hit.add(e);g.hit(e,s.dmg[L]*this.dm,dx*2,dy*2);}
      }
    }
    this.bs=this.bs.filter(b=>!b.done);
  }
  draw(ctx){
    const g=this.g,c=this.color,t=g.rt;
    for(const b of this.bs){
      if(b.t<0)continue;
      ctx.save();ctx.translate(b.x,b.y);ctx.rotate(t*16);ctx.globalCompositeOperation='lighter';
      GLOW.at(ctx,0,0,34,c,.7);ctx.globalCompositeOperation='source-over';
      ctx.fillStyle=c;ctx.strokeStyle='#fff';ctx.lineWidth=1.6;
      for(let k=0;k<3;k++){ctx.save();ctx.rotate(k*TAU/3);ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(10,-10,26,-4);ctx.quadraticCurveTo(12,-2,0,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,4,0,TAU);ctx.fill();ctx.restore();
    }
  }
}
class HellzoneWeapon extends NW{
  constructor(g,id){super(g,id);this.zs=[];}
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.cd-=dt;
    if(this.cd<=0){
      const live=g.en.filter(e=>this.inView(e,420));
      if(live.length){
        const n=s.n[L]+this.e2n;
        for(let i=0;i<n;i++){const t=pick(live);this.zs.push({x:t.x+rnd(-20,20),y:t.y+rnd(-20,20),t:-.45,life:s.life[L],rad:s.rad[L]*this.area(),tk:0});}
        g.audio.sfx('shot');this.cd=this.cdv();
      }else this.cd=.2;
    }
    for(const z of this.zs){
      z.t+=dt;
      if(z.t<0)continue;
      if(!z.on){z.on=true;g.ring(z.x,z.y,z.rad*1.2,this.color,.35);g.burst(z.x,z.y,16,'#ff9a2a');g.shake=Math.max(g.shake,.1);}
      z.tk-=dt;if(z.tk<=0){z.tk=.45;for(const e of g.en){if(e.dead)continue;const dx=e.x-z.x,dy=e.y-z.y,rr=z.rad+e.r;if(dx*dx+dy*dy<rr*rr)g.hit(e,s.dmg[L]*this.dm,0,0);}}
      if(Math.random()<.5&&g.fx.length<420){const a=rnd(0,TAU),d=rnd(0,z.rad);g.fx.push({x:z.x+Math.cos(a)*d,y:z.y+Math.sin(a)*d*.8,vx:rnd(-10,10),vy:rnd(-90,-40),l:rnd(.3,.6),m:.6,c:Math.random()<.5?'#ffb13b':'#ff5a1a',s:rnd(2,4)});}
    }
    this.zs=this.zs.filter(z=>z.t<z.life);
  }
  drawGround(ctx){
    const g=this.g,t=g.rt;
    for(const z of this.zs){
      if(z.t<0){const k=(z.t+.45)/.45,gy=z.y-(1-k)*420;GLOW.at(ctx,z.x,gy,26,'#ff7a2a',1);ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.arc(z.x,gy,6,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,120,40,.7)';ctx.setLineDash([5,5]);ctx.beginPath();ctx.ellipse(z.x,z.y,z.rad,z.rad*.8,0,0,TAU);ctx.stroke();ctx.setLineDash([]);continue;}
      const fade=Math.min(1,(z.life-z.t)/.6),pul=1+Math.sin(t*8+z.x)*.04;
      ctx.save();ctx.translate(z.x,z.y);ctx.scale(1,.8);ctx.globalAlpha=fade;
      const gr=ctx.createRadialGradient(0,0,z.rad*.1,0,0,z.rad*pul);gr.addColorStop(0,'rgba(255,230,120,.75)');gr.addColorStop(.55,'rgba(255,110,30,.5)');gr.addColorStop(1,'rgba(160,30,10,.0)');
      ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,z.rad*pul,0,TAU);ctx.fill();
      ctx.strokeStyle='#ff9a2a';ctx.lineWidth=2.5;ctx.globalCompositeOperation='lighter';ctx.beginPath();ctx.arc(0,0,z.rad*pul,0,TAU);ctx.stroke();
      ctx.rotate(t*1.5);ctx.strokeStyle='#ffd23f';ctx.lineWidth=1.5;ctx.setLineDash([8,10]);ctx.beginPath();ctx.arc(0,0,z.rad*.62,0,TAU);ctx.stroke();ctx.setLineDash([]);
      ctx.restore();
    }
  }
}
class ChronoWeapon extends NW{
  constructor(g,id){super(g,id);this.pend=[];this.fxT=0;this.fxR=0;}
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L,R=s.rad[L]*this.area();
    this.cd-=dt;
    if(this.cd<=0){
      if(g.en.some(e=>this.inView(e,R))){
        const hits=s.hits[L]+(this.evo>=2?2:0);
        for(const e of g.en)if(this.inView(e,R))e.stun=Math.max(e.stun,e.boss?s.stun[L]*.4:s.stun[L]);
        this.pend=[];for(let i=0;i<hits;i++)this.pend.push({t:.3+i*(s.stun[L]*.7/hits)});
        this.fxT=1;this.fxR=R;this.T0=0;g.flash=.25;g.flashC='#9ab4ff';g.audio.sfx('flare');this.cd=this.cdv();
      }else this.cd=.4;
    }
    if(this.fxT>0){this.fxT=Math.max(0,this.fxT-dt/1.4);this.T0+=dt;}
    for(const h of this.pend){
      h.t-=dt;
      if(h.t<=0&&!h.done){h.done=true;
        for(const e of g.en){if(e.dead||!this.inView(e,this.fxR))continue;g.hit(e,s.dmg[L]*this.dm,0,0);if(g.fx.length<420){const a=rnd(0,TAU);for(let k=0;k<3;k++)g.fx.push({x:e.x+Math.cos(a)*10*k,y:e.y-10+Math.sin(a)*10*k,vx:Math.cos(a)*120,vy:Math.sin(a)*120,l:.3,m:.3,c:'#cfd8ff',s:3});}}
        g.shake=Math.max(g.shake,.08);
      }
    }
    this.pend=this.pend.filter(h=>!h.done);
  }
  drawGround(ctx){
    if(this.fxT<=0)return;
    const p=this.g.p,k=this.fxT,R=this.fxR,t=this.T0;
    ctx.save();ctx.translate(p.x,p.y-8);ctx.scale(1,.82);ctx.globalCompositeOperation='lighter';
    const gr=ctx.createRadialGradient(0,0,R*.1,0,0,R);gr.addColorStop(0,'rgba(120,140,255,0)');gr.addColorStop(1,'rgba(150,170,255,'+(.3*k)+')');
    ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,R*(1-k*.1),0,TAU);ctx.fill();
    ctx.globalAlpha=k;ctx.strokeStyle='#cfd8ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,R*(1-k*.1),0,TAU);ctx.stroke();
    ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,0,R*.6,0,TAU);ctx.stroke();
    for(let i=0;i<12;i++){const a=i/12*TAU,r1=R*.6,r2=R*(i%3?.66:.72);ctx.beginPath();ctx.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);ctx.stroke();}
    ctx.lineWidth=3;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(t*5-1.6)*R*.5,Math.sin(t*5-1.6)*R*.5);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(t*1.2-1.6)*R*.35,Math.sin(t*1.2-1.6)*R*.35);ctx.stroke();
    ctx.restore();
  }
}
class ShockWeapon extends NW{
  constructor(g,id){super(g,id);this.rs=[];}
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.cd-=dt;
    if(this.cd<=0){
      if(g.en.some(e=>this.inView(e,s.rad[L]*this.area()+40))){
        const R=s.rad[L]*this.area(),n=this.evo?2:1;
        for(let i=0;i<n;i++)this.rs.push({r:0,t:-i*.22,max:R,hit:new Set()});
        g.audio.sfx('thunder');g.shake=Math.max(g.shake,.16);this.cd=this.cdv();
      }else this.cd=.2;
    }
    for(const w of this.rs){
      w.t+=dt;if(w.t<0)continue;
      const prev=w.r;w.r=w.max*Math.min(1,w.t/.55);
      for(const e of g.en){
        if(e.dead||w.hit.has(e))continue;
        const d=Math.hypot(e.x-p.x,(e.y-p.y)/.82);
        if(d<=w.r+e.r&&d>=prev-e.r-14){w.hit.add(e);const [ux,uy]=unit(e.x-p.x,e.y-p.y);g.hit(e,s.dmg[L]*this.dm,ux*260,uy*260);}
      }
    }
    this.rs=this.rs.filter(w=>w.t<.7);
  }
  drawGround(ctx){
    const p=this.g.p,c=this.color;
    for(const w of this.rs){
      if(w.t<0)continue;
      const k=Math.min(1,w.t/.55),fade=1-Math.max(0,(w.t-.55)/.15);
      ctx.save();ctx.translate(p.x,p.y-8);ctx.scale(1,.82);ctx.globalCompositeOperation='lighter';
      ctx.globalAlpha=fade*.9;ctx.lineCap='round';
      for(const [lw,col,rr] of [[26*(1-k*.6),c,1],[10,'#fff',.98],[3,c,.86],[2,'#fff',.74]]){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();ctx.arc(0,0,w.r*rr,0,TAU);ctx.stroke();}
      ctx.globalAlpha=fade*.7;ctx.strokeStyle='#fff';ctx.lineWidth=1.5;
      for(let i=0;i<20;i++){const a=i/20*TAU+w.t*.8;ctx.beginPath();ctx.moveTo(Math.cos(a)*w.r*.9,Math.sin(a)*w.r*.9);ctx.lineTo(Math.cos(a)*w.r*1.06,Math.sin(a)*w.r*1.06);ctx.stroke();}
      ctx.restore();
    }
  }
}
class HakaiWeapon extends NW{
  constructor(g,id){super(g,id);this.sp=[];}
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.cd-=dt;
    if(this.cd<=0){
      const t=g.nearest(p.x,p.y,500);
      if(t){const n=s.n[L]+(this.evo>=2?1:0);for(let i=0;i<n;i++){const a=rnd(0,TAU);this.sp.push({x:p.x+Math.cos(a)*40,y:p.y-14+Math.sin(a)*40,t:0,life:s.life[L],rad:s.rad[L]*this.area(),tk:0});}g.audio.sfx('spirit');this.cd=this.cdv();}
      else this.cd=.3;
    }
    for(const b of this.sp){
      b.t+=dt;
      const t=g.nearest(b.x,b.y,620);
      if(t){const [ux,uy]=unit(t.x-b.x,t.y-8-b.y);const sp2=Math.min(130,40+b.t*90);b.x+=ux*sp2*dt;b.y+=uy*sp2*dt;}
      b.tk-=dt;
      for(const e of g.en){
        if(e.dead)continue;
        const dx=e.x-b.x,dy=e.y-8-b.y,rr=b.rad+e.r;
        if(dx*dx+dy*dy<rr*rr){
          if(this.evo&&!e.boss){const [ux,uy]=unit(-dx,-dy);e.x+=ux*70*dt;e.y+=uy*70*dt;}
          if(b.tk<=0)g.hit(e,s.dmg[L]*this.dm,0,0);
        }
      }
      if(b.tk<=0)b.tk=.3;
    }
    this.sp=this.sp.filter(b=>b.t<b.life);
  }
  draw(ctx){
    const g=this.g,t=g.rt;
    for(const b of this.sp){
      const k=Math.min(1,b.t/.4,(b.life-b.t)/.6),r=b.rad*.62*k;
      ctx.save();ctx.translate(b.x,b.y);
      GLOW.at(ctx,0,0,r*3.2,'#a040ff',.6*k);
      ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#d8a0ff';ctx.lineWidth=2;ctx.globalAlpha=.8*k;
      for(let i=0;i<5;i++){ctx.beginPath();const a0=t*2+i*1.26;ctx.moveTo(Math.cos(a0)*r,Math.sin(a0)*r);for(let q=1;q<=4;q++){const a=a0+q*.18,rr=r*(1+q*.14)+Math.sin(t*20+i+q)*3;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.stroke();}
      ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
      ctx.fillStyle='#14061f';ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();
      ctx.strokeStyle='#c070ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();
      ctx.fillStyle='#6a20b0';ctx.beginPath();ctx.arc(-r*.25,-r*.25,r*.35,0,TAU);ctx.fill();
      ctx.restore();
      if(Math.random()<.6&&g.fx.length<420){const a=rnd(0,TAU);g.fx.push({x:b.x+Math.cos(a)*b.rad*1.1,y:b.y+Math.sin(a)*b.rad*1.1,vx:-Math.cos(a)*110,vy:-Math.sin(a)*110,l:.4,m:.4,c:'#c070ff',s:3});}
    }
  }
}
class ChainWeapon extends NW{
  constructor(g,id){super(g,id);this.bolts=[];}
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.cd-=dt;
    if(this.cd<=0){
      let cur=g.nearest(p.x,p.y,480);
      if(cur){
        const pts=[[p.x,p.y-20]],used=new Set(),jumps=s.jumps[L]+g.S.proj+this.e2n*2;
        for(let i=0;i<jumps&&cur;i++){
          used.add(cur);pts.push([cur.x,cur.y-10]);g.hit(cur,s.dmg[L]*this.dm,0,0);
          let nx=null,bd=230*230*this.area();
          for(const e of g.en){if(e.dead||used.has(e))continue;const dx=e.x-cur.x,dy=e.y-cur.y,d=dx*dx+dy*dy;if(d<bd){bd=d;nx=e;}}
          cur=nx;
        }
        this.bolts.push({pts,t:0});g.audio.sfx('thunder');this.cd=this.cdv();
      }else this.cd=.15;
    }
    for(const b of this.bolts)b.t+=dt;
    this.bolts=this.bolts.filter(b=>b.t<.28);
  }
  draw(ctx){
    const c=this.color;
    for(const b of this.bolts){
      const k=b.t/.28;ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineJoin='round';ctx.lineCap='round';
      for(const [lw,col,al] of [[9,c,.35],[4,c,.8],[1.6,'#ffffff',1]]){
        ctx.globalAlpha=(1-k)*al;ctx.strokeStyle=col;ctx.lineWidth=lw*(1-k*.4);
        ctx.beginPath();
        for(let i=1;i<b.pts.length;i++){
          const a=b.pts[i-1],z=b.pts[i];ctx.moveTo(a[0],a[1]);
          const seg=Math.max(2,Math.round(Math.hypot(z[0]-a[0],z[1]-a[1])/22)),nx=-(z[1]-a[1]),ny=z[0]-a[0],nl=Math.hypot(nx,ny)||1;
          for(let q=1;q<seg;q++){const f=q/seg,j=(Math.sin(i*91.7+q*13.3+Math.floor(b.t*40))*9);ctx.lineTo(a[0]+(z[0]-a[0])*f+nx/nl*j,a[1]+(z[1]-a[1])*f+ny/nl*j);}
          ctx.lineTo(z[0],z[1]);
        }
        ctx.stroke();
      }
      for(let i=1;i<b.pts.length;i++)GLOW.at(ctx,b.pts[i][0],b.pts[i][1],24,c,(1-k)*.9);
      ctx.restore();
    }
  }
}
class MeteorWeapon extends NW{
  constructor(g,id){super(g,id);this.ms=[];}
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.cd-=dt;
    if(this.cd<=0){
      const live=g.en.filter(e=>this.inView(e,460));
      if(live.length){
        const n=s.n[L]+g.S.proj+this.e2n;
        for(let i=0;i<n;i++){const t=pick(live);this.ms.push({x:t.x+rnd(-30,30),y:t.y+rnd(-24,24),t:-i*.12,fall:.55,rad:s.rad[L]*this.area()});}
        g.audio.sfx('shot');this.cd=this.cdv();
      }else this.cd=.25;
    }
    for(const m of this.ms){
      m.t+=dt;
      if(m.t>=m.fall&&!m.done){
        m.done=true;const R=m.rad,L2=this.L;
        g.ring(m.x,m.y,R*1.3,'#ff8a2a',.4);g.burst(m.x,m.y,18,'#ffb13b');g.burst(m.x,m.y,8,'#ffffff');g.shake=Math.max(g.shake,.1);
        for(const e of g.en){if(e.dead)continue;const dx=e.x-m.x,dy=e.y-m.y,rr=R+e.r;if(dx*dx+dy*dy<rr*rr)g.hit(e,s.dmg[L2]*this.dm,dx*.6,dy*.6);}
      }
    }
    this.ms=this.ms.filter(m=>!m.done);
  }
  drawGround(ctx){
    for(const m of this.ms){if(m.t<0)continue;const k=m.t/m.fall;ctx.strokeStyle='rgba(255,140,50,'+(.3+.5*k)+')';ctx.fillStyle='rgba(255,100,30,'+(.08+.2*k)+')';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(m.x,m.y,m.rad,m.rad*.8,0,0,TAU);ctx.fill();ctx.stroke();}
  }
  draw(ctx){
    for(const m of this.ms){
      if(m.t<0)continue;
      const k=m.t/m.fall,px=m.x+(1-k)*260,py=m.y-(1-k)*520;
      ctx.save();ctx.globalCompositeOperation='lighter';
      const gr=ctx.createLinearGradient(px,py,px+260*.45*(1-k)+60,py-520*.45*(1-k)-120);gr.addColorStop(0,'rgba(255,200,80,.9)');gr.addColorStop(1,'rgba(255,80,20,0)');
      ctx.strokeStyle=gr;ctx.lineWidth=14;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+130*(1-k)+40,py-260*(1-k)-80);ctx.stroke();
      GLOW.at(ctx,px,py,40,'#ff8a2a',1);ctx.restore();
      ctx.fillStyle='#5a2a1a';ctx.beginPath();ctx.arc(px,py,10,0,TAU);ctx.fill();ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.arc(px-2,py-2,5,0,TAU);ctx.fill();
    }
  }
}
class SweepWeapon extends NW{
  constructor(g,id){super(g,id);this.act=null;this.tk=0;}
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    if(!this.act){
      this.cd-=dt;
      if(this.cd<=0){
        const t=g.nearest(p.x,p.y,520);
        if(t){this.act={a:Math.atan2(t.y-p.y,t.x-p.x),t:0,dur:s.dur[L]};g.audio.sfx(this.evo?'kameFireEvo':'kameFire');}
        else this.cd=.2;
      }
    }else{
      const a=this.act;a.t+=dt;g.cast={a:a.a,t:Math.min(a.t,.4),dur:.4,color:this.color,kind:'kame'};
      a.cur=a.a+a.t/a.dur*TAU*1.15;this.tk-=dt;
      if(this.tk<=0){
        this.tk=.12;const len=s.len[L]*this.area(),wid=s.wid[L]*this.area(),angs=this.evo>=2?[a.cur,a.cur+TAU/3,a.cur+TAU*2/3]:this.evo?[a.cur,a.cur+Math.PI]:[a.cur];
        for(const ang of angs){const cs=Math.cos(ang),sn=Math.sin(ang);
          for(const e of g.en){if(e.dead)continue;const dx=e.x-p.x,dy=e.y-8-(p.y-18),al=dx*cs+dy*sn,pe=-dx*sn+dy*cs;if(al>-10&&al<len&&Math.abs(pe)<wid/2+e.r)g.hit(e,s.dmg[L]*this.dm,cs*30,sn*30);}}
      }
      g.shake=Math.max(g.shake,.06);
      if(a.t>=a.dur){this.act=null;g.cast=null;this.cd=this.cdv();}
    }
  }
  draw(ctx){
    if(!this.act)return;
    const g=this.g,p=g.p,s=this.st,L=this.L,a=this.act,k=Math.min(1,a.t/.25,(a.dur-a.t)/.3),len=s.len[L]*this.area(),wid=s.wid[L]*this.area();
    const angs=this.evo>=2?[a.cur,a.cur+TAU/3,a.cur+TAU*2/3]:this.evo?[a.cur,a.cur+Math.PI]:[a.cur];
    for(const ang of angs){ctx.save();ctx.translate(p.x,p.y-18);ctx.rotate(ang);VFX.beam(ctx,len,wid,this.color,Math.max(0,k),g.rt,ang);ctx.restore();}
  }
}
class DynWeapon extends NW{
  constructor(g,id){super(g,id);this.bs=[];}
  update(dt){
    const g=this.g,p=g.p,s=this.st,L=this.L;
    this.cd-=dt;
    if(this.cd<=0){
      const R=s.rad[L]*this.area();
      if(g.en.some(e=>this.inView(e,R))){
        const n=this.evo?2:1;
        for(let i=0;i<n;i++)this.bs.push({t:-i*.12,R,did:false});
        g.audio.sfx('slash');this.cd=this.cdv();
      }else this.cd=.1;
    }
    for(const b of this.bs){
      b.t+=dt;
      if(b.t>=0&&!b.did){
        b.did=true;g.shake=Math.max(g.shake,.1);
        for(const e of g.en){if(e.dead||!this.inView(e,b.R+e.r))continue;const [ux,uy]=unit(e.x-p.x,e.y-p.y);g.hit(e,s.dmg[L]*this.dm,ux*340,uy*340);}
      }
    }
    this.bs=this.bs.filter(b=>b.t<.3);
  }
  draw(ctx){
    const p=this.g.p,c=this.color;
    for(const b of this.bs){
      if(b.t<0)continue;
      const k=b.t/.3;ctx.save();ctx.translate(p.x,p.y-14);ctx.globalCompositeOperation='lighter';
      ctx.globalAlpha=1-k;ctx.strokeStyle=c;ctx.lineWidth=18*(1-k);ctx.beginPath();ctx.arc(0,0,b.R*(.4+.6*k),0,TAU);ctx.stroke();
      ctx.strokeStyle='#fff';ctx.lineWidth=5*(1-k);ctx.stroke();
      for(let i=0;i<14;i++){const a=i/14*TAU+.2,r1=b.R*(.25+.5*k),r2=b.R*(.5+.55*k);ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);ctx.stroke();}
      VFX.star(ctx,0,0,b.R*.55*(1-k),'rgba(255,255,255,.9)',k*3);
      ctx.restore();
    }
  }
}
const NEWW={javelin:JavelinWeapon,dsunday:DSundayWeapon,breaker:BreakerWeapon,spiral:SpiralWeapon,boomer:BoomerWeapon,hellzone:HellzoneWeapon,chrono:ChronoWeapon,shock:ShockWeapon,hakai:HakaiWeapon,chain:ChainWeapon,meteor:MeteorWeapon,sweep:SweepWeapon,dyn:DynWeapon};
