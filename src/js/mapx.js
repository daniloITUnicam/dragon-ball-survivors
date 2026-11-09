'use strict';
/* ====== v116: map moments — the training circle, the Capsule Corp pod (once per run) and a rare visit with a 60-second mission
   (v132: the visitor is a random character, no longer always the Supreme Kai) ====== */
const TR_FIRST=75,TR_EVERY=[110,160],TR_NEED=5,TR_R=70,TR_TTL=30,TR_BUFF=30,POD_NEED=10,POD_R=44,KS_P=.35,KS_T=60,KS_R=56;
/* v132: the visitor (once the Supreme Kai, now a random character): KS_ARR s of arrival in a column of light, KS_STAY s of stay once reached, KS_GO s of departure; KS_COL its light */
const KS_ARR=1.1,KS_STAY=15,KS_GO=.9,KS_COL='#c8a8ff';
const easeOutBack=x=>1+2.70158*Math.pow(x-1,3)+1.70158*Math.pow(x-1,2);
const KS_MISSIONS=[
  {id:'nohit',n:100,txt:n=>T6(`Sconfiggi ${n} nemici senza farti colpire`,`Defeat ${n} enemies without being hit`,`Derrota a ${n} enemigos sin recibir golpes`,`Bats ${n} ennemis sans être touché`,`Besiege ${n} Gegner, ohne getroffen zu werden`,`Derrote ${n} inimigos sem ser atingido`)},
  {id:'kills',n:250,txt:n=>T6(`Sconfiggi ${n} nemici`,`Defeat ${n} enemies`,`Derrota a ${n} enemigos`,`Bats ${n} ennemis`,`Besiege ${n} Gegner`,`Derrote ${n} inimigos`)},
  {id:'elite',n:3,txt:n=>T6(`Sconfiggi ${n} élite`,`Defeat ${n} elites`,`Derrota a ${n} élites`,`Bats ${n} élites`,`Besiege ${n} Eliten`,`Derrote ${n} elites`)}
];
const MAPX={
  ok(g){return !g.trial&&!g.tun&&!g.dying&&!g.ended&&!g.summon&&!g.endless;},
  /* v133: a spot d0-d1 px away that is really on the map: dry land, clear of obstacles, on the Snake Way body / an island, inside the arena; closer tries, then your own spot */
  spot(g,d0,d1,rad){rad=rad||40;const p=g.p;
    for(let i=0;i<48;i++){const k=i<32?1:.55,a=rnd(0,TAU),d=rnd(d0,d1)*k;let[x,y]=g.dryPos(p.x+Math.cos(a)*d,p.y+Math.sin(a)*d*.8,rad);
      if(g.stage.theme==='snake'){const o={x,y};Snake.clamp(o,rad);x=o.x;y=o.y;}
      if(this.walk(g,x,y,rad)&&Math.hypot(x-p.x,y-p.y)>=d0*.4*k)return{x,y};}
    return{x:p.x,y:p.y};},
  walk(g,x,y,rad){const th=g.stage.theme;if(!isFinite(x)||!isFinite(y)||g.waterAt(x,y))return false;
    if(th==='snake'){const o={x,y};Snake.clamp(o,rad);if(Math.hypot(o.x-x,o.y-y)>1)return false;}
    if(th==='void'&&!TOPARENA.inside(x,y,rad+10))return false;
    return World.clearAt(th,x,y,rad*.5);},
  init(g){const D=(g.D&&g.D.dur)||600;g.mx={trT:TR_FIRST,tr:null,pod:null,podT:rnd(.25,.6)*D,podDone:false,ks:null,ksT:Math.random()<KS_P?rnd(.2,.65)*D:1e9,mis:null,ksC:this.pickVisitor(g)};},
  /* v132: the visitor is a random character (never the one you play) */
  pickVisitor(g){const L=CHARS.filter(c=>c.id!==(g.C&&g.C.id));return L.length?L[Math.floor(Math.random()*L.length)].id:'goku';},
  visitor(g){return CHARS.find(c=>c.id===g.mx.ksC)||CHARS[0];},
  tick(g,dt){
    const M=g.mx;if(!M)return;const p=g.p,near=(o,r)=>Math.hypot(p.x-o.x,p.y-o.y)<r;
    if(!this.ok(g)){if(M.mis)this.misEnd(g,false);return;}
    /* training circle */
    if(!M.tr){M.trT-=dt;if(M.trT<=0){M.tr={...this.spot(g,230,340,TR_R),t:0,prog:0,ttl:TR_TTL,wave:0};g.say(g.env.tr(T6('Cerchio di allenamento!','Training circle!','¡Círculo de entrenamiento!','Cercle d\'entraînement !','Trainingskreis!','Círculo de treino!')),'#8ad8ff',2,g.env.tr(T6('Restaci dentro 5 secondi','Stay inside for 5 seconds','Quédate dentro 5 segundos','Reste dedans 5 secondes','Bleib 5 Sekunden darin','Fique dentro por 5 segundos')));}}
    else{const T=M.tr;T.t+=dt;const inn=near(T,TR_R);
      if(inn){T.prog+=dt;T.wave-=dt;if(T.wave<=0){T.wave=1.2;g.spawnRing(4+g.sd);}}else T.prog=Math.max(0,T.prog-dt*.5);
      if(T.prog>=TR_NEED){const k=Math.random()<.5?'dmg':'haste';g.buffs[k]=Math.max(g.buffs[k],TR_BUFF);g.recalc();g.ring(T.x,T.y,TR_R*1.6,'#8ad8ff',.7);g.burst(p.x,p.y-20,30,'#8ad8ff');g.audio.sfx('evolve');
        g.say(g.env.tr(T6('Allenamento completato!','Training complete!','¡Entrenamiento completado!','Entraînement terminé !','Training abgeschlossen!','Treino concluído!')),'#8ad8ff',2.2,g.env.tr(k==='dmg'?T6('+15% danno per 30 s','+15% damage for 30 s','+15% de daño durante 30 s','+15 % de dégâts pendant 30 s','+15 % Schaden für 30 s','+15% de dano por 30 s'):T6('−12% ricarica per 30 s','−12% cooldown for 30 s','−12% de recarga durante 30 s','−12 % de recharge pendant 30 s','−12 % Abklingzeit für 30 s','−12% de recarga por 30 s')));
        M.tr=null;M.trT=rnd(TR_EVERY[0],TR_EVERY[1]);}
      else if(T.t>=T.ttl&&T.prog<=0){M.tr=null;M.trT=rnd(TR_EVERY[0],TR_EVERY[1]);}}
    /* Capsule Corp pod: falls once, 10 s standing next to it opens it (taking hits does not stop it, walking away slowly undoes it) */
    if(!M.podDone&&!M.pod&&g.t>=M.podT){M.pod={...this.spot(g,260,360,POD_R),fall:1.2,prog:0};g.say(g.env.tr(T6('Una navicella Capsule Corp!','A Capsule Corp pod!','¡Una cápsula de la Capsule Corp!','Une capsule de la Capsule Corp !','Eine Capsule-Corp-Kapsel!','Uma cápsula da Capsule Corp!')),'#59c8ff',2.2,g.env.tr(T6('Restale accanto 10 secondi per aprirla','Stay next to it for 10 seconds to open it','Quédate a su lado 10 segundos para abrirla','Reste à côté 10 secondes pour l\'ouvrir','Bleib 10 Sekunden daneben, um sie zu öffnen','Fique ao lado por 10 segundos para abri-la')));}
    if(M.pod){const P=M.pod;
      if(P.fall>0){P.fall-=dt;if(P.fall<=0){g.shake=Math.max(g.shake,.6);g.ring(P.x,P.y,140,'#ffffff',.6);g.burst(P.x,P.y,30,'#cfd8ff');g.audio.sfx('boom');}}
      else{if(near(P,POD_R+20))P.prog+=dt;else P.prog=Math.max(0,P.prog-dt*.35);
        if(P.prog>=POD_NEED&&!g.modal){M.pod=null;M.podDone=true;g.run.pods=(g.run.pods||0)+1;const r=Math.max(2,Math.min(3,g.rollChestRar())),opts=[];
          for(let k=0;k<3;k++){const c=pickTrinket(r,t=>!opts.includes(t.id)&&!g.trinkets.includes(t.id))||pickTrinket(r,t=>!opts.includes(t.id));if(c)opts.push(c.id);}
          g.audio.sfx('chest');g.burst(P.x,P.y-10,40,'#59c8ff');if(opts.length)g.modal={type:'pick',opts,rars:opts.map(()=>r),pfs:opts.map(()=>pfFloor(rollPf(g.S.luck,1),30))};}}}
    /* the visitor: comes once (35% of runs), gives a 60 s mission when you reach it */
    /* (its frames are painted a few seconds before it comes, not in the frame it appears) */
    if(!M.ksW&&g.t>=M.ksT-4){M.ksW=1;const C=this.visitor(g),cfg=cfgForForm(C,-1);try{Sprites.player(C.id+':-1',cfg,0,false,null);Sprites.player(C.id+':-1',cfg,0,false,'happy');Sprites.player(C.id+':-1',cfg,0,true,null);}catch(e){}}
    if(!M.ks&&!M.mis&&g.t>=M.ksT){M.ksT=1e9;const C=this.visitor(g);M.ks={...this.spot(g,240,320,KS_R),t:0,c:C.id};const K=M.ks;
      g.pillar(K.x,K.y,KS_COL,1.3);g.ring(K.x,K.y,130,KS_COL,.7);g.burst(K.x,K.y-24,30,'#ffffff');g.audio.sfx('shrine');g.shake=Math.max(g.shake,.25);
      const nm=g.env.tr(C.n);g.say(nm+' '+g.env.tr(T6('è qui!','is here!','está aquí!','est là !','ist hier!','está aqui!')),KS_COL,2.4,g.env.tr(T6(`Raggiungi ${nm} per una missione`,`Reach ${nm} for a mission`,`Alcanza a ${nm} para una misión`,`Rejoins ${nm} pour une mission`,`Erreiche ${nm} für eine Mission`,`Alcance ${nm} para uma missão`)));}
    if(M.ks){const K=M.ks;K.t+=dt;if(K.cheer>0)K.cheer-=dt;
      if(K.go!==undefined){K.go-=dt;if(K.go<=0){g.burst(K.x,K.y-60,26,KS_COL);g.ring(K.x,K.y,80,KS_COL,.5);M.ks=null;}}   /* gone: a last flash where it stood */
      else if(!K.met){
        if(K.t>=KS_ARR&&!M.mis&&near(K,KS_R)){const m=KS_MISSIONS[Math.floor(Math.random()*KS_MISSIONS.length)];M.mis={m,t:KS_T,k0:g.kills,e0:g.run.elites||0,hit:0};K.met=1;K.stay=KS_STAY;K.cheer=.8;
          g.ring(K.x,K.y,100,KS_COL,.6);g.burst(K.x,K.y-30,18,KS_COL);
          if(m.id==='elite')for(let i=0;i<m.n;i++)g.spawnElite(1);g.audio.sfx('transform');g.say(g.env.tr(m.txt(m.n)),KS_COL,3,g.env.tr(T6('60 secondi · premio: un livello d\'arma','60 seconds · reward: a weapon level','60 segundos · premio: un nivel de arma','60 secondes · récompense : un niveau d\'arme','60 Sekunden · Belohnung: ein Waffenlevel','60 segundos · prêmio: um nível de arma')));}
        else if(K.t>90){K.go=KS_GO;g.audio.sfx('dash');}}   /* never reached: it leaves */
      else{K.stay-=dt;if(K.stay<=0){K.go=KS_GO;g.audio.sfx('dash');g.pillar(K.x,K.y,KS_COL,.9);}}}   /* v132: it stays KS_STAY s where you met it, then teleports away */
    if(M.mis){const S=M.mis;S.t-=dt;const v=this.misVal(g);if(S.m.id==='nohit'&&S.hit)this.misEnd(g,false);else if(v>=S.m.n)this.misEnd(g,true);else if(S.t<=0)this.misEnd(g,false);}
  },
  misVal(g){const S=g.mx.mis;return S.m.id==='elite'?(g.run.elites||0)-S.e0:g.kills-S.k0;},
  onHurt(g){if(g.mx&&g.mx.mis)g.mx.mis.hit=1;},
  misEnd(g,win){const S=g.mx.mis;g.mx.mis=null;
    if(win){const ws=[...g.weapons.values()].filter(w=>w.lv<WMAX||w.canXl()),w=ws.length?ws[Math.floor(Math.random()*ws.length)]:null;if(w)w.upgrade();g.run.ksWins=(g.run.ksWins||0)+1;g.recalc();
      g.say(g.env.tr(T6('Missione compiuta!','Mission complete!','¡Misión cumplida!','Mission accomplie !','Mission erfüllt!','Missão cumprida!')),'#ffd23f',2.4,w?g.env.tr(w.evo?w.evoName:w.def.n)+' +1':'');g.audio.sfx('evolve');
      /* v132: the quest-complete celebration: a golden column and rings on you, a shower of stars, the seal on screen (MAPX.hud) and the visitor cheering if it is still there */
      const p=g.p;g.pillar(p.x,p.y,'#ffd23f',1.5);g.ring(p.x,p.y,170,'#ffd23f',.8);g.ring(p.x,p.y,110,'#ffffff',.6);g.burst(p.x,p.y-30,46,'#ffd23f');g.burst(p.x,p.y-30,22,'#ffffff');g.flash=Math.max(g.flash||0,.25);g.flashC='#fff3b0';
      g.mx.fx={t0:g.rt};if(g.mx.ks&&g.mx.ks.go===undefined)g.mx.ks.cheer=2.5;}
    else g.say(g.env.tr(T6('Missione fallita','Mission failed','Misión fallida','Mission échouée','Mission gescheitert','Missão falhou')),'#9aa4b8',1.8);},
  /* ground pass (under the characters) */
  drawGround(R,g,ctx,t){const M=g.mx;if(!M)return;
    const lbl=(txt,x,y,c,sz)=>{ctx.font='900 '+(sz||12)+'px "Rajdhani",sans-serif';ctx.textAlign='center';ctx.lineWidth=3.5;ctx.strokeStyle='rgba(0,0,0,.85)';ctx.strokeText(txt,x,y);ctx.fillStyle=c;ctx.fillText(txt,x,y);};
    /* a progress bar in the world: dark case, white border, gradient fill with a moving shine, the seconds left on it */
    const bar=(x,y,w,h,k,c,txt)=>{ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(x-w/2-2,y-2,w+4,h+4);ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1.5;ctx.strokeRect(x-w/2-2,y-2,w+4,h+4);
      if(k>0){const gr=ctx.createLinearGradient(x-w/2,0,x+w/2,0);gr.addColorStop(0,c);gr.addColorStop(1,'#ffffff');ctx.fillStyle=gr;ctx.fillRect(x-w/2,y,w*k,h);
        const sx=x-w/2+((t*.9)%1)*w*k;ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillRect(Math.max(x-w/2,sx-6),y,Math.min(12,x-w/2+w*k-sx+6),h);}
      if(txt)lbl(txt,x,y+h-1,'#ffffff',h+3);};
    const ell=(x,y,r,ry,fill)=>{ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,r),Math.max(.1,ry),0,0,TAU);fill?ctx.fill():ctx.stroke();};
    const beacon=(x,y,w,c,a)=>{const gr=ctx.createLinearGradient(0,y-320,0,y);gr.addColorStop(0,hexA(c,0));gr.addColorStop(.75,hexA(c,a*.6));gr.addColorStop(1,hexA(c,a));ctx.fillStyle=gr;ctx.fillRect(x-w/2,y-320,w,320);};
    /* v132: the training circle - a column of light seen from afar, a glowing floor, a solid ring and a turning dashed one, motes rising from the edge,
       a progress ring, rings closing in while you stand inside and a big bar with the seconds left */
    if(M.tr){const T=M.tr,k=clamp(T.prog/TR_NEED,0,1),C='#8ad8ff',inn=Math.hypot(g.p.x-T.x,g.p.y-T.y)<TR_R,pu=.5+.5*Math.sin(t*4),R=TR_R,fade=T.prog<=0?clamp((T.ttl-T.t)/4,0,1):1;
      ctx.save();ctx.globalAlpha=fade;ctx.globalCompositeOperation='lighter';
      beacon(T.x,T.y,R*.7,C,inn?.42:.24+.08*pu);
      {const gr=ctx.createRadialGradient(T.x,T.y,4,T.x,T.y,R);gr.addColorStop(0,hexA(C,.32+.14*pu));gr.addColorStop(1,hexA(C,.06));ctx.save();ctx.translate(T.x,T.y);ctx.scale(1,.5);ctx.translate(-T.x,-T.y);ctx.fillStyle=gr;ctx.beginPath();ctx.arc(T.x,T.y,R,0,TAU);ctx.fill();ctx.restore();}
      if(k>0){ctx.fillStyle=hexA('#ffffff',.18+.12*pu);ell(T.x,T.y,R*k,R*.5*k,true);}
      ctx.strokeStyle=hexA(C,.6+.35*pu);ctx.lineWidth=5;ell(T.x,T.y,R,R*.5);ctx.strokeStyle=hexA('#ffffff',.5);ctx.lineWidth=1.5;ell(T.x,T.y,R+4,R*.5+2);
      ctx.setLineDash([10,9]);ctx.lineDashOffset=-t*40;ctx.strokeStyle=hexA(C,.75);ctx.lineWidth=2.5;ell(T.x,T.y,R*.74,R*.37);ctx.setLineDash([]);
      for(let i=0;i<16;i++){const ph=(t*.7+i/16*3.1)%1,a=i/16*TAU+t*.45,x=T.x+Math.cos(a)*R,y=T.y+Math.sin(a)*R*.5-ph*58;ctx.fillStyle=hexA(i%3?C:'#ffffff',(1-ph)*.85);ctx.fillRect(x-1.5,y-4,3,8);}
      if(inn)for(let j=0;j<3;j++){const q=(t*1.4+j/3)%1;ctx.strokeStyle=hexA('#ffffff',q*.7);ctx.lineWidth=2;ell(T.x,T.y,R*(1-q),R*.5*(1-q));}
      if(k>0){ctx.strokeStyle='#ffffff';ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.ellipse(T.x,T.y,R+9,R*.5+5,0,-Math.PI/2,-Math.PI/2+k*TAU);ctx.stroke();ctx.lineCap='butt';}
      ctx.globalCompositeOperation='source-over';
      GLOW.at(ctx,T.x,T.y-4,30+8*pu,C,.45);ctx.font='900 '+(26+3*pu)+'px "Noto Sans JP",sans-serif';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='rgba(0,30,60,.85)';ctx.strokeText('修',T.x,T.y+9);ctx.fillStyle='#e8f8ff';ctx.fillText('修',T.x,T.y+9);
      bar(T.x,T.y-R*.5-40,104,10,k,C,k>0?(Math.max(0,TR_NEED-T.prog)).toFixed(1)+'s':TR_NEED+'s');
      lbl(g.env.tr(T6('ALLENAMENTO','TRAINING','ENTRENAMIENTO','ENTRAÎNEMENT','TRAINING','TREINO')),T.x,T.y-R*.5-46,C,13);
      ctx.restore();}
    /* v132: the Capsule Corp pod - the spot to stand on (a turning ring), a column of light, blinking lights, sparks and a shake that grows while it opens, a big bar */
    if(M.pod){const P=M.pod,f=Math.max(0,P.fall),k=clamp(P.prog/POD_NEED,0,1),C='#59c8ff',RR=POD_R+20,inn=!f&&Math.hypot(g.p.x-P.x,g.p.y-P.y)<RR,pu=.5+.5*Math.sin(t*5);
      const shk=inn?Math.sin(t*47)*(.6+2.6*k):0,x=P.x+shk,y=P.y-f*f*420;ctx.save();
      if(!f){ctx.globalCompositeOperation='lighter';beacon(P.x,P.y,46,C,inn?.4:.22+.08*pu);
        ctx.fillStyle=hexA(C,.12+.08*pu);ell(P.x,P.y,RR,RR*.45,true);if(k>0){ctx.fillStyle=hexA('#ffffff',.2);ell(P.x,P.y,RR*k,RR*.45*k,true);}
        ctx.setLineDash([8,7]);ctx.lineDashOffset=t*30;ctx.strokeStyle=hexA(C,.65+.3*pu);ctx.lineWidth=3;ell(P.x,P.y,RR,RR*.45);ctx.setLineDash([]);
        if(k>0){ctx.strokeStyle='#ffffff';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.ellipse(P.x,P.y,RR+7,RR*.45+4,0,-Math.PI/2,-Math.PI/2+k*TAU);ctx.stroke();ctx.lineCap='butt';}
        if(inn)for(let i=0;i<7;i++){const a=t*6+i*.9,r=20+6*Math.sin(t*11+i);ctx.fillStyle=hexA(i%2?'#ffffff':C,.9);ctx.fillRect(x+Math.cos(a)*r-1.5,y-18+Math.sin(a)*r*.8-1.5,3,3);}
        ctx.globalCompositeOperation='source-over';}
      ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(P.x,P.y+4,26*(1-f*.6),8*(1-f*.6),0,0,TAU);ctx.fill();
      if(f>0){ctx.strokeStyle='rgba(255,220,160,.6)';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(P.x+f*40,y-80);ctx.lineTo(P.x,y-14);ctx.stroke();}
      if(!f)GLOW.at(ctx,x,y-18,32+6*pu,C,.3+.2*pu);
      /* the pod: a white sphere with a blue band and a round window */
      const gr=ctx.createRadialGradient(x-7,y-26,4,x,y-18,24);gr.addColorStop(0,'#ffffff');gr.addColorStop(1,'#b8c4d8');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y-18,20,0,TAU);ctx.fill();
      ctx.strokeStyle='rgba(20,30,60,.7)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y-18,20,0,TAU);ctx.stroke();
      ctx.fillStyle='#2a5ac8';ctx.fillRect(x-20,y-16,40,5);ctx.fillStyle='#59c8ff';ctx.beginPath();ctx.arc(x+6,y-24,6,0,TAU);ctx.fill();ctx.fillStyle='#e8f6ff';ctx.beginPath();ctx.arc(x+4,y-26,2,0,TAU);ctx.fill();
      ctx.fillStyle='#d03030';ctx.font='900 7px sans-serif';ctx.textAlign='center';ctx.fillText('CC',x-8,y-21);
      if(!f){const on=Math.floor(t*(inn?8:3))%2;ctx.fillStyle=on?'#ff4a4a':'#4aff8a';ctx.beginPath();ctx.arc(x-15,y-13.5,2.2,0,TAU);ctx.fill();ctx.fillStyle=on?'#4aff8a':'#ff4a4a';ctx.beginPath();ctx.arc(x+15,y-13.5,2.2,0,TAU);ctx.fill();
        bar(P.x,y-62,92,10,k,C,k>0?Math.ceil(POD_NEED-P.prog)+'s':POD_NEED+'s');lbl(g.env.tr(T6('APRI LA CAPSULA','OPEN THE POD','ABRE LA CÁPSULA','OUVRE LA CAPSULE','ÖFFNE DIE KAPSEL','ABRA A CÁPSULA')),P.x,y-68,C,12);}
      ctx.restore();}
    /* v132: the visitor - arrives in a column of light (it drops in, squashed, then springs up), waits in a pulsing circle, cheers, teleports away upward */
    if(M.ks){const K=M.ks,C=CHARS.find(c=>c.id===K.c)||CHARS[0],key=C.id+':-1',cfg=K.cfg||(K.cfg=cfgForForm(C,-1));
      const ap=clamp(K.t/KS_ARR,0,1),gone=K.go!==undefined?clamp(1-K.go/KS_GO,0,1):0,beam=ap<1?1-ap:gone,face=g.p.x<K.x?-1:1;
      const sp=Sprites.player(key,cfg,0,false,K.cheer>0||K.met?'happy':null),k=(C.u||1.95)/(sp.s||Sprites.S);
      ctx.save();
      if(beam>0){ctx.globalCompositeOperation='lighter';const w=16+34*beam,gr=ctx.createLinearGradient(0,K.y-340,0,K.y);gr.addColorStop(0,hexA(KS_COL,0));gr.addColorStop(.6,hexA(KS_COL,.45*beam));gr.addColorStop(1,hexA('#ffffff',.8*beam));ctx.fillStyle=gr;ctx.fillRect(K.x-w/2,K.y-340,w,340);ctx.globalCompositeOperation='source-over';}
      GLOW.at(ctx,K.x,K.y-26,48,KS_COL,.45*(1-gone));
      if(!K.met&&K.go===undefined){const pu=.5+.5*Math.sin(t*5);ctx.strokeStyle=hexA(KS_COL,.55+.35*pu);ctx.lineWidth=3;ell(K.x,K.y,KS_R,KS_R*.42);ctx.strokeStyle=hexA('#ffffff',.35*pu);ctx.lineWidth=1.5;ell(K.x,K.y,KS_R*(.6+.4*pu),KS_R*.42*(.6+.4*pu));}
      if(K.met&&K.go===undefined&&K.stay>0){ctx.strokeStyle=hexA(KS_COL,.7);ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(K.x,K.y,30,13,0,-Math.PI/2,-Math.PI/2+TAU*K.stay/KS_STAY);ctx.stroke();}   /* how long it stays */
      const sy=ap<1?.35+.65*easeOutBack(ap):1+gone*1.4,sx=ap<1?1.35-.35*ap:1-gone*.75,al=ap<1?Math.min(1,ap*2.5):1-gone*.9;
      const lift=(ap<1?(1-ap)*36:0)+gone*90+(K.cheer>0?Math.abs(Math.sin(K.cheer*8))*12:0);
      ctx.globalAlpha=al;ctx.translate(K.x,K.y-lift+Math.sin(t*2)*1.5);ctx.scale(face*k*sx,k*sy);ctx.imageSmoothingEnabled=!sp.px;ctx.drawImage(sp.c,-sp.ox,-sp.oy);
      if(beam>0){const fl=Sprites.player(key,cfg,0,true,null);ctx.globalAlpha=al*Math.min(1,beam*1.3);ctx.drawImage(fl.c,-fl.ox,-fl.oy);}   /* white while it materialises / vanishes */
      ctx.restore();ctx.imageSmoothingEnabled=false;
      if(!K.met&&K.go===undefined&&ap>=1){ctx.save();lbl('!',K.x,K.y-70+Math.sin(t*5)*3,'#ffe24d',20);ctx.restore();}
      if(K.cheer>0&&Math.random()<.25&&g.fx.length<400)g.fx.push({x:K.x+rnd(-18,18),y:K.y-50,vx:rnd(-30,30),vy:-rnd(60,110),l:.6,m:.6,c:Math.random()<.5?'#ffd23f':'#ffffff',s:3});}
  },
  /* the mission line under the timer */
  hud(R,g){
    /* v132: the quest-complete seal: pops in, turning golden rays, a check mark and orbiting stars, then fades (2.4 s) */
    const F=g.mx&&g.mx.fx;if(F){const e=g.rt-F.t0;if(e>2.4)g.mx.fx=null;else{const c=R.ctx,U=R.U,X=R.W/2,Y=R.H*.19,s=(e<.3?e/.3*1.25:1.25-.25*Math.min(1,(e-.3)/.25))*U,al=e>1.9?1-(e-1.9)/.5:1;
      c.save();c.globalAlpha=al;c.translate(X,Y);c.scale(s,s);c.save();c.rotate(e*.9);c.globalCompositeOperation='lighter';
      for(let i=0;i<14;i++){c.rotate(TAU/14);c.fillStyle=i%2?'rgba(255,210,63,.5)':'rgba(255,255,220,.35)';c.beginPath();c.moveTo(0,0);c.lineTo(-9,-110);c.lineTo(9,-110);c.closePath();c.fill();}c.restore();
      c.fillStyle='#ffd23f';c.strokeStyle='#5a3a00';c.lineWidth=6;c.beginPath();c.arc(0,0,40,0,TAU);c.fill();c.stroke();c.strokeStyle='#fff3b0';c.lineWidth=3;c.beginPath();c.arc(0,0,32,0,TAU);c.stroke();
      c.strokeStyle='#ffffff';c.lineWidth=9;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(-17,1);c.lineTo(-5,14);c.lineTo(19,-13);c.stroke();c.strokeStyle='#3a8a20';c.lineWidth=4;c.stroke();
      for(let i=0;i<6;i++){const a=e*2.4+i*TAU/6,r=58+6*Math.sin(e*7+i);c.fillStyle='#ffffff';c.font='900 16px sans-serif';c.textAlign='center';c.fillText('★',Math.cos(a)*r,Math.sin(a)*r*.8+5);}
      c.restore();}}
    const S=g.mx&&g.mx.mis;if(!S)return;const c=R.ctx,U=R.U,W=R.W,s=R.tr(S.m.txt(S.m.n))+': '+Math.min(S.m.n,this.misVal(g))+'/'+S.m.n+'  ·  '+Math.ceil(S.t)+'s';
    c.save();c.font='800 '+Math.round(14*U)+'px "Rajdhani",sans-serif';c.textAlign='center';c.lineWidth=3*U;c.strokeStyle='#000';c.strokeText('界 '+s,W/2,96*U);c.fillStyle='#d8c8ff';c.fillText('界 '+s,W/2,96*U);c.restore();}
};
