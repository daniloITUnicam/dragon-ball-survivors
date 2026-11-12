'use strict';
/* ====== Gacha: tickets, drop rates, the trinket bag and the sale of trinkets found in a run ======
   - A ticket is spent in the Gacha shop. Kinds: t1 = 1x ticket (1 pull), t10 = 10x ticket (10 pulls), l10 = 10x Lucky ticket (10 pulls with better rates).
   - A pull rolls a rarity first (rates below), then picks one of the trinkets that can exist at that rarity: widening the pool never makes a Mythic harder to find.
   - Every (trinket, rarity) pair is a separate collectible. Pulling one you already own pays zenny instead (80% of its Zeno-sama market value).
   - One trinket from the bag is equipped (d.equip) and starts every run in the trinket slot. */
const GACHA={
  rates:{n:[72,20,6,1.5,.5],l:[45,32,15,6,2]},   /* % for Common, Rare, Epic, Legendary, Mythic: normal tickets / Lucky tickets */
  stars:[1,2,3,5,7],                              /* dragon-ball stars shown on the slot for each rarity: more stars = rarer */
  sell:[20,50,150,400,1000],                      /* extra zenny when a trinket found in a run is sold (on top of its market value) */
  kinds:{t1:{n:1,lucky:false},t10:{n:10,lucky:false},l10:{n:10,lucky:true}},
  bossChance:1,                                   /* every boss drops a 10x ticket */
  maxPulls:100                                    /* most pulls in one go (tickets spent together) */
};
const TICKET_KINDS=['t1','t10','l10'];
/* v136: Gacha shop > Reroll: a new perfection roll (pf) or another trinket of the same rarity (id, perfection and fusion kept), for zenny by rarity;
   the player then keeps the new one or the old one. Gacha shop > Fusion: three trinkets become one (Progress.fusePlan). */
const REROLL_COST={pf:[120,300,750,1800,4500]};   /* v141: only the perfection can be rerolled (the trinket itself no longer) */
/* v141: price of keeping the OLD perfection after a roll ("Keep the old one"), by rarity of the trinket: Common .. Mythic */
const REROLL_KEEP=[200,600,1800,4500,10000];
/* tickets bought with zenny: a 1x ticket costs TICKET_PRICE.t1, a 10x ticket 10 times as much; on Saturday and Sunday the 10x ticket is 20% cheaper. The Lucky ticket is not for sale. */
const TICKET_PRICE={t1:1000,t10:10000},TICKET_WEEKEND=.2;
const isWeekend=(d)=>{const w=(d||new Date()).getDay();return w===0||w===6;};
const ticketPrice=(kind,d)=>{const b=TICKET_PRICE[kind];return b?Math.round(b*(kind==='t10'&&isWeekend(d)?1-TICKET_WEEKEND:1)):0;};
const trinketKey=(id,r)=>id+'@'+r;
/* the trinkets that can come out at rarity r (the same rule as Zeno-sama's stock: stat trinkets at any rarity, effect-only ones at their own) */
function gachaPool(r){return TRINKETS.filter(t=>canAt(t,r));}
function gachaRarity(lucky,rnd){
  const w=GACHA.rates[lucky?'l':'n'],tot=w.reduce((a,b)=>a+b,0);let q=(rnd||Math.random)()*tot;
  for(let i=0;i<w.length;i++){q-=w[i];if(q<=0)return i;}
  return 0;
}
function gachaRoll(lucky,rnd){
  const r=gachaRarity(lucky,rnd);
  return{id:pickTrinket(r,null,rnd).id,r};
}
/* the zenny a trinket found in a run is sold for: its market value in Zeno-sama's shop (grows with the stage like his prices) plus a bonus (Mythic: +1000) */
const TSELL_MUL=.24;   /* v104: trinket sales -70% (too much money); v107: another -20% (0.3 -> 0.24) */
const trinketSale=(r,sd)=>Math.round((ZENO_PRICE[r]*(1+.3*(sd||0))+GACHA.sell[r])*ZMUL*TSELL_MUL);   /* market value + bonus, like every other income 20% lower (ZMUL) */
const dupPayout=r=>Math.round(ZENO_PRICE[r]*ZMUL);

