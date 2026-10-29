'use strict';
/* ====== v117: boss weaknesses (+15% from one kind of weapon), the charged Kamehameha (hold the ability key), the golden Saibaman who runs off with a bag ====== */
const WEAK_K=1.15,WEAK_KINDS=['beam','shot','blast','chain'],WEAK_FIX={cell:'beam',cellmax:'beam',bu:'blast',kidbu:'blast',superbu:'blast',freezer:'shot',cooler:'shot',jiren:'chain',beerus:'blast',broly:'beam',kingpiccolo:'chain',raditz:'beam',nappa:'shot',vegeta:'blast'};
const WEAK_N={beam:T6('raggi','beams','rayos','rayons','Strahlen','raios'),shot:T6('colpi','shots','disparos','tirs','Schüsse','disparos'),blast:T6('esplosioni','blasts','explosiones','explosions','Explosionen','explosões'),chain:T6('fulmini','lightning','rayos eléctricos','éclairs','Blitze','relâmpagos')};
const KCH_MIN=.25,KCH_MAX=2,GS_FIRST=70,GS_EVERY=[80,140],GS_P=.6,GS_LIFE=10;
const EXTRAS={
  /* ---- weaknesses ---- */
  weak(id){return WEAK_FIX[id]||WEAK_KINDS[Online.hash('weak-'+id)%WEAK_KINDS.length];},
  wkind(wid){return GHOST_KIND[wid]||'blast';},
  dmgMul(g,e){if(!e.boss||!g.curW||!WEAPONS[g.curW])return 1;const ok=this.weak(e.bid)===this.wkind(g.curW);if(ok&&!(e.wkT>g.t)){e.wkT=g.t+2.5;if(g.showNums)g.floatText(e.x,e.y-e.r*2.2,g.env.tr(T6('Debole!','Weak!','¡Débil!','Faible !','Schwach!','Fraco!')),3);}return ok?WEAK_K:1;},
  onBoss(g,e){if(e.mini||e.sparring)return;g.floatText(e.x,e.y-e.r*3,g.env.tr(T6('Debole a: ','Weak to: ','Débil a: ','Faible contre : ','Schwach gegen: ','Fraco contra: '))+g.env.tr(WEAK_N[this.weak(e.bid)]),3);},
  /* ---- charged Kamehameha: hold the ability key (it still uses the ability on press) ---- */
  hold(g,on,dt){const k=g.weapons.get('kame');if(!k||g.modal||g.dying||g.ended){g.kch=0;return;}
    if(on){g.kch=Math.min(KCH_MAX,(g.kch||0)+dt);if(g.kch>KCH_MIN&&g.fx.length<420&&Math.random()<.5){const a=rnd(0,TAU),d=rnd(26,44);g.fx.push({x:g.p.x+Math.cos(a)*d,y:g.p.y-22+Math.sin(a)*d,vx:-Math.cos(a)*90,vy:-Math.sin(a)*90,l:.3,m:.3,c:k.color,s:3});}}
    else if(g.kch>KCH_MIN){g.kBoost=(g.kch-KCH_MIN)/(KCH_MAX-KCH_MIN);g.kch=0;if(!k.charge)k.cd=Math.min(k.cd,.05);g.audio.sfx('kameChargeEvo');}
    else g.kch=0;},
  /* the boost of the next beam: damage ×(1+1.5b), width ×(1+.8b), it lasts 20% longer at full charge */
  takeBoost(g){const b=g.kBoost||0;g.kBoost=0;return b;},
  /* ---- golden Saibaman ---- */
  init(g){g.gsT=GS_FIRST+rnd(0,40);},
  tick(g,dt){if(g.trial||g.tun||g.vic||g.summon)return;
    if(!g.gold&&(g.gsT-=dt)<=0){g.gsT=rnd(GS_EVERY[0],GS_EVERY[1]);if(Math.random()<GS_P&&ENEMIES.sai)this.spawnGold(g);}
    const e=g.gold;if(!e)return;if(e.dead){g.gold=null;return;}e.glife-=dt;const p=g.p,dx=e.x-p.x,dy=e.y-p.y,l=Math.hypot(dx,dy)||1,v=165*g.spdK;
    e.x+=dx/l*v*dt+Math.cos(g.t*3+e.ph)*40*dt;e.y+=dy/l*v*dt+Math.sin(g.t*2.4+e.ph)*30*dt;e.face=dx>0?1:-1;
    if(g.fx.length<430&&Math.random()<.3)g.fx.push({x:e.x,y:e.y-10,vx:rnd(-20,20),vy:-40,l:.4,m:.4,c:'#ffd23f',s:3});
    if(e.glife<=0){e.dead=true;g.gold=null;g.floatText(e.x,e.y-30,g.env.tr(T6('È scappato!','Got away!','¡Se escapó!','Il s\'est enfui !','Entkommen!','Fugiu!')),3);g.burst(e.x,e.y-10,16,'#ffd23f');}},
  spawnGold(g){const a=rnd(0,TAU),d=Math.min(260,g.viewR*.7),[x,y]=g.spawnSpot(a,d,0),e=g.mkEnemy(ENEMIES.sai,x,y);
    e.hp=e.max=Math.max(40,g.hpMul()*ENEMIES.sai.hp*6);e.spd=0;e.dmg=0;e.goldS=1;e.glife=GS_LIFE;e.ph=rnd(0,TAU);g.en.push(e);g.gold=e;
    g.say(g.env.tr(T6('Un Saibaman d\'oro!','A golden Saibaman!','¡Un Saibaman dorado!','Un Saibaman doré !','Ein goldener Saibaman!','Um Saibaman dourado!')),'#ffd23f',2,g.env.tr(T6('Prendilo entro 10 secondi','Catch it within 10 seconds','Atrápalo en 10 segundos','Attrape-le en 10 secondes','Fang ihn in 10 Sekunden','Pegue-o em 10 segundos')));g.audio.sfx('coin');},
  onKill(g,e){if(!e.goldS)return false;g.gold=null;g.run.golds=(g.run.golds||0)+1;g.spawnLoot('bag',e.x,e.y);g.spawnLoot('bag',e.x+16,e.y);g.dropGem(e.x,e.y,g.need*.25);
    g.burst(e.x,e.y-10,40,'#ffd23f');g.ring(e.x,e.y,90,'#ffd23f',.6);g.audio.sfx('coin');g.floatText(e.x,e.y-36,'💰',1);return true;},
  /* gold tint over the Saibaman (world space, after the enemies) */
  draw(R,g,ctx,t){const e=g.gold;if(!e||e.dead)return;GLOW.at(ctx,e.x,e.y-12,34,'#ffd23f',.55+.2*Math.sin(t*10));
    ctx.save();ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText('💰',e.x+e.face*-10,e.y-30);ctx.font='bold 10px sans-serif';ctx.fillStyle='#ffd23f';ctx.strokeStyle='#000';ctx.lineWidth=3;const s=Math.ceil(e.glife)+'s';ctx.strokeText(s,e.x,e.y-44);ctx.fillText(s,e.x,e.y-44);ctx.restore();}
};
/* ====== v117: weather with a light effect, the enemy album rewards, victory poses ====== */
const WX_ELEC=1.1,WX_GEM=1.2,WX_MIN=.35,ALBUM_STEPS=[{n:10,z:500},{n:25,tk:'t10'},{n:50,tk:'l10'}],VPOSE_LV=[3,6,9];
const VPOSES=[{id:'jump',n:T6('Salto di gioia','Jump for joy','Salto de alegría','Saut de joie','Freudensprung','Pulo de alegria')},{id:'power',n:T6('Esplosione d\'aura','Aura burst','Estallido de aura','Explosion d\'aura','Aura-Ausbruch','Explosão de aura')},{id:'spin',n:T6('Giravolta','Spin','Giro','Pirouette','Drehung','Giro')}];
Object.assign(EXTRAS,{
  /* the weather the renderer is showing (Ambient): rain / storm make electric attacks stronger, a sandstorm makes gems richer */
  wx(g){if(g.trial||g.tun||typeof Ambient==='undefined'||!Ambient.wxOn)return null;const k=Ambient.evK,I=Ambient.evI||0;return I>=WX_MIN&&k?{k,I}:null;},
  isElec(g,wid){const w=g.weapons.get(wid);return wid==='chain'||wid==='shock'||(!!w&&w.evo>0&&(wid==='kame'||wid==='dbeam'||wid==='sweep'));},
  wxDmg(g){const W=this.wx(g);return W&&(W.k==='rain'||W.k==='storm')&&g.curW&&this.isElec(g,g.curW)?WX_ELEC:1;},
  wxGem(g){const W=this.wx(g);return W&&W.k==='sand'?WX_GEM:1;},
  wxTag(g){const W=this.wx(g);if(!W)return null;if(W.k==='rain'||W.k==='storm')return T6('🌧 Pioggia: attacchi elettrici +10%','🌧 Rain: electric attacks +10%','🌧 Lluvia: ataques eléctricos +10%','🌧 Pluie : attaques électriques +10 %','🌧 Regen: elektrische Angriffe +10 %','🌧 Chuva: ataques elétricos +10%');
    if(W.k==='sand')return T6('🌪 Tempesta di sabbia: gemme +20%','🌪 Sandstorm: gems +20%','🌪 Tormenta de arena: gemas +20%','🌪 Tempête de sable : gemmes +20 %','🌪 Sandsturm: Edelsteine +20 %','🌪 Tempestade de areia: gemas +20%');return null;},
  /* ---- enemy album: rewards for discovering 10 / 25 / 50 enemies (glossary) ---- */
  albumN(save){const s=save.seen||{};return Object.keys(ENEMIES).filter(k=>s[k]).length;},
  albumClaim(app,i){const d=app.save.d,st=ALBUM_STEPS[i],A=d.album||(d.album={});if(A[st.n]||this.albumN(d)<st.n)return false;A[st.n]=1;if(st.z)d.zenny+=st.z;if(st.tk)d.tickets[st.tk]=(d.tickets[st.tk]||0)+1;app.save.write();return true;},
  albumLabel(st){return st.z?st.z+' Z':st.tk==='t10'?T6('Ticket 10×','10× Ticket','Ticket 10×','Ticket 10×','10×-Ticket','Ticket 10×'):T6('Ticket 10× Fortunato','Lucky Ticket 10×','Ticket 10× de la Suerte','Ticket 10× Chanceux','Glücksticket 10×','Ticket 10× da Sorte');},
  /* ---- victory poses: Lv 3 / 6 / 9 of mastery open them; the chosen one plays after VICTORY! ---- */
  posesOpen(save,id){const l=Mastery.lv(save,id);return VPOSES.filter((p,i)=>l>=VPOSE_LV[i]);},
  poseOf(save,id){const r=(save.mastery||{})[id]||{},L=this.posesOpen(save,id);return L.find(p=>p.id===r.pose)||L[0]||null;},
  /* extra transform for the hero during the pose: {oy: lift, sx/sy: scale, flip} */
  pose(g,t){const v=g.vic;if(!v||!v.boom||!g.vpose)return null;const u=v.t-(VIC_T-2.6);if(u<0)return null;
    if(g.vpose==='jump'){const ph=(u*2.2)%1,h=Math.sin(ph*Math.PI);return{oy:h*26,sx:1-.08*h,sy:1+.1*h};}
    if(g.vpose==='power'){const k=Math.min(1,u/.4);if(g.fx.length<430&&Math.random()<.6){const a=rnd(0,TAU);g.fx.push({x:g.p.x+Math.cos(a)*30,y:g.p.y-20+Math.sin(a)*20,vx:Math.cos(a)*60,vy:-120,l:.5,m:.5,c:g.formColor||'#ffd23f',s:4});}return{oy:0,sx:1+.06*k,sy:1+.1*k+.03*Math.sin(t*30)};}
    if(g.vpose==='spin'){const c=Math.cos(Math.min(1,u/1.2)*TAU*2);return{oy:Math.sin(Math.min(1,u/1.2)*Math.PI)*14,sx:c,sy:1};}
    return null;}
});
