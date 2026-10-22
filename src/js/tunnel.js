'use strict';
/* ====== Tunnels ======
   The bunker (Planet Vegeta), the demon portal (Hell) and the heavenly gate (Realm of the Gods) are not scenery any more: one entrance appears every TUN_EVERY seconds of play
   (TUN_EVERY_END in Endless) and leads into an underground tunnel, a narrow one-way corridor that only goes up (the floor behind you crumbles away, TUN_BACK px at most).
   Enemies spawn only inside it; at the end is the boss of the map (it drops nothing) and, once it falls, three chests appear on the vertices of a triangle and a hatch leads back.
   The run clock, the director, the map and the world are paused while you are inside (Game.update: "frozen"); everything lying on the map is stashed and put back on the way out.
   Game side: startTunnel / updateTunnel / tunSpawn / tunBoss / tunBossDown / endTunnel (called from MapDirector.use, Game.update and Game.killEnemy).
   Renderer side: tunnelRoom (the tunnel itself), drawTunnelEntrance (the sprite of the entrance on the map), tunnelHud.
   Not touched: the Room of Spirit and Time and Zeno's Shop (trial.js-style rooms in game.js). */
const TUN_EVERY=900,TUN_EVERY_END=600;
const TUN_HW=130,TUN_LEN=4400,TUN_RHW=300,TUN_RH=560,TUN_BACK=240,TUN_CAP=48,TUN_TRI=150;
/* def: index of the entrance sprite in OBSTACLES[theme] (their scenery weight is 0 now) */
const TUNNELS={
  redrock:{n:T('Bunker sotterraneo','Underground bunker'),def:3,gl:'#ffa24a'},
  hell:{n:T('Portale infernale','Infernal portal'),def:9,gl:'#ff5a2a'},
  sky:{n:T('Cancello celeste','Heavenly gate'),def:3,gl:'#9fd8ff'}
};

