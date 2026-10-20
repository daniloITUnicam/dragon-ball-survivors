'use strict';
/* ====== v52 UI: Objectives (gold goals + daily quests) and the Achievement screen (what to do to unlock things) ====== */
const fmtClock=ms=>{const s=Math.max(0,Math.floor(ms/1000)),p=n=>String(n).padStart(2,'0');return p(Math.floor(s/3600))+':'+p(Math.floor(s%3600/60))+':'+p(s%60);};
Object.assign(UI.prototype,{
  /* rows of the goals of one screen: progress comes from the achievement's own prog(), clamped to 0..1 */
  achRows(cat,sv){
    const d=this.save,fmt=(v,u)=>u==='t'?fmtT(v):Math.floor(v).toLocaleString();
    return ACHIEVEMENTS.filter(a=>a.cat===cat).map(a=>{
      const ok=!!d.ach[a.id];let pr=[ok?1:0,1];
      if(a.prog&&sv){try{pr=a.prog(sv);}catch(e){}}
      if(ok)pr=[pr[1],pr[1],pr[2]];
      return{a,ok,cur:pr[0],max:pr[1]||1,u:pr[2],ratio:Math.min(1,(pr[0]||0)/(pr[1]||1)),fmt};
    });
  },
  /* search box + "hide completed" + "closest to completion" with the choices saved in the settings (F = settings.objF / settings.achF) */
  achToolbar(F,fill,extra){
    const save=()=>{try{this.app.save.write();}catch(e){}};
    const bh=h('button',{class:'btn small','data-fid':'achhide',onclick:()=>{this.sfx();F.hide=!F.hide;save();fill();}});
    const bn=h('button',{class:'btn small','data-fid':'achnear',onclick:()=>{this.sfx();F.near=!F.near;save();fill();}});
    const inp=h('input',{type:'text',class:'achsearch','data-fid':'achq',placeholder:'🔍 '+this.tr(T('Cerca per nome, arma o descrizione…','Search by name, weapon or description…')),value:F.q||'',autocomplete:'off',spellcheck:'false',
      oninput:e=>{F.q=e.target.value;fill();},onchange:save});
    const shown=h('span',{class:'achshown'});
    const upd=n=>{bh.className='btn small'+(F.hide?'':' alt');bh.textContent=(F.hide?'☑ ':'☐ ')+this.tr(T('Nascondi completati','Hide completed'));
      bn.className='btn small'+(F.near?'':' alt');bn.textContent=(F.near?'☑ ':'☐ ')+this.tr(T('Più vicini al completamento','Closest to completion'));
      shown.textContent=this.tr(T('Mostrati','Shown'))+' '+n.a+' / '+n.b;};
    return{bar:h('div',{class:'achtools'},inp,bh,bn,extra||null,shown),upd};
  },
  /* ---------- Objectives: daily quests + gold goals ---------- */
  screen_ach(){
    const d=this.save,F=d.settings.objF||(d.settings.objF={hide:false,near:false,q:''});
    let sv=null;try{sv=this.app.progress.statsView(null);}catch(e){}
    const rows=this.achRows('obj',sv),done=rows.filter(r=>r.ok).length;
    const card=r=>h('div',{class:'card achi'+(r.ok?' done':'')},glyph(r.ok?'★':'☆',r.ok?'#ffd23f':'#6a7a90'),
      h('div',{class:'col'},h('div',{class:'cn'},this.tr(r.a.n)),h('div',{class:'cd'},this.tr(r.a.d)),
        h('div',{class:'achbar'+(r.ok?' full':'')},h('i',{style:'width:'+Math.round(r.ratio*100)+'%'})),
        h('div',{class:'achmeta'},h('span',{class:'achprog'},r.fmt(r.cur,r.u)+' / '+r.fmt(r.max,r.u)),h('span',{class:'cl'},'+',zAmt(r.a.reward,true),r.ok?' ✓':''))));
    const grid=h('div',{class:'grid ach'});
    let tools;
    const fill=()=>{
      const q=normQ((F.q||'').trim());
      let list=rows.filter(r=>!(F.hide&&r.ok)&&(!q||normQ(this.tr(r.a.n)+' '+this.tr(r.a.d)).includes(q)));
      if(F.near)list=list.slice().sort((x,y)=>(x.ok-y.ok)||(y.ratio-x.ratio));
      grid.replaceChildren(...(list.length?list.map(card):[h('p',{class:'sub'},this.tr(T('Nessun obiettivo trovato.','No objectives found.')))]));
      tools.upd({a:list.length,b:rows.length});
    };
    tools=this.achToolbar(F,fill);fill();
    /* daily quests */
    const prog=this.app.progress,dq=prog.dqView(sv),slotEnd=(dqSlot()+1)*DQ_MS,allDone=dq.length&&dq.every(x=>x.done);
    const timer=h('span',{class:'dqtimer'});
    const tick=()=>{if(!timer.isConnected){clearInterval(iv);return;}timer.textContent=this.tr(T('Nuove missioni tra ','New quests in '))+fmtClock(slotEnd-Date.now());if(Date.now()>=slotEnd){clearInterval(iv);if(this.top&&this.top.name==='ach')this.rebuild(true);}};
    const iv=setInterval(tick,1000);setTimeout(tick,0);
    const qcard=x=>{const ok=x.done,pc=Math.min(1,x.cur/x.n);
      return h('div',{class:'card achi dq'+(ok?' done':'')},glyph(ok?'✔':'目',ok?'#8be07a':'#7fd4ff'),
        h('div',{class:'col'},h('div',{class:'cn'},this.tr(dqText(x))),
          h('div',{class:'achbar'+(ok?' full':'')},h('i',{style:'width:'+Math.round(pc*100)+'%'})),
          h('div',{class:'achmeta'},h('span',{class:'achprog'},Math.floor(x.cur).toLocaleString()+' / '+x.n.toLocaleString()),h('span',{class:'cl'},'+',zAmt(x.reward,true),ok?' ✓':''))));};
    const dqBox=h('div',{class:'dqbox'},
      h('div',{class:'dqhead'},h('b',null,'🗓 '+this.tr(T('Missioni giornaliere','Daily quests'))),timer),
      h('div',{class:'grid ach'},dq.map(qcard)),
      h('div',{class:'dqbonus'+(allDone?' done':'')},allDone?'✔ ':'🎁 ',this.tr(T('Completale tutte: ','Finish them all: ')),'+',zAmt(DQ_BONUS,true)));
    return h('div',null,this.header('achTitle'),h('p',{class:'sub'},this.t('achCount',{a:done,b:rows.length})),dqBox,tools.bar,grid);
  },
  /* ---------- Achievement: what to do to unlock characters, weapons and second evolutions + challenges ---------- */
  charProg(c,sv){
    const d=this.save,r=reqInfo((c.lock&&c.lock.en)||''),o={cur:0,max:1};
    if(r.t==='stage'){const si=STAGES.findIndex(s=>s.no===r.no);o.cur=si>=0&&d.clears[si]>0&&!r.hard?1:0;}
    else if(r.t==='tot'){o.max=r.n;o.cur=Math.min(r.n,(sv&&sv[r.k])||0);}
    else if(r.t==='run'){o.max=r.n;o.cur=Math.min(r.n,(sv&&sv.rec&&sv.rec[{kills:'kills',lvl:'lvl',form:'form',evos:'evos'}[r.k]])||0);}
    return o;
  },
  /* the numbers of a weapon without any bonus: level 1 -> level 5 (or level 5 -> evolved) */
  weaponStatic(id,evo){
    const st=WS[id]||{},a=evo?4:0,b=evo?5:4,rows=[];
    const row=(k,u,mul)=>{if(!st[k])return;rows.push({lab:WI_LAB[k],a:st[k][a]*(mul||1),b:st[k][b]*(mul||1),u:u||''});};
    row('dmg','',BASE_POWER);row('n');row('cd','s');row('rad');row('r');row('wid');row('len');row('pi');row('stun','s');row('spd');
    return rows;
  },
  weaponTip(id,evo,ok){
    const w=WEAPONS[id];
    if(!ok)return h('div',{class:'wtip ctip',style:'--c:#6a7a90'},h('p',null,'???'));
    const fm=v=>String(Math.abs(v)>=100?Math.round(v):Math.round(v*10)/10).replace('.',',');
    return h('div',{class:'wtip ctip',style:'--c:'+w.c},h('div',{class:'wth'},h('b',null,this.tr(evo?w.evo2:w.n)),h('i',null,evo?this.tr(T('Seconda evoluzione','Second evolution')):this.tr(T('Arma','Weapon')))),
      h('p',null,this.tr(evo?w.evo2D:w.d)),
      h('div',{class:'wtr'},this.weaponStatic(id,evo).map(r=>h('div',{class:'wtrow'},h('span',null,this.tr(T(r.lab[0],r.lab[1]))),h('b',null,fm(r.a)+r.u+' → '+fm(r.b)+r.u)))),
      h('small',null,evo?this.tr(T('Livello 5 → evoluzione (valori base, senza bonus).','Level 5 → evolved (base values, no bonuses).')):this.tr(T('Livello 1 → 5 (valori base, senza bonus).','Level 1 → 5 (base values, no bonuses).'))));
  },
  screen_unl(){
    const d=this.save,F=d.settings.achF||(d.settings.achF={hide:false,near:false,q:'',sec:'all'});
    let sv=null;try{sv=this.app.progress.statsView(null);}catch(e){}
    const items=[];
    /* characters that are not available from the start */
    CHARS.forEach((c,i)=>{if(!c.lock)return;const ok=d.unlocked.includes(c.id),p=this.charProg(c,sv);
      items.push({sec:'char',ord:i,ok,cur:ok?p.max:p.cur,max:p.max,ratio:ok?1:Math.min(1,p.cur/p.max),id:c.id,name:c.n,desc:c.lock,
        extra:c.price?this.tr(T('Oppure comprabile per ','Or buy it for '))+Math.round(c.price).toLocaleString()+' Z':null,
        reward:T('Sblocchi il personaggio','Unlocks the character'),key:normQ(this.tr(c.n)+' '+this.tr(c.lock)),
        icon:()=>this.portrait(c,52)||glyph('人','#ffd23f')});});
    /* weapons: win a stage with a character that starts with it; second evolution: clear every stage with it */
    for(const a of ACHIEVEMENTS){
      if(a.cat==='ach'&&/^wu_/.test(a.id)){const id=a.id.slice(3),w=WEAPONS[id],ok=!!d.wu[id];
        const own=CHARS.filter(c=>c.start.includes(id)),open=own.find(c=>d.unlocked.includes(c.id));
        const who=own.map(c=>this.tr(c.n)).join(' / ');
        items.push({sec:'wpn',ord:Object.keys(WEAPONS).indexOf(id),ok,cur:ok?1:0,max:1,ratio:ok?1:0,id,name:T('Arma: '+w.n.it,'Weapon: '+w.n.en),
          desc:own.length?T('Vinci uno stage con '+own.map(c=>c.n.it).join(' / ')+(open?'':' (sbloccalo prima)'),'Win a stage with '+own.map(c=>c.n.en).join(' / ')+(open?'':' (unlock them first)')):a.d,
          reward:T('Sblocchi l’arma','Unlocks the weapon'),gold:a.reward,key:normQ(this.tr(w.n)+' '+who+' '+(ok?this.tr(w.d):'')),w:{id,evo:false},
          icon:()=>glyph(w.k,ok?w.c:'#6a7a90')});}
      else if(a.cat==='ach'&&/^we_/.test(a.id)){const id=a.id.slice(3),w=WEAPONS[id],ok=!!d.we[id],n=(d.wc[id]||[]).length,tot=STAGES.length;
        items.push({sec:'evo',ord:Object.keys(WEAPONS).indexOf(id),ok,cur:ok?tot:n,max:tot,ratio:ok?1:n/tot,id,name:T('Evoluzione finale: '+w.n.it,'Final evolution: '+w.n.en),
          desc:T('Completa tutti gli stage (Normale o superiore) con quest’arma nell’equipaggiamento.','Clear every stage (Normal or higher) with this weapon in your build.'),
          reward:T('Sblocchi la seconda evoluzione','Unlocks the second evolution'),gold:a.reward,key:normQ(this.tr(w.n)+' '+(ok?this.tr(w.evo2):'')),w:{id,evo:true},
          icon:()=>glyph(w.k,ok?'#ffd23f':'#6a7a90')});}
      else if(a.cat==='ach'&&a.tier){const ok=!!d.ach[a.id];let pr=[0,1];if(a.prog&&sv){try{pr=a.prog(sv);}catch(e){}}if(ok)pr=[pr[1],pr[1],pr[2]];
        items.push({sec:'chal',ord:a.tier*100,ok,cur:pr[0],max:pr[1]||1,u:pr[2],ratio:Math.min(1,(pr[0]||0)/(pr[1]||1)),id:a.id,name:a.n,desc:a.d,tier:a.tier,reward:null,gold:a.reward,tk:a.tk,key:normQ(this.tr(a.n)+' '+this.tr(a.d)),
          icon:()=>glyph(ok?'★':'☆',TIER_COL[a.tier])});}
    }
    const SEC=[['all',T('Tutto','All')],['char',T('Personaggi','Characters')],['wpn',T('Armi','Weapons')],['evo',T('Evoluzioni','Evolutions')],['chal',T('Sfide','Challenges')]];
    const card=it=>{
      const fmt=v=>it.u==='t'?fmtT(v):Math.floor(v).toLocaleString();
      const tip=it.w?this.weaponTip(it.w.id,it.w.evo,it.ok):null;
      return h('div',{class:'card achi unlc'+(it.ok?' done':'')+(it.w?' achw':''),style:it.tier?'--tc:'+TIER_COL[it.tier]:null,'data-fid':'u_'+it.id},
        h('div',{class:'uic'},it.icon()),
        h('div',{class:'col'},h('div',{class:'cn'},this.tr(it.name),it.tier?h('span',{class:'tierb',style:'--tc:'+TIER_COL[it.tier]},this.tr(TIER_NAMES[it.tier])):null,
            it.w&&it.ok?h('span',{class:'winfo',tabindex:'0','data-fid':'ui_'+it.id,'aria-label':this.tr(T('Statistiche','Stats'))},'i',this.weaponTip(it.w.id,it.w.evo,true)):null),
          h('div',{class:'cd'},this.tr(it.desc)),
          h('div',{class:'achbar'+(it.ok?' full':'')},h('i',{style:'width:'+Math.round(it.ratio*100)+'%'})),
          h('div',{class:'achmeta'},h('span',{class:'achprog'},it.max>1?fmt(it.cur)+' / '+fmt(it.max):(it.ok?'1 / 1':'0 / 1')),
            h('span',{class:'cl'},it.reward?this.tr(it.reward)+' ':'',it.gold?['+',zAmt(it.gold,true),' ']:'',it.tk?Object.keys(it.tk).map(k=>[tkChip(k,it.tk[k]),' ']):null,it.ok?' ✓':'')),
          it.extra?h('div',{class:'cd unex'},it.extra):null),
        tip&&!it.ok?tip:null);};
    const grid=h('div',{class:'grid ach'});
    let tools;
    const fill=()=>{
      const q=normQ((F.q||'').trim());
      let list=items.filter(it=>(F.sec==='all'||it.sec===F.sec)&&!(F.hide&&it.ok)&&(!q||it.key.includes(q)));
      list=list.slice().sort(F.near?((x,y)=>(x.ok-y.ok)||(y.ratio-x.ratio)):((x,y)=>SEC.findIndex(s=>s[0]===x.sec)-SEC.findIndex(s=>s[0]===y.sec)||x.ord-y.ord));
      grid.replaceChildren(...(list.length?list.map(card):[h('p',{class:'sub'},this.tr(T('Nessun achievement trovato.','No achievements found.')))]));
      tools.upd({a:list.length,b:items.length});
      chips.forEach(([k,b])=>b.className='btn small'+(F.sec===k?'':' alt'));
    };
    const chips=SEC.map(([k,l])=>[k,h('button',{class:'btn small','data-fid':'usec'+k,onclick:()=>{this.sfx('uiTab');F.sec=k;try{this.app.save.write();}catch(e){}fill();}},this.tr(l))]);
    tools=this.achToolbar(F,fill);
    fill();
    const done=items.filter(i=>i.ok).length;
    return h('div',null,this.header('unlTitle'),h('p',{class:'sub'},this.t('achCount',{a:done,b:items.length})),
      h('div',{class:'row tabs unlsec'},chips.map(c=>c[1])),tools.bar,grid);
  }
});
