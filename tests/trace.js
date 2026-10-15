const {X,bot}=require('./sim.js');
const stage=(+process.argv[2]||1)-1;const audio=new Proxy({},{get:()=>()=>{}});
const mem={};const save=new X.SaveData({getItem:k=>mem[k]||null,setItem:(k,v)=>{mem[k]=v;}});for(const k in X.WEAPONS)save.d.wu[k]=1;
const progress=new X.Progress(save,()=>{});let res=null;
const g=new X.Game({stage,char:'goku',diff:'normal',x2:false,sandbox:false},{save,audio,progress,tr:o=>typeof o==='string'?o:o.it,onEnd:r=>{res=r;}});
let nx=15;const log=[];const oh=g.hurt.bind(g);let dm={};g.hurt=(d,s)=>{const k=s&&s.def?s.def.id:(s&&s.dmg!==undefined?'bullet':s);dm[k]=(dm[k]||0)+d;return oh(d,s);};
while(!res&&g.t<g.dur){bot(g);g.update(1/30);if(g.modal){const mm=g.modal;if(mm.type==='level'){const all=mm.options.map((o,i)=>[o,i]),fr=all.filter(([o])=>o.type==='w'&&!o.lv),ow=all.filter(([o])=>o.type==='w'&&o.lv>0);const c=(g.weapons.size<4&&fr.length&&Math.random()<.7)?fr:ow.length?ow:all;g.resolveModal(c[Math.floor(Math.random()*c.length)][1]);}else g.resolveModal(0);}
 if(g.t>=nx){nx+=15;const c={};for(const e of g.en)c[e.boss?e.bd.id:e.def.id]=(c[e.boss?e.bd.id:e.def.id]||0)+1;console.log(g.t|0,'hp',Math.round(g.p.hp),'/',g.p.maxHp,'lvl',g.lvl,'en',g.en.length,'cap',g.spawnCap(),'eb',g.eb.length,'dmg',JSON.stringify(Object.fromEntries(Object.entries(dm).map(([k,v])=>[k,Math.round(v)]))));dm={};}}
