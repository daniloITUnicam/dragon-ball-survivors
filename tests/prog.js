// per-minute progression: node tests/prog.js <stage> <diff> <runs> <char>
const {X,bot}=require('./sim.js');
const stage=(+process.argv[2]||1)-1,diff=process.argv[3]||'normal',N=+process.argv[4]||3,ch=process.argv[5]||'goku';
const m={};const audio=new Proxy({},{get:()=>()=>{}});
let wins=0;
for(let r=0;r<N;r++){
  const mem={};const save=new X.SaveData({getItem:k=>mem[k]||null,setItem:(k,v)=>{mem[k]=v;}});
  for(const k in X.WEAPONS)save.d.wu[k]=1;const progress=new X.Progress(save,()=>{});let res=null;
  const g=new X.Game({stage,char:ch,diff,x2:false,sandbox:false},{save,audio,progress,tr:o=>typeof o==='string'?o:o.it,onEnd:r=>{res=r;}});
  let nextMark=60;
  while(!res&&g.t<X.STAGES[stage].time+400){
    bot(g);g.update(1/30);
    if(g.modal){const mm=g.modal;if(mm.type==='level'){const ow=mm.options.map((o,i)=>[o,i]).filter(([o])=>o.type==='w'&&o.lv>0);const c=ow.length?ow:mm.options.map((o,i)=>[o,i]);g.resolveModal(c[Math.floor(Math.random()*c.length)][1]);}else if(mm.type==='trial'){for(let i=0;i<mm.offers.length;i++)g.buyOffer(i);g.resolveModal(0);}else g.resolveModal(0);}
    if(g.t>=nextMark){(m[nextMark]=m[nextMark]||[]).push([g.lvl,g.kills,Math.round(g.p.hp/g.p.maxHp*100),g.en.length]);nextMark+=60;}
  }
  if(res&&res.win)wins++;
  (m.end=m.end||[]).push([g.lvl,g.kills,g.t|0,res?(res.win?'W':'L'):'T']);
}
for(const k of Object.keys(m)){const a=m[k];if(k==='end'){console.log('end',JSON.stringify(a));continue;}
  const av=i=>Math.round(a.reduce((s,x)=>s+x[i],0)/a.length);
  console.log('t='+k,'alive',a.length+'/'+N,'lvl',av(0),'kills',av(1),'hp%',av(2),'en',av(3));}
console.log('wins',wins+'/'+N);
