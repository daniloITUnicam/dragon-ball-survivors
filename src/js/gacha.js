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
const trinketSale=(r,sd)=>Math.round((ZENO_PRICE[r]*(1+.3*(sd||0))+GACHA.sell[r])*ZMUL);   /* market value + bonus, like every other income 20% lower (ZMUL) */
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
      const pf=hasPf(TRINKETS.find(t=>t.id===g.id))?rollPf(K.lucky?.5:0):PF_NOM,res={id:g.id,r:g.r,dup,coins:0,at:now+i,p:pf};
      if(dup){
        if(!test){res.coins=dupPayout(g.r);d.zenny+=res.coins;d.stats.zenny+=res.coins;}
        const ob=d.bag.find(x=>x.id===g.id&&x.r===g.r);if(ob&&hasPf(TRINKETS.find(t=>t.id===g.id))&&pf>(ob.p!=null?ob.p:PF_NOM)){res.up=ob.p!=null?ob.p:PF_NOM;ob.p=pf;}   /* a duplicate with a better roll upgrades the one you own (and still pays zenny) */
      }
      else{own.add(key);const b={id:g.id,r:g.r,at:now+i,p:pf};if(test)b.t=1;d.bag.push(b);}
      if(!test){const gs=d.gacha;gs.pulls++;if(g.r===4)gs.mythics++;if(g.r===3)gs.legend++;}
      out.push(res);
    }
    this.save.write();return out;
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
