// boss signature attacks + spawn behaviour during boss fights
const {X}=require('./sim.js');
const audio=new Proxy({},{get:()=>()=>{}});
function mk(stage,char){const mem={};const save=new X.SaveData({getItem:k=>mem[k]||null,setItem:(k,v)=>{mem[k]=v;}});
  return new X.Game({stage,char:char||'goku',diff:'normal',x2:false,sandbox:true},{save,audio,progress:new X.Progress(save,()=>{}),tr:o=>typeof o==='string'?o:o.it,onEnd:()=>{}});}
let g=mk(0);g.sb.god=true;
g.spawnBoss('raditz',false);const b=g.en.find(e=>e.boss);b.max=b.hp=1e8;b.tfT=1e9;
const pats=['wall','crossbeam','rush','homing','vortex','encircle'];
for(const pt of pats){
  b.bd=Object.assign({},b.bd,{pats:[pt]});b.phase=0;const n0=g.eb.length+g.bz.length;
  const old=Math.random;Math.random=()=>.99;   // skip random extra-pattern rolls so the forced one is used
  g.bossAttack(b);Math.random=old;
  console.log(pt.padEnd(10),'eb',g.eb.length,'bz',g.bz.length,'vortex',!!g.vortex);
  for(let i=0;i<150;i++){g.modal=null;g.update(1/30);}
  g.eb=[];g.bz=[];
}
console.log('ext of each boss:',Object.keys(X.BOSSES).slice(0,6).map(id=>id+':'+g.bossExt(X.BOSSES[id],false).join('/')).join(' | '));
// spawn behaviour: count how many enemies spawn in 20 s without / with a normal boss / with the final boss
function crowd(mode){
  const q=mk(1);q.sb.god=true;q.t=200;q.nt=200;
  if(mode>=1){q.spawnBoss('ginew',mode===2);const bb=q.en.find(e=>e.boss);bb.max=bb.hp=1e9;bb.tfT=1e9;bb.x=1e5;bb.y=1e5;}
  q.en=q.en.filter(e=>e.boss);let spawned=0;const spo=q.spawnOne.bind(q);q.spawnOne=function(){spawned++;return spo();};
  for(let i=0;i<600;i++){q.modal=null;q.update(1/30);q.p.hp=q.p.maxHp;}
  return{spawned,alive:q.en.filter(e=>!e.boss).length,cap:q.spawnCap()};
}
console.log('no boss   ',JSON.stringify(crowd(0)));console.log('normal    ',JSON.stringify(crowd(1)));console.log('final boss',JSON.stringify(crowd(2)));
// final boss stats vs normal
const h=mk(0);h.spawnBoss('raditz',false);const n=h.en.find(e=>e.boss);const f=mk(0);f.spawnBoss('raditz',true);const fb=f.en.find(e=>e.boss);
console.log('boss hp',Math.round(n.max),'-> final',Math.round(fb.max),'| armor',n.armor.toFixed(1),'->',fb.armor.toFixed(1),'| dmg',n.dmg.toFixed(1),'->',fb.dmg.toFixed(1));
const m=h.mkEnemy(X.ENEMIES.sai,0,0);const m2=f.mkEnemy(X.ENEMIES.sai,0,0);
console.log('minion in final fight: hp',Math.round(m.max),'->',Math.round(m2.max),'armor',m.armor.toFixed(1),'->',m2.armor.toFixed(1),'dmg',m.dmg.toFixed(1),'->',m2.dmg.toFixed(1));
