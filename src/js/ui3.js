'use strict';
/* ====== UI part 3: settings gear, character sorting + search, Quick Start ====== */

/* ---- character metadata for sorting / searching: [race, universe, series] ---- */
const CH_RACE={sai:T('Saiyan','Saiyan'),half:T('Mezzosangue Saiyan','Half-Saiyan'),nam:T('Namecciano','Namekian'),hum:T('Terrestre','Earthling'),and:T('Androide','Android'),maj:T('Majin','Majin'),
  arc:T('Arcosiano','Arcosian'),god:T('Divinità','Deity'),ali:T('Alieno','Alien'),fus:T('Fusione','Fusion'),dem:T('Demone','Demon'),gen:T('Genio','Genie'),bio:T('Bioandroide','Bio-Android')};
const CH_UNI={u6:[6,T('Universo 6','Universe 6')],u7:[7,T('Universo 7','Universe 7')],u10:[10,T('Universo 10','Universe 10')],u11:[11,T('Universo 11','Universe 11')],alt:[99,T('Linea temporale alternativa','Alternate timeline')]};
const CH_SER={z:[0,T('Dragon Ball Z','Dragon Ball Z')],s:[1,T('Dragon Ball Super','Dragon Ball Super')]};
const CHAR_META={
  goku:['sai','u7','z'],vegeta:['sai','u7','z'],piccolo:['nam','u7','z'],krillin:['hum','u7','z'],trunks:['half','u7','z'],yamcha:['hum','u7','z'],tien:['hum','u7','z'],gohan:['half','u7','z'],
  muten:['hum','u7','z'],goten:['half','u7','z'],c18:['and','u7','z'],broly:['sai','u7','s'],freezer:['arc','u7','z'],cell:['bio','u7','z'],bu:['maj','u7','z'],gotenks:['fus','u7','z'],
  vegito:['fus','u7','z'],satan:['hum','u7','z'],raditz:['sai','u7','z'],nappa:['sai','u7','z'],ginyu:['ali','u7','z'],zarbon:['ali','u7','z'],bardock:['sai','u7','z'],c17:['and','u7','z'],
  c16:['and','u7','z'],cooler:['arc','u7','z'],toppo:['ali','u11','s'],hit:['ali','u6','s'],kefla:['fus','u6','s'],beerus:['god','u7','s'],jiren:['ali','u11','s'],whis:['god','u7','s'],
  gogeta:['fus','u7','s'],dyspo:['ali','u11','s'],caulifla:['sai','u6','s'],gero:['and','u7','z'],c21:['and','u7','z'],kale:['sai','u6','s'],zamasu:['god','u10','s'],black:['god','alt','s'],
  fzamasu:['fus','alt','s'],videl:['hum','u7','z'],bulma:['hum','u7','z'],yajirobe:['hum','u7','z'],saiyaman:['half','u7','z'],chaozu:['hum','u7','z'],recoome:['ali','u7','z'],guldo:['ali','u7','z'],
  turles:['sai','u7','z'],nail:['nam','u7','z'],kingkai:['god','u7','z'],pan:['half','u7','z'],dabura:['dem','u7','z'],popo:['gen','u7','z'],uub:['hum','u7','z'],frost:['arc','u6','s'],kpiccolo:['dem','u7','z'],zeno:['god','u7','s']
};
const chMeta=id=>{const m=CHAR_META[id]||['ali','u7','z'];return{race:CH_RACE[m[0]],raceK:m[0],uni:CH_UNI[m[1]],ser:CH_SER[m[2]]};};
const CH_SORTS=[['default',T('Predefinito','Default')],['name',T('Nome','Name')],['race',T('Razza','Race')],['universe',T('Universo','Universe')],['series',T('Serie','Series')],
  ['hp',T('Salute','Health')],['might',T('Danno','Damage')],['spd',T('Velocità','Speed')],['open',T('Sbloccati prima','Unlocked first')]];
