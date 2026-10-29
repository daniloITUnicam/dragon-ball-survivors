'use strict';
/* ====== v115: character mastery — every run gives the character XP (save.mastery[id] = {xp, skin}).
   Lv 3 / Lv 7: alternative colours, Lv 5: a small passive of its own (from its ability type), Lv 10: a title ====== */
const MAST_MAX=10,MAST_SKIN_LV=[0,3,7],MAST_PASS_LV=5,MAST_TITLE_LV=10;
const mastNeed=l=>150+100*l;   /* XP from level l to l+1 */
/* per ability type: the passive (keys of Game.recalc's shared stats: might/spd/cd are fractions, hp and regen flat, magnet a fraction) */
const MAST_PASS={kaioken:{might:.05},beam:{cd:.04},sbc:{might:.05},blind:{spd:.05},nova:{might:.04},dash:{spd:.06},clones:{cd:.04},crit:{might:.05},barrier:{hp:15},berserk:{hp:15},
  absorb:{regen:.4},regen:{regen:.5},ghosts:{cd:.04},jackpot:{magnet:.15},buff:{might:.04},sphere:{cd:.04},timestop:{cd:.05},erase:{might:.05},rewind:{hp:15}};
/* skins: hue rotation in degrees (skin tones, whites, greys and blacks are kept) */
const MAST_SKINS=[0,140,235];
/* v116: Potara / Metamoran fusions — with both parents at Mastery Lv FUSE_LV you can play the fused warrior for a run, with the parents' weapons too */
const FUSE_LV=5,FUSE_MIGHT=.15,FUSE_HP=20,CHAR_FUSIONS=[{id:'vegito',a:'goku',b:'vegeta',k:'potara'},{id:'gogeta',a:'goku',b:'vegeta',k:'meta'},{id:'gotenks',a:'goten',b:'trunks',k:'meta'},
  {id:'kefla',a:'kale',b:'caulifla',k:'potara'},{id:'fzamasu',a:'zamasu',b:'black',k:'potara'}];
const fuseKind=k=>k==='potara'?T6('Orecchini Potara','Potara earrings','Pendientes Potara','Boucles Potara','Potara-Ohrringe','Brincos Potara'):T6('Danza di Metamor','Metamoran dance','Danza Metamor','Danse Métamor','Metamor-Tanz','Dança Metamor');
const Mastery={
  fuseOpen(save,f){return this.lv(save,f.a)>=FUSE_LV&&this.lv(save,f.b)>=FUSE_LV;},
  rec(save,id){const m=save.mastery||(save.mastery={});return m[id]||(m[id]={xp:0,skin:0});},
  lvOf(xp){let l=1;while(l<MAST_MAX&&xp>=mastNeed(l)){xp-=mastNeed(l);l++;}return{lv:l,into:xp,need:l<MAST_MAX?mastNeed(l):0};},
  skinOf(save,id){const r=(save.mastery||{})[id];return r&&r.skin&&this.lv(save,id)>=MAST_SKIN_LV[r.skin]?r.skin:0;},
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
  title(id){const C=CHARS.find(c=>c.id===id),n=C?C.n:{it:id,en:id};
    return T6('Maestro '+(n.it||n.en),(n.en||n.it)+' Master','Maestro '+(n.en||n.it),'Maître '+(n.en||n.it),'Meister '+(n.en||n.it),'Mestre '+(n.en||n.it));},
  /* recoloured copy of a sprite canvas, cached per source canvas */
  _cache:new WeakMap(),
  skinned(c,skin){
    const deg=MAST_SKINS[skin]||0;if(!deg||!c||!c.width)return c;
    let m=this._cache.get(c);if(!m)this._cache.set(c,m={});if(m[deg])return m[deg];
    const o=document.createElement('canvas');o.width=c.width;o.height=c.height;const x=o.getContext('2d');x.drawImage(c,0,0);
    const im=x.getImageData(0,0,o.width,o.height),d=im.data,rot=deg/360;
    for(let i=0;i<d.length;i+=4){if(d[i+3]<8)continue;
      const r=d[i]/255,gg=d[i+1]/255,b=d[i+2]/255,mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),l=(mx+mn)/2,dl=mx-mn;if(dl<.12)continue;   /* greys, whites, blacks */
      const s=dl/(1-Math.abs(2*l-1)||1);let h=mx===r?((gg-b)/dl)%6:mx===gg?(b-r)/dl+2:(r-gg)/dl+4;h/=6;if(h<0)h+=1;
      if(h>.01&&h<.12&&s<.8&&l>.3)continue;   /* skin tones */
      h=(h+rot)%1;const q=(1-Math.abs(2*l-1))*s,X=q*(1-Math.abs((h*6)%2-1)),M=l-q/2,k=(h*6)|0;
      const [R,G,B]=k===0?[q,X,0]:k===1?[X,q,0]:k===2?[0,q,X]:k===3?[0,X,q]:k===4?[X,0,q]:[q,0,X];
      d[i]=(R+M)*255;d[i+1]=(G+M)*255;d[i+2]=(B+M)*255;}
    x.putImageData(im,0,0);return m[deg]=o;
  }
};
