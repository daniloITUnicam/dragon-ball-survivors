// level/form pace with an immortal bot: node tests/lvfull.js "1,3,5,10" diff [char] [x2]
const {X,bot}=require('./sim.js');
const stages=(process.argv[2]||'1').split(',').map(n=>+n-1),diff=process.argv[3]||'normal',ch=process.argv[4]||'goku',x2=process.argv[5]==='x2';
const audio=new Proxy({},{get:()=>()=>{}});
for(const stage of stages){
  const mem={};const save=new X.SaveData({getItem:k=>mem[k]||null,setItem:(k,v)=>{mem[k]=v;}});for(const k in X.WEAPONS)save.d.wu[k]=1;
  const progress=new X.Progress(save,()=>{});let res=null;
  const g=new X.Game({stage,char:ch,diff,x2,sandbox:false},{save,audio,progress,tr:o=>typeof o==='string'?o:o.it,onEnd:r=>{res=r;}});
  g.sb.god=true;const marks={},ft=[];
  while(!res&&g.t<g.dur){
    bot(g);g.update(1/30);
    if(g.modal){const mm=g.modal;if(mm.type==='level'){const all=mm.options.map((o,i)=>[o,i]),fr=all.filter(([o])=>o.type==='w'&&!o.lv),ow=all.filter(([o])=>o.type==='w'&&o.lv>0);const c=(g.weapons.size<4&&fr.length&&Math.random()<.7)?fr:ow.length?ow:all;g.resolveModal(c[Math.floor(Math.random()*c.length)][1]);}else if(mm.type==='trial'){for(let i=0;i<mm.offers.length;i++)g.buyOffer(i);g.resolveModal(0);}else g.resolveModal(0);}
    for(const m of [120,240,360,480,600,720,840])if(g.t>=m&&!marks[m])marks[m]=g.lvl;
    if(ft.length<g.formsUnlocked)ft.push(Math.round(g.t/60*10)/10);
  }
  console.log(`S${stage+1} ${diff} dur=${g.dur/60}m  lvl@min ${JSON.stringify(marks)} end lvl=${g.lvl} forms=${g.formsUnlocked} formAt(min)=${ft.join(',')} kills=${g.kills}`);
}
