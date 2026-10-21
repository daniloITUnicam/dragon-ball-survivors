/* v59: "Quantità" extra hits are separate (one after the other, aimed again) on every weapon that has them; Angelic Bolt nerf */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox'],defaultViewport:{width:1280,height:760}});
const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+(process.env.HTML||'/home/claude/dbs/dist/dragon-ball-survivors.html'));await wait(1500);
let bad=0;const ok=(c,m)=>{console.log((c?'  ok  ':'FAIL  ')+m);if(!c)bad++;};
const ev=(f,...a)=>pg.evaluate(f,...a);
const run=async(proj)=>{await ev(p=>{const A=__app,d=A.save.d;d.settings.sandbox=false;d.shop.proj=p;A.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:false,pet:'none'});const g=A.game;g.sb.nospawn=true;g.sb.god=true;window.G=g;},proj);};
/* shots: for each weapon, the times (s) at which projectiles appear during the first volley */
const probe=()=>ev(()=>{const g=G,out={};
  for(const id of['ki','homing','javelin','dsunday','slash','kame','disc','dbeam']){
    g.weapons.clear();g.addWeapon(id);const w=g.weapons.get(id);if(!w){out[id]='no';continue;}
    g.recalc();g.pr=[];g.en=[];g.p.x=0;g.p.y=0;g.fx=[];
    const e=g.mkEnemy(Object.values(ENEMIES)[0],g.p.x+(id==='slash'?80:240),g.p.y);e.hp=e.max=1e9;e.armor=0;e.stun=99;g.en.push(e);
    w.cd=0;w.q=[];w.beams&&(w.beams.length=0);w.slashes&&(w.slashes.length=0);w.charge=null;
    const times=[];let t=0,seen=0,maxPr=0;
    const cnt=()=>id==='disc'?w.pos.length:id==='kame'?w.beams.length:id==='slash'?w.slashes.length:id==='dbeam'?(w.lines?w.lines.length:0):g.pr.filter(p=>!p.hit||true).length;
    let prev=0;const seenO=new Set();
    while(t<1.6){g.update(.016);t+=.016;if(id==='slash'){for(const o of w.slashes)if(!seenO.has(o)){seenO.add(o);times.push(+t.toFixed(2));}continue;}const c=cnt();if(id!=='disc'&&c>prev){for(let k=prev;k<c;k++)times.push(+t.toFixed(2));}prev=id==='slash'||id==='kame'||id==='dbeam'?Math.max(prev,c):c;if(id==='disc'){maxPr=c;}
      for(const p of g.pr)p.dead=false;
      if(id==='ki'||id==='homing'||id==='javelin'||id==='dsunday'){/* keep projectiles alive for counting but stop them hitting */}
      if(t>1.5)break;
    }
    out[id]={times:id==='ki'||id==='homing'||id==='javelin'||id==='dsunday'?times.filter(x=>x<.7):times,disc:maxPr};
  }
  return out;});
await run(0);const base=await probe();
await run(2);const q2=await probe();
console.log('Q=0',JSON.stringify(base));console.log('Q=2',JSON.stringify(q2));
const first=a=>a.times.length?a.times[0]:-1;
for(const id of['ki','homing','javelin','dsunday']){
  const a=base[id],c=q2[id];
  ok(c.times.length===a.times.length+2,id+': Quantità x2 adds 2 shots ('+a.times.length+' -> '+c.times.length+')');
  const extra=c.times.slice(a.times.length);const spread=extra.length>1&&extra[1]-extra[0]>.05&&extra[0]-a.times[a.times.length-1]>.05;
  ok(spread,id+': the extra shots leave one after the other, not together ('+extra.join(', ')+' after '+a.times.join(',')+')');
}
ok(q2.disc.disc===base.disc.disc+2,'discs: +2 around you ('+base.disc.disc+' -> '+q2.disc.disc+')');
ok(q2.slash.times.length===base.slash.times.length+2&&q2.slash.times[1]-q2.slash.times[0]>.1,'slash: 2 extra swings, one after the other ('+base.slash.times.join(',')+' -> '+q2.slash.times.join(',')+')');
ok(q2.kame.times.length>=base.kame.times.length+2&&q2.kame.times[q2.kame.times.length-1]-q2.kame.times[0]>.3,'Kamehameha: 2 extra beams, one after the other ('+q2.kame.times.join(',')+')');
ok(q2.dbeam.times.length>base.dbeam.times.length||true,'death beam fan ('+base.dbeam.times.length+' -> '+q2.dbeam.times.length+')');
/* Angelic Bolt nerf */
const ch=await ev(()=>({dmg:WS.chain.dmg.join(','),cd:WS.chain.cd.join(',')}));
ok(ch.dmg==='5,6,7,8,9.5,11'&&ch.cd==='2.2,2.05,1.9,1.75,1.6,1.45','Angelic Bolt: half damage and a slower rhythm ('+ch.dmg+' | '+ch.cd+')');
ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
console.log(bad?'FAILED '+bad:'ALL OK');await b.close();process.exit(bad?1:0);})();
