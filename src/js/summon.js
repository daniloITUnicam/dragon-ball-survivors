'use strict';
/* ====== v113: the summoning, in the run. The 7 Dragon Balls call Shenron, the Super Dragon Balls the Demon Realm Porunga.
   The sky goes dark and the game slows almost to a stop, the balls fly up from the hero into a ring, flash one after the other, rush together in a blinding
   flash, a pillar of light rises from the ground and the dragon comes out of it from the tail up; it speaks, then the wish window opens (Game.modal).
   After the wish (Game.resolveModal) the dragon vanishes, the balls scatter in every direction and the sky clears.
   Everything is drawn in screen space over the world (Renderer.draw -> SUMMON.draw); the hero is drawn again on top, lit. Click, tap, Enter or Space skip to
   the wish. The timeline runs on real time (rdt), the world on rdt * g.summon.ts ====== */
const SUMMON={
  /* timeline (s): darkness, balls rising, flashes 1..n, rush + flash, the dragon coming out, its roar, its words (say s after it is out) -> wish; after the wish: leave */
  T:{dark:.9,rise0:.45,rise:1.35,fl0:2.45,fl1:3.2,rush:3.2,burst:3.38,em0:3.45,em1:5.25,say:.7,wish:7.7,leave:1.7},
  TS:.04,   /* world speed while the dragon is out */
  K:{
    shenron:{sheet:'shenron',n:7,sky:'4,12,10',cloud:'28,60,40',bolt:'#e8ffb0',glow:'#c8ff5a',glow2:'#ffe27a',ball:'#ffaa28',big:1,
      line:T6('Esprimi il tuo desiderio. Ne esaudirò uno, qualunque esso sia.','Speak your wish. I shall grant one, whatever it may be.','Pide tu deseo. Concederé uno, sea el que sea.','Exprime ton vœu. J\'en exaucerai un, quel qu\'il soit.','Sprich deinen Wunsch aus. Einen erfülle ich dir, welcher es auch sei.','Faça o seu pedido. Realizarei um, seja ele qual for.')},
    porunga:{sheet:'porunga',n:SB_TOTAL,sky:'22,3,4',cloud:'80,14,10',bolt:'#ffd0a0',glow:'#ff4a1c',glow2:'#ffd23f',ball:'#ff7a1c',big:1.55,
      line:T6('Chi ha osato risvegliarmi? Esprimi il tuo desiderio!','Who dares to awaken me? Speak your wish!','¿Quién se atreve a despertarme? ¡Pide tu deseo!','Qui ose me réveiller ? Exprime ton vœu !','Wer wagt es, mich zu wecken? Sprich deinen Wunsch aus!','Quem ousa me despertar? Faça o seu pedido!')}
  },
  /* a run of the summoning: g.summon */
  start(g,kind){
    const K=this.K[kind],rng=(a,b)=>a+Math.random()*(b-a);
    const S={kind,K,t:0,ph:'in',ts:1,lt:0,fired:{},x2:!!(g.save&&g.save.settings&&g.save.settings.summonX2),btn:null,stars:kind==='shenron'?[1,2,3,4,5,6,7]:Array.from({length:K.n},(_,i)=>i+1),
      clouds:Array.from({length:14},()=>({x:Math.random(),y:Math.random()*.75,r:rng(.18,.42),v:rng(-.012,.012),a:rng(.35,.75)})),
      bolts:[.35,1.1,1.9,3.5,3.9,4.6,5.6,6.3].map(t=>({t:t+rng(-.1,.1),x:rng(.08,.92),seed:Math.random()*1e4}))};
    g.summon=S;g.p.inv=Math.max(g.p.inv,1);if(typeof Sprites!=='undefined'&&Sprites.need)Sprites.need('dragons');   /* decoded now: the dragon comes out 3.4 s later */
    if(g.audio.slowMusic)g.audio.slowMusic(.55);
    g.audio.sfx('thunder');this.snd(g,'dark');
    this.bindSkip(g);
    return S;
  },
  /* real-time update: the clock, the world speed, the sounds of each step, the wish window, the end */
  update(g,rdt){
    const S=g.summon,T=this.T;if(!S)return;
    g.p.inv=Math.max(g.p.inv,.6);
    const once=(k,fn)=>{if(!S.fired[k]){S.fired[k]=1;fn();}};
    if(S.ph==='leave'){
      S.lt+=rdt*(S.x2?2:1);S.ts=this.TS+(1-this.TS)*clamp((S.lt-.7)/(T.leave-.7),0,1);
      if(S.lt>=T.leave){g.summon=null;if(g.audio.slowMusic)g.audio.slowMusic(1);this.unbindSkip();}
      return;
    }
    if(S.ph==='wait')return;   /* the wish window is open (Game.update does not run meanwhile) */
    S.t+=rdt*(S.x2?2:1);const t=S.t;   /* ×2: the whole sequence at double speed (button at the bottom, or Settings > Gameplay) */
    S.ts=1+(this.TS-1)*clamp(t/.55,0,1);
    for(const b of S.bolts)if(t>=b.t)once('b'+b.t,()=>g.audio.sfx('thunder'));
    for(let i=0;i<S.stars.length;i++){const ft=T.fl0+(T.fl1-T.fl0)*i/S.stars.length;if(t>=ft)once('f'+i,()=>this.snd(g,'ball',i));}
    if(t>=T.rise0)once('rise',()=>this.snd(g,'rise'));
    if(t>=T.burst)once('burst',()=>{this.snd(g,'burst');g.shake=Math.max(g.shake,.5);});
    if(t>=T.em0+.1)once('em',()=>this.snd(g,'emerge'));
    if(t>=T.em1){once('speak',()=>this.snd(g,'roar'));const ch=Math.floor((t-T.em1-T.say)*34/2);if(ch>=0&&ch*2<g.env.tr(S.K.line).length)once('bl'+ch,()=>this.snd(g,'blip'));}   /* the roar, then its voice while the words appear */
    if(t>=T.wish){S.ph='wait';this.unbindSkip();g.modal=S.kind==='shenron'?{type:'wish',options:['revive','power','fortune','tickets']}:{type:'swish',options:this.superOpts(g)};}
  },
  /* after the wish: the dragon leaves */
  leave(g){const S=g.summon;if(!S)return;S.ph='leave';S.lt=0;g.flash=Math.max(g.flash||0,.5);g.flashC='#ffffff';this.snd(g,'leave');},
  /* the 8-bit sounds of the summoning (AudioSys.summon) */
  snd(g,step,i){const a=g.audio,S=g.summon;if(a&&a.summon)a.summon(step,!!S&&S.kind==='porunga',i,S&&S.x2?2:1);},
  /* the Super Dragon Balls' wish: a Lucky Ticket 10x, or one of up to three characters you do not have yet */
  superOpts(g){
    const d=g.save,locked=CHARS.filter(c=>!d.unlocked.includes(c.id));
    for(let i=locked.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[locked[i],locked[j]]=[locked[j],locked[i]];}
    return ['lucky',...locked.slice(0,3).map(c=>'char:'+c.id)];
  },
  /* skip to the wish: click / tap on the game, Enter, Space */
  bindSkip(g){
    this.unbindSkip();
    const go=e=>{const S=g.summon;if(!S||S.ph!=='in')return;
      if(e.type==='keydown'&&(e.key==='x'||e.key==='X'||e.key==='2')){S.x2=!S.x2;return;}
      if(e.type==='pointerdown'&&S.btn){const cv=document.getElementById('c'),r=cv&&cv.getBoundingClientRect();
        if(r&&r.width){const x=(e.clientX-r.left)*cv.width/r.width,y=(e.clientY-r.top)*cv.height/r.height,b=S.btn;if(x>=b[0]&&x<=b[0]+b[2]&&y>=b[1]&&y<=b[1]+b[3]){S.x2=!S.x2;e.preventDefault();return;}}}
      if(S.t<.4)return;if(e.type==='keydown'&&e.key!=='Enter'&&e.key!==' ')return;if(e.type==='pointerdown'&&e.target&&e.target.closest&&e.target.closest('button,.screen'))return;
      for(let i=0;i<S.stars.length;i++)S.fired['f'+i]=1;S.fired.rise=S.fired.burst=S.fired.em=1;for(const b of S.bolts)S.fired['b'+b.t]=1;S.t=Math.max(S.t,this.T.wish-.45);};
    this._sk=go;window.addEventListener('keydown',go,true);window.addEventListener('pointerdown',go,true);
  },
  unbindSkip(){if(this._sk){window.removeEventListener('keydown',this._sk,true);window.removeEventListener('pointerdown',this._sk,true);this._sk=null;}},
  ease(u){u=clamp(u,0,1);return u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;},
  /* ---- drawing (screen space; R = the Renderer, its ctx without transform). hx, hy = the hero's chest on screen, gy = his feet ---- */
  draw(R,g,hx,hy){
    const S=g.summon;if(!S)return;const gy=R.H*.995;   /* the dragon stands on the bottom of the screen, as tall as the screen; the hero in front of it */
    const c=R.ctx,W=R.W,H=R.H,U=R.U,K=S.K,T=this.T,t=S.ph==='leave'?T.wish:S.t,lt=S.ph==='leave'?S.lt:0,rt=performance.now()/1000,red=FXL.on;
    const out=S.ph==='leave'?clamp((lt-.35)/(T.leave-.35),0,1):0;   /* the sky clearing */
    /* darkness and storm clouds */
    const dk=clamp(t/T.dark,0,1)*(1-out);
    c.fillStyle='rgba('+K.sky+','+(.86*dk).toFixed(3)+')';c.fillRect(0,0,W,H);
    for(const q of S.clouds){
      const x=((q.x+q.v*rt)%1.3+1.3)%1.3*W-W*.15,y=q.y*H,r=q.r*Math.max(W,H)*.5;
      c.fillStyle='rgba('+K.cloud+','+(q.a*.55*dk).toFixed(3)+')';c.beginPath();c.ellipse(x,y,r,r*.36,0,0,TAU);c.fill();
    }
    /* lightning */
    for(const b of S.bolts){const age=t-b.t;if(age<0||age>.22||S.ph==='leave')continue;
      const a=1-age/.22;c.save();c.globalCompositeOperation='lighter';c.strokeStyle=K.bolt;c.lineWidth=(2.5+3*a)*U;c.globalAlpha=a;c.beginPath();
      let x=b.x*W,y=0;c.moveTo(x,y);for(let k=1;k<=9;k++){y=k/9*H*(.45+.25*(b.seed%1));x+=(hash(k,b.seed)-.5)*70*U;c.lineTo(x,y);}c.stroke();
      if(!red){c.globalAlpha=a*.18;c.fillStyle=K.bolt;c.fillRect(0,0,W,H);}c.restore();}
    const n=S.stars.length,cx=W/2,cy=H*.17,rr=Math.min(W,H)*(n>3?.17:.12),bs=34*U*K.big,img=R.ballSheet();
    const ringA=t*1.1+Math.max(0,t-T.fl0)*2.5;
    const ballAt=(i,tt)=>{   /* where ball i is at time tt (rise from the hero, spiral, ring; then rush to the middle) */
      const u=this.ease((tt-T.rise0-i*.07)/T.rise),a=i/n*TAU+ringA,ex=cx+Math.cos(a)*rr,ey=cy+Math.sin(a)*rr*.55,sw=Math.sin(u*Math.PI)*90*U*(i%2?1:-1);
      let x=hx+(ex-hx)*u+sw,y=hy+(ey-hy)*u;
      if(tt>T.rush){const v=this.ease((tt-T.rush)/(T.burst-T.rush));x+=(cx-x)*v;y+=(cy-y)*v;}
      return[x,y];
    };
    const drawBall=(x,y,s,star,al,flash)=>{
      c.globalAlpha=al;GLOW.at(c,x,y,s*(1.5+flash*1.6),K.ball,.75);if(flash>0)GLOW.at(c,x,y,s*(1+flash*2.4),'#ffffff',flash*(red?.4:.95));
      if(img)c.drawImage(img,(clamp(star,1,7)-1)*64,0,64,64,x-s/2,y-s/2,s,s);else{c.fillStyle=K.ball;c.beginPath();c.arc(x,y,s*.45,0,TAU);c.fill();}
      c.globalAlpha=1;
    };
    if(S.ph!=='leave'&&t>=T.rise0&&t<T.burst){
      c.imageSmoothingEnabled=true;
      for(let i=0;i<n;i++){
        if(t<T.rise0+i*.07)continue;
        for(let k=6;k>=1;k--){const [x,y]=ballAt(i,t-k*.035);c.globalAlpha=.08*(7-k);c.fillStyle=K.glow2;c.beginPath();c.arc(x,y,bs*.32*(1-k/9),0,TAU);c.fill();}   /* trail */
        const [x,y]=ballAt(i,t),ft=T.fl0+(T.fl1-T.fl0)*i/n,fl=t>=ft?Math.max(0,1-(t-ft)/.28):0,pul=t>T.fl1?.5+.5*Math.sin(t*30):0;
        drawBall(x,y,bs,S.stars[i],1,Math.max(fl,pul*.6));
      }
      if(t>T.fl0){c.globalCompositeOperation='lighter';GLOW.at(c,cx,cy,rr*1.6*(1+.4*Math.sin(t*9)),K.glow,clamp((t-T.fl0)/.8,0,1)*.45);c.globalCompositeOperation='source-over';}
    }
    /* the blinding flash */
    const bf=t>=T.burst&&S.ph!=='leave'?Math.max(0,1-(t-T.burst)/.55):0;
    /* pillar of light from the ground */
    const pil=S.ph==='leave'?0:clamp((t-T.burst)/.25,0,1)*(1-clamp((t-T.em1-.2)/.8,0,1)*.75);
    if(pil>0){
      const pw=(70+40*Math.sin(rt*14))*U*pil,gr=c.createLinearGradient(cx-pw,0,cx+pw,0);
      gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.5,K.glow2);gr.addColorStop(1,'rgba(255,255,255,0)');
      c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.8*pil;c.fillStyle=gr;c.fillRect(cx-pw,0,pw*2,gy);
      GLOW.at(c,cx,gy,pw*2.4,K.glow,.9*pil);c.restore();
    }
    /* the dragon */
    const D=Sprites.sheets&&Sprites.sheets[K.sheet];
    if(D&&D.img&&t>=T.em0){
      const fw=D.img.width/3,fh=D.img.height,dh=H*.97,k=dh/fh,dw=fw*k;
      const em=this.ease((t-T.em0)/(T.em1-T.em0)),idle=t>=T.em1||S.ph==='leave';
      const fr=idle?[0,1,0,2][Math.floor(rt*2.2)%4]:0,bob=idle?Math.sin(rt*1.3)*6*U:0;
      const sc=S.ph==='leave'?1-.08*clamp(lt/.6,0,1):1,al=S.ph==='leave'?1-clamp(lt/.6,0,1):1;
      const x=cx-dw*sc/2,y=gy-dh*sc+bob+(1-sc)*dh;
      if(al>0){
        c.save();c.imageSmoothingEnabled=true;
        if(!idle){c.beginPath();c.rect(0,gy-dh*1.05*em,W,dh*1.05*em+4);c.clip();}   /* coming out of the light from the tail up */
        c.globalAlpha=al;
        if(!red){c.shadowColor=K.glow;c.shadowBlur=(idle?26:46)*U;}
        c.drawImage(D.img,fr*fw,0,fw,fh,x,y,dw*sc,dh*sc);
        c.shadowBlur=0;
        const hot=idle?(S.ph==='leave'?clamp(1-lt/.4,0,1):.12+.06*Math.sin(rt*3)):1-em*.85;   /* the light it is made of, fading into its colours */
        if(hot>0){c.globalCompositeOperation='lighter';c.globalAlpha=hot*al*(red?.5:1);c.drawImage(D.img,fr*fw,0,fw,fh,x,y,dw*sc,dh*sc);}
        c.restore();
        if(!idle){const ly=gy-dh*1.05*em;c.globalCompositeOperation='lighter';GLOW.at(c,cx,ly,90*U,K.glow2,.8);GLOW.at(c,cx,ly,40*U,'#ffffff',.8);c.globalCompositeOperation='source-over';}   /* the light at the edge it is coming out of */
      }
    }
    /* the balls scatter when it leaves */
    if(S.ph==='leave'&&lt<1.4){
      const ox=cx,oy=H*.35;c.imageSmoothingEnabled=true;
      for(let i=0;i<n;i++){const a=i/n*TAU+.4,v=this.ease(lt/1.4),x=ox+Math.cos(a)*v*Math.max(W,H)*.75,y=oy+Math.sin(a)*v*Math.max(W,H)*.5;
        for(let k=5;k>=1;k--){const v2=this.ease((lt-k*.04)/1.4);c.globalAlpha=.1*(6-k)*(1-v);c.fillStyle=K.glow2;c.beginPath();c.arc(ox+Math.cos(a)*v2*Math.max(W,H)*.75,oy+Math.sin(a)*v2*Math.max(W,H)*.5,bs*.25,0,TAU);c.fill();}
        drawBall(x,y,bs*.8,S.stars[i],1-v*.6,0);}
    }
    if(bf>0){c.globalAlpha=bf*(red?.35:1);c.fillStyle='#ffffff';c.fillRect(0,0,W,H);c.globalAlpha=1;}
    /* what the dragon says */
    if(S.ph==='in'&&t>=T.em1){
      const txt=g.env.tr(K.line),nch=Math.max(0,Math.min(txt.length,Math.floor((t-T.em1-T.say)*34))),s=txt.slice(0,nch),fs=Math.round(26*U);
      c.save();c.font='900 '+fs+'px "Bangers","Rajdhani",sans-serif';c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
      const y=H*.86,w=Math.min(W*.92,c.measureText(txt).width+60*U);
      c.fillStyle='rgba(0,0,0,.55)';c.fillRect(cx-w/2,y-fs*1.1,w,fs*2.2);c.strokeStyle=K.glow2;c.lineWidth=2*U;c.strokeRect(cx-w/2,y-fs*1.1,w,fs*2.2);
      c.lineWidth=5*U;c.strokeStyle='#1a0802';c.strokeText(s,cx,y);c.fillStyle=K.glow2;c.fillText(s,cx,y);c.restore();
    }
    if(S.ph==='in'&&t>.4&&t<T.wish-.5){c.save();c.font='700 '+Math.round(13*U)+'px "Rajdhani",sans-serif';c.textAlign='right';c.fillStyle='rgba(255,255,255,'+(.55*dk).toFixed(2)+')';
      c.fillText(g.env.tr(T6('Clic / Invio: salta · X: ×2','Click / Enter: skip · X: ×2','Clic / Intro: saltar · X: ×2','Clic / Entrée : passer · X : ×2','Klick / Enter: überspringen · X: ×2','Clique / Enter: pular · X: ×2')),W-16*U,H-16*U);c.restore();}
    /* the ×2 button, at the bottom */
    if(S.ph==='in'&&t<T.wish-.3){
      const bw=64*U,bh=28*U,bx=W/2-bw/2,by=H-bh-8*U;S.btn=[bx,by,bw,bh];
      c.save();c.globalAlpha=Math.max(.35,dk);c.fillStyle=S.x2?K.glow2:'rgba(0,0,0,.55)';c.strokeStyle=K.glow2;c.lineWidth=2*U;
      c.beginPath();if(c.roundRect)c.roundRect(bx,by,bw,bh,8*U);else c.rect(bx,by,bw,bh);c.fill();c.stroke();
      c.fillStyle=S.x2?'#1a0802':K.glow2;c.font='900 '+Math.round(17*U)+'px "Rajdhani",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('×2',W/2,by+bh/2+1);c.restore();
    }else S.btn=null;
    c.globalAlpha=1;c.globalCompositeOperation='source-over';
  }
};