Object.assign(Game.prototype,{
  startTunnel(f){
    const D=TUNNELS[this.stage.theme];
    if(!D||this.tun||this.trial||this.ended||this.dying||this.modal||this.vic)return false;
    const p=this.p;
    if(this.bossAlive>0||this.xform||this.held){this.floatText(p.x,p.y-60,this.env.tr(T('Non con un boss in giro!','Not with a boss around!')),3);return false;}
    const cx=Math.round(p.x),cy=Math.round(p.y),ry1=cy-TUN_LEN;
    if(this.pet&&this.pet.hold&&this.pet.hold.length)this.petRelease(this.pet);
    this.tun={D,theme:this.stage.theme,cx,cy,t:0,fl:cy+60,ry1,ry0:ry1-TUN_RH,phase:'run',boss:null,sp:0,exit:null,ret:{x:p.x,y:p.y},
      stash:{en:this.en,gm:this.gm,loot:this.loot,chests:this.chests,feat:this.feat,rg:this.rg,corpses:this.corpses}};
    this.en=[];this.gm=[];this.loot=[];this.chests=[];this.feat=[];this.rg=null;this.corpses=[];
    this.eb=[];this.pr=[];this.bz=[];this.jbeams=[];this.rain=[];this.vortex=null;
    p.x=cx;p.y=cy;p.inv=1.5;this.flash=.7;this.flashC=D.gl;this.audio.sfx('transform');this.ring(cx,cy,220,D.gl,.7);
    this.say(this.env.tr(D.n),D.gl,3,this.env.tr(T('Senso unico: si sale. Alla fine c\'è il boss.','One way: upwards. The boss waits at the end.')));
    return true;
  },
  /* a point of the tunnel: the corridor is TUN_HW wide on each side of cx, the boss room (above ry1) TUN_RHW */
  tunClamp(o,r){
    const tn=this.tun;
    if(o.y>tn.ry1&&o.y<tn.ry1+r+50&&Math.abs(o.x-tn.cx)>TUN_HW-r)o.y=tn.ry1;   /* beside the mouth of the corridor: stay in the room */
    const hw=(o.y<=tn.ry1?TUN_RHW:TUN_HW)-r;
    if(o.x<tn.cx-hw)o.x=tn.cx-hw;else if(o.x>tn.cx+hw)o.x=tn.cx+hw;
    if(o.y<tn.ry0+4)o.y=tn.ry0+4;
    if(o.y>tn.fl)o.y=tn.fl;
  },
  updateTunnel(dt){
    const tn=this.tun,p=this.p;tn.t+=dt;this.input.interact=false;
    tn.fl=Math.min(tn.fl,tn.phase==='run'?p.y+TUN_BACK:tn.ry1+16);   /* the floor behind you crumbles: it only ever moves up */
    if(tn.phase==='run'){
      if(p.y<tn.ry1-30)this.tunBoss();
      else{
        tn.sp+=Math.min(7,Math.max(2.2,this.spawnRate()*.45))*dt;
        while(tn.sp>=1){tn.sp-=1;if(this.en.length<TUN_CAP)this.tunSpawn();}
      }
    }
    for(const e of this.en){
      if(e.dead)continue;
      if(!e.boss&&e.y>tn.fl+50){e.dead=true;continue;}   /* left behind: gone, without experience */
      this.tunClamp(e,e.r*.55);
    }
    this.tunClamp(p,9);
    if(tn.phase==='clear'&&tn.exit&&!this.modal&&Math.hypot(p.x-tn.exit.x,p.y-tn.exit.y)<46)this.endTunnel();
  },
  /* regular enemies of the map come from above, just beyond the screen, inside the corridor */
  tunSpawn(){
    const tn=this.tun,def=this.limitShooter(this.rosterPick());if(!def)return;
    const y=this.p.y-(this.vh/2+30+Math.random()*140);if(y<tn.ry1+40)return;
    this.en.push(this.mkEnemy(def,tn.cx+rnd(-TUN_HW+18,TUN_HW-18),y));
  },
  /* the end of the corridor: the door closes behind you and the map's boss comes (one of its regular ones, later in the list the later in the run) */
  tunBoss(){
    const tn=this.tun;tn.phase='boss';tn.fl=tn.ry1+16;
    for(const e of this.en)if(!e.boss&&!e.dead){e.dead=true;this.burst(e.x,e.y-8,3,'#ffffff');}
    const ids=this.bossQ.filter(b=>!b.final&&BOSSES[b.id]).sort((a,b)=>a.t-b.t).map(b=>b.id),all=this.bossQ.filter(b=>BOSSES[b.id]).map(b=>b.id);
    const id=ids.length?ids[Math.min(ids.length-1,Math.floor(Math.max(0,Math.min(.999,this.prog()))*ids.length))]:all[0];
    if(!id){this.tunBossDown(null);return;}
    this.spawnBoss(id,false,{x:tn.cx,y:tn.ry0+TUN_RH*.3,k:1},1);
    const b=this.en[this.en.length-1];b.tun=true;tn.boss=b;
    this.ring(tn.cx,tn.ry1,TUN_HW*1.6,tn.D.gl,.7);this.shake=Math.max(this.shake,.4);
  },
  /* boss down: it dropped nothing, but three chests rise on the vertices of a triangle in the middle of the room and the hatch opens */
  tunBossDown(e){
    const tn=this.tun;if(!tn)return;
    tn.phase='clear';tn.boss=null;this.rain=[];this.eb=[];this.bz=[];this.jbeams=[];
    const cx=tn.cx,cy=(tn.ry0+tn.ry1)/2;
    for(let i=0;i<3;i++){
      const a=-Math.PI/2+i*TAU/3,x=cx+Math.cos(a)*TUN_TRI,y=cy+Math.sin(a)*TUN_TRI;
      this.chests.push({x,y,final:false,t:0,tun:1,rar:this.rollChestRar()});
      this.ring(x,y-10,70,tn.D.gl,.6);this.pillar(x,y,tn.D.gl,.8);
    }
    tn.exit={x:cx,y:tn.ry1-36};
    this.audio.sfx('chest');this.shake=Math.max(this.shake,.3);
    this.say(this.env.tr(T('Tre casse! Poi risali dal portello.','Three chests! Then take the hatch back up.')),tn.D.gl,3.2);
  },
  endTunnel(){
    const tn=this.tun;if(!tn)return;
    const st=tn.stash;
    this.en=st.en;this.gm=st.gm;this.loot=st.loot;this.chests=st.chests;this.feat=st.feat;this.rg=st.rg;this.corpses=st.corpses;
    this.eb=[];this.pr=[];this.bz=[];this.jbeams=[];this.rain=[];
    this.tun=null;this.bossAlive=this.en.filter(e=>e.boss&&!e.dead).length;
    const p=this.p;p.x=tn.ret.x;p.y=tn.ret.y;p.inv=1.5;this.flash=.5;this.flashC='#ffffff';this.ring(p.x,p.y,200,tn.D.gl,.6);this.audio.sfx('transform');
  }
});

