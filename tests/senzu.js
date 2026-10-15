// Senzu bag: cards fill the bag (max 3), H / button eats one, full bag heals directly
const {X}=require('./sim.js');
const mem={};const save=new X.SaveData({getItem:k=>mem[k]||null,setItem:(k,v)=>{mem[k]=v;}});
const audio=new Proxy({},{get:()=>()=>{}});
const g=new X.Game({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true},{save,audio,progress:new X.Progress(save,()=>{}),tr:o=>typeof o==='string'?o:o.it,onEnd:()=>{}});
g.sb.god=true;
for(let i=0;i<5;i++){g.applyOption({type:'h'});}
console.log('bag after 5 cards:',g.senzu,'(max 3)');
g.p.hp=30;const ok=g.useSenzu();console.log('use at 30hp:',ok,'hp',Math.round(g.p.hp),'bag',g.senzu);
g.senzuCd=0;g.p.hp=g.p.maxHp;console.log('use at full hp (should refuse):',g.useSenzu(),'bag',g.senzu);
g.p.hp=10;g.applyOption({type:'h'});g.applyOption({type:'h'});console.log('bag',g.senzu);
g.p.hp=10;g.senzu=3;g.applyOption({type:'h'});console.log('full bag card heals directly: hp',Math.round(g.p.hp),'bag',g.senzu);
let seen=0,N=2000;g.senzu=0;for(let i=0;i<N;i++)if(g.levelOptions().some(o=>o.type==='h'))seen++;console.log('levelOptions with Senzu card:',(seen/N*100).toFixed(0)+'%');
g.senzu=3;seen=0;for(let i=0;i<N;i++)if(g.levelOptions().some(o=>o.type==='h'))seen++;console.log('with full bag:',(seen/N*100).toFixed(0)+'%');
