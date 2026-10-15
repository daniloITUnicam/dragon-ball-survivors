// Headless balance simulator: node tests/sim.js <stage 1-5> <diff> <N> <charIds|all> [dt]
const fs=require('fs'),path=require('path');
const SRC=path.join(__dirname,'..','src','js');
let code='';for(const f of ['util','data','weapons','weapons2','world','save','game'])code+=fs.readFileSync(path.join(SRC,f+'.js'),'utf8')+'\n';
code+='\nglobalThis.__X={Game,SaveData,Progress,CHARS,STAGES,FORM_TIERS,TRINKETS,WEAPONS,ENEMIES,BOSSES,SHOP,Weapon};';
(0,eval)(code);
const X=globalThis.__X;
function mem(){const m={};return{getItem:k=>m[k]||null,setItem:(k,v)=>{m[k]=v;}};}
const audio=new Proxy({},{get:()=>()=>{}});
function runOne(stageIdx,charId,diff,opts){
  opts=opts||{};
  const save=new X.SaveData(mem());if(!opts.lockedW)for(const k in X.WEAPONS)save.d.wu[k]=1;
  if(opts.shop)Object.assign(save.d.shop,opts.shop);
  const progress=new X.Progress(save,()=>{});
  let result=null;
  const env={save,audio,progress,tr:o=>typeof o==='string'?o:o.it,onEnd:(r)=>{result=r;}};
  const g=new X.Game({stage:stageIdx,char:charId,diff,x2:!!opts.x2,sandbox:false},env);
  const DT=opts.dt||1/30,limit=X.STAGES[stageIdx].time+400;
  let steps=0;
  while(!result&&g.t<limit){
    bot(g);g.update(DT);steps++;
    if(g.modal){
      const m=g.modal;
      if(m.type==='level'){
        const ws=m.options.map((o,i)=>[o,i]).filter(([o])=>o.type==='w');
        const owned=ws.filter(([o])=>o.lv>0);
        const fresh=ws.filter(([o])=>!o.lv);const pr=(g.weapons.size<4&&fresh.length&&Math.random()<.7)?fresh:owned.length&&Math.random()<.85?owned:(ws.length&&Math.random()<.6?ws:m.options.map((o,i)=>[o,i]));
        g.resolveModal(pr[Math.floor(Math.random()*pr.length)][1]);
      }else if(m.type==='trial'){for(let i=0;i<m.offers.length;i++)g.buyOffer(i);g.resolveModal(0);}else g.resolveModal(0);
    }
  }
  if(!result){g.finish(false);}
  return{win:result.win,t:g.t,lvl:g.lvl,kills:g.kills,form:g.formsUnlocked,evos:g.run.evos,trin:g.trinkets.length,total:result.total,weapons:g.weapons.size,boss:g.run.bossKills};
}
function bot(g){
  const p=g.p;let fx=0,fy=0,threat=0;
  for(const e of g.en){
    const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1,R=(e.boss?240:170)+e.r;
    if(d<R){const w=((R-d)/R)**1.5*(e.boss?2.2:1);fx+=dx/d*w;fy+=dy/d*w;threat+=w;}
  }
  for(const b of g.eb){
    const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy)||1;
    if(d<110){const w=((110-d)/110)*2.2,vl=Math.hypot(b.vx,b.vy)||1,px=-b.vy/vl,py=b.vx/vl,side=(dx*px+dy*py)>=0?1:-1;fx+=px*side*w+dx/d*w*.4;fy+=py*side*w+dy/d*w*.4;threat+=w;}
  }
  if(threat>0){const tx=-fy,ty=fx;fx+=tx*.35;fy+=ty*.35;}
  const gw=Math.max(.25,.7-threat*.25);
  let bd=360*360,bx=0,by=0;
  for(const q of g.gm){const dx=q.x-p.x,dy=q.y-p.y,d=dx*dx+dy*dy;if(d<bd){bd=d;bx=dx;by=dy;}}
  for(const q of g.loot){const dx=q.x-p.x,dy=q.y-p.y,d=dx*dx+dy*dy*0.8;if(d<bd){bd=d;bx=dx;by=dy;}}
  for(const q of g.chests){const dx=q.x-p.x,dy=q.y-p.y,d=dx*dx+dy*dy*0.3;if(d<bd){bd=d;bx=dx;by=dy;}}
  for(const q of g.feat){if(q.used)continue;const dx=q.x-p.x,dy=q.y-p.y,d=dx*dx+dy*dy*.5;if(d<bd){bd=d;bx=dx;by=dy;}if(q.near&&(q.kind==='altar'||q.kind==='chamber'||q.kind==='totem'))g.input.interact=true;}
  if(g.pet&&g.pet.cd<=0&&!g.modal){const id=g.pet.d.id,lowhp=p.hp<p.maxHp*.55;if((id==='dende'||id==='droid')?lowhp:(id==='buu'||id==='saibaman')?(threat>1.2||g.en.length>70):true)g.usePet();}
  const l=Math.hypot(bx,by);
  if(l>0){fx+=bx/l*gw;fy+=by/l*gw;}else{const a=g.t*.4;fx+=Math.cos(a)*.3;fy+=Math.sin(a)*.3;}
  const m=Math.hypot(fx,fy);
  g.input.x=m>.02?fx/m:0;g.input.y=m>.02?fy/m:0;
}
module.exports={runOne,X,bot};
if(require.main===module){
  const stage=(+process.argv[2]||1)-1,diff=process.argv[3]||'normal',N=+process.argv[4]||1,ids=process.argv[5]||'all',dt=process.argv[6]?+process.argv[6]:1/30;
  const list=ids==='all'?X.CHARS.map(c=>c.id):ids.split(',');
  const t0=Date.now();let W=0,T=0;
  for(const id of list){
    let w=0,ts=0,lv=0,k=0,fm=0,ev=0,tr=0,zn=0;
    for(let i=0;i<N;i++){const r=runOne(stage,id,diff,{dt});if(r.win)w++;ts+=r.t;lv+=r.lvl;k+=r.kills;fm+=r.form;ev+=r.evos;tr+=r.trin;zn+=r.total;}
    W+=w;T+=N;
    console.log(('S'+(stage+1)+' '+diff).padEnd(10),id.padEnd(8),'win',w+'/'+N,'t',Math.round(ts/N),'lvl',Math.round(lv/N),'kills',Math.round(k/N),'form',(fm/N).toFixed(1),'evo',(ev/N).toFixed(1),'trin',(tr/N).toFixed(1),'zenny',Math.round(zn/N),'['+Math.round((Date.now()-t0)/1000)+'s]');
  }
  console.log('TOTAL win%',Math.round(100*W/T));
}
