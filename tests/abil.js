const {X}=require('./sim.js');
const audio=new Proxy({},{get:()=>()=>{}});
const ids=Object.keys(X.ABIL||{});
const mem={};const save=new X.SaveData({getItem:k=>mem[k]||null,setItem:(k,v)=>{mem[k]=v;}});
let bad=0;
for(const id of Object.keys(X.ABIL)){
  const g=new X.Game({stage:1,char:id,diff:'normal',x2:false,sandbox:true},{save,audio,progress:new X.Progress(save,()=>{}),tr:o=>typeof o==='string'?o:o.it,onEnd:()=>{}});
  g.sb.god=true;g.setLevel(16);
  for(let i=0;i<300;i++){g.update(1/30);if(g.modal)g.modal=null;}
  const nE=g.en.length,hp0=g.p.hp;g.p.hp=g.p.maxHp*.6;
  const ok=g.useAbility();
  let err=null;
  try{for(let i=0;i<30*12;i++){g.update(1/30);if(g.modal)g.modal=null;}}catch(e){err=e.message;}
  const a=g.abil;
  console.log(id.padEnd(9),a.m.padEnd(8),'used',ok,'cd',g.abCd.toFixed(1),'hp',Math.round(g.p.hp)+'/'+g.p.maxHp,'enemies',nE,'->',g.en.length,err?'ERR '+err:'');
  if(err||!ok&&a.m!=='kaioken')bad++;
}
console.log('problems',bad);
