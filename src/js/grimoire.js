'use strict';
/* ====== Grimoire: every weapon, its evolutions and the passive that triggers them ======
   Opens from the pause screen (Esc, "Grimoire" tab), the character select and the main menu.
   Weapons / evolutions you have not unlocked yet are censored. */
Object.assign(UI.prototype,{
  /* "the Zenkai upgrade evolves your Kamehameha at max level" (both languages) */
  evoSentence(pid,wid,evo){
    const p=PASS[pid],w=WEAPONS[wid],wn=evo?w.evo:w.n;
    return T('Il potenziamento «'+p.n.it+'» evolve l\'arma «'+wn.it+'» al livello massimo'+(evo?' (seconda evoluzione)':'')+'.',
      'The «'+p.n.en+'» upgrade evolves your «'+wn.en+'» weapon at max level'+(evo?' (second evolution)':'')+'.');
  },
  /* small tooltip block: weapon icon + passive icon + sentence */
  evoHint(pid,wid,evo,ready){
    const w=WEAPONS[wid],p=PASS[pid],txt=this.tr(this.evoSentence(pid,wid,evo));
    return h('div',{class:'evohint'+(ready?' ready':''),title:txt},
      glyph(p.k,p.c),h('span',{class:'arr'},'➜'),glyph(w.k,w.c),h('span',{class:'et'},txt+(ready?' '+this.t('evoReady'):'')));
  },
  /* weapons the player knows about (weapon unlocked in the save, or a starter of an unlocked character) */
  grimWeaponOpen(id,g){
    const d=this.save;
    if(d.settings&&d.settings.sandbox&&g&&g.sandbox)return true;
    if(g&&g.weapons.has(id))return true;
    return !!d.wu[id]||CHARS.some(c=>c.start.includes(id)&&d.unlocked.includes(c.id));
  },
  grimEvo2Open(id,g){return !!(this.save.we[id]||(g&&g.sandbox));},
  grimBody(){
    const g=this.app.game&&this.app.state!=='menu'?this.app.game:null,d=this.save;
    const ids=Object.keys(WEAPONS);
    const open=ids.filter(id=>this.grimWeaponOpen(id,g));
    if(!this.grimSel||!WEAPONS[this.grimSel])this.grimSel=ids[0];
    const cur=this.grimSel,W=WEAPONS[cur],isOpen=open.includes(cur),evo2=this.grimEvo2Open(cur,g);
    const bar=(n)=>h('span',{class:'censor'},'█'.repeat(n||8));
    const cards=ids.map(id=>{
      const w=WEAPONS[id],ok=open.includes(id),e2=this.grimEvo2Open(id,g),wp=g&&g.weapons.get(id);
      return h('button',{class:'wcard'+(id===cur?' sel':'')+(ok?'':' locked'),'data-fid':'gw'+id,title:ok?this.tr(w.n):this.t('grimHidden'),
        onclick:()=>{this.sfx();this.grimSel=id;this.rebuild(true);}},
        ok?glyph(w.k,w.c):h('span',{class:'glyph cens',style:'--c:#33465e'},'？'),
        h('b',null,ok?this.tr(w.n):'???'),
        h('span',{class:'wst'},ok?(wp?'● ':'')+'★'+(e2?'★':'☆'):''));
    });
    /* one tier row: base weapon / first evolution / second evolution */
    const tier=(i)=>{
      const shown=i===0?isOpen:i===1?isOpen:(isOpen&&evo2);
      const nm=i===0?W.n:i===1?W.evo:W.evo2,ds=i===0?W.d:i===1?W.evoD:W.evo2D;
      const label=this.t(i===1?'evolution':'evolution2');
      const wp=g&&g.weapons.get(cur);
      const state=wp?(wp.evo>i?'done':(wp.evo===i?'now':'')):'';
      const row=h('div',{class:'tier'+(shown?'':' hide')+(state?' '+state:'')},
        shown?glyph(i?'★':W.k,i?'#ffd23f':W.c):h('span',{class:'glyph cens',style:'--c:#33465e'},'？'),
        h('div',{class:'col'},
          h('div',{class:'cl',style:'color:'+(i?'#ffd23f':W.c)},(i?'★'.repeat(i)+' '+label:this.t('grimWeapon'))),
          h('div',{class:'cn'},shown?this.tr(nm):bar(10)),
          h('div',{class:'cd'},shown?this.tr(ds):(isOpen&&i===2?this.t('grimEvo2Lock',{a:((d.wc[cur]||[]).length),b:STAGES.length}):this.t('grimWeaponLocked')))));
      if(i>0&&shown){
        const pid=evoPass(cur,i-1),p=PASS[pid],owned=g?(g.pass[pid]||0):0,wp2=g&&g.weapons.get(cur);
        const ready=!!(wp2&&wp2.evo===i-1&&g.evoReady(wp2));
        row.querySelector('.col').append(
          h('div',{class:'recipe'},h('span',{class:'lbl'},this.t('grimRecipe')+': '),
            h('span',{class:'rchip',style:'--c:'+W.c},glyph(W.k,W.c),(i>1?this.tr(W.evo):this.tr(W.n))+' · '+this.t('grimMaxLv')),
            h('span',{class:'plus'},'+'),
            h('span',{class:'rchip'+(g&&owned>0?' have':''),style:'--c:'+p.c},glyph(p.k,p.c),this.tr(p.n)+(g&&wp2?(owned>0?' ✓':' ✗'):'')),
            h('span',{class:'plus'},'➜'),
            h('span',{class:'rchip',style:'--c:#ffd23f'},glyph('★','#ffd23f'),this.tr(nm))),
          this.evoHint(pid,cur,i-1,ready));
      }
      return row;
    };
    /* stages cleared with this weapon (second evolution progress) */
    const cl=d.wc[cur]||[];
    const prog=isOpen?h('div',{class:'stprog'},h('span',{class:'lbl'},this.t('grimStages')+': '),
      STAGES.map((s,i)=>h('i',{class:cl.includes(i)||evo2?'on':'',title:'S'+s.id+' '+this.tr(s.n)},'S'+s.id))):null;
    const inRun=g&&g.weapons.get(cur);
    const detail=h('div',{class:'detail grimdetail'},
      h('h3',null,isOpen?this.tr(W.n):this.t('grimHidden')),
      inRun?h('div',{class:'cd gold'},this.t('grimOwned')+': '+'Lv '+inRun.lv+'/'+WMAX+(inRun.evo?' · '+'★'.repeat(inRun.evo):'')):null,
      tier(0),tier(1),tier(2),prog);
    return h('div',{class:'grimbody'},
      h('p',{class:'sub'},this.t('grimSub')+' · '+this.t('grimCount',{a:open.length,b:ids.length})),
      h('div',{class:'split'},h('div',{class:'grid wgrid'},cards),detail));
  },
  screen_grimoire(){
    return h('div',null,this.header('grimoire'),this.grimBody());
  }
});
