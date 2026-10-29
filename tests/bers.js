const {X}=require('./sim.js');
const audio=new Proxy({},{get:()=>()=>{}});const mem={};const save=new X.SaveData({getItem:k=>mem[k]||null,setItem:(k,v)=>{mem[k]=v;}});
const g=new X.Game({stage:0,char:'broly',diff:'normal',x2:false,sandbox:true},{save,audio,progress:new X.Progress(save,()=>{}),tr:o=>typeof o==='string'?o:o.it,onEnd:()=>{}});
g.sb.god=true;Object.defineProperty(g,'abil',{value:X.AB('berserk','#8aff3a','Berserk','Berserk',0),configurable:true});   /* v124: no character has it by default any more */
console.log('berAvail',g.berAvail,'kaiAvail',g.kaiAvail);
for(let i=0;i<300;i++)g.update(1/30);
const m0=g.S.might;console.log('enemies',(g.en||g.foes||g.E||[]).length);
const k0=g.kills;
console.log('start',g.toggleKaioken(),'bers',g.bers,'might x',(g.S.might/m0).toFixed(2));
// second toggle must not cancel
g.toggleKaioken();console.log('after 2nd toggle bers',g.bers.toFixed(1));
let t=0;while(g.bers>0&&t<600){if(g.modal){g.modal=null;}g.update(1/30);t++;}
console.log('ended after',(t/30).toFixed(1),'s; cd',g.bersCd.toFixed(1),'kills',g.kills-k0,'might x',(g.S.might/m0).toFixed(2));
for(let i=0;i<30;i++)g.update(1/30);console.log('cd after1s',g.bersCd.toFixed(1));
console.log('start during cd',g.toggleKaioken());
console.log('modal',g.modal&&g.modal.type,'t',g.t.toFixed(1));
