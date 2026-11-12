/* v140: right HUD column - the stats panel (kills / zenny / tickets) and the "Capsule Corp" effects panel, laid out like the mockup in assets/_sorgenti/hud/mockup.png.
   The effect icons are cut from that mockup (tools/hud_icons_from_mockup.py -> assets/hudicons); the frames, the STREAK burst and the lightning are drawn here, animated.
   The effects panel grows and shrinks with the number of active effects. */
const HUDICONS=/*__HUDICONS__*/{};
const HUDP=(()=>{
  const IM={};for(const k in HUDICONS){const i=new Image();i.src=HUDICONS[k];IM[k]=i;}
  /* streak tiers: [from, burst edge, text top, text bottom] */
  const TIERS=[[500,'#a83cff','#f2d0ff','#b050ff'],[200,'#ff3a1a','#ffd8b0','#ff4a24'],[100,'#ff8a00','#fff3a8','#ff8000'],[50,'#ffa800','#fff0a0','#ffa000'],[0,'#ffc61a','#fffbc0','#ffd21f']];
  const tierOf=n=>TIERS.find(t=>n>=t[0]);
  const S={g:null,h:0,sh:0,fx:{},kills:0,kPop:0,coins:0,bolts:[],boltT:-9,stars:[],ti:0};
  for(let i=0;i<9;i++)S.stars.push({x:Math.random(),y:Math.random(),p:Math.random()*6.3,s:1.6+Math.random()*2.2});
  const rr=(c,x,y,w,h,r)=>{c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.lineTo(x+w,y+r);c.lineTo(x+w,y+h-r);c.lineTo(x+w-r,y+h);c.lineTo(x+r,y+h);c.lineTo(x,y+h-r);c.lineTo(x,y+r);c.closePath();};   /* chamfered box */
  const ease=v=>v*v*(3-2*v);

  /* ---- frames ---- */
  function frameStats(c,x,y,w,h,u,t){
    rr(c,x,y,w,h,5*u);c.fillStyle='#000610';c.fill();
    rr(c,x+1.5*u,y+1.5*u,w-3*u,h-3*u,4*u);c.fillStyle='#1d6ea4';c.fill();
    c.fillStyle='#4ba2d0';c.fillRect(x+5*u,y+2*u,w-10*u,1.6*u);c.fillRect(x+2*u,y+5*u,1.6*u,h-10*u);
    rr(c,x+6*u,y+6*u,w-12*u,h-12*u,3*u);c.fillStyle='#00041c';c.fill();
    const ix=x+7.5*u,iy=y+7.5*u,iw=w-15*u,ih=h-15*u,g=c.createLinearGradient(0,iy,0,iy+ih);g.addColorStop(0,'#0a3d6a');g.addColorStop(1,'#0f3e68');
    c.fillStyle=g;c.fillRect(ix,iy,iw,ih);
    c.fillStyle='rgba(0,0,0,.14)';for(let k=0;k<ih;k+=3*u)c.fillRect(ix,iy+k,iw,1*u);   /* scan lines */
    const sw=(t*.35)%1.6-.3;c.save();c.beginPath();c.rect(ix,iy,iw,ih);c.clip();c.fillStyle='rgba(120,200,255,.07)';c.fillRect(ix+iw*sw,iy,iw*.12,ih);c.restore();   /* a slow shine passing */
    /* orange tab, top right */
    c.fillStyle='#000610';c.fillRect(x+w*.52-1*u,y-1*u,w*.4+2*u,6*u);c.fillStyle='#fc8100';c.fillRect(x+w*.52,y,w*.4,4*u);c.fillStyle='#f2bc84';c.fillRect(x+w*.52,y,w*.4,1.2*u);
    c.fillStyle='#000610';c.fillRect(x+w-8*u,y+2*u,3.4*u,3.4*u);c.fillStyle='#4ba2d0';c.fillRect(x+w-7.4*u,y+2.6*u,2.2*u,2.2*u);
    c.fillStyle='#fc8100';c.fillRect(x+6*u,y+h-3.6*u,w*.3,2.2*u);
  }
  function frameFx(c,x,y,w,h,u,t){
    /* body: the game stays visible through it, tinted dark teal */
    c.fillStyle='rgba(10,30,32,.84)';c.fillRect(x+4*u,y+8*u,w-8*u,h-16*u);
    c.fillStyle='rgba(0,0,0,.12)';for(let k=8*u;k<h-8*u;k+=3*u)c.fillRect(x+4*u,y+k,w-8*u,1*u);
    /* left orange line, right green line */
    c.fillStyle='#000';c.fillRect(x+1*u,y+6*u,5*u,h-12*u);c.fillStyle='#f58411';c.fillRect(x+2*u,y+6*u,3*u,h-12*u);c.fillStyle='#f2bc84';c.fillRect(x+2*u,y+6*u,1*u,h-12*u);
    c.fillStyle='#000';c.fillRect(x+w-6*u,y+6*u,5*u,h-12*u);c.fillStyle='#5fd28a';c.fillRect(x+w-5*u,y+6*u,3*u,h-12*u);c.fillStyle='#b8f5d0';c.fillRect(x+w-3.6*u,y+6*u,1*u,h-12*u);
    /* top band + tab */
    c.fillStyle='#000610';rr(c,x,y,w,12*u,3*u);c.fill();
    rr(c,x+1.4*u,y+1.4*u,w-2.8*u,9.2*u,2.4*u);c.fillStyle='#1d6ea4';c.fill();c.fillStyle='#4ba2d0';c.fillRect(x+3*u,y+2*u,w-6*u,1.4*u);
    c.fillStyle='#000610';c.fillRect(x+7*u,y+2*u,w*.36+2*u,9*u);c.fillStyle='#ec8a22';c.fillRect(x+8*u,y+3*u,w*.36,7*u);c.fillStyle='#f6b46a';c.fillRect(x+8*u,y+3*u,w*.36,1.2*u);
    c.font='800 '+Math.round(5.6*u)+'px "Rajdhani",sans-serif';c.textAlign='left';c.fillStyle='#a8571a';c.fillText('CAPSULE CORP',x+11*u,y+8.6*u);
    /* LEDs + green line */
    const lx=x+w*.5;c.fillStyle='#000610';c.fillRect(lx-1*u,y+1.6*u,w*.17,8*u);
    for(let i=0;i<5;i++){const on=((t*3+i*.7)%3)<1.2;c.fillStyle=on?'#8dffb4':'#0a1a12';c.fillRect(lx+i*3.2*u,y+3*u,1.8*u,5*u);}
    c.fillStyle='#000';c.fillRect(x+w*.68,y+4*u,w*.26,3.6*u);c.fillStyle='#5fd28a';c.fillRect(x+w*.68,y+4.8*u,w*.26,2*u);
    c.fillStyle='#fc8100';c.fillRect(x+w*.7,y+2*u,w*.17,2.4*u);
    /* bottom band, corner brackets */
    c.fillStyle='#000610';rr(c,x,y+h-11*u,w,11*u,3*u);c.fill();
    rr(c,x+1.4*u,y+h-9.6*u,w-2.8*u,8.2*u,2.4*u);c.fillStyle='#1d6ea4';c.fill();c.fillStyle='#4ba2d0';c.fillRect(x+3*u,y+h-9*u,w-6*u,1.2*u);
    c.fillStyle='#5fd28a';c.fillRect(x+10*u,y+h-4.4*u,w*.5,1.6*u);
    c.fillStyle='#000610';c.fillRect(x+w*.62-1*u,y+h-7*u,w*.3+2*u,6*u);c.fillStyle='#fc8100';c.fillRect(x+w*.62,y+h-6*u,w*.3,4*u);c.fillStyle='#f2bc84';c.fillRect(x+w*.62,y+h-6*u,w*.3,1.2*u);
    for(const [dx,dy] of [[5,5],[w/u-5,5],[5,h/u-5],[w/u-5,h/u-5]]){c.fillStyle='#000610';c.beginPath();c.arc(x+dx*u,y+dy*u,2.2*u,0,TAU);c.fill();c.fillStyle='#7fe8ff';c.globalAlpha=.55+.45*Math.sin(t*3+dx);c.beginPath();c.arc(x+dx*u,y+dy*u,1*u,0,TAU);c.fill();c.globalAlpha=1;}
  }

  /* ---- icons ---- */
  function ico(c,k,cx,cy,sz,t,ph){
    const i=IM[k];if(!i||!i.complete||!i.naturalWidth)return;
    const sc=sz/Math.max(i.naturalWidth,i.naturalHeight),w=i.naturalWidth*sc,h=i.naturalHeight*sc;
    c.save();c.translate(cx,cy);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    const s=t+(ph||0);
    switch(k){
      case'sword':c.rotate(Math.sin(s*2.2)*.09);break;
      case'coin':{const q=(s*.9)%3;if(q<.7)c.scale(Math.max(.08,Math.abs(Math.cos(q/.7*Math.PI))),1);break;}   /* a flip every ~3 s */
      case'dmg':{const p=1+.07*Math.sin(s*7);c.scale(p,p);break;}
      case'haste':c.translate(Math.sin(s*9)*sz*.07,0);break;
      case'risk':c.rotate(Math.sin(s*3)*.06);break;
      case'heal':{const p=1+.08*Math.sin(s*4);c.scale(p,p);break;}
      case'rain':c.translate(0,Math.sin(s*10)*sz*.04);break;
      case'kaioken':c.scale(1+.04*Math.sin(s*11),1+.09*Math.sin(s*7+1));break;
      case'slow':{const q=(s*.5)%1,a=q<.25?ease(q/.25)*Math.PI:0;c.rotate(a);break;}
    }
    if(k==='kaioken'||k==='dmg'||k==='risk'||k==='heal'){c.globalAlpha=.5+.25*Math.sin(s*6);c.globalCompositeOperation='lighter';c.drawImage(i,-w*.56,-h*.56,w*1.12,h*1.12);c.globalCompositeOperation='source-over';c.globalAlpha=1;}
    c.drawImage(i,-w/2,-h/2,w,h);
    if(k==='storm'||k==='rain'){const f=Math.sin(s*13)+Math.sin(s*5.3);if(f>1.5){c.globalAlpha=.55;c.globalCompositeOperation='lighter';c.drawImage(i,-w/2,-h/2,w,h);c.globalCompositeOperation='source-over';c.globalAlpha=1;}}
    if(k==='sword'){const q=(s*.8)%2.4;if(q<.4){const a=Math.sin(q/.4*Math.PI);c.globalAlpha=a;c.fillStyle='#fff';const gx=w*.28,gy=-h*.34,r=sz*.18*a;c.fillRect(gx-r,gy-.5,r*2,1);c.fillRect(gx-.5,gy-r,1,r*2);c.globalAlpha=1;}}
    c.restore();
  }
  function ticket(c,cx,cy,u,t,inner){
    const w=22*u,h=13*u,x=cx-w/2,y=cy-h/2+Math.sin(t*3)*.6*u;
    c.save();c.beginPath();c.roundRect?c.roundRect(x,y,w,h,2*u):c.rect(x,y,w,h);c.fillStyle='#000610';c.fill();
    c.beginPath();c.roundRect?c.roundRect(x+1*u,y+1*u,w-2*u,h-2*u,1.6*u):c.rect(x+u,y+u,w-2*u,h-2*u);const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#fff3b0');g.addColorStop(.5,'#ffc83a');g.addColorStop(1,'#ff9d1c');c.fillStyle=g;c.fill();
    c.save();c.clip();c.fillStyle='rgba(255,255,255,.7)';const sx=x+((t*.5)%1.8-.4)*w;c.transform(1,0,-.5,1,0,0);c.fillRect(sx+h*.25,y,3*u,h);c.restore();
    c.fillStyle=inner;c.beginPath();c.arc(x,cy,2.4*u,0,TAU);c.fill();c.beginPath();c.arc(x+w,cy,2.4*u,0,TAU);c.fill();   /* the notches */
    c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=.8*u;c.strokeRect(x+1.8*u,y+1.8*u,w-3.6*u,h-3.6*u);
    c.fillStyle='rgba(122,58,0,.75)';for(let k=0;k<4;k++)c.fillRect(x+w*.32,y+2.6*u+k*2.5*u,.7*u,1.4*u);c.fillRect(x+w*.44,y+h*.36,w*.34,1.5*u);c.fillRect(x+w*.44,y+h*.6,w*.24,1.5*u);
    c.restore();
  }

  /* ---- the STREAK burst ---- */
  function burst(c,cx,cy,R,t,u,tier,n){
    const N=14,pk=(rot,k,amp)=>{c.beginPath();for(let i=0;i<N*2;i++){const a=rot+i*Math.PI/N,r=(i%2?R*.6:R*(1+amp*Math.sin(t*6+i*2.1)))*k;c[i?'lineTo':'moveTo'](cx+Math.cos(a)*r,cy+Math.sin(a)*r*.74);}c.closePath();};
    c.save();
    pk(t*.35,1,.1);c.fillStyle='#000';c.globalAlpha=.55;c.save();c.translate(0,1.6*u);c.fill();c.restore();c.globalAlpha=1;
    const g=c.createRadialGradient(cx,cy,0,cx,cy,R);g.addColorStop(0,'#fffbd8');g.addColorStop(.35,'#ffe45a');g.addColorStop(.75,tier[1]);g.addColorStop(1,tier[1]);
    pk(t*.35,1,.1);c.fillStyle=g;c.fill();c.lineWidth=1.8*u;c.strokeStyle='#4a1c00';c.lineJoin='round';c.stroke();
    pk(-t*.5,.62,.14);c.fillStyle='rgba(255,252,220,.7)';c.fill();
    /* lightning flickering around it */
    if(t-S.boltT>.085){S.boltT=t;S.bolts=[];const nb=4+Math.min(4,(n/60)|0);for(let i=0;i<nb;i++){const a=Math.random()*TAU,r0=.62,r1=1+Math.random()*.55,seg=[];for(let j=0;j<=5;j++){const f=j/5,aa=a+(j&&j<5?(Math.random()-.5)*.2:0);seg.push([Math.cos(aa)*(r0+(r1-r0)*f),Math.sin(aa)*(r0+(r1-r0)*f)*.74+(j&&j<5?(Math.random()-.5)*.08:0)]);}S.bolts.push(seg);}}
    c.globalCompositeOperation='lighter';c.lineJoin='round';c.lineCap='round';
    for(const [wd,col,al] of [[3.4*u,'#18b8ff',.55],[1.5*u,'#e8ffff',1]]){c.lineWidth=wd;c.strokeStyle=col;c.globalAlpha=al*(.6+.4*Math.sin(t*40));for(const sg of S.bolts){c.beginPath();sg.forEach((p,j)=>c[j?'lineTo':'moveTo'](cx+p[0]*R,cy+p[1]*R));c.stroke();}}
    c.restore();
  }

  /* ---- text ---- */
  function txt(c,s,x,y,col,al,size,u,wt){c.font=(wt||800)+' '+Math.round(size*u)+'px "Rajdhani",sans-serif';c.textAlign=al||'right';c.lineJoin='round';c.lineWidth=3*u;c.strokeStyle='rgba(0,0,0,.85)';c.strokeText(s,x,y);c.fillStyle=col;c.fillText(s,x,y);}
  function fit(c,s,size,maxw,u,wt){c.font=(wt||800)+' '+Math.round(size*u)+'px "Rajdhani",sans-serif';const w=c.measureText(s).width;return w>maxw?size*maxw/w:size;}

  /* the list of effects shown in the panel, in order */
  function rows(R,g,tt,tr){
    const o=[],kt=R.keyHints&&R.keyHints.kaioken||'R',kv=n=>Math.ceil(n)+'s';
    if(g.buffs.dmg>0)o.push({k:'dmg',i:'dmg',s:tt('buffDmg')+' '+kv(g.buffs.dmg),c:'#f2905a',l:g.buffs.dmg});
    if(g.buffs.haste>0)o.push({k:'haste',i:'haste',s:tt('buffHaste')+' '+kv(g.buffs.haste),c:'#ffeaa0',l:g.buffs.haste});
    if(g.riskT>0)o.push({k:'risk',i:'risk',s:tt('buffRisk')+' '+kv(g.riskT),c:'#ff9a5a',l:g.riskT});
    if(g.totemTag){const d=g.totemFx.storm?Math.ceil(Math.max(0,g.stormT)):g.totemFx.spirit?Math.ceil(Math.max(0,g.pulseT)):g.wealthT>0?Math.ceil(g.wealthT):0;o.push({k:'totem',i:g.totemFx.storm?'storm':null,s:tr(g.totemTag)+(g.totemLuck>0?' x'+g.totemLuck:'')+(d?' '+d+'s':''),c:g.totemFx.storm?'#bfe8ff':'#8be07a',l:d||99});}
    if(g.inHeal)o.push({k:'heal',i:'heal',s:tt('inHeal'),c:'#8ff0a0',l:99});
    {const wt=EXTRAS.wxTag(g);if(wt)o.push({k:'wx',i:'rain',s:tr(wt).replace(/^[^A-Za-z0-9\[]+/,''),c:'#ffffff',l:99});}
    if(g.bers>0)o.push({k:'bers',i:null,s:'BERSERK '+kv(g.bers)+'  ·  +80% DMG  +5 ARM',c:'#8aff3a',l:g.bers,glow:'#46ff00',big:1});
    else if(g.berAvail)o.push({k:'berA',i:null,s:g.bersCd>0?'Berserk '+kv(g.bersCd):'['+kt+'] Berserk',c:g.bersCd>0?'#9aaa9a':'#b8ff8a',l:99,dim:1});
    if(g.kai>0)o.push({k:'kai',i:'kaioken',s:'KAIOKEN x'+(g.kai===1?10:20)+'  -'+Math.round(g.kaiDrain*KAI_TICK)+' HP / '+KAI_TICK+'s  ['+kt+']',c:'#ff4b3f',l:99,glow:'#ff2a1a',big:1});
    else if(g.kaiAvail)o.push({k:'kaiA',i:null,s:'['+kt+'] Kaioken x10 / x20',c:'#e0a090',l:99,dim:1});
    if(g.slowT>0)o.push({k:'slow',i:'slow',s:tt('buffSlow'),c:'#a9b0ff',l:99});
    if(g.x2)o.push({k:'x2',i:null,s:'x2',c:'#ff7ad0',l:99,big:1});
    return o;
  }

  function draw(R,g,dt,ctx,W,H,U,m,F,tt,tr){
    const t=g.rt||0,c=ctx;
    if(S.g!==g){S.g=g;S.h=0;S.sh=0;S.fx={};S.kills=g.kills;S.coins=g.run.coins;S.kPop=0;S.ti=0;}
    const RX=W-m-(R.hudRP||0),PW=Math.min(268*U,W*.47),x0=RX-PW,y0=10*U,d=Math.min(.05,dt||.016);
    /* ---- stats panel ---- */
    const tk=g.run.tk||{},tn=(tk.t1||0)+(tk.t10||0)+(tk.l10||0),tickets=(tk.t1||0)+(tk.t10||0)*10+(tk.l10||0)*10;
    const rowsN=tn>0?3:2,sT=(14+rowsN*21)*U;S.sh+=(sT-S.sh)*Math.min(1,d*12);if(Math.abs(S.sh-sT)<.3)S.sh=sT;
    if(g.kills>S.kills)S.kPop=1;S.kills=g.kills;S.kPop=Math.max(0,S.kPop-d*4);
    S.coins+=(g.run.coins-S.coins)*Math.min(1,d*10);if(Math.abs(S.coins-g.run.coins)<.5)S.coins=g.run.coins;
    c.save();frameStats(c,x0,y0,PW,S.sh,U,t);
    c.beginPath();c.rect(x0+7*U,y0+7*U,PW-14*U,S.sh-14*U);c.clip();
    {const xr=x0+PW-14*U,ix=x0+22*U;let y=y0+7*U+17*U;
      const kk=tt('kills').toUpperCase(),lw=(c.font='800 '+Math.round(12*U)+'px "Rajdhani",sans-serif',c.measureText(kk).width);
      txt(c,kk,xr,y,'#fff','right',12,U);
      c.save();c.translate(xr-lw-5*U,y);const pp=1+.22*ease(S.kPop);c.scale(pp,pp);txt(c,String(g.kills),0,0,'#fff','right',20,U,900);c.restore();
      ico(c,'sword',ix,y-6*U,18*U,t,0);
      y+=21*U;
      c.save();c.translate(xr,y);txt(c,String(Math.floor(S.coins)),0,0,'#ffd23f','right',19,U,900);c.restore();
      ico(c,'coin',ix,y-6*U,17*U,t,1.3);
      if(tn>0){y+=21*U;{const ts=tt('hudTickets',{n:tickets}).toUpperCase();txt(c,ts,xr,y,'#ffd7f0','right',fit(c,ts,13,PW-58*U,U),U);}ticket(c,ix,y-5*U,U*.78,t,'#0b3c6a');}
    }
    c.restore();
    /* ---- effects panel ---- */
    const sc=g.streak,showS=sc>=5,list=rows(R,g,tt,tr),ct=showS?comboTier(sc):null,nx=showS?COMBO.find(q=>q.n>sc):null;
    const seen={};
    const unit={top:14,pad:5,burst:showS?58:0,combo:showS?20:0,row:18.5,bot:13};
    const needU=list.length||showS?unit.top+unit.pad+unit.burst+unit.combo+list.length*unit.row+unit.bot:0;
    const yF=y0+S.sh+7*U,cap=Math.max(60*U,H*.8-yF),u=U*Math.min(1,cap/(Math.max(1,needU)*U));
    const hT=needU*u;S.h+=(hT-S.h)*Math.min(1,d*10);if(Math.abs(S.h-hT)<.3)S.h=hT;
    if(S.h>3*u){
      c.save();frameFx(c,x0,yF,PW,S.h,u,t);
      c.beginPath();c.rect(x0+5*u,yF+10*u,PW-10*u,S.h-20*u);c.clip();
      for(const st of S.stars){const a=Math.max(0,Math.sin(t*1.6*(.6+st.s*.15)+st.p));if(a<.05)continue;const sx=x0+(.06+st.x*.88)*PW,sy=yF+(14+st.y*(S.h/u-28))*u,r=st.s*u*a;c.globalAlpha=a*.85;c.fillStyle='#bfeaff';c.fillRect(sx-r,sy-.4*u,r*2,.8*u);c.fillRect(sx-.4*u,sy-r,.8*u,r*2);c.globalAlpha=1;}
      const xr=x0+PW-13*u;let y=yF+(unit.top+unit.pad)*u;
      if(showS){
        const tr0=tierOf(sc);
        if(tr0[0]!==S.ti){if(S.ti!==undefined&&tr0[0]>S.ti)S.tp=1;S.ti=tr0[0];}
        S.tp=Math.max(0,(S.tp||0)-d*1.6);
        const pop=1+Math.min(.4,Math.max(0,g.streakPop)*1.6)+.45*ease(S.tp||0),s='x'+sc,sz=sc>=1000?34:sc>=100?38:40;
        c.font='900 '+Math.round(sz*u)+'px "Rajdhani",sans-serif';const nw=c.measureText(s).width,bcx=xr-nw/2-3*u,bcy=y+34*u,R2=Math.max(nw*.8,50*u)*(1+.05*Math.sin(t*5)+.12*(S.tp||0));
        burst(c,bcx,bcy,R2,t,u,tr0,sc);
        const lab=tr(T('SERIE','STREAK'));
        c.save();c.translate(xr,y+15*u);c.rotate(Math.sin(t*3)*.015);txt(c,lab,0,0,'#fff5c8','right',15,u,900);c.restore();
        c.save();c.translate(xr-nw/2,bcy+12*u);c.scale(pop*(1+.02*Math.sin(t*6)),pop*(1+.02*Math.sin(t*6)));
        c.font='900 '+Math.round(sz*u)+'px "Rajdhani",sans-serif';c.textAlign='center';c.lineJoin='round';
        c.lineWidth=7*u;c.strokeStyle='#000';c.strokeText(s,0,0);
        c.lineWidth=2.6*u;c.strokeStyle='#6a2400';c.strokeText(s,0,0);
        const gr=c.createLinearGradient(0,-sz*u*.7,0,0);gr.addColorStop(0,tr0[2]);gr.addColorStop(1,tr0[3]);c.fillStyle=gr;c.fillText(s,0,0);
        c.fillStyle='rgba(255,255,255,.35)';c.save();c.beginPath();c.rect(-nw/2,-sz*u*.7,nw,sz*u*.2);c.clip();c.fillText(s,0,0);c.restore();   /* top shine */
        c.restore();
        const bw=Math.min(PW-30*u,nw+20*u);c.fillStyle='rgba(0,0,0,.55)';c.fillRect(xr-bw,y+unit.burst*u-4*u,bw,3*u);c.fillStyle=tr0[1];c.fillRect(xr-bw,y+unit.burst*u-4*u,bw*clamp(g.streakT/(g.streakW||STREAK_WIN),0,1),3*u);
        y+=unit.burst*u;
        {const s2=(ct?'COMBO ×'+ct.m:'COMBO')+(nx?'  → '+nx.n:'');txt(c,s2,xr,y+6*u,ct?ct.c:'#cfd8ff','right',14,u,800);
          if(nx){const lo=ct?ct.n:0,bw2=Math.min(PW-30*u,92*u);c.fillStyle='rgba(0,0,0,.55)';c.fillRect(xr-bw2,y+10*u,bw2,2.6*u);c.fillStyle=nx.c;c.fillRect(xr-bw2,y+10*u,bw2*clamp((sc-lo)/(nx.n-lo),0,1),2.6*u);}
          y+=unit.combo*u;}
      }
      for(const r of list){
        r.s=r.s.toUpperCase().replace(/X(\d)/g,'x$1').replace(/(\d)S\b/g,'$1s');
        const F2=S.fx[r.k]||(S.fx[r.k]={a:0});F2.a=Math.min(1,F2.a+d*5);seen[r.k]=1;
        const a=ease(F2.a),yy=y+13*u,sz0=r.big?14:13,avail=PW-28*u-(r.i?20*u:0);
        const size=fit(c,r.s,sz0,avail,u,r.big?900:800),blink=r.l<=5&&!r.dim?.45+.55*Math.abs(Math.sin(t*8)):1;
        c.save();c.globalAlpha=a*blink;c.translate((1-a)*26*u,0);
        if(r.glow){c.shadowColor=r.glow;c.shadowBlur=(7+4*Math.sin(t*7))*u;}
        txt(c,r.s,xr,yy,r.c,'right',size,u,r.big?900:800);
        c.shadowBlur=0;
        if(r.i){c.font=(r.big?900:800)+' '+Math.round(size*u)+'px "Rajdhani",sans-serif';const tw=c.measureText(r.s).width;ico(c,r.i,xr-tw-12*u,yy-5.5*u,18*u,t,r.k.length);}
        c.restore();y+=unit.row*u;
      }
      for(const k in S.fx)if(!seen[k])delete S.fx[k];
      c.restore();
    }else for(const k in S.fx)delete S.fx[k];
  }
  return{draw};
})();
