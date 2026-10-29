'use strict';
/* ====== v116: Ki Clash — a boss beam that has just charged can turn into a beam struggle: the world stops, the two beams meet,
   every key / click / button press pushes the meeting point towards the boss, the boss pushes back. Win: the boss is stunned and takes a big hit.
   Lose (or time runs out on his side): the beam lands harder than usual. ====== */
const KC_P=.4,KC_CD=40,KC_FIRST=60,KC_DUR=5,KC_TAP=.042,KC_PUSH={easy:.09,normal:.13,hard:.16,extreme:.19},KC_DMG=.12,KC_DMG_FINAL=.07,KC_STUN=4,KC_LOSE=1.5,KC_RANGE=760;
const CLASH={
  /* called when a boss beam (b) finishes charging; true = a clash started instead of the shot */
  maybe(g,b){
    const e=b.e,p=g.p;if(!e||!e.boss||e.mini||e.sparring||e.tun||g.trial||g.tun||g.dying||g.modal||g.summon||g.ended)return false;
    if(g.t<KC_FIRST||g.t<(g.kcNext||0)||Math.hypot(p.x-b.x,p.y-b.y)>KC_RANGE||Math.random()>=KC_P)return false;
    g.kcNext=g.t+KC_CD;g.clash={b,e,t:0,pos:.5,taps:0,hint:0};b.kc=1;
    g.audio.sfx('xcharge');g.flash=.3;g.flashC=b.col;g.shake=Math.max(g.shake,.4);
    g.say('KI CLASH!',b.col,1.6);this.bind(g);return true;
  },
  tap(g){const C=g.clash;if(!C||C.t<.15||C.end)return;C.pos=Math.min(1,C.pos+KC_TAP);C.taps++;C.hint=.12;if(C.taps%3===0)g.audio.sfx('hit');if(C.pos>=1)this.finish(g,true);},
  update(g,dt){
    const C=g.clash;if(!C)return;C.t+=dt;if(C.hint>0)C.hint-=dt;
    if(C.end){C.et+=dt;if(C.et>=.6){this.unbind();g.clash=null;}return;}
    if(!C.e||C.e.dead){this.finish(g,true,true);return;}
    C.pos-=(KC_PUSH[g.diffId]||KC_PUSH.normal)*(C.e.final?1.15:1)*dt*(1+.25*Math.sin(C.t*5));   /* the boss pushes in surges */
    if(C.pos>=1)this.finish(g,true);else if(C.pos<=0)this.finish(g,false);else if(C.t>=KC_DUR)this.finish(g,C.pos>=.5);
  },
  finish(g,win,silent){
    const C=g.clash,e=C.e,b=C.b,p=g.p;C.end=win?'win':'lose';C.et=0;
    if(silent){C.et=1;return;}
    if(win){const dmg=e.max*(e.final?KC_DMG_FINAL:KC_DMG);e.stun=Math.max(e.stun||0,KC_STUN);b.t=b.charge+b.fire+1;   /* his beam is gone */
      g.damageEnemy(e,dmg,0,0,true);g.run.clashes=(g.run.clashes||0)+1;
      g.ring(e.x,e.y,180,b.col,.8);g.burst(e.x,e.y-e.r,50,'#ffffff');g.flash=.6;g.flashC='#ffffff';g.shake=.9;g.audio.sfx('boom');g.hitStop(.12,.1);
      g.say(g.env.tr(T6('Ki Clash vinto!','Ki Clash won!','¡Choque de Ki ganado!','Choc de Ki gagné !','Ki-Clash gewonnen!','Choque de Ki vencido!')),'#ffd23f',2,
        g.env.tr(T6('Il boss è stordito','The boss is stunned','El jefe está aturdido','Le boss est étourdi','Der Boss ist betäubt','O chefe está atordoado')));}
    else{b.dmg*=KC_LOSE;b.t=b.charge;   /* the beam fires right now, harder */
      g.say(g.env.tr(T6('Ki Clash perso!','Ki Clash lost!','¡Choque de Ki perdido!','Choc de Ki perdu !','Ki-Clash verloren!','Choque de Ki perdido!')),'#ff6b6b',1.6);g.audio.sfx('boom');g.shake=.6;}
  },
  bind(g){this.unbind();const f=ev=>{if(!g.clash)return;if(ev.type==='keydown'){if(ev.repeat||ev.key==='Escape')return;ev.preventDefault();}this.tap(g);};
    this._f=f;window.addEventListener('keydown',f,true);window.addEventListener('pointerdown',f,true);
    /* gamepad: any button edge */
    const pad=()=>{if(!g.clash){this._pad=0;return;}const ps=navigator.getGamepads?navigator.getGamepads():[];let d=false;for(const q of ps)if(q)for(const bt of q.buttons)if(bt.pressed)d=true;if(d&&!this._pd)this.tap(g);this._pd=d;this._pad=requestAnimationFrame(pad);};
    if(typeof requestAnimationFrame!=='undefined')this._pad=requestAnimationFrame(pad);},
  unbind(){if(this._f){window.removeEventListener('keydown',this._f,true);window.removeEventListener('pointerdown',this._f,true);this._f=null;}if(this._pad){cancelAnimationFrame(this._pad);this._pad=0;}},
  /* world space (R.ctx carries the camera transform) */
  draw(R,g,ctx,t){
    const C=g.clash;if(!C)return;const p=g.p,e=C.e,b=C.b,px=p.x,py=p.y-22,ex=e.x,ey=e.y-e.r*.6;
    const mx=px+(ex-px)*C.pos,my=py+(ey-py)*C.pos,pc=g.formColor||(g.weapons.get('kame')?'#59c8ff':'#ffd23f'),fade=C.end?clamp(1-C.et/.5,0,1):1;
    const beam=(x0,y0,x1,y1,col,w)=>{ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=fade;ctx.lineCap='round';
      for(const [k,a] of [[2.4,.25],[1.4,.5],[.55,1]]){ctx.strokeStyle=k<1?'#ffffff':col;ctx.globalAlpha=a*fade;ctx.lineWidth=w*k*(1+.12*Math.sin(t*40+k));ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();}ctx.restore();};
    beam(px,py,mx,my,pc,14);beam(ex,ey,mx,my,b.col,14);
    const r=26+Math.sin(t*30)*4+(C.hint>0?8:0);GLOW.at(ctx,mx,my,r*2.2,'#ffffff',.8*fade);GLOW.at(ctx,mx,my,r*3.2,C.pos>=.5?pc:b.col,.6*fade);
    if(g.fx.length<420)for(let i=0;i<3;i++){const a=Math.random()*TAU;g.fx.push({x:mx,y:my,vx:Math.cos(a)*220,vy:Math.sin(a)*220,l:.25,m:.25,c:Math.random()<.5?pc:b.col,s:4});}
  },
  /* screen space: the title, the bar and the prompt */
  hud(R,g){
    const C=g.clash;if(!C||C.end)return;const c=R.ctx,W=R.W,H=R.H,U=R.U,bw=Math.min(520*U,W*.7),bx=W/2-bw/2,by=H*.2;
    c.save();c.textAlign='center';c.font='900 '+Math.round(34*U)+'px "Bangers","Rajdhani",sans-serif';c.lineWidth=5*U;c.strokeStyle='#000';const s=1+(C.hint>0?.08:0);
    c.translate(W/2,by-16*U);c.scale(s,s);c.strokeText('KI CLASH!',0,0);c.fillStyle='#ffd23f';c.fillText('KI CLASH!',0,0);c.setTransform(1,0,0,1,0,0);
    c.fillStyle='rgba(0,0,0,.6)';c.fillRect(bx-3*U,by-3*U,bw+6*U,20*U);
    const pc=g.formColor||'#59c8ff';c.fillStyle=pc;c.fillRect(bx,by,bw*C.pos,14*U);c.fillStyle=C.b.col;c.fillRect(bx+bw*C.pos,by,bw*(1-C.pos),14*U);
    c.fillStyle='#fff';c.fillRect(bx+bw*C.pos-2*U,by-4*U,4*U,22*U);c.fillStyle='rgba(255,255,255,.5)';c.fillRect(bx+bw/2-1,by,2,14*U);
    c.font='700 '+Math.round(16*U)+'px "Rajdhani",sans-serif';c.lineWidth=3*U;const tx=g.env.tr(T6('Premi un tasto più volte che puoi!','Mash any key!','¡Pulsa cualquier tecla sin parar!','Martèle n\'importe quelle touche !','Hämmere auf eine beliebige Taste!','Aperte qualquer tecla sem parar!'))+'  '+Math.max(0,Math.ceil(KC_DUR-C.t))+'s';
    c.strokeText(tx,W/2,by+40*U);c.fillStyle='#fff';c.fillText(tx,W/2,by+40*U);c.restore();
  }
};
