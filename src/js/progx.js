'use strict';
/* ====== v116: weapon diary (lifetime kills per weapon: borders and titles, cosmetic), live personal records, daily stage mutators ====== */
const WD_TIERS=[{n:1000,c:'#d08a4a',t:T6('Esperto','Adept','Experto','Expert','Experte','Especialista')},{n:10000,c:'#d8e0ea',t:T6('Maestro','Master','Maestro','Maître','Meister','Mestre')},{n:100000,c:'#ffd23f',t:T6('Leggenda','Legend','Leyenda','Légende','Legende','Lenda')}];
const DAILY_MUTS=[
  {id:'xp',fx:{xp:1.2},n:T6('Gemme +20% esperienza','Gems +20% experience','Gemas +20% de experiencia','Gemmes +20 % d\'expérience','Edelsteine +20 % Erfahrung','Gemas +20% de experiência')},
  {id:'zenny',fx:{zenny:1.2},n:T6('+20% Zenny','+20% Zenny','+20% de Zenny','+20 % de Zenny','+20 % Zenny','+20% de Zenny')},
  {id:'ehp',fx:{ehp:.9},n:T6('Nemici −10% vita','Enemies −10% HP','Enemigos −10% de vida','Ennemis −10 % de vie','Gegner −10 % LP','Inimigos −10% de vida')},
  {id:'spd',fx:{spd:.08},n:T6('+8% velocità','+8% speed','+8% de velocidad','+8 % de vitesse','+8 % Tempo','+8% de velocidade')},
  {id:'mag',fx:{magnet:.3},n:T6('+30% raggio di raccolta','+30% pickup range','+30% de radio de recogida','+30 % de portée de ramassage','+30 % Sammelradius','+30% de raio de coleta')}
];
const PROGX={
  /* ---- weapon diary ---- */
  wkTier(n){let r=null;for(const t of WD_TIERS)if(n>=t.n)r=t;return r;},
  wkAll(g,id){return((g.save.wk||{})[id]||0)+((g.wkills||{})[id]||0);},
  onKill(g){const k=g.curW;if(!k||!WEAPONS[k])return;const W=g.wkills||(g.wkills={});W[k]=(W[k]||0)+1;
    const tot=this.wkAll(g,k),t=WD_TIERS.find(x=>x.n===tot);if(t)g.say(g.env.tr(WEAPONS[k].n)+' · '+g.env.tr(t.t),t.c,2.4,g.env.tr(T6(t.n.toLocaleString()+' sconfitti con quest\'arma',t.n.toLocaleString()+' defeated with this weapon',t.n.toLocaleString()+' derrotados con esta arma',t.n.toLocaleString()+' vaincus avec cette arme',t.n.toLocaleString()+' mit dieser Waffe besiegt',t.n.toLocaleString()+' derrotados com esta arma')));},
  /* finishRun: the run's kills join the diary (once: bank-like reset) */
  commit(save,g){if(!g.wkills)return;const D=save.wk||(save.wk={});for(const k in g.wkills)D[k]=(D[k]||0)+g.wkills[k];g.wkills={};},
  /* ---- live records: each one announced once per run, only when there was a record to beat ---- */
  initRec(g){const s=g.save,b=(s.best||{})[String(g.stageIdx)],st=s.stats||{};g.recs={kills:b&&b.kills||0,lvl:st.maxLevel||0,streak:(st.rec&&st.rec.streak)||0,done:{}};},
  tickRec(g){const R=g.recs;if(!R||g.sandbox)return;const chk=(k,v,txt)=>{if(!R.done[k]&&R[k]>0&&v>R[k]){R.done[k]=1;g.say(g.env.tr(T6('Nuovo record!','New record!','¡Nuevo récord!','Nouveau record !','Neuer Rekord!','Novo recorde!')),'#8be07a',2.2,g.env.tr(txt));g.audio.sfx('pkxp');}};
    const sn=g.env.tr(g.stage.n);
    chk('kills',g.kills,T6(`${g.kills} uccisioni su ${sn}`,`${g.kills} kills on ${sn}`,`${g.kills} bajas en ${sn}`,`${g.kills} éliminations sur ${sn}`,`${g.kills} Kills auf ${sn}`,`${g.kills} abates em ${sn}`));
    chk('lvl',g.lvl,T6(`livello ${g.lvl}`,`level ${g.lvl}`,`nivel ${g.lvl}`,`niveau ${g.lvl}`,`Level ${g.lvl}`,`nível ${g.lvl}`));
    chk('streak',g.streak,T6(`serie di ${g.streak}`,`streak of ${g.streak}`,`racha de ${g.streak}`,`série de ${g.streak}`,`Serie von ${g.streak}`,`sequência de ${g.streak}`));},
  /* ---- daily mutator: one stage a day (UTC), a light bonus ---- */
  dayId(d){d=d?new Date(d):new Date();return d.toISOString().slice(0,10);},
  daily(day){const r=Online.rng(Online.hash('dbs-daily-'+(day||this.dayId())));return{stage:Math.floor(r()*STAGES.length),m:DAILY_MUTS[Math.floor(r()*DAILY_MUTS.length)]};},
  forStage(i,day){const d=this.daily(day);return d.stage===i?d.m:null;}
};
