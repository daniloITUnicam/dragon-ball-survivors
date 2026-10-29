'use strict';
/* ====== v116: anime moments — Last Stand (once per run under 10% HP), an ally who drops in when things look bad, and the boss transformation as a short cinematic ====== */
const LS_HP=.1,LS_T=8,ALLY_T=15,ALLY_CD=300,ALLY_FIRST=90,ALLY_HIT=1.1,ALLY_HP=.35,ALLY_CROWD=14,BCINE_T=1.6;
/* Last Stand lines by character line (original lines, short) */
const LS_LINES={
  saiyan:T('Non è ancora finita... mi sto solo scaldando!','It is not over... I am just warming up!'),vegeta:T('Il principe dei Saiyan non cade così!','The Saiyan prince does not fall like this!'),
  saiyan2:T('Tutti contano su di me. Non mollo!','Everyone is counting on me. I will not quit!'),namek:T('Ho ancora un ultimo asso nella manica.','I still have one last card to play.'),
  human:T('Ce la posso fare. Devo farcela!','I can do this. I have to!'),android:T('Danni critici. Potenza al massimo.','Critical damage. Full power.'),
  freezer:T('Insetti! Mi avete fatto arrabbiare!','Insects! Now you have made me angry!'),cell:T('La perfezione non conosce la sconfitta.','Perfection does not know defeat.'),
  broly:T('Più forte... ancora più forte!','Stronger... even stronger!'),bu:T('Bu arrabbiato! Bu molto arrabbiato!','Buu angry! Buu very angry!'),
  gotenks:T('Il guerriero più figo non perde mai!','The coolest warrior never loses!'),pride:T('La giustizia non si piega.','Justice does not bend.'),
  god:T('Interessante. Facciamo sul serio.','Interesting. Let us get serious.'),zamasu:T('Gli dei non si arrendono ai mortali.','Gods do not yield to mortals.'),
  black:T('Questo corpo ha ancora potere da vendere.','This body still has power to spare.'),fzamasu:T('L\'immortalità non conosce la fine.','Immortality knows no end.'),
  demon:T('Il demonio ride per ultimo.','The demon laughs last.'),zeno:T('Ancora! Ancora!','Again! Again!')
};
const LS_DEF=T('Fino all\'ultimo respiro!','To my last breath!');
const MOMENTS={
  /* ---- Last Stand ---- */
  checkLastStand(g){const p=g.p;if(g.lsUsed||p.hp<=0||p.hp>=p.maxHp*LS_HP||g.dying||g.ended||g.trial)return;
    g.lsUsed=true;g.lsT=LS_T;g.abCd=0;g.bersCd=0;g.run.lsTry=1;
    g.say(g.env.tr(T6('ULTIMO RESPIRO!','LAST STAND!','¡ÚLTIMO ALIENTO!','DERNIER SOUFFLE !','LETZTER ATEMZUG!','ÚLTIMO SUSPIRO!')),'#ff5a3d',3,g.env.tr(LS_LINES[g.C.line]||LS_DEF));
    g.flash=.5;g.flashC='#ffffff';g.hitStop(.12,.08);if(g.audio.summon)g.audio.summon('rise',false,0,1.4);if(g.audio.slowMusic)g.audio.slowMusic(.85);
    g.ring(p.x,p.y,180,'#ff5a3d',.8);p.inv=Math.max(p.inv,1);},
  tickLastStand(g,dt){if(!(g.lsT>0))return;g.lsT-=dt;g.abCd=0;g.bersCd=0;   /* the ability has no cooldown */
    if(((g.lsT*1.4)|0)!==(((g.lsT+dt)*1.4)|0)&&g.audio.sfx)g.audio.sfx('hit');   /* heartbeat */
    if(g.lsT<=0){g.lsT=0;if(g.audio.slowMusic)g.audio.slowMusic(1);
      if(g.p.hp>0){g.run.lastStand=(g.run.lastStand||0)+1;g.say(g.env.tr(T6('Sopravvissuto!','Survived!','¡Sobreviviste!','Survécu !','Überlebt!','Sobreviveu!')),'#8be07a',2.4,g.env.tr(T6('Trofeo: Ultimo respiro','Trophy: Last Stand','Trofeo: Último aliento','Trophée : Dernier souffle','Trophäe: Letzter Atemzug','Troféu: Último suspiro')));g.audio.sfx('evolve');}}},
  /* ---- the ally ---- */
  allyPool(g){const s=g.save,own=g.sandbox?CHARS.map(c=>c.id):(s.unlocked||[]);return own.filter(id=>id!==g.C.id&&CHARS.some(c=>c.id===id)&&!(g.fz&&g.fz.parents.includes(id)));},
  checkAlly(g){
    if(g.ally||g.t<ALLY_FIRST||g.t<(g.allyNext||0)||g.trial||g.tun||g.dying||g.ended||g.modal||g.summon)return;
    const p=g.p;let near=0;for(const e of g.en)if(!e.dead&&Math.abs(e.x-p.x)<260&&Math.abs(e.y-p.y)<200)near++;
    const bad=p.hp<p.maxHp*ALLY_HP&&(near>=ALLY_CROWD||g.bossAlive>0);if(!bad)return;
    const pool=this.allyPool(g);if(!pool.length)return;const id=pool[Math.floor(Math.random()*pool.length)],C=CHARS.find(c=>c.id===id);
    const wid=(C.start||[]).find(w=>WEAPONS[w])||'ki';
    g.allyNext=g.t+ALLY_CD;g.ally={id,C,wid,t:ALLY_T,x:p.x-70,y:p.y-160,land:.35,hitT:.6,fl:1,atk:0};
    g.say(g.env.tr(T6(g.env.tr(C.n)+' è arrivato!',g.env.tr(C.n)+' is here!','¡'+g.env.tr(C.n)+' ha llegado!',g.env.tr(C.n)+' est arrivé !',g.env.tr(C.n)+' ist da!',g.env.tr(C.n)+' chegou!')),WEAPONS[wid].c,2.6,g.env.tr(WEAPONS[wid].n));
    g.audio.sfx('transform');g.flash=.3;g.flashC=WEAPONS[wid].c;g.hitStop(.06,.05);},
  tickAlly(g,dt){
    const a=g.ally;if(!a)return;const p=g.p;a.t-=dt;a.atk=Math.max(0,a.atk-dt);
    if(a.land>0){a.land-=dt;a.y+=(p.y-a.y)*Math.min(1,dt*9);a.x+=(p.x-70-a.x)*Math.min(1,dt*9);if(a.land<=0){g.ring(a.x,a.y,120,WEAPONS[a.wid].c,.6);g.shake=Math.max(g.shake,.4);}return;}
    const tg=g.nearest(a.x,a.y,520),side=tg&&tg.x<p.x?-1:1;
    const gx=tg?p.x+side*60:p.x-60,gy=tg?p.y-8:p.y-4,dx=gx-a.x,dy=gy-a.y,d=Math.hypot(dx,dy)||1,v=Math.min(320,d*5);a.x+=dx/d*v*dt;a.y+=dy/d*v*dt;a.mv=d>6;
    if(tg)a.fl=tg.x>=a.x?1:-1;
    a.hitT-=dt;if(tg&&a.hitT<=0){a.hitT=ALLY_HIT;a.atk=.35;this.allyStrike(g,a,tg);}
    if(a.t<=0){g.burst(a.x,a.y-20,24,WEAPONS[a.wid].c);g.ring(a.x,a.y,80,'#ffffff',.4);g.floatText(a.x,a.y-60,g.env.tr(T6('Ci vediamo!','See you!','¡Nos vemos!','À plus !','Bis dann!','Até mais!')),3);g.ally=null;}},
  /* the signature move: its first weapon at its top level, fired at the target (shots / beam / blast) */
  allyStrike(g,a,tg){
    const id=a.wid,st=WS[id]||{},col=WEAPONS[id].c,L=4,base=((st.dmg&&st.dmg[L])||14)*1.6*(1+g.lvl*.02),kind=GHOST_KIND[id]||'blast';
    const ox=a.x,oy=a.y-22,ang=Math.atan2(tg.y-8-oy,tg.x-ox),cs=Math.cos(ang),sn=Math.sin(ang);g.audio.sfx('shot');
    if(kind==='shot'){for(let i=-2;i<=2;i++){const q=ang+i*.13;g.pr.push({x:ox,y:oy,vx:Math.cos(q)*520,vy:Math.sin(q)*520,r:8,dmg:base,pi:2,life:1.3,hit:[],c:col,wid:'ally'});}}
    else if(kind==='beam'||kind==='chain'){const len=620,wd=44;for(const e of g.en){if(e.dead)continue;const rx=e.x-ox,ry=e.y-8-oy,t=rx*cs+ry*sn;if(t<-10||t>len)continue;if(Math.abs(-rx*sn+ry*cs)<wd/2+e.r){g.curW='ally';g.hit(e,base*1.3,cs*180,sn*180);}}g.curW=null;
      if(g.fx.length<420)g.fx.push({beam:true,x:ox,y:oy,a:ang,len,w:wd,l:.5,m:.5,c:col});}
    else{g.curW='ally';g.explodeAt(tg.x,tg.y,120,base*1.4,col);g.curW=null;}
  },
  /* ---- boss transformation cinematic: the camera flies to the boss, letterbox, its new name; the ground shakes when it ends ---- */
  bossCine(g,e,n,c){if(g.trial||g.tun||e.mini)return;g.bcine={e,n,c,t:0};g.audio.sfx('xcharge');},
  tickCine(g,dt){const b=g.bcine;if(!b)return false;b.t+=dt;
    if(b.t>=BCINE_T){const e=b.e;g.bcine=null;g.shake=1;g.flash=.4;g.flashC=b.c;g.audio.sfx('xburst');
      if(e&&!e.dead){g.fx.push({shock:true,x:e.x,y:e.y,max:520,l:1,m:1,c:b.c});for(const o of g.en){if(o.dead||o===e)continue;const dx=o.x-e.x,dy=o.y-e.y,l=Math.hypot(dx,dy)||1;if(l<420){o.kx+=dx/l*14;o.ky+=dy/l*14;}}}
      return false;}
    return true;},
  /* camera focus (0..1) on the boss while the cinematic runs */
  cineF(g){const b=g.bcine;if(!b)return 0;const u=b.t,ein=clamp(u/.35,0,1),eout=clamp((BCINE_T-u)/.35,0,1);return Math.min(ein*ein*(3-2*ein),eout*eout*(3-2*eout));},
  cineHud(R,g){const b=g.bcine;if(!b)return;const c=R.ctx,W=R.W,H=R.H,U=R.U,f=this.cineF(g),bar=H*.11*f;
    c.fillStyle='#000';c.fillRect(0,0,W,bar);c.fillRect(0,H-bar,W,bar);
    const k=clamp((b.t-.25)/.3,0,1)*clamp((BCINE_T-b.t)/.3,0,1),y=H*.72,sl=(1-k)*W*.3;if(k<=0)return;
    c.save();c.globalAlpha=k;const gr=c.createLinearGradient(0,0,W,0);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.5,'rgba(0,0,0,.75)');gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(0,y-40*U,W,62*U);
    c.fillStyle=b.c;c.fillRect(W*.15+sl,y+18*U,W*.7,3*U);c.textAlign='center';c.font='900 '+Math.round(44*U)+'px "Bangers","Rajdhani",sans-serif';c.lineWidth=6*U;c.strokeStyle='#000';
    const s=R.tr(b.n).toUpperCase();c.strokeText(s,W/2-sl,y+8*U);c.fillStyle='#fff';c.fillText(s,W/2-sl,y+8*U);c.restore();}
};