Object.assign(Progress.prototype,{
  ticketCount(){const t=this.d.tickets;return t.t1+t.t10+t.l10;}
  ,buyTicket(kind,n){
    n=Math.max(1,Math.floor(+n)||1);const pr=ticketPrice(kind),d=this.d;
    if(!pr||d.settings.sandbox||d.zenny<pr*n)return false;
    d.zenny-=pr*n;d.tickets[kind]+=n;this.save.write();return true;
  }
  ,addTickets(kind,n){if(!GACHA.kinds[kind]||!(n>0))return;this.d.tickets[kind]+=n;this.save.write();}
  ,bagHas(id,r){return this.d.bag.some(b=>b.id===id&&b.r===r);}
  /* spend a ticket and pull: returns the list of results [{id,r,dup,coins,at}] or null when there is no ticket. Test mode: free, nothing counted, new trinkets are flagged to be removed when Test is turned off. */
  /* most tickets of a kind that can be spent at once: up to GACHA.maxPulls pulls in one go (100) */
  ,gachaMaxTimes(kind){const K=GACHA.kinds[kind];return K?Math.max(1,Math.floor(GACHA.maxPulls/K.n)):1;}
  /* spend `times` tickets of the kind in one go (default 1); returns the results of every pull */
  ,gachaPull(kind,times){
    const K=GACHA.kinds[kind],d=this.d,test=!!d.settings.sandbox;
    times=clamp(Math.floor(+times)||1,1,K?this.gachaMaxTimes(kind):1);
    if(!K||(!test&&!(d.tickets[kind]>=times)))return null;
    if(!test)d.tickets[kind]-=times;
    const out=[],now=Date.now(),own=new Set(d.bag.map(b=>trinketKey(b.id,b.r)));
    for(let i=0;i<K.n*times;i++){
      const g=gachaRoll(K.lucky),key=trinketKey(g.id,g.r),dup=own.has(key);
      const pf=hasPf(trinDef(g.id))?rollPf(K.lucky?.5:0):PF_NOM,res={id:g.id,r:g.r,dup,coins:0,at:now+i,p:pf};
      if(dup){
        if(!test){res.coins=dupPayout(g.r);d.zenny+=res.coins;d.stats.zenny+=res.coins;}
        const ob=d.bag.find(x=>x.id===g.id&&x.r===g.r);if(ob&&hasPf(trinDef(g.id))&&pf>(ob.p!=null?ob.p:PF_NOM)){res.up=ob.p!=null?ob.p:PF_NOM;ob.p=PFS(pf,ob.ls);}   /* a duplicate with a better roll upgrades the one you own (and still pays zenny) */
      }
      else{own.add(key);const b={id:g.id,r:g.r,at:now+i,p:pf};if(test)b.t=1;d.bag.push(b);}
      if(!test){const gs=d.gacha;gs.pulls++;if(g.r===4)gs.mythics++;if(g.r===3)gs.legend++;}
      out.push(res);
    }
    this.save.write();return out;
  }
  ,bagGet(k){return this.d.bag.find(b=>trinketKey(b.id,b.r)===k)||null;}
  /* Test mode: only the trinkets pulled in Test can be rerolled or fused (they go away with it), for free */
  ,canWork(b){return !!b;}   /* Test mode: every trinket can be rerolled / fused / locked, not only the ones pulled in Test */
  ,rerollCost(kind,r){return this.d.settings.sandbox?0:(REROLL_COST[kind]||[])[r]||0;}
  ,keepFee(r){return this.d.settings.sandbox?0:REROLL_KEEP[r]||0;}
  /* v141: a stat can be locked (bought per stat at the keep price of the trinket's rarity, unlocked for free): a perfection reroll no longer touches it, the others still
     change. b.ls = {stat key: its frozen perfection}; the number b.p is the perfection of every other stat (see PFS) */
  ,lockStat(k,key){const b=this.bagGet(k),f=b?this.keepFee(b.r):0;if(!b||(b.ls&&b.ls[key]!=null)||this.d.zenny<f)return false;this.d.zenny-=f;b.ls=Object.assign({},b.ls,{[key]:+(b.p!=null?b.p:PF_NOM)});b.p=PFS(+b.p,b.ls);this.save.write();return true;}
  ,unlockStat(k,key){const b=this.bagGet(k);if(!b||!b.ls)return;const ls=Object.assign({},b.ls);delete ls[key];if(Object.keys(ls).length)b.ls=ls;else delete b.ls;b.p=PFS(+b.p,b.ls);this.save.write();}
  /* the stat keys a perfection reroll of b can still change */
  ,freeStats(b){const t=trinDef(b.id);return trinStats(t,b.r,PF_NOM,b.f).map(x=>x.k).filter(k=>!(b.ls&&b.ls[k]!=null));}
  ,payKeep(r){const f=this.keepFee(r);if(this.d.zenny<f)return false;this.d.zenny-=f;this.save.write();return true;}
  /* spends the zenny and returns the candidate {id,r,p,f} (nothing changes in the bag until rerollApply), or null */
  ,rerollRoll(kind,k){
    const d=this.d,b=this.bagGet(k);if(!this.canWork(b))return null;const c=this.rerollCost(kind,b.r);if(d.zenny<c)return null;
    let o=null;
    if(kind==='pf'&&hasPfE(trinDef(b.id),b.f)&&this.freeStats(b).length)o={id:b.id,r:b.r,p:rollPf(0),f:b.f};
    if(!o)return null;
    d.zenny-=c;d.gacha.rerolls=(d.gacha.rerolls||0)+1;this.save.write();return o;
  }
  ,rerollApply(k,o){
    const d=this.d,b=this.bagGet(k);if(!b||!o||(o.id!==b.id&&this.bagHas(o.id,b.r)))return null;
    const eqs=d.equips||[];
    for(let i=0;i<eqs.length;i++){const e=eqs[i];if(!e)continue;if(e.id===b.id&&e.r===b.r)eqs[i]={id:o.id,r:b.r};else if(e.id===o.id)eqs[i]=null;}   /* the slot follows; another rarity of the new trinket leaves its slot */
    b.id=o.id;b.p=PFS(+o.p,b.ls);if(isFused(o.f)){b.f=o.f.filter(e=>e.id!==o.id);if(!b.f.length)delete b.f;}
    if(d.trin)d.trin[o.id]=1;d.equip=eqs[0]||null;this.save.write();return trinketKey(b.id,b.r);
  }
  /* three bag trinkets -> one: the rarity of the rarest (that one is the base: its trinket and its effect; ties: the better perfection), the stats of all three
     Rule (v136b): the base is the one with the highest perfection (ties: the rarer); the result is that trinket, at the highest rarity of the three, with its
     perfection, its own stats and effect, plus the best stat of each of the other two (a stat it lacks when they have one: trinBestStat). Two extra stats at most:
     a fused trinket fused again keeps only the two new ones, nothing piles up. block: that trinket at that rarity is already in the bag (outside the three). */
  ,fusePlan(keys){
    if(!keys||keys.length!==3||new Set(keys).size!==3)return null;const bs=keys.map(k=>this.bagGet(k));if(bs.some(b=>!b))return null;
    const pfOf=b=>hasPfE(trinDef(b.id),b.f)?(b.p!=null?b.p:PF_NOM):-1;
    const base=bs.reduce((a,b)=>pfOf(b)>pfOf(a)||(pfOf(b)===pfOf(a)&&b.r>a.r)?b:a),r=Math.max(...bs.map(b=>b.r)),p=pfOf(base);
    const have=new Set(Object.keys(trinMods0(trinDef(base.id),r,PF_NOM))),f=[];
    for(const b of bs)if(b!==base){const s=trinBestStat(b.id,b.f,r,have);if(s){f.push(s);have.add(s.k);}}
    const k=trinketKey(base.id,r),block=this.d.bag.some(b=>trinketKey(b.id,b.r)===k&&!bs.includes(b));
    return{base,id:base.id,r,p:p<0?PF_NOM:+p,f:f.slice(0,FUSE_MAX),block};
  }
  ,fuse(keys){
    const d=this.d,P=this.fusePlan(keys);if(!P||P.block)return null;const bs=keys.map(k=>this.bagGet(k));if(bs.some(b=>!this.canWork(b)))return null;
    const eqs=d.equips||(d.equips=[null,null,null]);let slot=-1;
    eqs.forEach((e,i)=>{if(e&&bs.some(b=>b.id===e.id&&b.r===e.r)){if(slot<0)slot=i;eqs[i]=null;}});
    d.bag=d.bag.filter(b=>!bs.includes(b));
    const nb={id:P.id,r:P.r,at:Date.now(),p:+P.p};if(P.f.length)nb.f=P.f;if(bs.some(b=>b.t))nb.t=1;d.bag.push(nb);
    if(slot>=0)eqs[slot]={id:nb.id,r:nb.r};d.equip=eqs[0]||null;d.gacha.fused=(d.gacha.fused||0)+1;this.save.write();
    return trinketKey(nb.id,nb.r);
  }
  /* trinket slots before a run: 1 + one per "Extra Trinket" purchase (max 3). equipTrinket(id,r,slot): equips into that slot (default: the first empty one, else slot 1);
     equipTrinket(null,0,slot) empties a slot, equipTrinket(null) empties all of them */
  ,trinketSlots(){return Math.min(3,1+(this.d.shop.tslot||0));}
  ,equipTrinket(id,r,slot){
    const d=this.d,n=this.trinketSlots();if(!Array.isArray(d.equips))d.equips=[d.equip||null,null,null];
    if(!id){if(slot==null)d.equips=[null,null,null];else d.equips[slot]=null;d.equip=d.equips[0];this.save.write();return true;}
    if(!this.bagHas(id,r))return false;
    if(slot==null){slot=d.equips.findIndex((e,i)=>i<n&&!e);if(slot<0)slot=0;}
    if(!(slot>=0&&slot<n))return false;
    d.equips=d.equips.map((e,i)=>i!==slot&&e&&e.id===id?null:e);   /* the same trinket cannot be carried twice (another rarity of it leaves its old slot) */
    d.equips[slot]={id,r};d.equip=d.equips[0];this.save.write();return true;
  }
  /* Super Dragon Balls: collected in the last stages, kept between runs. Returns the star number or 0 when it was not stored. */
  ,addSuperBall(star){
    if(this.d.settings.sandbox||!(star>=1&&star<=SB_TOTAL)||this.d.sball.includes(star))return 0;
    this.d.sball.push(star);this.save.write();return star;
  }
  ,superBalls(){return this.d.sball.length;}
  /* the three are spent on a reward in the stage menu: 'lucky' = a 10x Lucky ticket, 'char' = an unlocked character of your choice (id) */
  ,useSuperBalls(reward,charId){
    const d=this.d;if(d.sball.length<SB_TOTAL)return false;
    if(reward==='lucky')d.tickets.l10++;
    else if(reward==='char'){const c=CHARS.find(x=>x.id===charId);if(!c||d.unlocked.includes(charId))return false;d.unlocked.push(charId);}
    else return false;
    d.sball=[];this.save.write();return true;
  }
});