/* ---------- drawing ---------- */
const TUNART={
  redrock:{wall:'#2a120c',spk:['#3a1a12','#1e0c08','#4a2418','#34160e'],floor:'#4e464e',trim:'#e0b030',edge:'rgba(10,4,2,.62)',lamp:'#ffb050',face:'#4a2a20'},
  hell:{wall:'#150810',spk:['#25101a','#0e0408','#1e0a14','#2a1220'],floor:'#34121a',trim:'#ff5a1a',edge:'rgba(20,0,0,.6)',lamp:'#ff6a2a',face:'#2a0e16'},
  sky:{wall:'#46548c',spk:['#5a68a0','#3c4880','#6a78b0','#34407a'],floor:'#eef1fb',trim:'#d8b858',edge:'rgba(60,70,120,.45)',lamp:'#bfe6ff',face:'#6a7ab4'}
};
Object.assign(Renderer.prototype,{
  tunTex(th){
    this.tunX=this.tunX||{};if(this.tunX[th])return this.tunX[th];
    const A=TUNART[th],mk=()=>{const c=document.createElement('canvas');c.width=c.height=128;return c;};
    let sd=th.length*7919+13;const rn=()=>{sd=(sd+0x6D2B79F5)|0;let q=Math.imul(sd^(sd>>>15),1|sd);q=(q+Math.imul(q^(q>>>7),61|q))^q;return((q^(q>>>14))>>>0)/4294967296;};
    const w=mk(),wc=w.getContext('2d'),f=mk(),fc=f.getContext('2d');
    wc.fillStyle=A.wall;wc.fillRect(0,0,128,128);
    if(th==='sky'){for(let i=0;i<30;i++){wc.globalAlpha=.16;wc.fillStyle=A.spk[(rn()*4)|0];wc.beginPath();wc.arc(rn()*128,rn()*128,8+rn()*18,0,TAU);wc.fill();}wc.globalAlpha=1;}
    else for(let i=0;i<300;i++){wc.fillStyle=A.spk[(rn()*4)|0];const s=2+rn()*5;wc.fillRect(rn()*128,rn()*128,s,s);}
    if(th!=='sky'){
      const cr=th==='hell'?'#ff5a1a':'#120604';
      for(let k=0;k<(th==='hell'?7:5);k++){
        const pts=[[rn()*128,rn()*128]];for(let j=0;j<5;j++){const q=pts[j];pts.push([q[0]+rn()*34-17,q[1]+rn()*34-17]);}
        for(const [lw,al] of th==='hell'?[[5,.18],[2,.85]]:[[1.5,.8]]){wc.strokeStyle=cr;wc.globalAlpha=al;wc.lineWidth=lw;wc.beginPath();pts.forEach((q,j)=>j?wc.lineTo(q[0],q[1]):wc.moveTo(q[0],q[1]));wc.stroke();}
        wc.globalAlpha=1;
      }
    }
    fc.fillStyle=A.floor;fc.fillRect(0,0,128,128);
    const T0=th==='hell'?48:64;
    if(th==='redrock'){   /* steel plates with rivets */
      for(let y=0;y<128;y+=64)for(let x=0;x<128;x+=64){
        fc.fillStyle='#5c545c';fc.fillRect(x+1,y+1,62,2);fc.fillRect(x+1,y+1,2,62);fc.fillStyle='#2c282e';fc.fillRect(x,y+62,64,2);fc.fillRect(x+62,y,2,64);
        fc.fillStyle='#3a363c';for(const [a,b] of [[6,6],[56,6],[6,56],[56,56]]){fc.beginPath();fc.arc(x+a,y+b,2,0,TAU);fc.fill();}
      }
      for(let i=0;i<60;i++){fc.fillStyle=rn()<.5?'#5a525a':'#423c44';fc.fillRect(rn()*128,rn()*128,1+rn()*3,1);}
    }else if(th==='hell'){   /* black-red stone with glowing cracks */
      for(let y=0;y<144;y+=T0)for(let x=0;x<144;x+=T0){fc.fillStyle='#180610';fc.fillRect(x,y+T0-3,T0,3);fc.fillRect(x+T0-3,y,3,T0);fc.fillStyle='#46181f';fc.fillRect(x+1,y+1,T0-5,2);}
      for(let k=0;k<4;k++){const pts=[[rn()*128,rn()*128]];for(let j=0;j<4;j++){const q=pts[j];pts.push([q[0]+rn()*30-15,q[1]+rn()*30-15]);}
        for(const [lw,al] of [[4,.2],[1.5,.85]]){fc.strokeStyle='#ff4a10';fc.globalAlpha=al;fc.lineWidth=lw;fc.beginPath();pts.forEach((q,j)=>j?fc.lineTo(q[0],q[1]):fc.moveTo(q[0],q[1]));fc.stroke();}fc.globalAlpha=1;}
      for(let i=0;i<70;i++){fc.fillStyle=rn()<.5?'#3e161e':'#28101a';fc.fillRect(rn()*128,rn()*128,2+rn()*3,2);}
    }else{   /* white marble with gold seams */
      for(let y=0;y<128;y+=64)for(let x=0;x<128;x+=64){fc.fillStyle='#d6b45a';fc.fillRect(x,y,64,2);fc.fillRect(x,y,2,64);fc.fillStyle='#fff';fc.fillRect(x+3,y+3,58,1);}
      for(let i=0;i<14;i++){fc.strokeStyle='#c8d0ea';fc.globalAlpha=.7;fc.lineWidth=1;const x=rn()*128,y=rn()*128;fc.beginPath();fc.moveTo(x,y);fc.lineTo(x+rn()*40-20,y+rn()*40);fc.stroke();}fc.globalAlpha=1;
      for(let i=0;i<60;i++){fc.fillStyle='#dde3f4';fc.fillRect(rn()*128,rn()*128,2+rn()*3,2);}
    }
    return this.tunX[th]={wall:this.ctx.createPattern(w,'repeat'),floor:this.ctx.createPattern(f,'repeat')};
  },
  /* the tunnel: rock everywhere, the corridor and the boss room as floor, lamps, direction chevrons, the crumbling dark behind you */
  tunnelRoom(vx,vy,vw,vh,t,tn){
    const ctx=this.ctx,th=tn.theme,A=TUNART[th],X=this.tunTex(th),cx=tn.cx,hw=TUN_HW,rw=TUN_RHW,ry0=tn.ry0,ry1=tn.ry1,fl=tn.fl,D=tn.D;
    const x0=vx-8,x1=vx+vw+8,y0=vy-8,y1=vy+vh+130;
    ctx.fillStyle=X.wall;ctx.fillRect(x0,y0,x1-x0,y1-y0);
    /* floor shape: corridor + room */
    ctx.save();ctx.beginPath();
    ctx.moveTo(cx-hw,fl+40);ctx.lineTo(cx-hw,ry1);ctx.lineTo(cx-rw,ry1);ctx.lineTo(cx-rw,ry0);ctx.lineTo(cx+rw,ry0);ctx.lineTo(cx+rw,ry1);ctx.lineTo(cx+hw,ry1);ctx.lineTo(cx+hw,fl+40);ctx.closePath();
    ctx.fillStyle=X.floor;ctx.fill();ctx.clip();
    /* the walls' bases darken the floor along the edges */
    const sh=(xa,xb,ya,yb)=>{const g=ctx.createLinearGradient(xa,0,xb,0);g.addColorStop(0,A.edge);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(Math.min(xa,xb),ya,Math.abs(xb-xa),yb-ya);};
    sh(cx-hw,cx-hw+34,Math.max(y0,ry1),y1);sh(cx+hw,cx+hw-34,Math.max(y0,ry1),y1);   /* corridor */
    sh(cx-rw,cx-rw+40,y0,ry1);sh(cx+rw,cx+rw-40,y0,ry1);   /* room */
    /* chevrons pointing up, sliding along the corridor */
    ctx.strokeStyle=D.gl;ctx.lineWidth=3;ctx.lineJoin='round';
    const ph=(t*46)%200;
    for(let yy=Math.floor((vy-ph)/200)*200+ph;yy<vy+vh+200;yy+=200){
      if(yy>fl-30||yy<ry1+30)continue;
      const a=.1+.14*Math.sin(yy*.013+t*2);ctx.globalAlpha=Math.max(.04,a);
      ctx.beginPath();ctx.moveTo(cx-16,yy+9);ctx.lineTo(cx,yy-7);ctx.lineTo(cx+16,yy+9);ctx.stroke();
    }
    ctx.globalAlpha=1;
    /* the room: a ring emblem in the middle and, once the boss is down, the three chest spots */
    {const my=(ry0+ry1)/2;
     ctx.save();ctx.translate(cx,my);ctx.scale(1,.62);
     ctx.strokeStyle=D.gl;ctx.globalAlpha=.32+.1*Math.sin(t*2);ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,TUN_TRI+34,0,TAU);ctx.stroke();
     ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,TUN_TRI-36,0,TAU);ctx.stroke();
     if(th==='sky'){ctx.fillStyle=A.trim;}
     ctx.globalAlpha=.18;ctx.fillStyle=D.gl;ctx.beginPath();ctx.arc(0,0,TUN_TRI+34,0,TAU);ctx.fill();ctx.restore();}
    ctx.restore();
    /* gold / hazard trim line along the floor edges */
    ctx.strokeStyle=A.trim;ctx.globalAlpha=.55;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(cx-hw+1,fl);ctx.lineTo(cx-hw+1,ry1);ctx.lineTo(cx-rw+1,ry1);ctx.lineTo(cx-rw+1,ry0+1);ctx.lineTo(cx+rw-1,ry0+1);ctx.lineTo(cx+rw-1,ry1);ctx.lineTo(cx+hw-1,ry1);ctx.lineTo(cx+hw-1,fl);ctx.stroke();ctx.globalAlpha=1;
    /* the north wall of the room shows its face (we look from the south) */
    {const fh=64,g=ctx.createLinearGradient(0,ry0-fh,0,ry0);g.addColorStop(0,A.wall);g.addColorStop(1,A.face);
     ctx.fillStyle=g;ctx.fillRect(cx-rw,ry0-fh,rw*2,fh);ctx.fillStyle=X.wall;ctx.globalAlpha=.35;ctx.fillRect(cx-rw,ry0-fh,rw*2,fh);ctx.globalAlpha=1;
     ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(cx-rw,ry0-4,rw*2,4);
     ctx.fillStyle=A.trim;ctx.globalAlpha=.7;ctx.fillRect(cx-rw,ry0-fh,rw*2,3);ctx.globalAlpha=1;}
    /* lamps / torches on the walls, alternating sides; the room has four */
    const lamp=(x,y)=>{
      const fk=.82+.18*Math.sin(t*9+x*.07+y*.03);
      GLOW.at(ctx,x,y-18,92*fk,A.lamp,.5);GLOW.at(ctx,x,y-18,26,'#ffffff',.5*fk);
      ctx.fillStyle='#1c1418';ctx.fillRect(x-4,y-16,8,16);ctx.fillStyle=A.lamp;ctx.fillRect(x-3,y-24,6,9);ctx.fillStyle='#fff';ctx.fillRect(x-1,y-22,2,4);
    };
    for(let yy=Math.floor((vy-120)/340)*340;yy<vy+vh+120;yy+=340){
      if(yy>fl-40||yy<ry1+60)continue;
      const side=(Math.round(yy/340)&1)?-1:1;lamp(cx+side*(hw-2),yy);
    }
    if(ry1>vy-120&&ry0<vy+vh+120){
      for(const [lx,ly] of [[cx-rw+6,ry0+90],[cx+rw-6,ry0+90],[cx-rw+6,ry1-70],[cx+rw-6,ry1-70],[cx-130,ry0+2],[cx+130,ry0+2]])lamp(lx,ly);
    }
    /* hell: embers rising from the cracks; sky: drifting motes */
    if(th!=='redrock'&&!FXL.on){
      ctx.fillStyle=th==='hell'?'#ff7a2a':'#ffffff';
      for(let i=0;i<26;i++){
        const q=((t*(th==='hell'?34:14)+i*97)%(vh+80)),yy=vy+vh-q,xx=vx+((i*211+Math.sin(t*.7+i)*26)%vw+vw)%vw;
        ctx.globalAlpha=th==='hell'?.6*(1-q/(vh+80)):.5;ctx.fillRect(xx,yy,2,2);
      }
      ctx.globalAlpha=1;
    }
    /* the mouth of the room: a frame, and a glowing barrier across it while the boss lives */
    if(ry1>vy-80&&ry1<vy+vh+80){
      ctx.fillStyle=A.face;ctx.fillRect(cx-hw-14,ry1-10,14,34);ctx.fillRect(cx+hw,ry1-10,14,34);ctx.fillStyle=A.trim;ctx.fillRect(cx-hw-14,ry1-10,14,3);ctx.fillRect(cx+hw,ry1-10,14,3);
      if(tn.phase==='boss'){
        const g=ctx.createLinearGradient(0,ry1-20,0,ry1+30);g.addColorStop(0,hexA(D.gl,0));g.addColorStop(.5,hexA(D.gl,.7+.2*Math.sin(t*8)));g.addColorStop(1,hexA(D.gl,0));
        ctx.fillStyle=g;ctx.fillRect(cx-hw,ry1-20,hw*2,50);
      }
    }
    /* the exit hatch (once the boss is down) */
    if(tn.exit){
      const ex=tn.exit.x,ey=tn.exit.y;
      GLOW.at(ctx,ex,ey-6,80+8*Math.sin(t*4),'#8be07a',.55);
      ctx.save();ctx.translate(ex,ey);ctx.scale(1,.55);
      for(let i=0;i<3;i++){ctx.strokeStyle=i?'#bfffb0':'#8be07a';ctx.globalAlpha=.8-.2*i;ctx.lineWidth=4-i;ctx.beginPath();ctx.arc(0,0,38-i*9+2*Math.sin(t*5+i),0,TAU);ctx.stroke();}
      ctx.globalAlpha=.55;ctx.fillStyle='#d8ffd0';ctx.beginPath();ctx.arc(0,0,20,0,TAU);ctx.fill();ctx.restore();ctx.globalAlpha=1;
    }
    /* behind you: the floor ends in darkness */
    {const g=ctx.createLinearGradient(0,fl-110,0,fl+30);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.97)');
     ctx.fillStyle=g;ctx.fillRect(x0,fl-110,x1-x0,140);ctx.fillStyle='#000';ctx.fillRect(x0,fl+29,x1-x0,y1-fl);}
  },
  /* the entrance on the map: the sprite of the bunker / portal / gate, a pulsing glow and an arrow above it */
  drawTunnelEntrance(f,t,g){
    const ctx=this.ctx,th=g.stage.theme,D=TUNNELS[th],sp=D&&this.getObst(th)[D.def];if(!sp)return;
    const x=f.x,y=f.y,k=3.1/Sprites.S*(sp.sc||1),w=sp.c.width*k,h=sp.c.height*k,pulse=.5+.5*Math.sin(t*3);
    ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(x,y+2,w*.34,w*.12,0,0,TAU);ctx.fill();
    GLOW.at(ctx,x,y-h*.35,(40+w*.3)*(1+.1*pulse),D.gl,.26+.12*pulse);
    ctx.save();ctx.imageSmoothingEnabled=!!sp.sm;ctx.translate(x,y+2);ctx.scale(k,k);ctx.drawImage(sp.c,-sp.ox,-sp.oy);ctx.restore();ctx.imageSmoothingEnabled=false;
    const by=y-h-16-4*Math.sin(t*3);
    ctx.save();ctx.translate(x,by);GLOW.at(ctx,0,0,22,D.gl,.5);ctx.fillStyle=D.gl;ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-9,-6);ctx.lineTo(9,-6);ctx.lineTo(0,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  },
  tunnelHud(g,W,H,U,txt,F,tr,tr2){
    const tn=g.tun,ctx=this.ctx,bw=Math.min(300*U,W*.45),y=H*.86;
    const run=tn.phase==='run',prog=clamp(1-(g.p.y-tn.ry1)/(tn.cy-tn.ry1),0,1);
    txt(tr(tn.D.n),W/2,y,tn.D.gl,'center',F(22,400).replace('"Rajdhani"','"Bangers"'));
    ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(W/2-bw/2,y+8*U,bw,7*U);ctx.fillStyle=tn.D.gl;ctx.fillRect(W/2-bw/2,y+8*U,bw*(run?prog:1),7*U);
    txt(run?tr2('Avanti: si sale, non si torna indietro','Keep going up: there is no way back'):tn.phase==='boss'?tr2('Sconfiggi il boss','Defeat the boss'):tr2('Apri le casse, poi esci dal portello verde','Open the chests, then take the green hatch'),W/2,y+34*U,'#ffffff','center',F(13));
  }
});
