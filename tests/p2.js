const {X}=require('./sim.js');
const audio=new Proxy({},{get:()=>()=>{}});const mem={};const save=new X.SaveData({getItem:k=>mem[k]||null,setItem:(k,v)=>{mem[k]=v;}});
const g=new X.Game({stage:4,char:'goku',diff:'normal',x2:false,sandbox:true},{save,audio,progress:new X.Progress(save,()=>{}),tr:o=>typeof o==='string'?o:o.it,onEnd:()=>{}});
g.spawnBoss('jiren',true);const b=g.en.find(e=>e.boss);b.hp=b.max*.4;g.update(1/30);
console.log('p2',b.p2,b.bd.n.it,b.r,b.bd.sp.u);
g.startTrial();console.log('trial1 hp',Math.round(g.trial.boss.max),'u',g.trial.boss.bd.u);g.endTrial();
g.startTrial();console.log('trial2 hp',Math.round(g.trial.boss.max),'u',g.trial.boss.bd.u);
g.trial.boss.dead=true;g.trial.killed=true;g.finishTraining();console.log('free',g.modal.freePick,g.buyOffer(0),g.modal.freePick);
