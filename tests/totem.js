const {X}=require('./sim.js');
const audio=new Proxy({},{get:()=>()=>{}});
function mk(){const mem={};const save=new X.SaveData({getItem:k=>mem[k]||null,setItem:(k,v)=>{mem[k]=v;}});
 const g=new X.Game({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true},{save,audio,progress:new X.Progress(save,()=>{}),tr:o=>typeof o==='string'?o:o.it,onEnd:()=>{}});return g;}
let g=mk();g.sb.god=true;g.sb.nospawn=true;
// spawn timing: only once
let spawns=0,seen=false;
for(let i=0;i<30*500;i++){g.update(1/30);if(g.modal&&g.modal.type==='level')g.modal=null;
  const t=g.feat.find(f=>f.kind==='totem');if(t&&!seen){seen=true;spawns++;}
  if(g.modal&&g.modal.type==='totem'){}
  if(g.p.hp<=0)g.p.hp=g.p.maxHp;
  if(t&&g.t>400)break;}
console.log('totem spawned',spawns,'present',!!g.feat.find(f=>f.kind==='totem'));
const t=g.feat.find(f=>f.kind==='totem');if(t){g.feat.splice(g.feat.indexOf(t),1);g.map.totemT=0;}
for(let i=0;i<30*60;i++){g.update(1/30);if(g.modal&&g.modal.type==='level')g.modal=null;if(g.p.hp<=0)g.p.hp=g.p.maxHp;}
console.log('after removal and 60s, new totem?',!!g.feat.find(f=>f.kind==='totem'),'(should be false)');
for(const id of ['luck','risk','vigor','fury','wealth','guard','storm','spirit']){
  const h=mk();h.sb={nospawn:true};const b={m:h.S.might,c:h.S.cd,mh:h.p.maxHp,gold:h.S.gold,mag:h.S.magnet};
  h.applyTotem(id);
  for(let i=0;i<30*40;i++)h.update(1/30);
  console.log(id.padEnd(7),'might x'+(h.S.might/b.m).toFixed(2),'cd x'+(h.S.cd/b.c).toFixed(2),'maxHp',b.mh,'->',h.p.maxHp,'gold',b.gold.toFixed(2),'->',h.S.gold.toFixed(2),'mag x'+(h.S.magnet/b.mag).toFixed(2),'barrier',h.barrierReady);
}
const o=mk().rollTotems();console.log('offer',o.join(','));
