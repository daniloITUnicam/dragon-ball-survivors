// red XP gem: far gems merge into one gem parked just outside the screen; walking into it pays out the XP
const {X}=require('./sim.js');
const audio=new Proxy({},{get:()=>()=>{}});const mem={};const save=new X.SaveData({getItem:k=>mem[k]||null,setItem:(k,v)=>{mem[k]=v;}});
const g=new X.Game({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true},{save,audio,progress:new X.Progress(save,()=>{}),tr:o=>typeof o==='string'?o:o.it,onEnd:()=>{}});
g.sb.god=true;g.sb.nospawn=true;g.vw=900;g.vh=560;
const p=g.p;let total=0;
for(let i=0;i<300;i++){const a=Math.random()*6.283,d=150+Math.random()*900,v=1+Math.floor(Math.random()*3);total+=v;g.dropGem(p.x+Math.cos(a)*d,p.y+Math.sin(a)*d,v);}
console.log('gems placed: 300, in list',g.gm.length,'redgem v',g.rg&&g.rg.v);
g.update(1/30);
const inList=g.gm.reduce((s,x)=>s+x.v,0),rv=g.rg?g.rg.v:0;
console.log('after merge: gems',g.gm.length,'(cap 90, keep 55) | list xp',inList,'+ red gem',rv,'= total',inList+rv,'expected',total);
const dx=g.rg.x-p.x,dy=g.rg.y-p.y,a=Math.atan2(dy,dx),ed=g.edgeDist(a),d=Math.hypot(dx,dy);
console.log('red gem distance',d.toFixed(0),'screen edge there',ed.toFixed(0),'-> just off screen:',d>=ed-1&&d<=ed+40);
// walk away: it must follow and stay close to the edge
p.x+=2000;for(let i=0;i<5;i++)g.update(1/30);
const d2=Math.hypot(g.rg.x-p.x,g.rg.y-p.y),ed2=g.edgeDist(Math.atan2(g.rg.y-p.y,g.rg.x-p.x));console.log('after walking 2000px away: distance',d2.toFixed(0),'edge',ed2.toFixed(0));
// walk into it
const xp0=g.xp,l0=g.lvl;const tx=g.rg.x,ty=g.rg.y,v=g.rg.v;
for(let i=0;i<120&&g.rg;i++){const r=g.rg;const ddx=r.x-p.x,ddy=r.y-p.y,dd=Math.hypot(ddx,ddy)||1;p.x+=ddx/dd*4;p.y+=ddy/dd*4;g.modal=null;g.update(1/30);}
console.log('collected:',!g.rg,'xp gained ~',Math.round((g.xp-xp0)+(g.lvl-l0)*0),'level',l0,'->',g.lvl,'(value',v+')');
