const {X,bot}=require('./sim.js');const x2=process.argv[2]==='x2';
const audio=new Proxy({},{get:()=>()=>{}});const out=[];
for(let r=0;r<4;r++){const mem={};const save=new X.SaveData({getItem:k=>mem[k]||null,setItem:(k,v)=>{mem[k]=v;}});for(const k in X.WEAPONS)save.d.wu[k]=1;
const g=new X.Game({stage:0,char:'goku',diff:'normal',x2,sandbox:false},{save,audio,progress:new X.Progress(save,()=>{}),tr:o=>typeof o==='string'?o:o.it,onEnd:()=>{}});
const m={};let rt=0;let ft={};while(rt<310&&!g.ended){bot(g);g.update(1/30);rt+=1/30;if(g.modal){const mm=g.modal;g.resolveModal(mm.type==='level'?0:0);}if(!ft[g.formsUnlocked])ft[g.formsUnlocked]=Math.round(g.t);for(const s of [60,120,180,300])if(rt>=s&&!m[s])m[s]=g.lvl+'/f'+g.formsUnlocked;}
out.push("formAt(clock s) "+JSON.stringify(ft)+" lvl@end "+g.lvl);}console.log(out.join('\n'));
