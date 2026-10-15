const {X}=require('./sim.js');
const audio=new Proxy({},{get:()=>()=>{}});const mem={};const save=new X.SaveData({getItem:k=>mem[k]||null,setItem:(k,v)=>{mem[k]=v;}});
const g=new X.Game({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true},{save,audio,progress:new X.Progress(save,()=>{}),tr:o=>typeof o==='string'?o:o.it,onEnd:()=>{}});
g.sb.god=true;g.sb.nospawn=true;
for(let i=0;i<10;i++)g.update(1/30);
g.spawnBoss('raditz',false);const b=g.en.find(e=>e.boss);b.max=b.hp=1e7;
console.log('boss hp',Math.round(b.max),'dmg',b.dmg.toFixed(1),'tfT',b.tfT);
const log=[];let last=0,patterns={};
const oa=g.bossAttack.bind(g);g.bossAttack=function(e){const before=g.bz.length;oa(e);if(g.bz.length>before)patterns.slam=(patterns.slam||0)+1;};
for(let i=0;i<30*260;i++){g.update(1/30);if(g.modal)g.modal=null;
  if(b.tf!==last){last=b.tf;log.push('t='+(i/30).toFixed(0)+'s tf='+b.tf+' hp='+Math.round(b.hp)+'/'+Math.round(b.max)+' dmg '+b.dmg.toFixed(1)+' cd '+b.bd.cd.toFixed(2));}}
console.log(log.join('\n'));console.log('slam attacks',patterns.slam||0,'boss alive',!b.dead);
// new enemy ai
for(const id of ['rap','bru','cel']){const h=new X.Game({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true},{save,audio,progress:new X.Progress(save,()=>{}),tr:o=>typeof o==='string'?o:o.it,onEnd:()=>{}});
 h.sb.god=true;h.sb.nospawn=true;h.spawnEnemyById(id,6);let hurts=0;const oh=h.hurt.bind(h);h.hurt=(d,s)=>{hurts++;};
 for(let i=0;i<30*40;i++){h.update(1/30);if(h.modal)h.modal=null;}
 console.log(id,h.en.length,'alive; hurt calls',hurts,'bz',h.bz.length);}