const normQ=x=>String(x||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');

/* ---- what a locked character asks for, read from its English requirement text ---- */
function reqInfo(en){
  let m;const num=s=>+String(s).replace(/,/g,'');
  if((m=/^Clear Stage (\d+)( on Hard)?$/.exec(en)))return{t:'stage',no:+m[1],hard:!!m[2]};
  if((m=/^Defeat ([\d,]+) bosses in total$/.exec(en)))return{t:'tot',k:'bosses',n:num(m[1])};
  if((m=/^Defeat ([\d,]+) enemies in total$/.exec(en)))return{t:'tot',k:'kills',n:num(m[1])};
  if((m=/^Defeat ([\d,]+) enemies in one run$/.exec(en)))return{t:'run',k:'kills',n:num(m[1])};
  if((m=/^Reach level (\d+) in a run$/.exec(en)))return{t:'run',k:'lvl',n:+m[1]};
  if((m=/^Unlock (\d+) transformations in a run$/.exec(en)))return{t:'run',k:'form',n:+m[1]};
  if(/^Evolve a weapon in a run$/.test(en))return{t:'run',k:'evos',n:1};
  if(/x2 modifier/.test(en))return{t:'x2'};
  return{t:'?'};
}

/* ---- weapon info (the "i" on the weapons in the pause screen): numbers with a green + where items / forms / upgrades raise them ---- */
const WI_LAB={dmg:['Danno per colpo','Damage per hit'],n:['Proiettili','Projectiles'],cd:['Ricarica','Cooldown'],aps:['Attacchi al secondo','Attacks per second'],pi:['Perforazione','Pierce'],rad:['Raggio','Radius'],r:['Raggio','Radius'],wid:['Spessore','Width'],len:['Gittata','Range'],stun:['Stordimento','Stun'],spd:['Velocità proiettile','Projectile speed'],
  crit:['Probabilità critico','Crit chance'],critDmg:['Danno critico','Crit damage']};
Object.assign(UI.prototype,{
  /* rows: {lab,fin,base,unit,tip}: fin = what the weapon does now, base = without upgrades / forms / trinkets / buffs; the green part shows the difference */
  weaponStatRows(w,g){
    const st=w.st||{},S=g.S,C=g.C,L=w.L,rows=[];
    const row=(k,base,fin,unit,tip)=>rows.push({lab:WI_LAB[k],base,fin,unit:unit||'',tip:tip||null});
    const baseMight=BASE_POWER*C.might,cb=(C.cd||1);
    if(st.dmg){const b=st.dmg[L]*w.dm*baseMight;row('dmg',b,st.dmg[L]*w.dm*S.might,'');}
    if(st.n)row('n',st.n[L]+w.e2n,st.n[L]+w.e2n+S.proj,'');
    if(st.cd){const b=st.cd[L]*cb*w.e2c,f=st.cd[L]*S.cd*w.e2c;row('cd',b,f,'s');row('aps',1/Math.max(.05,b),1/Math.max(.05,f),'/s');}
    for(const k of['rad','r','wid','len']){if(!st[k])continue;row(k,st[k][L]*w.e2a,st[k][L]*S.area*w.e2a,'');}
    if(st.pi)row('pi',st.pi[L],st.pi[L],'');
    if(st.stun)row('stun',st.stun[L],st.stun[L],'s');
    if(st.spd)row('spd',st.spd[L],st.spd[L],'');
    row('crit',5,S.crit*100,'%');
    row('critDmg',1.75,S.critDmg,'x');
    return rows;
  },
  /* the "i" badge + the popover (hover or keyboard focus) */
  weaponInfo(w,g){
    const rows=this.weaponStatRows(w,g),lv=(w.evo?'★'.repeat(w.evo)+' ':'')+'Lv '+w.lvShow;
    return h('span',{class:'winfo',tabindex:'0','data-fid':'wi'+w.id,'aria-label':this.tr(T('Statistiche','Stats'))},'i',
      h('div',{class:'wtip',style:'--c:'+w.color},h('div',{class:'wth'},h('b',null,this.tr(w.evo?w.evoName:w.def.n)),h('i',null,lv)),
        h('p',null,this.tr(w.def.d)+(w.evo?' · '+this.tr(w.evo>=2?w.def.evo2D:w.def.evoD):'')),
        h('div',{class:'wtr'},rows.map(r=>{
          const fm=v=>{const x=Math.abs(v)>=100?Math.round(v):Math.round(v*10)/10;return String(x).replace('.',',');},d=r.fin-r.base,up=Math.abs(d)>1e-6*Math.max(1,Math.abs(r.base))&&Math.abs(d)>=.005;
          return h('div',{class:'wtrow'},h('span',null,this.tr(T(r.lab[0],r.lab[1]))),
            h('b',null,fm(r.fin)+r.unit,up?h('em',{class:'gp',title:this.tr(T('Base ','Base '))+fm(r.base)+r.unit},' ('+fm(r.base)+r.unit+' '):null,up?h('em',{class:'gp'},(d>0?'+':'−')+fm(Math.abs(d))+r.unit):null,up?h('em',{class:'gb'},')'):null));})),
        h('small',null,this.tr(T('Il + verde indica un aumento dovuto a potenziamenti, trasformazioni, cimeli o altri bonus.','A green + marks a boost from upgrades, forms, trinkets or other bonuses.')))));
  },
  /* the ⚙ button that opens the settings from the stage and character screens */
  gearBtn(){
    const tip=this.t('settings');
    return h('button',{class:'btn small alt gear','data-fid':'gear',title:tip,'aria-label':tip,onclick:()=>{this.sfx();this.push('settings',{tab:'general'});}},'⚙');
  },
  /* ---------- character list: search + sorting ---------- */
  /* returns the characters to show (already filtered by the search text and sorted) */
  charList(){
    const s=this.save.settings,cf=this.cf||(this.cf={q:''}),q=normQ(cf.q.trim()),sort=s.charSort||'default',desc=!!s.charDesc;
    let list=CHARS.map((c,i)=>({c,i,m:chMeta(c.id)}));
    if(q)list=list.filter(({c,m})=>normQ([this.tr(c.n),c.id,this.tr(m.race),this.tr(m.uni[1]),this.tr(m.ser[1]),...c.start.map(w=>WEAPONS[w]?this.tr(WEAPONS[w].n):'')].join(' ')).includes(q));
    const nm=x=>this.tr(x.c.n),loc=(a,b)=>String(a).localeCompare(String(b),this.save.settings.lang||'it');
    const cmp={
      default:(a,b)=>a.i-b.i,
      name:(a,b)=>loc(nm(a),nm(b)),
      race:(a,b)=>loc(this.tr(a.m.race),this.tr(b.m.race))||a.i-b.i,
      universe:(a,b)=>a.m.uni[0]-b.m.uni[0]||a.i-b.i,
      series:(a,b)=>a.m.ser[0]-b.m.ser[0]||a.i-b.i,
      hp:(a,b)=>b.c.hp-a.c.hp||a.i-b.i,
      might:(a,b)=>b.c.might-a.c.might||a.i-b.i,
      spd:(a,b)=>b.c.spd-a.c.spd||a.i-b.i,
      open:(a,b)=>(this.charOpen(b.c.id)-this.charOpen(a.c.id))||a.i-b.i
    }[sort]||((a,b)=>a.i-b.i);
    list.sort(cmp);if(desc)list.reverse();
    return list;
  },
  /* the little toolbar above the character grid: search box + sort selector + direction. refill() redraws the grid without rebuilding the screen (the typing keeps its focus) */
  charTools(refill,countEl){
    const s=this.save.settings,cf=this.cf||(this.cf={q:''});
    const inp=h('input',{type:'text',class:'chsearch','data-fid':'chq',placeholder:'🔍 '+this.tr(T('Cerca nome, razza, universo, arma…','Search name, race, universe, weapon…')),value:cf.q,autocomplete:'off',spellcheck:'false',
      oninput:e=>{cf.q=e.target.value;clr.style.visibility=cf.q?'visible':'hidden';refill();}});
    const clr=h('button',{class:'chclear',type:'button',tabindex:'-1','aria-label':'clear',style:'visibility:'+(cf.q?'visible':'hidden'),onclick:()=>{cf.q='';inp.value='';clr.style.visibility='hidden';refill();inp.focus();}},'✕');
    const sel=h('select',{class:'chsort','data-fid':'chsort','aria-label':this.tr(T('Ordina per','Sort by')),onchange:()=>{s.charSort=sel.value;this.app.save.write();refill();}},
      CH_SORTS.map(([v,l])=>h('option',{value:v,selected:(s.charSort||'default')===v},this.tr(T('Ordina: ','Sort: '))+this.tr(l))));
    const dir=h('button',{class:'btn small alt chdir','data-fid':'chdir',title:this.tr(T('Inverti l\'ordine','Reverse the order')),onclick:()=>{this.sfx();s.charDesc=!s.charDesc;this.app.save.write();dir.textContent=s.charDesc?'↓':'↑';refill();}},s.charDesc?'↓':'↑');
    return h('div',{class:'chtools'},h('div',{class:'chsearchw'},inp,clr),sel,dir,countEl);
  },

  /* ---------- Quick Start ---------- */
  /* the things still missing, in order of how close they are: [{kind,id,ratio,cur,max,text,stage,diff,char,icon,color,name,reward}] */
  qsTargets(fromChar){
    const d=this.save,sv=(()=>{try{return this.app.progress.statsView(null);}catch(e){return null;}})()||{kills:0,bosses:0,rec:{}};
    const open=i=>this.stageOpen(i),opens=STAGE_ORDER.filter(open),first=opens[0]!==undefined?opens[0]:STAGE_ORDER[0],last=opens.length?opens[opens.length-1]:STAGE_ORDER[0];
    const lastChar=this.charOpen(fromChar||d.lastChar)?(fromChar||d.lastChar):'goku';
    const out=[],tx=o=>this.tr(o);
    /* 1. characters that are still locked */
    for(const c of CHARS){
      if(this.charOpen(c.id)||!c.lock)continue;
      const r=reqInfo(c.lock.en||''),o={kind:'char',id:c.id,name:c.n,icon:'人',color:'#ffd23f',text:c.lock,reward:T('Sblocchi il personaggio','Unlocks the character'),stage:last,diff:d.diff||'normal',char:lastChar,cur:0,max:1,ratio:0};
      if(r.t==='stage'){
        const si=STAGES.findIndex(s=>s.no===r.no);o.max=1;o.cur=si>=0&&d.clears[si]>0?(r.hard?0:1):0;
        o.stage=si>=0&&open(si)?si:first;if(r.hard)o.diff='hard';
      }else if(r.t==='tot'){o.max=r.n;o.cur=Math.min(r.n,sv[r.k]||0);o.stage=last;}
      else if(r.t==='run'){const rk={kills:'kills',lvl:'lvl',form:'form',evos:'evos'}[r.k];o.max=r.n;o.cur=Math.min(r.n,(sv.rec&&sv.rec[rk])||0);o.stage=last;}
      else if(r.t==='x2'){o.stage=first;}
      o.ratio=Math.min(1,o.cur/(o.max||1));out.push(o);
    }
    out.sort((a,b)=>b.ratio-a.ratio);
    const W=[];
    /* 2. weapons: win a stage with a character that starts with it */
    for(const id of Object.keys(WEAPONS)){
      if(id==='ki'||d.wu[id])continue;
      const owners=CHARS.filter(c=>c.start.includes(id));if(!owners.length)continue;
      const ok=owners.find(c=>this.charOpen(c.id));
      const w=WEAPONS[id];
      W.push({kind:'weapon',id,name:w.n,icon:w.k,color:w.c,text:ok?T('Vinci uno stage con '+tx(ok.n)+'.','Win a stage with '+tx(ok.n)+'.'):T('Sblocca prima '+owners.map(c=>tx(c.n)).join(' o ')+', poi vinci uno stage con '+(owners.length>1?'uno di loro':'lui/lei')+'.','First unlock '+owners.map(c=>tx(c.n)).join(' or ')+', then win a stage with them.'),
        reward:T('Sblocchi l\'arma','Unlocks the weapon'),stage:first,diff:d.diff||'normal',char:ok?ok.id:lastChar,cur:0,max:1,ratio:ok?.05:0,blocked:!ok});
    }
    W.sort((a,b)=>(a.blocked-b.blocked));
    /* 3. the next stage of the story that has not been cleared yet */
    const S=[];
    for(const i of STAGE_ORDER){if(!d.clears[i]){S.push({kind:'stage',id:i,name:STAGES[i].n,icon:'旅',color:'#7fd4ff',text:T('Completa questo stage per proseguire nella storia.','Clear this stage to move on with the story.'),reward:T('Sblocchi lo stage successivo','Opens the next stage'),
      stage:open(i)?i:first,diff:d.diff||'normal',char:lastChar,cur:0,max:1,ratio:0});break;}}
    return[...out.filter(o=>o.ratio>=.5),...S,...out.filter(o=>o.ratio<.5),...W.filter(o=>!o.blocked),...W.filter(o=>o.blocked)];
  },
  /* opens the screen from the main menu (fromChar undefined) or from the character screen (the chosen character) */
  quickStart(fromChar){
    this.qs={i:0,fromChar:fromChar||null,hold:null};this.push('quick');
  },
  screen_quick(){
    const d=this.save,qs=this.qs||(this.qs={i:0}),list=this.qsTargets(qs.fromChar);
    if(qs.i>=list.length)qs.i=0;
    const tg=list[qs.i]||null;
    let ch=tg?tg.char:(qs.fromChar||d.lastChar||'goku'),stg=tg?tg.stage:STAGE_ORDER[0],diff=tg?tg.diff:(d.diff||'normal');
    if(qs.fromChar&&tg&&tg.kind!=='weapon')ch=qs.fromChar;
    if(!this.charOpen(ch))ch='goku';
    const C=CHARS.find(c=>c.id===ch),S=STAGES[stg];
    this.anim=[];
    const big=document.createElement('canvas');big.width=150;big.height=170;
    this.anim.push({cv:big,c:C,open:true,seed:.3,key:'',w:150,h:170,base:158,k:(C.u||1.95)/Sprites.S*2.6,big:true,forms:0});
    const pv=h('canvas',{class:'stprev',width:240,height:96,'data-theme':S.theme,'data-seed':String(stg)});
    const fm=n=>Math.floor(n).toLocaleString();
    const dName=this.tr(DIFF[diff].n);
    const charCard=h('div',{class:'qscard'},h('span',{class:'lbl'},this.tr(T('Personaggio','Character'))),
      h('div',{class:'qschar'},h('div',{class:'preview qsprev'},big),h('div',{class:'qsside'},h('h3',null,this.tr(C.n)),
        h('div',{class:'chips'},C.start.map(id=>h('span',{class:'chip',style:'--c:'+WEAPONS[id].c},glyph(WEAPONS[id].k,WEAPONS[id].c),this.tr(WEAPONS[id].n)))),
        this.trinketSlot())));
    const stageCard=h('div',{class:'qscard'},h('span',{class:'lbl'},this.tr(T('Stage scelto','Chosen stage'))),
      h('div',{class:'qsstage'},pv,h('div',{class:'stnum'},'STAGE '+S.no),h('div',{class:'cn'},this.tr(S.n)),
        h('div',{class:'cd'},this.t('difficulty')+': '+dName+' · '+this.t('duration')+': '+fmtT(DIFF[diff].dur)+' · '+this.t('bosses')+': '+bossPlan(S,DIFF[diff].dur,diff).length)));
    let goal;
    if(tg){
      const pct=Math.round(tg.ratio*100),isTotal=tg.max>1;
      goal=h('div',{class:'qscard qsgoal',style:'--c:'+tg.color},h('span',{class:'lbl'},this.tr(T('Sblocco mancante','Missing unlock'))),
        h('div',{class:'qsg'},glyph(tg.icon,tg.color),h('div',{class:'col'},h('div',{class:'cn'},tg.kind==='stage'?'STAGE '+STAGES[tg.id].no+' · '+this.tr(tg.name):this.tr(tg.name)),
          h('div',{class:'cl',style:'color:'+tg.color},this.tr(tg.reward)),h('div',{class:'cd'},this.tr(tg.text)),
          tg.blocked?h('div',{class:'cd bad'},this.tr(T('Non puoi ancora farlo: manca un personaggio.','You cannot do this yet: a character is missing.'))):null,
          isTotal?h('div',{class:'achbar'},h('i',{style:'width:'+Math.max(2,pct)+'%'})):null,
          isTotal?h('div',{class:'achmeta'},h('span',{class:'achprog'},fm(tg.cur)+' / '+fm(tg.max)+' ('+pct+'%)')):null)),
        list.length>1?h('div',{class:'row qsmore'},h('button',{class:'btn small alt','data-fid':'qsnext',onclick:()=>{this.sfx();qs.i=(qs.i+1)%list.length;this.rebuild(true);}},'↻ '+this.tr(T('Altro suggerimento','Another suggestion'))+' ('+(qs.i+1)+'/'+list.length+')')):null);
    }else goal=h('div',{class:'qscard qsgoal'},h('span',{class:'lbl'},this.tr(T('Sblocco mancante','Missing unlock'))),h('p',{class:'sub'},'🏆 '+this.tr(T('Hai sbloccato tutto quello che c\'era da sbloccare: gioca per il record!','You unlocked everything there is to unlock: play for the record!'))));
    const go=()=>{this.sfx('uiStart');d.lastChar=ch;d.lastStage=stg;d.diff=diff;this.sel.char=ch;this.sel.stage=stg;this.sel.diff=diff;this.sel.x2=false;this.app.save.write();
      this.app.startGame({stage:stg,char:ch,diff,x2:false,sandbox:false,pet:d.pet});};
    return h('div',{class:'qsscr'},this.header('quickStart'),
      h('div',{class:'row topact'},h('button',{class:'btn primary','data-focus':true,'data-fid':'qsgo',onclick:go},'⚡ '+this.tr(T('Avvia','Start')))),
      h('div',{class:'qsgrid'},charCard,stageCard,goal),
      h('div',{class:'row'},h('button',{class:'btn small alt','data-fid':'qsman',onclick:()=>{this.sfx();this.sel.stage=stg;this.sel.char=ch;this.sel.diff=diff;this.stack.pop().el.remove();this.push('stages');}},this.tr(T('Scegli a mano','Choose manually')))));
  }
});
