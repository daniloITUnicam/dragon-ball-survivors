'use strict';
/* ====== v115: character mastery — every run gives the character XP (save.mastery[id] = {xp}).
   Lv 5: a small passive of its own (from its ability type) ====== */
const MAST_MAX=10,MAST_PASS_LV=5;
const mastNeed=l=>150+100*l;   /* XP from level l to l+1 */
/* per ability type: the passive (keys of Game.recalc's shared stats: might/spd/cd are fractions, hp and regen flat, magnet a fraction) */
const MAST_PASS={kaioken:{might:.05},beam:{cd:.04},sbc:{might:.05},blind:{spd:.05},nova:{might:.04},dash:{spd:.06},clones:{cd:.04},crit:{might:.05},barrier:{hp:15},berserk:{hp:15},
  absorb:{regen:.4},regen:{regen:.5},ghosts:{cd:.04},jackpot:{magnet:.15},buff:{might:.04},sphere:{cd:.04},timestop:{cd:.05},erase:{might:.05},rewind:{hp:15}};
/* v116: Potara / Metamoran fusions — with both parents at Mastery Lv FUSE_LV you can play the fused warrior for a run, with the parents' weapons too */
const FUSE_LV=5,FUSE_MIGHT=.15,FUSE_HP=20,CHAR_FUSIONS=[{id:'vegito',a:'goku',b:'vegeta',k:'potara'},{id:'gogeta',a:'goku',b:'vegeta',k:'meta'},{id:'gotenks',a:'goten',b:'trunks',k:'meta'},
  {id:'kefla',a:'kale',b:'caulifla',k:'potara'},{id:'fzamasu',a:'zamasu',b:'black',k:'potara'}];
const fuseKind=k=>k==='potara'?T6('Orecchini Potara','Potara earrings','Pendientes Potara','Boucles Potara','Potara-Ohrringe','Brincos Potara'):T6('Danza di Metamor','Metamoran dance','Danza Metamor','Danse Métamor','Metamor-Tanz','Dança Metamor');
const Mastery={
  fuseOpen(save,f){return this.lv(save,f.a)>=FUSE_LV&&this.lv(save,f.b)>=FUSE_LV;},
  rec(save,id){const m=save.mastery||(save.mastery={});return m[id]||(m[id]={xp:0});},
  lvOf(xp){let l=1;while(l<MAST_MAX&&xp>=mastNeed(l)){xp-=mastNeed(l);l++;}return{lv:l,into:xp,need:l<MAST_MAX?mastNeed(l):0};},
  lv(save,id){return this.lvOf(((save.mastery||{})[id]||{}).xp||0).lv;},
  /* XP for the part of the run not counted yet (b = the game's bank, as in finishRun) */
  runXp(g,win,b){const kills=g.kills-(b.kills||0),bosses=g.run.bossKills-(b.bossKills||0),min=Math.max(0,g.t-(b.t||0))/60;
    return Math.round(kills*.1+min*15+bosses*25+(win&&!b.cleared?120:0)+(g.pacts?g.pacts.length*20:0));},
  gain(save,g,win,b){
    const r=this.rec(save,g.C.id),l0=this.lvOf(r.xp).lv,x=this.runXp(g,win,b||{});r.xp+=x;if(g.fz)for(const pid of g.fz.parents)this.rec(save,pid).xp+=x;   /* a fusion run trains both parents */
    const l1=this.lvOf(r.xp).lv;
    return{id:g.C.id,xp:x,l0,l1,...this.lvOf(r.xp)};
  },
  passive(id){const a=ABIL[id];return a&&MAST_PASS[a.m]||{might:.03};},
  passiveText(id){const p=this.passive(id),k=Object.keys(p)[0],v=p[k];
    const pc=n=>Math.round(n*100)+'%';
    return({might:T6('+'+pc(v)+' potenza','+'+pc(v)+' power','+'+pc(v)+' poder','+'+pc(v)+' puissance','+'+pc(v)+' Kraft','+'+pc(v)+' poder'),
      spd:T6('+'+pc(v)+' velocità','+'+pc(v)+' speed','+'+pc(v)+' velocidad','+'+pc(v)+' vitesse','+'+pc(v)+' Tempo','+'+pc(v)+' velocidade'),
      cd:T6('−'+pc(v)+' ricarica','−'+pc(v)+' cooldown','−'+pc(v)+' recarga','−'+pc(v)+' recharge','−'+pc(v)+' Abklingzeit','−'+pc(v)+' recarga'),
      hp:T6('+'+v+' vita massima','+'+v+' max HP','+'+v+' vida máxima','+'+v+' vie max','+'+v+' max. LP','+'+v+' vida máxima'),
      regen:T6('+'+v+' rigenerazione','+'+v+' regeneration','+'+v+' regeneración','+'+v+' régénération','+'+v+' Regeneration','+'+v+' regeneração'),
      magnet:T6('+'+pc(v)+' raggio di raccolta','+'+pc(v)+' pickup range','+'+pc(v)+' radio de recogida','+'+pc(v)+' portée de ramassage','+'+pc(v)+' Sammelradius','+'+pc(v)+' raio de coleta')})[k];},
};
