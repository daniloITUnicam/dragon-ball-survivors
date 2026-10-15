/* second wave of characters: data sanity, unlock conditions, starting senzu, jackpot scaling, form lines, full runs */
const {X}=require('./sim.js');
const audio=new Proxy({},{get:()=>()=>{}});
const mem={};const save=new X.SaveData({getItem:k=>mem[k]||null,setItem:(k,v)=>{mem[k]=v;}});
const NEW=['videl','bulma','yajirobe','saiyaman','chaozu','recoome','guldo','turles','nail','kingkai','pan','dabura','popo','uub','frost','kpiccolo'];
let bad=0;const fail=m=>{console.log('FAIL',m);bad++;};
console.log('characters total',X.CHARS.length,'(new',NEW.length+')');
const ids=new Set();
for(const c of X.CHARS){if(ids.has(c.id))fail('duplicate id '+c.id);ids.add(c.id);}
const base={t:0,lvl:1,kills:0,bossKills:0,win:false,diff:'normal',stage:-1,sid:0,x2:false,forms:0,evos:0,totKills:0,totBosses:0};
for(const id of NEW){
  const c=X.CHARS.find(x=>x.id===id);
  if(!c){fail('missing '+id);continue;}
  for(const w of c.start)if(!X.WEAPONS[w])fail(id+' bad start weapon '+w);
  if(!X.ABIL[id])fail(id+' no ability');
  if(!X.LINES[c.line||'saiyan'])fail(id+' bad line '+c.line);
  if(!c.n.it||!c.n.en||!c.d.it||!c.d.en||!c.lock.it||!c.lock.en)fail(id+' missing text');
  if(!(c.price>0))fail(id+' no price');
  /* the unlock condition must be false on an empty run and true on at least one plausible context */
  if(c.ul(base))fail(id+' unlocks on an empty run');
  const probes=[{lvl:99},{evos:3},{totKills:999999},{kills:99999},{totBosses:999},{forms:8},{win:true,sid:1},{win:true,sid:2},{win:true,sid:3,diff:'hard'},{win:true,sid:5,diff:'hard'},{win:true,sid:6},{win:true,x2:true}];
  if(!probes.some(p=>c.ul(Object.assign({},base,p))))fail(id+' unlock condition unreachable by probes');
  /* full 2 minute run with the character */
  const g=new X.Game({stage:0,char:id,diff:'normal',x2:false,sandbox:true},{save,audio,progress:new X.Progress(save,()=>{}),tr:o=>typeof o==='string'?o:o.it,onEnd:()=>{}});
  g.sb.god=true;
  if(id==='yajirobe'&&g.senzu!==1)fail('yajirobe should start with 1 senzu, has '+g.senzu);
  if(id!=='yajirobe'&&g.senzu!==0)fail(id+' should start without senzu');
  g.setLevel(60);
  let err=null;try{for(let i=0;i<30*60;i++){g.update(1/30);if(g.modal)g.modal=null;}}catch(e){err=e.message;}
  if(err)fail(id+' run error '+err);
  const ff=X.LINES[c.line||'saiyan'].length;
  console.log(id.padEnd(9),'weapons',[...g.weapons.keys()].join(',').padEnd(18),'forms',g.formsUnlocked+'/'+ff,'hp',Math.round(g.p.hp)+'/'+g.p.maxHp,err||'');
}
/* jackpot scales with ability strength */
{const mk=id=>{const g=new X.Game({stage:0,char:id,diff:'normal',x2:false,sandbox:true},{save,audio,progress:new X.Progress(save,()=>{}),tr:o=>typeof o==='string'?o:o.it,onEnd:()=>{}});g.sb.god=true;g.sb.nospawn=true;g.setLevel(10);for(let i=0;i<5;i++)g.update(1/30);g.loot.length=0;g.useAbility();return g.loot.filter(l=>l.k==='coin').length;};
 const s=mk('satan'),bu=mk('bulma');console.log('jackpot coins satan',s,'bulma',bu);if(!(bu>s))fail('bulma jackpot should drop more coins');}
console.log(bad?'PROBLEMS '+bad:'all ok');process.exit(bad?1:0);
