'use strict';
/* ====== v116: map moments — the training circle, the Capsule Corp pod (once per run) and a rare visit from the Supreme Kai with a 60-second mission ====== */
const TR_FIRST=75,TR_EVERY=[110,160],TR_NEED=5,TR_R=70,TR_TTL=30,TR_BUFF=30,POD_NEED=10,POD_R=44,KS_P=.35,KS_T=60,KS_R=56;
const KS_CFG={skin:'#b89ae0',outfit:'#2a5ac8',legs:'#f4f1ea',shoulder:'#3a2a8a',belt:'#3ab0a8',hair:'#f4f1ea',hs:'vegeta',pointy:true,eye:'#2a2a3a',boot:'#e0a030',armor:'#3a2a8a'};
const KS_MISSIONS=[
  {id:'nohit',n:100,txt:n=>T6(`Sconfiggi ${n} nemici senza farti colpire`,`Defeat ${n} enemies without being hit`,`Derrota a ${n} enemigos sin recibir golpes`,`Bats ${n} ennemis sans être touché`,`Besiege ${n} Gegner, ohne getroffen zu werden`,`Derrote ${n} inimigos sem ser atingido`)},
  {id:'kills',n:250,txt:n=>T6(`Sconfiggi ${n} nemici`,`Defeat ${n} enemies`,`Derrota a ${n} enemigos`,`Bats ${n} ennemis`,`Besiege ${n} Gegner`,`Derrote ${n} inimigos`)},
  {id:'elite',n:3,txt:n=>T6(`Sconfiggi ${n} élite`,`Defeat ${n} elites`,`Derrota a ${n} élites`,`Bats ${n} élites`,`Besiege ${n} Eliten`,`Derrote ${n} elites`)}
];
const MAPX={
  ok(g){return !g.trial&&!g.tun&&!g.dying&&!g.ended&&!g.summon&&!g.endless;},
  spot(g,d0,d1){const a=rnd(0,TAU),d=rnd(d0,d1),[x,y]=g.dryPos(g.p.x+Math.cos(a)*d,g.p.y+Math.sin(a)*d*.8);return{x,y};},
  init(g){const D=(g.D&&g.D.dur)||600;g.mx={trT:TR_FIRST,tr:null,pod:null,podT:rnd(.25,.6)*D,podDone:false,ks:null,ksT:Math.random()<KS_P?rnd(.2,.65)*D:1e9,mis:null};},
  tick(g,dt){
    const M=g.mx;if(!M)return;const p=g.p,near=(o,r)=>Math.hypot(p.x-o.x,p.y-o.y)<r;
    if(!this.ok(g)){if(M.mis)this.misEnd(g,false);return;}
    /* training circle */
    if(!M.tr){M.trT-=dt;if(M.trT<=0){M.tr={...this.spot(g,230,340),t:0,prog:0,ttl:TR_TTL,wave:0};g.say(g.env.tr(T6('Cerchio di allenamento!','Training circle!','¡Círculo de entrenamiento!','Cercle d\'entraînement !','Trainingskreis!','Círculo de treino!')),'#8ad8ff',2,g.env.tr(T6('Restaci dentro 5 secondi','Stay inside for 5 seconds','Quédate dentro 5 segundos','Reste dedans 5 secondes','Bleib 5 Sekunden darin','Fique dentro por 5 segundos')));}}
    else{const T=M.tr;T.t+=dt;const inn=near(T,TR_R);
      if(inn){T.prog+=dt;T.wave-=dt;if(T.wave<=0){T.wave=1.2;g.spawnRing(4+g.sd);}}else T.prog=Math.max(0,T.prog-dt*.5);
      if(T.prog>=TR_NEED){const k=Math.random()<.5?'dmg':'haste';g.buffs[k]=Math.max(g.buffs[k],TR_BUFF);g.recalc();g.ring(T.x,T.y,TR_R*1.6,'#8ad8ff',.7);g.burst(p.x,p.y-20,30,'#8ad8ff');g.audio.sfx('evolve');
        g.say(g.env.tr(T6('Allenamento completato!','Training complete!','¡Entrenamiento completado!','Entraînement terminé !','Training abgeschlossen!','Treino concluído!')),'#8ad8ff',2.2,g.env.tr(k==='dmg'?T6('+15% danno per 30 s','+15% damage for 30 s','+15% de daño durante 30 s','+15 % de dégâts pendant 30 s','+15 % Schaden für 30 s','+15% de dano por 30 s'):T6('−12% ricarica per 30 s','−12% cooldown for 30 s','−12% de recarga durante 30 s','−12 % de recharge pendant 30 s','−12 % Abklingzeit für 30 s','−12% de recarga por 30 s')));
        M.tr=null;M.trT=rnd(TR_EVERY[0],TR_EVERY[1]);}
      else if(T.t>=T.ttl&&T.prog<=0){M.tr=null;M.trT=rnd(TR_EVERY[0],TR_EVERY[1]);}}
    /* Capsule Corp pod: falls once, 10 s standing next to it opens it (taking hits does not stop it, walking away slowly undoes it) */
    if(!M.podDone&&!M.pod&&g.t>=M.podT){M.pod={...this.spot(g,260,360),fall:1.2,prog:0};g.say(g.env.tr(T6('Una navicella Capsule Corp!','A Capsule Corp pod!','¡Una cápsula de la Capsule Corp!','Une capsule de la Capsule Corp !','Eine Capsule-Corp-Kapsel!','Uma cápsula da Capsule Corp!')),'#59c8ff',2.2,g.env.tr(T6('Restale accanto 10 secondi per aprirla','Stay next to it for 10 seconds to open it','Quédate a su lado 10 segundos para abrirla','Reste à côté 10 secondes pour l\'ouvrir','Bleib 10 Sekunden daneben, um sie zu öffnen','Fique ao lado por 10 segundos para abri-la')));}
    if(M.pod){const P=M.pod;
      if(P.fall>0){P.fall-=dt;if(P.fall<=0){g.shake=Math.max(g.shake,.6);g.ring(P.x,P.y,140,'#ffffff',.6);g.burst(P.x,P.y,30,'#cfd8ff');g.audio.sfx('boom');}}
      else{if(near(P,POD_R+20))P.prog+=dt;else P.prog=Math.max(0,P.prog-dt*.35);
        if(P.prog>=POD_NEED&&!g.modal){M.pod=null;M.podDone=true;g.run.pods=(g.run.pods||0)+1;const r=Math.max(2,Math.min(3,g.rollChestRar())),opts=[];
          for(let k=0;k<3;k++){const c=pickTrinket(r,t=>!opts.includes(t.id)&&!g.trinkets.includes(t.id))||pickTrinket(r,t=>!opts.includes(t.id));if(c)opts.push(c.id);}
          g.audio.sfx('chest');g.burst(P.x,P.y-10,40,'#59c8ff');if(opts.length)g.modal={type:'pick',opts,rars:opts.map(()=>r),pfs:opts.map(()=>pfFloor(rollPf(g.S.luck,1),30))};}}}
    /* the Supreme Kai: comes once (35% of runs), gives a 60 s mission when you reach him */
    if(!M.ks&&!M.mis&&g.t>=M.ksT){M.ksT=1e9;M.ks={...this.spot(g,240,320),t:0};g.say(g.env.tr(T6('Il Kaiohshin è qui!','The Supreme Kai is here!','¡El Kaio-shin está aquí!','Le Kaio Shin est là !','Der Kaioshin ist hier!','O Kaioshin está aqui!')),'#c8a8ff',2.4,g.env.tr(T6('Raggiungilo per una missione','Reach him for a mission','Alcánzalo para una misión','Rejoins-le pour une mission','Erreiche ihn für eine Mission','Alcance-o para uma missão')));}
    if(M.ks){M.ks.t+=dt;if(!M.ks.leave&&!M.mis&&near(M.ks,KS_R)){const m=KS_MISSIONS[Math.floor(Math.random()*KS_MISSIONS.length)];M.mis={m,t:KS_T,k0:g.kills,e0:g.run.elites||0,hit:0};M.ks.leave=1;
        if(m.id==='elite')for(let i=0;i<m.n;i++)g.spawnElite(1);g.audio.sfx('transform');g.say(g.env.tr(m.txt(m.n)),'#c8a8ff',3,g.env.tr(T6('60 secondi · premio: un livello d\'arma','60 seconds · reward: a weapon level','60 segundos · premio: un nivel de arma','60 secondes · récompense : un niveau d\'arme','60 Sekunden · Belohnung: ein Waffenlevel','60 segundos · prêmio: um nível de arma')));}
      if(M.ks.leave){M.ks.leave-=dt;if(M.ks.leave<=0){g.burst(M.ks.x,M.ks.y-20,24,'#c8a8ff');M.ks=null;}}else if(M.ks.t>90)M.ks=null;}
    if(M.mis){const S=M.mis;S.t-=dt;const v=this.misVal(g);if(S.m.id==='nohit'&&S.hit)this.misEnd(g,false);else if(v>=S.m.n)this.misEnd(g,true);else if(S.t<=0)this.misEnd(g,false);}
  },
  misVal(g){const S=g.mx.mis;return S.m.id==='elite'?(g.run.elites||0)-S.e0:g.kills-S.k0;},
  onHurt(g){if(g.mx&&g.mx.mis)g.mx.mis.hit=1;},
  misEnd(g,win){const S=g.mx.mis;g.mx.mis=null;
    if(win){const ws=[...g.weapons.values()].filter(w=>w.lv<WMAX||w.canXl()),w=ws.length?ws[Math.floor(Math.random()*ws.length)]:null;if(w)w.upgrade();g.run.ksWins=(g.run.ksWins||0)+1;g.recalc();
      g.say(g.env.tr(T6('Missione compiuta!','Mission complete!','¡Misión cumplida!','Mission accomplie !','Mission erfüllt!','Missão cumprida!')),'#c8a8ff',2.4,w?g.env.tr(w.evo?w.evoName:w.def.n)+' +1':'');g.audio.sfx('evolve');g.ring(g.p.x,g.p.y,160,'#c8a8ff',.7);}
    else g.say(g.env.tr(T6('Missione fallita','Mission failed','Misión fallida','Mission échouée','Mission gescheitert','Missão falhou')),'#9aa4b8',1.8);},
  /* ground pass (under the characters) */
  drawGround(R,g,ctx,t){const M=g.mx;if(!M)return;
    if(M.tr){const T=M.tr,k=T.prog/TR_NEED,a=.55+.25*Math.sin(t*4);ctx.save();ctx.globalAlpha=a;ctx.strokeStyle='#8ad8ff';ctx.lineWidth=3;ctx.setLineDash([12,8]);ctx.lineDashOffset=-t*30;ctx.beginPath();ctx.ellipse(T.x,T.y,TR_R,TR_R*.5,0,0,TAU);ctx.stroke();ctx.setLineDash([]);
      ctx.globalAlpha=.25;ctx.fillStyle='#8ad8ff';ctx.beginPath();ctx.ellipse(T.x,T.y,TR_R*k,TR_R*.5*k,0,0,TAU);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#8ad8ff';ctx.font='900 18px "Noto Sans JP",sans-serif';ctx.textAlign='center';ctx.fillText('修',T.x,T.y+6);ctx.restore();}
    if(M.pod){const P=M.pod,f=Math.max(0,P.fall),y=P.y-f*f*420;ctx.save();ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(P.x,P.y+4,26*(1-f*.6),8*(1-f*.6),0,0,TAU);ctx.fill();
      if(f>0){ctx.strokeStyle='rgba(255,220,160,.6)';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(P.x+f*40,y-80);ctx.lineTo(P.x,y-14);ctx.stroke();}
      /* the pod: a white sphere with a blue band and a round window */
      const gr=ctx.createRadialGradient(P.x-7,y-26,4,P.x,y-18,24);gr.addColorStop(0,'#ffffff');gr.addColorStop(1,'#b8c4d8');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(P.x,y-18,20,0,TAU);ctx.fill();
      ctx.fillStyle='#2a5ac8';ctx.fillRect(P.x-20,y-16,40,5);ctx.fillStyle='#59c8ff';ctx.beginPath();ctx.arc(P.x+6,y-24,6,0,TAU);ctx.fill();ctx.fillStyle='#e8f6ff';ctx.beginPath();ctx.arc(P.x+4,y-26,2,0,TAU);ctx.fill();
      ctx.fillStyle='#d03030';ctx.font='900 7px sans-serif';ctx.textAlign='center';ctx.fillText('CC',P.x-8,y-21);
      if(!f&&P.prog>0){ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(P.x-24,y-50,48,5);ctx.fillStyle='#59c8ff';ctx.fillRect(P.x-24,y-50,48*P.prog/POD_NEED,5);}ctx.restore();}
    if(M.ks){const K=M.ks,sp=Sprites.player('kaioshin:0',KS_CFG,0,false,null),k=1.95/(sp.s||Sprites.S),fade=K.leave?clamp(K.leave,0,1):1;GLOW.at(ctx,K.x,K.y-24,42,'#c8a8ff',.4*fade);
      ctx.save();ctx.globalAlpha=fade;ctx.translate(K.x,K.y+Math.sin(t*2)*1.5);ctx.scale(-k,k);ctx.imageSmoothingEnabled=!sp.px;ctx.drawImage(sp.c,-sp.ox,-sp.oy);ctx.restore();ctx.imageSmoothingEnabled=false;
      if(!K.leave){ctx.save();ctx.font='900 16px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffe24d';ctx.fillText('!',K.x,K.y-62+Math.sin(t*5)*2);ctx.restore();}}
  },
  /* the mission line under the timer */
  hud(R,g){const S=g.mx&&g.mx.mis;if(!S)return;const c=R.ctx,U=R.U,W=R.W,s=R.tr(S.m.txt(S.m.n))+': '+Math.min(S.m.n,this.misVal(g))+'/'+S.m.n+'  ·  '+Math.ceil(S.t)+'s';
    c.save();c.font='800 '+Math.round(14*U)+'px "Rajdhani",sans-serif';c.textAlign='center';c.lineWidth=3*U;c.strokeStyle='#000';c.strokeText('界 '+s,W/2,96*U);c.fillStyle='#d8c8ff';c.fillText('界 '+s,W/2,96*U);c.restore();}
};
