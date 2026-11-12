'use strict';
/* ====== the pause map: a big overview centred on the player that shows where the pickups are (UI.pauseMap builds the panel, this draws it) ====== */
const MAP_ZOOMS=[.06,.1,.17,.3,.5,.8,1.2],MAP_ZOOM0=3,MAP_W=960,MAP_H=600;
/* v137: what every map icon does (hover with the mouse / tap on a phone shows it) */
const MAP_TIP_RAW={   /* key: [name it, name en, what it does it, en] */
  heal:['Pozza curativa','Healing pool','Restaci dentro: recuperi salute.','Stand in it: you recover health.'],
  coin:['Zenny','Zenny','Monete per il negozio.','Coins for the shop.'],
  bag:['Sacco di zenny','Bag of zenny','Tanti zenny in un colpo.','Lots of zenny at once.'],
  heart:['Cuore','Heart','Recuperi il 30% della salute.','Restores 30% of your health.'],
  magnet:['Calamita','Magnet','Attira tutte le gemme e gli zenny della mappa.','Pulls in every gem and zenny on the map.'],
  dmg:['Potenza','Power','Danni +15% per 12 secondi.','+15% damage for 12 seconds.'],
  haste:['Fuoco rapido','Rapid fire','Le armi ricaricano più in fretta per 10 secondi.','Weapons recharge faster for 10 seconds.'],
  xp:['Esperienza','Experience','Una gemma grande di esperienza.','A big experience gem.'],
  capsule:['Capsula','Capsule','Un potenziamento (un cimelio se hai già tutto al massimo).','An upgrade (a trinket when everything is maxed).'],
  luck:['Quadrifoglio','Clover','Fortuna +1,5% per il resto della partita.','+1.5% luck for the rest of the run.'],
  ball:['Sfera del Drago','Dragon Ball','Raccoglile tutte e 7 per evocare Shenron ed esprimere un desiderio.','Collect all 7 to summon Shenron and make a wish.'],
  sball:['Super Sfera del Drago','Super Dragon Ball','Custodita da un Tamagami: sconfiggilo per prenderla.','Guarded by a Tamagami: defeat it to take it.'],
  shrine:['Altare del Potere','Altar of Power','Un bonus casuale per 30 s: danno, velocità, ricarica, salute, rigenerazione o raccolta.','A random bonus for 30 s: damage, speed, cooldown, health, regeneration or pickup.'],
  spring:['Sorgente curativa','Healing spring','Recuperi il 20% della salute.','Restores 20% of your health.'],
  altar:['Altare del Sacrificio','Altar of Sacrifice','Perdi metà della salute e la tua arma più alta sale di un livello (serve più del 30% di salute).','Lose half your health and your highest weapon gains a level (needs more than 30% health).'],
  font:["Fonte dell'esperienza",'Experience font','Ti dà il 40% di un livello.','Gives you 40% of a level.'],
  totem:['Totem','Totem','Scegli una benedizione tra tre: fortuna, rischio, vigore, furia, ricchezza...','Choose one blessing out of three: luck, risk, vigor, fury, wealth...'],
  secret:['Bottone misterioso','Mysterious button','Premilo: si apre il portale di Zeno-sama.',"Press it: Zeno-sama's portal opens."],
  zenoportal:['Portale di Zeno-sama',"Zeno-sama's portal",'Entra nel suo negozio di cimeli.','Enter his trinket shop.'],
  chamber:['Stanza dello Spirito e del Tempo','Hyperbolic Time Chamber','Sfida il Maestro e allenati.','Challenge the Master and train.'],
  tunnel:['Tunnel','Tunnel','Porta al piano di sopra (senso unico).','Leads one floor up (one way).'],
  tr:["Cerchio d'allenamento",'Training circle','Restaci dentro 5 s: danni +15% o fuoco rapido per 30 s.','Stay inside 5 s: +15% damage or rapid fire for 30 s.'],
  pod:['Navicella Capsule Corp','Capsule Corp pod','Restaci accanto 10 s: scegli un cimelio Epico o Leggendario.','Stay next to it 10 s: pick an Epic or Legendary trinket.'],
  ks:['Visitatore','Visitor','Raggiungilo: ti dà una missione di 60 s con un premio.','Reach it: it gives you a 60-second mission with a prize.'],
  gold:["Saibaman d'oro",'Golden Saibaman','Scappa con un sacco di zenny: prendilo entro 14 s.','It runs off with a bag of zenny: catch it within 14 s.'],
  boss:['Boss','Boss','Sconfiggilo per uno scrigno, zenny e un biglietto.','Defeat it for a chest, zenny and a ticket.'],
  mini:['Miniboss','Miniboss','Una versione più piccola di un boss: scrigno e biglietto.',"A smaller version of a boss: chest and ticket."],
  final:['Boss finale','Final boss','Sconfiggilo per vincere la partita.','Defeat it to win the run.'],
  alt:['Altare Sfida','Challenge Altar','Restaci dentro 2 s per risvegliarlo: i boss avranno +15% vita, armatura e danni, ma ogni boss lascerà uno scrigno in più.','Stand in it 2 s to wake it: bosses get +15% health, armor and damage, but every boss drops one more chest.'],
  drop:['Rifornimenti Capsule Corp','Capsule Corp supply drop','Rompi la cassa: dentro ci sono zenny, gemme e altro.','Break the crate: zenny, gems and more inside.'],
  nest:['Nido di Saibaman','Saibaman nest','Rompi i baccelli prima che si schiudano.','Break the pods before they hatch.'],
  nimbus:["Nuvola d'oro",'Golden Nimbus','Salici sopra: +40% velocità e raccolta più ampia.','Hop on: +40% speed and a wider pickup.'],
  senzu:['Pianta di Senzu','Senzu plant','Quando sei ferito ogni fagiolo cura il 25%.','When hurt each bean heals 25%.'],
  gravity:['Camera Gravitazionale','Gravity Room','Restaci accanto: esperienza +60%, velocità −20% per 25 s.','Stand by it: +60% XP, −20% speed for 25 s.'],
  scouter:['Scouter perduto','Lost scouter','Raccoglilo: trova un tesoro sepolto.','Pick it up: it finds a buried treasure.'],
  dig:['Tesoro sepolto','Buried treasure','Restaci sopra per dissotterrare uno scrigno.','Stand on it to dig up a chest.']
};
function mapTipText(tr,key,rar){
  if(key==='chest'){const c=CHEST_RAR[rar||0],R=RARITY[rar||0];
    return{n:tr(T('Scrigno '+R.n.it,R.n.en+' chest')),d:tr(T(c.up+' potenziament'+(c.up>1?'i':'o')+(c.tr?' + '+c.tr+' cimel'+(c.tr>1?'i':'io'):'')+'. Se hai tutto al massimo, cimeli al posto dei potenziamenti.',c.up+' upgrade'+(c.up>1?'s':'')+(c.tr?' + '+c.tr+' trinket'+(c.tr>1?'s':''):'')+'. With everything maxed, trinkets instead of upgrades.')),c:R.c};}
  const m=MAP_TIP_RAW[key];if(!m)return null;return{n:tr(T(m[0],m[1])),d:tr(T(m[2],m[3]))};
}
Object.assign(Renderer.prototype,{
  /* draws the whole map on a canvas: zi = index in MAP_ZOOMS (map px per world px). Every pickup is drawn with the game's own drawing code (drawLoot / drawChest / drawFeature), shrunk */
  drawPauseMap(cv,g,zi,pan){
    const c2=cv.getContext('2d'),W=cv.width,H=cv.height,k=MAP_ZOOMS[Math.max(0,Math.min(MAP_ZOOMS.length-1,zi))],p0=g.p,th=g.stage.theme;
    /* p = the map centre: the hero moved by the drag offset (world px) */
    const p={x:p0.x+(pan?pan.x:0),y:p0.y+(pan?pan.y:0)},sx=x=>W/2+(x-p.x)*k,sy=y=>H/2+(y-p.y)*k,hx=sx(p0.x),hy=sy(p0.y),moved=!!(pan&&(pan.x||pan.y));
    const keep=this.ctx;this.ctx=c2;   /* the drawing helpers use this.ctx: point them at the map canvas for the duration */
    try{
      c2.imageSmoothingEnabled=false;c2.textAlign='left';c2.globalAlpha=1;
      const gr=c2.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#10241c');gr.addColorStop(1,'#0a1620');c2.fillStyle=gr;c2.fillRect(0,0,W,H);
      /* world limits of the finite maps: the Tournament of Power arena and the Snake Way body */
      if(th==='void'&&typeof TOPARENA!=='undefined'){c2.fillStyle='rgba(120,200,190,.10)';c2.strokeStyle='rgba(150,230,220,.55)';c2.lineWidth=2;c2.beginPath();c2.ellipse(sx(0),sy(0),TOPARENA.RX*k,TOPARENA.RY*k,0,0,TAU);c2.fill();c2.stroke();}
      if(th==='snake'&&typeof Snake!=='undefined'){
        c2.fillStyle='rgba(120,200,120,.14)';c2.strokeStyle='rgba(150,230,150,.5)';c2.lineWidth=1.5;c2.beginPath();
        const x0=p.x-W/2/k,x1=p.x+W/2/k,st=Math.max(20,12/k);let first=true;
        for(let x=x0;x<=x1;x+=st){const yy=sy(Snake.f(x)-Snake.HW);if(first){c2.moveTo(sx(x),yy);first=false;}else c2.lineTo(sx(x),yy);}
        for(let x=x1;x>=x0;x-=st)c2.lineTo(sx(x),sy(Snake.f(x)+Snake.HW));
        c2.closePath();c2.fill();c2.stroke();
        /* v110: the islands and their roads */
        for(const I of Snake.islandsIn(x0-ISLE_RMAX,x1+ISLE_RMAX)){
          if(I.road){c2.lineWidth=Math.max(2,ISLE_RW*2*k);c2.strokeStyle='rgba(150,230,150,.32)';c2.lineCap='round';c2.beginPath();I.road.forEach(([x,y],j)=>j?c2.lineTo(sx(x),sy(y)):c2.moveTo(sx(x),sy(y)));c2.stroke();c2.lineWidth=1.5;}
          c2.fillStyle=(SnakeArt.col[I.kind]||['#ffe9a0'])[0]+'55';c2.strokeStyle='rgba(255,233,160,.7)';c2.beginPath();c2.ellipse(sx(I.x),sy(I.y),Math.max(3,I.r*k),Math.max(2,I.ry*k),0,0,TAU);c2.fill();c2.stroke();
          if(I.r*k>26){c2.fillStyle='rgba(255,240,200,.85)';c2.font='700 11px sans-serif';c2.textAlign='center';c2.fillText(this.tr(SnakeArt.names[I.kind]),sx(I.x),sy(I.y)+4);c2.textAlign='left';}
        }
      }
      /* grid every 25 / 50 / 100 / 200 / 500 m (1 m = 10 world px) */
      const steps=[250,500,1000,2000,5000],stp=steps.find(s=>s*k>=80)||5000;
      c2.strokeStyle='rgba(255,255,255,.07)';c2.lineWidth=1;c2.beginPath();
      for(let gx=Math.floor((p.x-W/2/k)/stp)*stp;gx<=p.x+W/2/k;gx+=stp){const X=Math.round(sx(gx))+.5;c2.moveTo(X,0);c2.lineTo(X,H);}
      for(let gy=Math.floor((p.y-H/2/k)/stp)*stp;gy<=p.y+H/2/k;gy+=stp){const Y=Math.round(sy(gy))+.5;c2.moveTo(0,Y);c2.lineTo(W,Y);}
      c2.stroke();
      /* distance rings around the hero */
      c2.font='700 11px sans-serif';c2.fillStyle='rgba(255,255,255,.35)';c2.strokeStyle='rgba(255,255,255,.14)';c2.setLineDash([4,5]);
      for(const m of [stp,stp*2,stp*3]){const r=m*k;if(r<30||r>W)continue;c2.beginPath();c2.arc(hx,hy,r,0,TAU);c2.stroke();c2.fillText(Math.round(m/10)+' m',hx+r*.71+3,hy-r*.71-3);}
      c2.setLineDash([]);
      /* the part of the world the game screen shows */
      c2.strokeStyle='rgba(255,255,255,.45)';c2.lineWidth=1.5;c2.setLineDash([6,4]);c2.strokeRect(hx-g.vw*k/2,hy-g.vh*k/2,g.vw*k,g.vh*k);c2.setLineDash([]);
      const hits=cv._hits=[],draw=(x,y,s,fn,tip,rr)=>{const X=sx(x),Y=sy(y);if(X<-40||X>W+40||Y<-40||Y>H+60)return;c2.save();c2.translate(X,Y);c2.scale(s,s);fn();c2.restore();if(tip)hits.push({x:X,y:Y-(rr||14)*.6,r:Math.max(12,rr||14),tip});};   /* hits: what is under the cursor (tooltips) */
      /* healing pools */
      const zs=Sprites.sheets.zonesprites;
      for(const z of World.zonesNear(th,p.x,p.y,Math.max(W,H)/k/2+200)){
        if(z.kind!=='heal')continue;
        draw(z.x,z.y,.3,()=>{if(zs&&zs.rects&&zs.rects.length>=24){const rc=zs.rects[12],an=zs.anch[12];c2.imageSmoothingEnabled=true;c2.drawImage(zs.img,rc[0],rc[1],rc[2],rc[3],-an[0],-an[1],rc[2],rc[3]);c2.imageSmoothingEnabled=false;}else{c2.fillStyle='#8be07a';c2.beginPath();c2.ellipse(0,0,40,26,0,0,TAU);c2.fill();}},{k:'heal'},18);
      }
      for(const f of g.feat){if(f.dead||f.fade!==undefined)continue;draw(f.x,f.y,.3,()=>this.drawFeature({kind:f.kind,x:0,y:0,t:9,ttl:1e9,pressed:f.pressed,used:false},9,g),{k:f.kind},20);}
      for(const ch of g.chests){if(ch.dead||ch.op!==undefined)continue;draw(ch.x,ch.y,.8,()=>this.drawChest({x:0,y:0,rar:ch.rar||0,final:ch.final,elite:ch.elite,t:9},9),{k:'chest',rar:ch.rar||0},22);}
      for(const l of g.loot){
        if(l.dead||l.held)continue;
        const s=l.k==='sball'?.32:l.k==='ball'?.55:.85;
        draw(l.x,l.y,s,()=>this.drawLoot({k:l.k,x:0,y:0,t:9,v:l.v,star:l.star,tama:l.tama,ttl:0,lock:l.lock,flat:1},9),{k:l.k==='heal'?'heart':l.k},l.k==='coin'?10:16);
      }
      this.mapMarks(c2,g,W,H,sx,sy,hits);
      c2.font='700 11px sans-serif';c2.textAlign='right';c2.fillStyle='rgba(255,255,255,.5)';c2.fillText(this.tr(T(moved?'trascina per spostarti · doppio tocco = torna su di te · 1 m = 10 px':'centrata su di te · trascina per guardare lontano · riquadro tratteggiato = ciò che vede lo schermo · 1 m = 10 px',moved?'drag to move · double tap = back to you · 1 m = 10 px':'centred on you · drag to look far away · dashed box = what the screen shows · 1 m = 10 px')),W-10,H-9);c2.textAlign='left';
      /* the hero: a pulsing marker */
      const pu=.5+.5*Math.sin(performance.now()/260),m=24,out=hx<m||hx>W-m||hy<m||hy>H-m-16;
      let HX=hx,HY=hy;
      if(out){   /* dragged away from the hero: pin the marker to the edge with an arrow pointing at it */
        const a=Math.atan2(hy-H/2,hx-W/2),r=Math.min((W/2-m)/Math.max(1e-3,Math.abs(Math.cos(a))),(H/2-m-8)/Math.max(1e-3,Math.abs(Math.sin(a))));HX=W/2+Math.cos(a)*r;HY=H/2+Math.sin(a)*r;
        c2.save();c2.translate(HX,HY);c2.rotate(a);c2.fillStyle='#ffe24d';c2.strokeStyle='#1a1208';c2.lineWidth=2;c2.beginPath();c2.moveTo(22,0);c2.lineTo(13,-6);c2.lineTo(13,6);c2.closePath();c2.stroke();c2.fill();c2.restore();}
      c2.save();c2.translate(HX,HY);GLOW.at(c2,0,0,22+6*pu,'#ffe24d',.7);c2.fillStyle='#ffe24d';c2.strokeStyle='#1a1208';c2.lineWidth=2.5;c2.beginPath();c2.arc(0,0,7,0,TAU);c2.fill();c2.stroke();
      c2.fillStyle='#fff';c2.beginPath();c2.arc(0,0,2.6,0,TAU);c2.fill();c2.restore();
    }finally{this.ctx=keep;}
  },
  /* v133: the moving targets of the run as icons: the training circle, the Capsule Corp pod, the visitor, the golden Saibaman and a skull on every boss and miniboss.
     Off the map they sit on its edge with a small arrow pointing at them */
  mapMarks(c2,g,W,H,sx,sy,hits){
    const L=[],M=g.mx,MO=g.mo;
    if(MO){for(const a of (MO.alts||[]))if(a.st==='idle')L.push({x:a.x,y:a.y,k:'alt',c:ALT_C,s:1.15});
      for(const a of (MO.acts||[])){if(a.done)continue;if(a.k==='scouter'&&a.st==='scan')L.push({x:a.dg.x,y:a.dg.y,k:'act',ic:'actdig',tip:'dig',c:ACT_C.scouter});else L.push({x:a.x,y:a.y,k:'act',ic:ACT_ICON[a.k],tip:a.k,c:ACT_C[a.k]});}}
    if(M){if(M.tr)L.push({x:M.tr.x,y:M.tr.y,k:'tr',c:'#8ad8ff'});if(M.pod&&!(M.pod.fall>0))L.push({x:M.pod.x,y:M.pod.y,k:'pod',c:'#59c8ff'});if(M.ks&&M.ks.go===undefined)L.push({x:M.ks.x,y:M.ks.y,k:'ks',c:KS_COL});}
    if(g.gold&&!g.gold.dead)L.push({x:g.gold.x,y:g.gold.y,k:'gold',c:'#ffd23f'});
    for(const e of g.en)if(e.boss&&!e.dead&&!e.sparring)L.push({x:e.x,y:e.y,k:'skull',tip:e.mini?'mini':e.final?'final':'boss',c:e.mini?'#d9a8ff':e.final?'#ff3b3b':'#ff8a3a',s:e.mini?.8:e.final?1.25:1});
    const pu=.5+.5*Math.sin(performance.now()/220),m=28;
    for(const o of L){
      let X=sx(o.x),Y=sy(o.y);const out=X<m||X>W-m||Y<m||Y>H-m-16;
      if(out){const a=Math.atan2(Y-H/2,X-W/2),kx=(W/2-m)/Math.max(1e-3,Math.abs(Math.cos(a))),ky=(H/2-m-8)/Math.max(1e-3,Math.abs(Math.sin(a))),r=Math.min(kx,ky);X=W/2+Math.cos(a)*r;Y=H/2+Math.sin(a)*r;
        c2.save();c2.translate(X,Y);c2.rotate(a);c2.fillStyle=o.c;c2.strokeStyle='#0a0f1c';c2.lineWidth=2;c2.beginPath();c2.moveTo(26,0);c2.lineTo(17,-6);c2.lineTo(17,6);c2.closePath();c2.stroke();c2.fill();c2.restore();}
      const s=1.25*(o.s||1)*(1+.08*pu);
      if(hits)hits.push({x:X,y:Y,r:15*s,tip:{k:o.tip||o.k}});
      c2.save();c2.translate(X,Y);c2.scale(s,s);GLOW.at(c2,0,0,20,o.c,.55+.25*pu);
      if(o.k==='skull')this.mapSkull(c2,o.c);
      else if(o.k==='alt'){const b=MOBJ.evilBall();c2.drawImage(b,-15,-15,30,30);}
      else if(o.k==='act'){c2.fillStyle='rgba(10,15,28,.85)';c2.strokeStyle=o.c;c2.lineWidth=2.5;c2.beginPath();c2.arc(0,0,12,0,TAU);c2.fill();c2.stroke();
        const ic=MOBJ.icon(o.ic,0);if(ic){const k=Math.min(18/ic.width,18/ic.height);c2.imageSmoothingEnabled=true;c2.drawImage(ic,-ic.width*k/2,-ic.height*k/2,ic.width*k,ic.height*k);c2.imageSmoothingEnabled=false;}}
      else{c2.fillStyle='rgba(10,15,28,.85)';c2.strokeStyle=o.c;c2.lineWidth=2.5;c2.beginPath();c2.arc(0,0,11,0,TAU);c2.fill();c2.stroke();
        if(o.k==='tr'){c2.fillStyle='#ffffff';c2.font='900 9px sans-serif';c2.textAlign='center';c2.textBaseline='middle';c2.fillText('XP',0,.5);}
        else if(o.k==='pod'){c2.fillStyle='#e8f4ff';c2.strokeStyle='#1a2a44';c2.lineWidth=1.2;c2.beginPath();c2.ellipse(0,0,4.6,7,0,0,TAU);c2.fill();c2.stroke();c2.fillStyle=o.c;c2.fillRect(-4.6,-1,9.2,2);}
        else if(o.k==='ks'){c2.fillStyle=o.c;c2.font='900 15px sans-serif';c2.textAlign='center';c2.textBaseline='middle';c2.fillText('!',0,1);}
        else if(o.k==='gold'){c2.fillStyle='#ffd23f';c2.strokeStyle='#5a3a00';c2.lineWidth=1.2;c2.beginPath();c2.arc(0,1.5,5.5,0,TAU);c2.fill();c2.stroke();c2.fillStyle='#5a3a00';c2.font='900 8px sans-serif';c2.textAlign='center';c2.textBaseline='middle';c2.fillText('Z',0,2);c2.fillStyle='#ffd23f';c2.beginPath();c2.moveTo(-3,-3.5);c2.lineTo(0,-7.5);c2.lineTo(3,-3.5);c2.closePath();c2.fill();}}
      c2.restore();
    }
    c2.textBaseline='alphabetic';c2.textAlign='left';
  },
  /* a little skull: round cranium, jaw with teeth, dark eye sockets; tinted ring under it */
  mapSkull(c2,col){
    c2.fillStyle='rgba(10,15,28,.85)';c2.strokeStyle=col;c2.lineWidth=2.5;c2.beginPath();c2.arc(0,0,12,0,TAU);c2.fill();c2.stroke();
    c2.fillStyle='#f4efe4';c2.strokeStyle='#1a1208';c2.lineWidth=1.2;
    c2.beginPath();c2.arc(0,-1.8,6.6,Math.PI*.83,Math.PI*2.17);c2.lineTo(3.6,4.6);c2.lineTo(-3.6,4.6);c2.closePath();c2.fill();c2.stroke();
    c2.fillStyle='#1a1208';for(const ex of[-2.6,2.6]){c2.beginPath();c2.ellipse(ex,-1.6,1.9,2.3,0,0,TAU);c2.fill();}
    c2.beginPath();c2.moveTo(0,1);c2.lineTo(-1,2.8);c2.lineTo(1,2.8);c2.closePath();c2.fill();
    c2.fillRect(-1.6,3.2,.8,1.6);c2.fillRect(.8,3.2,.8,1.6);
  }
});
