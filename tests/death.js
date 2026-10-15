// where do bots die? node tests/death.js stage diff N char
const {X,bot}=require('./sim.js');
const stage=(+process.argv[2]||1)-1,diff=process.argv[3]||'normal',N=+process.argv[4]||6,ch=process.argv[5]||'goku',x2=process.argv[6]==='x2';
const audio=new Proxy({},{get:()=>()=>{}});let wins=0;const rows=[];
for(let r=0;r<N;r++){
  const mem={};const save=new X.SaveData({getItem:k=>mem[k]||null,setItem:(k,v)=>{mem[k]=v;}});
  for(const k in X.WEAPONS)save.d.wu[k]=1;const progress=new X.Progress(save,()=>{});let res=null;
  const g=new X.Game({stage,char:ch,diff,x2,sandbox:false},{save,audio,progress,tr:o=>typeof o==='string'?o:o.it,onEnd:r=>{res=r;}});
  let last=null;const oh=g.hurt.bind(g);g.hurt=(d,s)=>{last=s;return oh(d,s);};
  while(!res&&g.t<g.dur+300){
    bot(g);g.update(1/30);
    if(g.modal){const mm=g.modal;if(mm.type==='level'){const all=mm.options.map((o,i)=>[o,i]),fr=all.filter(([o])=>o.type==='w'&&!o.lv),ow=all.filter(([o])=>o.type==='w'&&o.lv>0);const c=(g.weapons.size<4&&fr.length&&Math.random()<.7)?fr:ow.length?ow:all;g.resolveModal(c[Math.floor(Math.random()*c.length)][1]);}else if(mm.type==='trial'){for(let i=0;i<mm.offers.length;i++)g.buyOffer(i);g.resolveModal(0);}else g.resolveModal(0);}
  }
  const bs=g.en.filter(e=>e.boss).map(e=>e.bd.id+':'+Math.round(e.hp/e.max*100)+'%');
  if(res&&res.win)wins++;
  rows.push(`${res&&res.win?'W':'L'} t=${g.t|0}/${g.dur} lvl=${g.lvl} form=${g.formsUnlocked} w=${g.weapons.size} en=${g.en.length} bosses=[${bs}] last=${last&&(last.def?last.def.id:(last.o&&last.o.def?last.o.def.id:JSON.stringify(Object.keys(last))))}`);
}
console.log(rows.join('\n'));console.log('wins',wins+'/'+N);
