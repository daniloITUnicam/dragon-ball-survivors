'use strict';
/* ====== v135: map objects ======
   Breakables: bushes, crates, barrels, cracked rocks... (which ones depends on the planet) scattered around the hero; any attack breaks them and
   they drop a little zenny or experience, sometimes health or a power-up, very rarely a capsule or a ticket. They live in g.en as enemies
   flagged .prop, so every weapon hits them through the usual enemy loops; they never move or hurt, never count as kills, and the aim only
   falls on them when no real enemy is in range (Game.nearest).
   Activities: one every ACT_EVERY s, at most ACT_MAX at once, each announced and shown by an arrow: a Capsule Corp supply drop, a Saibaman
   nest, the golden Nimbus, a Senzu plant, a gravity room, a lost scouter that finds a buried treasure.
   Art: assets/sprites/mappa/<id>.png, one row of equally wide frames (sprites.json "cols"), the object standing on the bottom of its frame.
   Any resolution: the opaque part of frame 0 is drawn MO_H world px tall and every frame of the sheet uses the same scale and foot line.
   brk<kind>.png: intact | damaged | debris. The act*.png frames are listed in MO_H. */
const BRK_N=9,BRK_EVERY=1,BRK_FAR=2300,BRK_IN=.45,BRK_FX=2.6,BRK_AIM=420;
const ACT_FIRST=40,ACT_EVERY=[50,80],ACT_MAX=2,DROP_FALL=2.2,NEST_T=20,NIMBUS_T=12,NIMBUS_IN=1.6,GRAV_T=25,GRAV_IN=1.5,GRAV_POP=.7,DIG_T=2.5,SENZU_N=3;
/* h: world height of the intact object, r: footprint radius, hp: health (x the run's enemy health curve), c: splinter colour, s: sound, keep: never despawned by distance */
const BRK={
  bush:{h:46,r:15,hp:7,c:'#5fb04a',s:'pop'},
  crate:{h:44,r:16,hp:12,c:'#d8dee8',s:'pop'},
  barrel:{h:46,r:14,hp:10,c:'#c8402a',s:'pop'},
  rock:{h:40,r:17,hp:18,c:'#9a948a',s:'pop'},
  amphora:{h:44,r:12,hp:6,c:'#d07a3a',s:'pop'},
  crystal:{h:52,r:14,hp:14,c:'#7ad8ff',s:'crystal'},
  scrap:{h:40,r:17,hp:14,c:'#a8b0b8',s:'pop'},
  tomb:{h:50,r:15,hp:16,c:'#8a8a96',s:'pop'},
  lantern:{h:56,r:12,hp:10,c:'#c8c0a8',s:'pop'},
  pod:{h:38,r:14,hp:14,c:'#8be04a',s:'pop',keep:1},
  supply:{h:62,r:24,hp:70,c:'#e8eef8',s:'boom',keep:1}
};
const BRK_THEME={plains:['bush','bush','rock','crate'],beach:['amphora','barrel','bush','crate'],namek:['crystal','crystal','bush','crate'],waste:['scrap','barrel','rock','crate'],
  redrock:['rock','rock','barrel','crate'],arena:['crate','barrel','scrap'],sky:['amphora','lantern','bush'],hell:['tomb','lantern','rock'],snake:['lantern','amphora','crate'],
  void:['crate','crystal'],other:['crystal','amphora','crate']};
const ACT_C={drop:'#59c8ff',nest:'#8be04a',nimbus:'#ffd23f',senzu:'#8be07a',gravity:'#ff6a5a',scouter:'#5aff8a'};
const ACT_ICON={drop:'brksupply',nest:'brkpod',nimbus:'actnimbus',senzu:'actsenzu',gravity:'actgravity',scouter:'actscouter'};
/* world height of the activity art (the opaque part of frame 0) */
const MO_H={actchute:64,actnest:30,actnimbus:30,actsenzu:50,actgravity:58,actscouter:16,actdig:22};

