'use strict';
/* ====== Death animation ======
   Every enemy you kill stays for CORPSE_T seconds: a white flash, it is thrown back by the blow (at least CORPSE_PUSH px/s) with a small hop and falls on its back
   (the first CORPSE_FALL of the time, dust where it lands), then its pixels vanish in a random order (a pixel dissolve, the front glowing white-hot) while motes of
   its own colour rise from it. A boss does not fall: it drifts up while it dissolves. A boss takes CORPSE_TB seconds and also sends out a
   shock wave (three expanding rings of light + a white flash + a stronger shake). The final boss keeps its victory sequence (startVictory) and only gets the rings.
   How it works: at the first frame the enemy is drawn once (drawEnemy) into a small canvas; every frame that picture is copied to a second canvas, the pixels of the
   current dissolve level are erased with a pre-made pattern ('destination-out') and the white-hot edge is painted on what is left ('source-atop').
   Canvases come from a small pool, at most CORPSE_MAX bodies at a time, none with "Reduce effects" on, none when the enemy dies off screen.
   Game side: Game.addCorpse (called by killEnemy), updateCorpses (after the fx update), bossShock. Renderer side: drawCorpse (depth sorted with the entities). */
const CORPSE_T=.8,CORPSE_FALL=.48,CORPSE_PUSH=190,CORPSE_HB=1.9,CORPSE_TB=1.15,CORPSE_MAX=40,CORPSE_MAXB=10;
const Dissolve={
  N:14,T:96,CS:3,built:false,mask:[],edge:[],
  /* N nested masks: level l erases the cells whose random value is below (l+1)/N; the edge pattern holds the cells that go next (the white-hot front) */
  build(){
    if(this.built)return;this.built=true;
    const n=this.T/this.CS,v=[];for(let i=0;i<n*n;i++)v.push(Math.random());
    for(let l=0;l<this.N;l++){
      const thr=(l+1)/this.N,m=document.createElement('canvas'),e=document.createElement('canvas');m.width=m.height=e.width=e.height=this.T;
      const mc=m.getContext('2d'),ec=e.getContext('2d');mc.fillStyle='#000';ec.fillStyle='#fff';
      for(let j=0;j<n;j++)for(let i=0;i<n;i++){const q=v[j*n+i];if(q<thr)mc.fillRect(i*this.CS,j*this.CS,this.CS,this.CS);else if(q<thr+.17)ec.fillRect(i*this.CS,j*this.CS,this.CS,this.CS);}
      this.mask.push(mc.createPattern(m,'repeat'));this.edge.push(ec.createPattern(e,'repeat'));
    }
  }
};
const CorpsePool={
  sizes:[96,160,256,352,448],free:{},
  size(need){for(const s of this.sizes)if(s>=need)return s;return this.sizes[this.sizes.length-1];},
  get(S,q){const k=S+'x'+q,a=this.free[k]||(this.free[k]=[]);if(a.length)return a.pop();const mk=()=>{const c=document.createElement('canvas');c.width=c.height=S*q;return c;};return{S,q,a:mk(),b:mk()};},
  put(o){if(!o)return;const k=o.S+'x'+o.q,a=this.free[k]||(this.free[k]=[]);if(a.length<24)a.push(o);}
};
Game.prototype.corpseColor=function(e){const d=e.boss?e.bd:e.def,cf=d&&d.sp&&d.sp.cfg;return(d&&d.c)||(cf&&(cf.outfit||cf.skin))||'#ffffff';};
Game.prototype.addCorpse=function(e){
  if(this.trial||FXL.on||e.sparring||e.ai==='explode'||(e.boss&&e.final)||typeof document==='undefined')return;
  const p=this.p;if(Math.hypot(e.x-p.x,e.y-p.y)>this.viewR*1.2)return;           /* off screen: nobody sees it */
  const a=this.corpses||(this.corpses=[]),nb=a.reduce((s,c)=>s+(c.boss?1:0),0);
  if(e.boss?nb>=CORPSE_MAXB:a.length-nb>=CORPSE_MAX)return;
  let vx=clamp((e.kx||0)*.35,-90,90),vy=clamp((e.ky||0)*.35,-60,60);
  if(!e.boss){const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy)||1,v=Math.hypot(vx,vy);   /* always thrown back: at least CORPSE_PUSH, away from the hero when the blow gave no direction */
    if(v<CORPSE_PUSH){if(v>8){vx*=CORPSE_PUSH/v;vy*=CORPSE_PUSH/v;}else{vx=dx/d*CORPSE_PUSH;vy=dy/d*CORPSE_PUSH*.6;}}}
  a.push({e,boss:!!e.boss,t:0,dur:e.boss?CORPSE_TB:CORPSE_T,x:e.x,y:e.y,vx,vy,dir:vx>=0?1:-1,land:false,ox:(Math.random()*96)|0,oy:(Math.random()*96)|0,
    acc:0,n:e.boss?28:Math.round(5+e.r*.45),col:this.corpseColor(e),cv:null});
};
Game.prototype.updateCorpses=function(dt){
  const a=this.corpses;if(!a||!a.length)return;
  for(const c of a){
    c.t+=dt;c.x+=c.vx*dt;c.y+=c.vy*dt;const dm=Math.exp(-(c.boss?7:4.5)*dt);c.vx*=dm;c.vy*=dm;
    if(!c.boss){if(c.t<c.dur*CORPSE_FALL)continue;                                 /* regular enemies: thrown back and falling first; dust where they land, then the dissolve */
      if(!c.land){c.land=true;c.vx*=.25;c.vy*=.25;for(let i=0;i<5&&this.fx.length<420;i++)this.fx.push({x:c.x+rnd(-c.e.r,c.e.r),y:c.y+rnd(-2,3),vx:rnd(-70,70),vy:-rnd(10,60),l:rnd(.25,.45),m:.45,c:'#e8dcc0',s:rnd(2,4)});}}
    c.acc+=dt/c.dur*c.n*(c.boss?1:1/(1-CORPSE_FALL));                             /* motes rise all along the dissolve */
    while(c.acc>=1){c.acc-=1;if(this.fx.length>=420)continue;const r=c.e.r;
      this.fx.push({x:c.x+rnd(-r,r)*1.1,y:c.y-rnd(0,r*(c.boss?2.4:.9)),vx:rnd(-22,22),vy:-rnd(110,240),l:rnd(.3,.65),m:.65,c:Math.random()<.45?'#ffffff':c.col,s:c.boss?rnd(3,6):rnd(2,4)});}
  }
  this.corpses=a.filter(c=>{if(c.t>=c.dur){CorpsePool.put(c.cv);return false;}return true;});
};
/* boss shock wave: three rings of light (colour of the boss, white, gold), a ring on the ground, a white flash (not for the final boss: its victory sequence does that) and a strong shake */
Game.prototype.bossShock=function(e){
  const x=e.x,y=e.y-e.r*.5,c=(e.bd&&e.bd.c)||'#ffffff',R=Math.max(420,e.r*10);
  this.fx.push({shock:true,x,y,max:R,l:1.3,m:1.3,c});
  this.fx.push({shock:true,x,y,max:R*.66,l:.95,m:.95,c:'#ffffff'});
  if(!FXL.on)this.fx.push({shock:true,x,y,max:R*1.3,l:1.7,m:1.7,c:'#ffd23f'});
  this.ring(x,y,R*.5,'#ffffff',.55);
  if(!e.final){this.flash=Math.max(this.flash||0,.5);this.flashC='#ffffff';}
  this.shake=Math.max(this.shake,e.final?.7:.95);
};
Renderer.prototype.drawCorpse=function(c,t){
  const ctx=this.ctx,e=c.e,k=Math.min(1,c.t/c.dur);
  if(!c.cv){                                                                      /* first frame: the enemy is drawn once into its own canvas (a few per frame at most) */
    if((this._snapN||0)>=6)return;this._snapN++;Dissolve.build();
    const Z=ctx.getTransform().a,q=Z>=2.2?2:1,S=CorpsePool.size(Math.max(80,e.r*(c.boss?6.2:4.6))),o=CorpsePool.get(S,q),sc=o.a.getContext('2d');
    sc.setTransform(1,0,0,1,0,0);sc.clearRect(0,0,S*q,S*q);sc.setTransform(q,0,0,q,0,0);sc.imageSmoothingEnabled=false;
    const old=this.ctx,fl=e.fl,ag=e.age;this.ctx=sc;e.fl=0;e.age=Math.max(ag||0,1);sc.save();sc.translate(S/2-e.x,S*.74-e.y);this._snap=!c.boss;
    try{this.drawEnemy(e,t);}catch(err){}
    this._snap=false;sc.restore();this.ctx=old;e.fl=fl;e.age=ag;c.cv=o;
  }
  const o=c.cv,S=o.S,q=o.q,wk=o.b.getContext('2d');
  wk.setTransform(1,0,0,1,0,0);wk.globalCompositeOperation='source-over';wk.clearRect(0,0,S*q,S*q);wk.drawImage(o.a,0,0);
  const cov=c.boss?clamp((k-.1)/.9,0,1):clamp((k-CORPSE_FALL)/(1-CORPSE_FALL),0,1),l=Math.min(Dissolve.N-1,Math.floor(Math.pow(cov,1.1)*Dissolve.N));
  wk.setTransform(q,0,0,q,-c.ox*q,-c.oy*q);                                      /* the pattern starts at a random point of its tile: no two bodies dissolve alike */
  if(c.boss||cov>0){   /* (a regular enemy is whole while it falls) */
  wk.globalCompositeOperation='destination-out';wk.fillStyle=Dissolve.mask[l];wk.fillRect(c.ox,c.oy,S,S);
  wk.globalCompositeOperation='source-atop';wk.fillStyle=Dissolve.edge[l];wk.fillRect(c.ox,c.oy,S,S);}   /* the front of the dissolve burns white */
  if(k<.16){wk.setTransform(1,0,0,1,0,0);wk.globalCompositeOperation='source-atop';wk.fillStyle='rgba(255,255,255,'+(.95*(1-k/.16))+')';wk.fillRect(0,0,S*q,S*q);}   /* hit flash: a white silhouette */
  wk.globalCompositeOperation='source-over';
  if(!c.boss){   /* thrown back by the blow: a hop, falling on its back (a quarter turn, squashed by the hit and again on landing), then it dissolves where it lies */
    const kf=Math.min(1,k/CORPSE_FALL),ef=1-Math.pow(1-kf,2),hop=-Math.sin(Math.PI*kf)*(12+e.r*.7),rot=c.dir*ef*1.5,
      sq=k<.12?1+.2*(1-k/.12):kf>=1&&k<CORPSE_FALL+.1?1+.14*(1-(k-CORPSE_FALL)/.1):1,hb=e.r*CORPSE_HB,py=hb*(1-ef)+e.r*.8*ef;   /* hb: from the feet to the middle of the body; lying down, the middle is a body's half thickness above the ground */
    ctx.fillStyle='rgba(0,0,0,'+(.26*(1-cov))+')';ctx.beginPath();ctx.ellipse(c.x,c.y,e.r*(.95+.5*ef),e.r*.32,0,0,TAU);ctx.fill();
    ctx.save();ctx.translate(c.x,c.y+hop-py);ctx.rotate(rot);ctx.scale(sq,1/sq);ctx.imageSmoothingEnabled=q>1;
    ctx.drawImage(o.b,-S/2,-(S*.74-hb),S,S);
    ctx.restore();
    if(k<.3)GLOW.at(ctx,c.x,c.y-py+hop,e.r*(2+k*5),'#ffffff',.55*(1-k/.3));
    return;}
  const e1=1-Math.pow(1-k,2.2),lift=-(c.boss?34:24)*e1,sx=1+.07*e1;
  ctx.save();ctx.translate(c.x,c.y+lift);ctx.scale(sx,sx);ctx.imageSmoothingEnabled=q>1;
  ctx.drawImage(o.b,-S/2,-S*.74,S,S);
  ctx.restore();
  if(k<.3)GLOW.at(ctx,c.x,c.y-e.r+lift,e.r*(2+k*5),'#ffffff',.55*(1-k/.3));
};
