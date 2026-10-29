'use strict';
/* ====== v116: boss extras — guard bar (break it: 3 s stun, +25% damage taken), the surprise boss from another saga, the named finishing move ====== */
const GD_P=.5,GD_K=.14,GD_STUN=3,GD_TAKEN=1.25,GD_REGEN=.12,GD_WAIT=3,SB_P=.25,SB_AT=[.4,.62];
const BOSSX={
  /* a boss that just spawned may get a guard (never minibosses, sparring or the tunnel boss) */
  onSpawn(g,e){if(e.mini||e.sparring||e.tun||g.trial)return;if(e.final||Math.random()<GD_P){const m=e.max*GD_K;e.gd={v:m,max:m,last:-9,brk:0};}},
  /* damage d reached boss e: the guard soaks the hits (the health still goes down normally); returns the damage multiplier while broken */
  onHit(g,e,d){const G=e.gd;if(!G)return 1;if(G.brk>0)return GD_TAKEN;G.last=g.t;G.v-=d;
    if(G.v<=0){G.v=0;G.brk=GD_STUN;e.stun=Math.max(e.stun||0,GD_STUN);g.ring(e.x,e.y-e.r,e.r*3,'#8ad8ff',.8);g.burst(e.x,e.y-e.r,34,'#cfeaff');g.audio.sfx('boom');g.hitStop(.07,.05);
      g.floatText(e.x,e.y-e.r*2.6,g.env.tr(T6('GUARDIA ROTTA!','GUARD BREAK!','¡GUARDIA ROTA!','GARDE BRISÉE !','DECKUNG GEBROCHEN!','GUARDA QUEBRADA!')),7);g.run.guardBreaks=(g.run.guardBreaks||0)+1;}
    return 1;},
  tick(g,dt){for(const e of g.en){const G=e.gd;if(!G||e.dead)continue;
    if(G.brk>0){G.brk-=dt;if(G.brk<=0){G.brk=0;G.v=G.max*.5;}}else if(g.t-G.last>GD_WAIT)G.v=Math.min(G.max,G.v+G.max*GD_REGEN*dt);}
    /* the surprise boss */
    const S=g.sbx;if(S&&!S.done&&g.t>=S.at&&!g.trial&&!g.tun&&!g.vic&&!g.finalSpawned&&!g.modal){S.done=true;const id=this.surprisePick(g);if(id){g.spawnBoss(id,false);const e=g.en[g.en.length-1];if(e&&e.boss){e.surprise=true;
      g.say(g.env.tr(T6('BOSS A SORPRESA!','SURPRISE BOSS!','¡JEFE SORPRESA!','BOSS SURPRISE !','ÜBERRASCHUNGSBOSS!','CHEFE SURPRESA!')),'#ff3b6b',3,g.env.tr(T6('Da un\'altra saga · forziere migliore','From another saga · a better chest','De otra saga · un cofre mejor','D\'une autre saga · un meilleur coffre','Aus einer anderen Saga · eine bessere Truhe','De outra saga · um baú melhor')));
      g.flash=.4;g.flashC='#ff3b6b';g.shake=.7;}}}},
  init(g){const D=(g.D&&g.D.dur)||600;g.sbx=!g.endless&&Math.random()<SB_P?{at:rnd(SB_AT[0],SB_AT[1])*D,done:false}:null;},
  surprisePick(g){const own=new Set(g.stage.bosses.map(b=>b[0])),pool=new Set();
    STAGES.forEach(s=>{if(s===g.stage)return;for(const b of s.bosses)if(b[2]&&BOSSES[b[0]]&&!own.has(b[0])&&!BOSSES[b[0]].tama)pool.add(b[0]);});
    for(const id of['broly','cooler'])if(BOSSES[id]&&!own.has(id))pool.add(id);const L=[...pool];return L.length?L[Math.floor(Math.random()*L.length)]:null;},
  chestRar(g,e){const r=g.rollChestRar();return e.surprise?Math.max(2,Math.min(4,r+1)):r;},
  /* the finishing move of the final boss: weapon (evolution / fusion name) or the ally */
  finisherName(g,k){const w=k&&g.weapons.get(k);if(k==='ally')return T6('Alleato','Ally','Aliado','Allié','Verbündeter','Aliado');if(!w)return null;
    const f=w.fz&&FUSIONS.find(x=>x.id===w.fz);return f?f.n:w.evo?w.evoName:w.def.n;},
  /* guard bars over the bosses (world space) */
  draw(R,g,ctx,t){for(const e of g.en){const G=e.gd;if(!G||e.dead)continue;const w=Math.max(40,e.r*3),x=e.x-w/2,y=e.y-e.r*2.9;
    ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(x-1,y-1,w+2,6);ctx.fillStyle=G.brk>0?(((t*8)|0)%2?'#ffffff':'#8ad8ff'):'#59c8ff';ctx.fillRect(x,y,w*(G.brk>0?G.brk/GD_STUN:G.v/G.max),4);}},
  /* the big name of the finishing move, during the victory slow motion (screen space) */
  hud(R,g){const v=g.vic,f=g.finisher;if(!v||!f||v.t>2.8)return;const c=R.ctx,W=R.W,H=R.H,U=R.U,a=clamp(v.t/.15,0,1)*clamp((2.8-v.t)/.5,0,1),s=1+Math.max(0,.25-v.t)*2;
    c.save();c.globalAlpha=a;c.translate(W/2,H*.36);c.scale(s,s);c.textAlign='center';c.font='900 '+Math.round(64*U)+'px "Bangers","Rajdhani",sans-serif';c.lineWidth=8*U;c.strokeStyle='#000';
    const tx=R.tr(f.n).toUpperCase()+'!';c.strokeText(tx,0,0);const gr=c.createLinearGradient(0,-50*U,0,10*U);gr.addColorStop(0,'#ffffff');gr.addColorStop(1,f.c);c.fillStyle=gr;c.fillText(tx,0,0);c.restore();}
};