const MOBJ={
  def(k){const D=this._d||(this._d={});return D[k]||(D[k]={id:'brk_'+k,prop:k,n:T('Oggetto','Object'),hp:BRK[k].hp,r:BRK[k].r,spd:0,dmg:0,xp:0,ai:'prop',sp:null});},
  defOf(id){const k=typeof id==='string'&&id.slice(0,4)==='brk_'?id.slice(4):null;return k&&BRK[k]?this.def(k):null;},
  init(g){g.mo={bt:.2,n:0,seeded:false,acts:[],at:ACT_FIRST,last:null,fx:[],sfxT:0};},
  ok(g){return !g.trial&&!g.tun&&!g.dying&&!g.ended&&!g.summon&&!g.vic&&!g.coopView;},
  say(g,a,b,col,c,d){g.say(g.env.tr(T(a,b)),col,2.6,c?g.env.tr(T(c,d)):undefined);},
  mk(g,k,x,y,grow){
    const e=g.mkEnemy0(this.def(k),x,y);e.hp=e.max=BRK[k].hp*g.hpMul();e.armor=0;e.dmg=0;e.dx=x;e.dy=y;e.age=grow?0:BRK_IN;e.face=Math.random()<.5?-1:1;
    g.en.push(e);return e;},
  xpu(g){return XP_MUL*g.stageXp()/ENEMY_N_K*g.earlyXp();},

  /* ---------- breakables ---------- */
  propTick(g,e,dt){e.age+=dt;if(e.sq>0)e.sq=Math.max(0,e.sq-dt);e.x=e.dx;e.y=e.dy;e.kx=0;e.ky=0;},
  hit(g,e,d){
    if(e.dead)return;e.hp-=d;e.fl=.08;e.sq=.3;
    if(e.hp<=0){g.killEnemy(e);return;}
    const M=g.mo;if(M&&g.rt>=M.sfxT){M.sfxT=g.rt+.09;g.audio.sfx('hit');}},
  brk(g,e){
    e.dead=true;const k=e.prop,B=BRK[k];this.debris(g,e);
    g.burst(e.x,e.y-B.h*.4,k==='supply'?30:12,B.c);g.audio.sfx(B.s);
    if(k==='supply'){g.shake=Math.max(g.shake,.25);g.ring(e.x,e.y,90,ACT_C.drop,.5);}
    this.drops(g,e);},
  debris(g,e){if(!g.mo)this.init(g);g.mo.fx.push({k:e.prop,x:e.x,y:e.y,f:e.face||1,w0:performance.now()});},
  drops(g,e){
    const k=e.prop,x=e.x,y=e.y,L=g.S.luck||0,xu=this.xpu(g),sp=a=>[x+rnd(-a,a),y+rnd(-a*.6,a*.6)];
    if(k==='pod'){g.dropGem(x,y,3*xu);return;}
    if(k==='supply'){
      for(let i=0;i<5;i++)g.spawnLoot('coin',...sp(44));
      g.spawnLoot('bag',...sp(30));
      {const q=g.pickLoot();if(q)g.spawnLoot(q,...sp(34));}
      if(Math.random()<.3+L)g.spawnLoot('capsule',...sp(30));
      if(Math.random()<.12+L*.3)g.addTicket('t1',1,e);
      for(let i=0;i<4;i++)g.dropGem(...sp(50),5*xu);
      return;}
    const r=Math.random(),hr=g.p.hp/g.p.maxHp;
    if(r<.46){g.spawnLoot('coin',...sp(6));if(Math.random()<.25)g.spawnLoot('coin',...sp(14));}
    else if(r<.8)g.dropGem(x,y,4*xu);
    else if(r<.9){if(hr<.85&&!(g.lootCd.heal>0))g.spawnLoot('heal',x,y);else g.dropGem(x,y,4*xu);}
    else if(r<.95+.03*L){const q=g.pickLoot();g.spawnLoot(q||'coin',x,y);}
    else g.spawnLoot('coin',x,y);
    if(Math.random()<.004*(1+2*L))g.spawnLoot('capsule',...sp(10));
    if(Math.random()<.003*(1+2*L))g.addTicket('t1',1,e);
  },

  tick(g,dt){
    const M=g.mo;if(!M||!this.ok(g))return;
    this.tickBrk(g,dt);
    M.at-=dt;if(M.at<=0){M.at=rnd(ACT_EVERY[0],ACT_EVERY[1]);if(M.acts.length<ACT_MAX)this.spawnAct(g);}
    for(const a of M.acts){a.t+=dt;this['t_'+a.k](g,a,dt);}
    if(M.acts.some(a=>a.dead))M.acts=M.acts.filter(a=>!a.dead);
  },
  tickBrk(g,dt){
    const M=g.mo,p=g.p,far=BRK_FAR*BRK_FAR;M.bt-=dt;
    let n=0,all=0;
    for(const e of g.en){if(!e.prop||e.dead)continue;all++;if(BRK[e.prop].keep)continue;
      const dx=e.x-p.x,dy=e.y-p.y;if(M.bt<=0&&dx*dx+dy*dy>far){e.dead=true;all--;continue;}n++;}
    M.n=all;
    if(M.bt>0)return;M.bt=BRK_EVERY;
    const L=BRK_THEME[g.stage.theme]||BRK_THEME.plains;
    if(!M.seeded){M.seeded=true;   /* the first screen already has a few, popping out of the ground */
      for(let i=0;i<6;i++){const s=MAPX.spot(g,170,640,30);if(Math.hypot(s.x-p.x,s.y-p.y)>120&&!this.crowded(g,s))this.mk(g,pick(L),s.x,s.y,true);}return;}
    if(n<BRK_N){const s=MAPX.spot(g,g.viewR+60,g.viewR+560,30);if(Math.hypot(s.x-p.x,s.y-p.y)>g.viewR*.8&&!this.crowded(g,s))this.mk(g,pick(L),s.x,s.y,false);}
  },
  crowded(g,s){for(const e of g.en)if(e.prop&&!e.dead&&Math.abs(e.x-s.x)<70&&Math.abs(e.y-s.y)<60)return true;return false;},

  /* ---------- activities ---------- */
  spawnAct(g){
    const M=g.mo,hr=g.p.hp/g.p.maxHp,t=g.t;
    const c=[['drop',3],['nest',t>=90?3:0],['nimbus',2.2],['senzu',hr<.6?5:1.6],['gravity',t>=60?2.4:0],['scouter',t>=100?2:0]]
      .filter(x=>x[1]>0&&x[0]!==M.last&&!M.acts.some(a=>a.k===x[0]));
    if(!c.length)return;
    const k=wpick(c,x=>x[1])[0],a=this['s_'+k](g);if(!a)return;
    M.last=k;a.k=k;a.t=0;M.acts.push(a);g.audio.sfx('shrine');
  },
  /* Capsule Corp supply drop: a crate under a parachute; once landed it is a big breakable full of loot (it waits 90 s) */
  s_drop(g){const s=MAPX.spot(g,220,380,44);
    this.say(g,'Rifornimenti Capsule Corp!','Capsule Corp supply drop!',ACT_C.drop,"Distruggi la cassa: dentro c'è un bottino",'Break the crate open: there is loot inside');
    return{x:s.x,y:s.y,e:null,land:0};},
  t_drop(g,a){
    if(!a.e&&a.t>=DROP_FALL){a.e=this.mk(g,'supply',a.x,a.y,false);a.land=a.t;g.ring(a.x,a.y,80,'#e8dcc0',.45);g.burst(a.x,a.y-6,16,'#e8dcc0');g.shake=Math.max(g.shake,.18);g.audio.sfx('boom');}
    if(!a.e)return;
    if(!a.done&&a.e.dead)a.done=true;
    if(!a.done&&a.t-a.land>90){a.e.dead=true;this.debris(g,a.e);a.done=true;}
    if(a.done&&a.t-a.land>1.6)a.dead=true;},
  /* Saibaman nest: four pods; break them all within NEST_T s for a prize, or each one left hatches two Saibamen */
  s_nest(g){const s=MAPX.spot(g,240,400,70),a0=rnd(0,TAU),pods=[];
    for(let i=0;i<4;i++){const an=a0+i*TAU/4+rnd(-.3,.3),d=rnd(30,42);pods.push(this.mk(g,'pod',s.x+Math.cos(an)*d,s.y+Math.sin(an)*d*.6,true));}
    this.say(g,'Nido di Saibaman!','Saibaman nest!',ACT_C.nest,'Distruggi i baccelli prima che si schiudano ('+NEST_T+' s)','Break the pods before they hatch ('+NEST_T+' s)');
    return{x:s.x,y:s.y,pods};},
  t_nest(g,a){
    if(a.done){if(a.t-a.t1>1.2)a.dead=true;return;}
    const live=a.pods.filter(e=>!e.dead);
    for(const e of live)e.st=a.t>NEST_T-5?1:0;   /* the last 5 s the pods shiver */
    if(!live.length){
      const xu=this.xpu(g),z=Math.round(g.bagValue()*.35);
      for(let i=0;i<6;i++)g.dropGem(a.x+rnd(-40,40),a.y+rnd(-30,30),6*xu);
      g.addZenny(z);g.floatText(a.x,a.y-40,'+Z '+z,1);g.audio.sfx('coin');g.ring(a.x,a.y,120,ACT_C.nest,.6);
      this.say(g,'Nido distrutto!','Nest destroyed!',ACT_C.nest);a.done=true;a.win=1;a.t1=a.t;return;}
    if(a.t>=NEST_T){const d=ENEMIES.sai;
      for(const e of live){e.dead=true;this.debris(g,e);g.burst(e.x,e.y-14,14,ACT_C.nest);
        if(d)for(let i=0;i<2;i++)g.en.push(g.mkEnemy(d,e.x+rnd(-10,10),e.y+rnd(-8,8)));}
      g.audio.sfx('pop');this.say(g,'I Saibaman si sono schiusi!','The Saibamen have hatched!','#ff8a5a');a.done=true;a.t1=a.t;}
  },
  /* the golden Nimbus flies in and waits; step on it: NIMBUS_T s faster and with a wider pickup */
  s_nimbus(g){const s=MAPX.spot(g,200,340,30),sd=Math.random()<.5?-1:1;
    this.say(g,"La Nuvola d'oro!",'The golden Nimbus!',ACT_C.nimbus,'Salici sopra: +40% velocità per '+NIMBUS_T+' s','Hop on: +40% speed for '+NIMBUS_T+' s');
    return{x:s.x,y:s.y,fx:s.x+sd*700,fy:s.y-260,sd,st:'in',t1:0};},
  t_nimbus(g,a,dt){const p=g.p;
    if(a.st==='in'&&a.t>=NIMBUS_IN){a.st='idle';a.t1=a.t;}
    if(a.st==='idle'){
      if(Math.hypot(p.x-a.x,p.y-a.y)<44){a.st='ride';a.t1=a.t;a.done=true;g.tempBuffs.push({k:'spd',v:.4,t:NIMBUS_T},{k:'magnet',v:.6,t:NIMBUS_T});g.recalc();
        g.audio.sfx('pkhaste');g.ring(p.x,p.y,90,ACT_C.nimbus,.5);this.say(g,"In sella alla Nuvola d'oro!",'Riding the golden Nimbus!',ACT_C.nimbus,'+40% velocità, raccolta più ampia','+40% speed, wider pickup');}
      else if(a.t-a.t1>45){a.st='out';a.t1=a.t;a.done=true;}}
    if(a.st==='ride'){a.x=p.x;a.y=p.y;
      if(a.t-a.t1>=NIMBUS_T){a.st='out';a.t1=a.t;a.sd=(g.input.x||0)<0?-1:1;}
      else if(Math.random()<dt*16)g.fx.push({x:p.x+rnd(-14,14),y:p.y+2,vx:rnd(-30,30)-(g.input.x||0)*80,vy:rnd(-14,4)-(g.input.y||0)*40,l:.5,m:.5,c:'#ffe58a',s:rnd(3,6)});}
    if(a.st==='out'&&a.t-a.t1>1.3)a.dead=true;},
  /* a Senzu plant with SENZU_N beans: one bean every second while you stand by it hurt (25% of your health each) */
  s_senzu(g){const s=MAPX.spot(g,180,320,36);
    this.say(g,'Pianta di Senzu!','Senzu plant!',ACT_C.senzu,'Avvicinati quando sei ferito: ogni fagiolo cura il 25%','Come close when hurt: each bean heals 25%');
    return{x:s.x,y:s.y,n:SENZU_N,cd:0};},
  t_senzu(g,a,dt){const p=g.p;a.cd-=dt;
    if(a.wt!==undefined){a.wt+=dt;if(a.wt>3.2)a.dead=true;return;}
    if(a.t>120){a.wt=0;a.done=true;return;}
    if(a.t<1||Math.hypot(p.x-a.x,p.y-a.y)>=60){a.told=0;return;}
    if(a.cd>0||a.n<=0)return;
    if(p.hp<p.maxHp*.92){a.n--;a.cd=1;g.heal(p.maxHp*.25);g.audio.sfx('senzu');g.ring(p.x,p.y,50,ACT_C.senzu,.4);
      g.floatText(p.x,p.y-50,g.env.tr(T('Fagiolo di Senzu!','Senzu bean!')),2);g.mo.fx.push({bean:1,x:a.x,y:a.y-28,w0:performance.now()});
      if(!a.n){a.wt=0;a.done=true;}}
    else if(!a.told){a.told=1;g.floatText(a.x,a.y-58,g.env.tr(T('Torna quando sei ferito','Come back when hurt')),5);}
  },
  /* a gravity room pops out of its capsule; stand by it GRAV_IN s: GRAV_T s of 10x gravity, +60% XP and -20% speed */
  s_gravity(g){const s=MAPX.spot(g,200,340,56);
    this.say(g,'Camera Gravitazionale!','Gravity Room!',ACT_C.gravity,'Restaci accanto: gravità ×10 per '+GRAV_T+' s (XP +60%, velocità −20%)','Stand by it: 10x gravity for '+GRAV_T+' s (XP +60%, speed −20%)');
    return{x:s.x,y:s.y,st:'idle',pg:0,t1:0};},
  t_gravity(g,a,dt){const p=g.p;
    if(a.st==='idle'){if(a.t<GRAV_POP)return;
      a.pg=Math.hypot(p.x-a.x,p.y-a.y)<64?a.pg+dt:Math.max(0,a.pg-dt);
      if(a.pg>=GRAV_IN){a.st='on';a.t1=a.t;a.done=true;g.tempBuffs.push({k:'xp',v:.6,t:GRAV_T},{k:'spd',v:-.2,t:GRAV_T});g.recalc();
        g.audio.sfx('transform');g.ring(p.x,p.y,130,ACT_C.gravity,.7);g.flash=Math.max(g.flash||0,.15);g.flashC='#ff8a7a';g.shake=Math.max(g.shake,.2);
        this.say(g,'Gravità ×10!','10x gravity!',ACT_C.gravity,'XP +60%, velocità −20% per '+GRAV_T+' s','XP +60%, speed −20% for '+GRAV_T+' s');}
      else if(a.t>75){a.st='out';a.t1=a.t;a.done=true;}return;}
    if(a.st==='on'){if(a.t-a.t1>=GRAV_T){a.st='out';a.t1=a.t;this.say(g,'Gravità normale','Normal gravity','#ffffff');}return;}
    if(a.t-a.t1>GRAV_POP)a.dead=true;},
  /* a lost scouter: pick it up, it marks a buried treasure 6-9 m away; stand on the spot DIG_T s to dig out a chest */
  s_scouter(g){const s=MAPX.spot(g,200,340,30);
    this.say(g,'Uno scouter perduto!','A lost scouter!',ACT_C.scouter,'Raccoglilo: rileva un tesoro sepolto','Pick it up: it finds a buried treasure');
    return{x:s.x,y:s.y,st:'idle',dp:0,t1:0,dg:null};},
  t_scouter(g,a,dt){const p=g.p;
    if(a.st==='idle'){
      if(a.t>.6&&Math.hypot(p.x-a.x,p.y-a.y)<42){const s=MAPX.spot(g,560,860,40);a.dg={x:s.x,y:s.y};a.st='scan';a.t1=a.t;
        g.audio.sfx('pkluck');g.ring(p.x,p.y,260,ACT_C.scouter,.9);g.ring(p.x,p.y,140,ACT_C.scouter,.6);
        this.say(g,'Tesoro rilevato!','Treasure detected!',ACT_C.scouter,'Scava nel punto indicato dalla freccia','Dig where the arrow points');}
      else if(a.t>60){a.dead=true;a.done=true;}return;}
    if(a.st==='scan'){
      a.dp=Math.hypot(p.x-a.dg.x,p.y-a.dg.y)<46?a.dp+dt:Math.max(0,a.dp-dt*.5);
      if(a.dp>=DIG_T){a.st='dug';a.t1=a.t;a.done=true;
        g.chests.push({...g.landAt(a.dg.x,a.dg.y,30),final:false,t:0,supply:true,rar:g.rollChestRar()});
        g.burst(a.dg.x,a.dg.y-6,26,'#a0784a');g.ring(a.dg.x,a.dg.y,90,ACT_C.scouter,.5);g.shake=Math.max(g.shake,.15);g.audio.sfx('boom');
        this.say(g,'Tesoro dissotterrato!','Treasure dug up!',ACT_C.scouter);}
      else if(a.t-a.t1>150){a.dead=true;a.done=true;}return;}
    if(a.t-a.t1>3)a.dead=true;},

  /* off-screen arrows (Renderer HUD) */
  targets(g,out){const M=g.mo;if(!M||g.trial||g.tun)return;
    for(const a of M.acts){if(a.done)continue;
      if(a.k==='scouter'&&a.st==='scan')out.push([a.dg.x,a.dg.y,ACT_C.scouter,{k:'mo',id:'actdig',f:0}]);
      else out.push([a.x,a.y,ACT_C[a.k],{k:'mo',id:ACT_ICON[a.k],f:0}]);}},

  /* ---------- drawing ---------- */
  /* the opaque rows of frame 0 (top, bottom): the scale and the foot line of the whole sheet */
  box(S){
    if(S.mob)return S.mob;
    let top=0,bot=S.fh-1;
    try{const c=document.createElement('canvas');c.width=S.fw;c.height=S.fh;const x=c.getContext('2d');x.drawImage(S.img,0,0,S.fw,S.fh,0,0,S.fw,S.fh);
      const d=x.getImageData(0,0,S.fw,S.fh).data,row=j=>{for(let i=0;i<S.fw;i++)if(d[(j*S.fw+i)*4+3]>40)return true;return false;};
      while(bot>0&&!row(bot))bot--;while(top<bot&&!row(top))top++;}catch(e){}
    return S.mob={top,bot};},
  /* frame f of sheet id standing on (x,y), the opaque part of frame 0 h world px tall; false when the sheet is not loaded */
  img(ctx,id,f,x,y,h){
    const S=Sprites.sheets[id];if(!S)return false;
    const b=this.box(S),k=h/(b.bot-b.top+1),fi=Math.max(0,Math.min(S.cols-1,f|0));
    ctx.imageSmoothingEnabled=k<1;ctx.drawImage(S.img,fi*S.fw,0,S.fw,S.fh,x-S.fw*k/2,y-(b.bot+1)*k,S.fw*k,S.fh*k);ctx.imageSmoothingEnabled=false;
    return true;},
  /* beacon miniature: frame f of a sheet, cropped to its opaque box */
  icon(id,f){
    const S=Sprites.sheets[id];if(!S)return null;const C=this._ic||(this._ic={}),key=id+':'+f;if(C[key])return C[key];
    const b=this.box(S),h=b.bot-b.top+1,c=document.createElement('canvas');c.width=S.fw;c.height=h;
    c.getContext('2d').drawImage(S.img,(f|0)*S.fw,b.top,S.fw,h,0,0,S.fw,h);return C[key]=c;},
  blob(ctx,x,y,h,col){ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y-h*.42,h*.36,h*.42,0,0,TAU);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=2;ctx.stroke();},
  shadow(ctx,x,y,rx,a){ctx.fillStyle='rgba(0,0,0,'+(a||.25)+')';ctx.beginPath();ctx.ellipse(x,y,rx,rx*.36,0,0,TAU);ctx.fill();},
  /* capsule smoke: puffs swelling and fading (q 0..1) */
  puff(ctx,x,y,q,R){
    for(let i=0;i<8;i++){const a=i*TAU/8+.4,d=R*(.25+.75*q)*(.6+.4*((i*.37)%1)),r=R*(.35+.45*q)*(.7+.3*((i*.61)%1));
      ctx.fillStyle='rgba(245,245,250,'+(.85*(1-q)).toFixed(3)+')';ctx.beginPath();ctx.arc(x+Math.cos(a)*d,y-R*.5+Math.sin(a)*d*.6,r,0,TAU);ctx.fill();}},
  arc(ctx,x,y,rx,q,col,w){
    ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=(w||4)+3;ctx.beginPath();ctx.ellipse(x,y,rx,rx*.42,0,0,TAU);ctx.stroke();
    ctx.strokeStyle=col;ctx.lineWidth=w||4;ctx.beginPath();ctx.ellipse(x,y,rx,rx*.42,0,-Math.PI/2,-Math.PI/2+TAU*clamp(q,0,1));ctx.stroke();},

  drawProp(R,e,t){
    const ctx=R.ctx,k=e.prop,B=BRK[k];if(!B)return;
    const q=e.hp/(e.max||1),f=q>.5?0:1,g0=Math.min(1,(e.age||0)/BRK_IN),gs=g0>=1?1:Math.max(0,easeOutBack(g0)),sq=e.sq>0?e.sq:0;
    this.shadow(ctx,e.x,e.y,B.r*1.15*Math.min(1,gs));
    if(k==='pod'&&e.st)GLOW.at(ctx,e.x,e.y-B.h*.4,B.h*.9,ACT_C.nest,.25+.2*Math.sin(t*10+e.ph));
    let rot=sq?Math.sin(sq*46)*sq*.5:0;if(e.st)rot+=Math.sin(t*38+e.ph)*.07;   /* hit wobble; a pod about to hatch shivers */
    ctx.save();ctx.translate(e.x,e.y);ctx.rotate(rot);ctx.scale((e.face||1)*(1+sq*.25),gs*(1-sq*.2));
    const id='brk'+k;
    if(!this.img(ctx,id,f,0,0,B.h))this.blob(ctx,0,0,B.h*(f?.8:1),B.c);
    else if(e.fl>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.6;this.img(ctx,id,f,0,0,B.h);}
    ctx.restore();
  },
  drawGround(R,g,t){
    const M=g.mo;if(!M)return;const ctx=R.ctx,now=performance.now();
    if(M.fx.length){let w=0;
      for(const f of M.fx){const age=(now-f.w0)/1000;if(f.bean?age>.45:age>BRK_FX)continue;M.fx[w++]=f;if(f.bean)continue;
        const B=BRK[f.k]||BRK.crate;ctx.save();ctx.globalAlpha=age<1.6?1:Math.max(0,1-(age-1.6)/(BRK_FX-1.6));ctx.translate(f.x,f.y);ctx.scale(f.f,1);
        if(!this.img(ctx,'brk'+f.k,2,0,0,B.h)){ctx.fillStyle=B.c;for(let i=0;i<5;i++)ctx.fillRect(-12+i*6,-3-(i%2)*3,4,3);}
        ctx.restore();}
      M.fx.length=w;}
    for(const a of M.acts){
      const x=a.x,y=a.y;
      if(a.k==='drop'){
        if(!a.e){const q=clamp(a.t/DROP_FALL,0,1);this.shadow(ctx,x,y,10+22*q,.12+.2*q);}
        else{const q=clamp((a.t-a.land)/1.6,0,1);if(q<1){ctx.save();ctx.globalAlpha=1-q;if(!this.img(ctx,'actchute',1,x+30,y+4,20)){ctx.fillStyle='#f0f0f0';ctx.fillRect(x+14,y-6,34,10);}ctx.restore();}}}
      else if(a.k==='nest'){
        ctx.save();ctx.globalAlpha=a.done?Math.max(0,1-(a.t-a.t1)/1.2):1;
        if(!this.img(ctx,'actnest',0,x,y+16,MO_H.actnest)){ctx.fillStyle='rgba(60,40,24,.75)';ctx.beginPath();ctx.ellipse(x,y+4,68,26,0,0,TAU);ctx.fill();}
        ctx.restore();
        if(!a.done){const q=1-a.t/NEST_T,col=q>.5?ACT_C.nest:q>.25?'#ffd23f':'#ff5a3d';this.arc(ctx,x,y+4,78,q,col,4);
          ctx.font='700 16px "Rajdhani",sans-serif';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#0a0f1c';const s=Math.ceil(NEST_T-a.t)+'s';ctx.strokeText(s,x,y-48);ctx.fillStyle=col;ctx.fillText(s,x,y-48);}}
      else if(a.k==='nimbus'){
        if(a.st==='idle'){const bob=Math.sin(t*2.2)*3;this.shadow(ctx,x,y,24,.18);GLOW.at(ctx,x,y-14+bob,46,'#ffd23f',.35+.1*Math.sin(t*4));
          if(!this.img(ctx,'actnimbus',((t*6)|0)%4,x,y-8+bob,MO_H.actnimbus))this.blob(ctx,x,y-8+bob,26,'#ffe066');
          if(Ambient.on&&Math.random()<.2)g.fx.push({x:x+rnd(-22,22),y:y-16+rnd(-8,8),vx:0,vy:-20,l:.5,m:.5,c:'#fff3b0',s:2});}
        else if(a.st==='ride'){const k=1-Math.max(0,(a.t-a.t1)-(NIMBUS_T-1));GLOW.at(ctx,x,y-4,40,'#ffd23f',.3);ctx.save();ctx.globalAlpha=clamp(k,0,1);
          if(!this.img(ctx,'actnimbus',((t*8)|0)%4,x,y+8,MO_H.actnimbus*.9))this.blob(ctx,x,y+8,22,'#ffe066');ctx.restore();}}
      else if(a.k==='senzu'){
        const gq=clamp(a.t/.9,0,1),sc=gq>=1?1:Math.max(0,easeOutBack(gq)),al=a.wt!==undefined?clamp(1-(a.wt-2.4)/.8,0,1):1;
        if(gq<1&&Ambient.on&&Math.random()<.4)g.fx.push({x:x+rnd(-14,14),y:y-rnd(0,30),vx:rnd(-40,40),vy:-rnd(30,80),l:.5,m:.5,c:'#8be07a',s:3});
        ctx.save();ctx.globalAlpha=al;this.shadow(ctx,x,y,18*sc);
        if(a.n>0&&g.p.hp<g.p.maxHp*.92)GLOW.at(ctx,x,y-24,44,ACT_C.senzu,.25+.12*Math.sin(t*5));
        ctx.translate(x,y);ctx.scale(1,sc);if(!this.img(ctx,'actsenzu',SENZU_N-a.n,0,0,MO_H.actsenzu))this.blob(ctx,0,0,40,'#5fb04a');ctx.restore();}
      else if(a.k==='gravity'){
        const pop=a.st==='out'?1-clamp((a.t-a.t1)/GRAV_POP,0,1):clamp((a.t-GRAV_POP*.4)/(GRAV_POP*.4),0,1);
        if(pop>0){ctx.save();ctx.globalAlpha=pop;this.shadow(ctx,x,y,30);
          if(a.st==='on')GLOW.at(ctx,x,y-26,70,ACT_C.gravity,.3+.15*Math.sin(t*6));
          ctx.translate(x,y);ctx.scale(.6+.4*pop,.6+.4*pop);if(!this.img(ctx,'actgravity',a.st==='on'?1:0,0,0,MO_H.actgravity))this.blob(ctx,0,0,50,'#e8eef8');ctx.restore();}
        const pq=a.st==='out'?(a.t-a.t1)/GRAV_POP:a.t/GRAV_POP;if(pq<1)this.puff(ctx,x,y,clamp(pq,0,1),40);   /* capsule smoke */
        if(a.st==='idle'&&a.pg>0)this.arc(ctx,x,y+2,58,a.pg/GRAV_IN,ACT_C.gravity,4);
        if(a.st==='on'){const p=g.p;   /* the pressure on the hero: red rings closing in */
          for(let i=0;i<3;i++){const k=(t*1.2+i/3)%1;ctx.strokeStyle=hexA(ACT_C.gravity,(.5*k).toFixed(3));ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,24+46*(1-k),(24+46*(1-k))*.4,0,0,TAU);ctx.stroke();}}}
      else if(a.k==='scouter'){
        if(a.st==='idle'){this.shadow(ctx,x,y,12,.2);if(!this.img(ctx,'actscouter',((t*3)|0)%2,x,y,MO_H.actscouter))this.blob(ctx,x,y,12,'#5aff8a');
          const k=(t*.9)%1;ctx.strokeStyle=hexA(ACT_C.scouter,(.7*(1-k)).toFixed(3));ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,10+40*k,(10+40*k)*.42,0,0,TAU);ctx.stroke();}
        else if(a.dg){const d=a.dg;
          ctx.save();if(a.st==='dug')ctx.globalAlpha=clamp(1-(a.t-a.t1-2)/1,0,1);
          if(!this.img(ctx,'actdig',a.st==='dug'?1:0,d.x,d.y+6,MO_H.actdig)){ctx.fillStyle='#7a5a3a';ctx.beginPath();ctx.ellipse(d.x,d.y,22,9,0,0,TAU);ctx.fill();}
          ctx.restore();
          if(a.st==='scan'){GLOW.at(ctx,d.x,d.y-6,40,ACT_C.scouter,.25+.15*Math.sin(t*6));if(a.dp>0)this.arc(ctx,d.x,d.y+2,40,a.dp/DIG_T,ACT_C.scouter,4);
            if(a.dp>0&&Ambient.on&&Math.random()<.5)g.fx.push({x:d.x+rnd(-14,14),y:d.y-2,vx:rnd(-90,90),vy:-rnd(60,160),l:.4,m:.4,c:'#a0784a',s:3});}}}
    }
  },
  /* what is in the air: the falling crate under its parachute, the Nimbus flying in and away, the Senzu beans going to the hero */
  drawAir(R,g,t){
    const M=g.mo;if(!M)return;const ctx=R.ctx,now=performance.now(),p=g.p;
    for(const a of M.acts){
      if(a.k==='drop'&&!a.e){const q=clamp(a.t/DROP_FALL,0,1),e=q<.85?q/.85*.9:.9+(q-.85)/.15*.1,h=BRK.supply.h,y=a.y-380*(1-e),sw=Math.sin(a.t*2.6)*.14*(1-q);
        ctx.save();ctx.translate(a.x,y);ctx.rotate(sw);
        if(!this.img(ctx,'actchute',0,0,-h+6,MO_H.actchute)){ctx.fillStyle='#f4f4f4';ctx.beginPath();ctx.arc(0,-h-30,40,Math.PI,0);ctx.fill();}
        if(!this.img(ctx,'brksupply',0,0,0,h))this.blob(ctx,0,0,h,BRK.supply.c);
        ctx.restore();}
      else if(a.k==='nimbus'&&(a.st==='in'||a.st==='out')){
        const q=a.st==='in'?clamp(a.t/NIMBUS_IN,0,1):clamp((a.t-a.t1)/1.3,0,1),e=a.st==='in'?1-Math.pow(1-q,3):q*q;
        const x=a.st==='in'?a.fx+(a.x-a.fx)*e:a.x+a.sd*700*e,y=a.st==='in'?a.fy+(a.y-a.fy)*e-8:a.y-8-300*e;
        ctx.save();ctx.globalAlpha=a.st==='out'?1-q:1;GLOW.at(ctx,x,y-6,50,'#ffd23f',.4);
        for(let i=1;i<=4;i++){const k=i*.06,tx=a.st==='in'?a.fx+(a.x-a.fx)*Math.max(0,e-k):a.x+a.sd*700*Math.max(0,e-k),ty=a.st==='in'?a.fy+(a.y-a.fy)*Math.max(0,e-k)-8:a.y-8-300*Math.max(0,e-k);
          ctx.fillStyle=hexA('#ffe58a',(.35*(1-i/5)).toFixed(3));ctx.beginPath();ctx.ellipse(tx,ty-8,18-i*2,7-i,0,0,TAU);ctx.fill();}
        if(!this.img(ctx,'actnimbus',((t*8)|0)%4,x,y,MO_H.actnimbus))this.blob(ctx,x,y,26,'#ffe066');ctx.restore();}
    }
    for(const f of M.fx){if(!f.bean)continue;const u=clamp((now-f.w0)/1000/.42,0,1),x=f.x+(p.x-f.x)*u,y=f.y+(p.y-24-f.y)*u-50*Math.sin(Math.PI*u);
      ctx.fillStyle='#3a8a2a';ctx.beginPath();ctx.ellipse(x,y,4.5,6.5,u*6,0,TAU);ctx.fill();ctx.fillStyle='#9be86a';ctx.beginPath();ctx.ellipse(x-1,y-1.5,2,3,u*6,0,TAU);ctx.fill();}
  }
};
