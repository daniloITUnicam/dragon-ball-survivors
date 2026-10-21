'use strict';
/* ====== XpBar: the experience bar of the HUD, made from the artwork in assets/xpbar.webp (see tools/gen_xpbar.py) ======
   The atlas holds: the left cap (EXP medallion; the level is written big on the bar, there are no level plates), the right cap (number panel), the beam (a body that is
   stretched to the filled length + a head of fixed size) and two rails that run between the caps. The game draws the real values on the
   plates (level, XP / next level, percentage) and the beam grows with the experience. Layout numbers: XPB_META (generated). */
const XPBAR_URL=('__XPBAR__'?'data:image/webp;base64,__XPBAR__':'');
const XpBar={
  img:null,ok:false,
  load(){
    if(this.img||!XPBAR_URL||typeof Image==='undefined')return;
    const i=new Image();i.onload=()=>{this.ok=true;};i.src=XPBAR_URL;this.img=i;
  },
  /* size on screen: the bar sits in the top-left corner, left of the stage timer; null when the screen is too narrow (the old thin bar is used) */
  layout(U,W){
    this.load();
    const s=.32*U,Lw=XPB_META.left[2]*s,Rw=XPB_META.right[2]*s,h=XPB_META.ch.h*s;
    const w=Math.min(480*U,W/2-150*U-12*U);
    if(!this.ok||w<Lw+Rw+40*U)return null;
    return{s,w,h,Lw,Rw};
  },
  /* x,y: top-left of the whole bar; f: filled fraction 0..1; tx: {lv, cur, need, pct}; t: seconds (animation) */
  draw(ctx,x,y,L,f,tx,t){
    const M=XPB_META,I=this.img,s=L.s,ch=M.ch,mid=L.w-L.Lw-L.Rw;
    const cx0=x+ch.x0*s,cx1=x+L.Lw+mid+ch.rx*s,cy0=y+ch.y0*s,chH=(ch.y1-ch.y0)*s;
    ctx.save();ctx.imageSmoothingEnabled=true;
    /* empty channel */
    const gr=ctx.createLinearGradient(0,cy0,0,cy0+chH);gr.addColorStop(0,'#0c0a24');gr.addColorStop(.18,'#1f1c52');gr.addColorStop(.8,'#262260');gr.addColorStop(1,'#14123a');
    ctx.fillStyle=gr;ctx.fillRect(cx0,cy0,cx1-cx0,chH);
    /* rails between the caps */
    const rt=M.railT,rb=M.railB;
    ctx.drawImage(I,rt[0],rt[1],rt[2],rt[3],x+L.Lw-6*s,y+ch.railT*s,mid+12*s,rt[3]*s);
    ctx.drawImage(I,rb[0],rb[1],rb[2],14,x+L.Lw-6*s,y+ch.railB*s,mid+12*s,14*s);
    /* the beam: body stretched + head, clipped to the filled length */
    const fw=Math.max(0,(cx1-cx0)*f);
    if(fw>1){
      const bo=M.body,hd=M.head,hw=hd[2]*s;
      ctx.save();ctx.beginPath();ctx.rect(cx0,cy0,fw,chH);ctx.clip();
      if(fw>hw){
        ctx.drawImage(I,bo[0],bo[1],bo[2],bo[3],cx0,cy0,fw-hw+1,chH);
        ctx.drawImage(I,hd[0],hd[1],hd[2],hd[3],cx0+fw-hw,cy0,hw,chH);
      }else ctx.drawImage(I,hd[0]+(hd[2]-fw/s),hd[1],fw/s,hd[3],cx0,cy0,fw,chH);
      /* a light sweep that travels along the beam */
      ctx.globalCompositeOperation='lighter';
      const sp=((t*.55)%1.6)-.3,sx=cx0+fw*sp,sg=ctx.createLinearGradient(sx-26*s,0,sx+26*s,0);
      sg.addColorStop(0,'rgba(180,240,255,0)');sg.addColorStop(.5,'rgba(220,250,255,.42)');sg.addColorStop(1,'rgba(180,240,255,0)');
      ctx.fillStyle=sg;ctx.fillRect(cx0,cy0,fw,chH);
      ctx.restore();
      /* flare at the tip of the beam */
      ctx.globalCompositeOperation='lighter';
      const tipx=cx0+fw,tr=chH*(.95+.12*Math.sin(t*14)),tg=ctx.createRadialGradient(tipx,cy0+chH/2,0,tipx,cy0+chH/2,tr);
      tg.addColorStop(0,'rgba(255,255,230,.55)');tg.addColorStop(.4,'rgba(255,236,120,.22)');tg.addColorStop(1,'rgba(255,220,80,0)');
      ctx.fillStyle=tg;ctx.fillRect(tipx-tr,cy0-chH*.4,tr*2,chH*1.8);
      ctx.globalCompositeOperation='source-over';
    }
    /* caps */
    const le=M.left,ri=M.right;
    ctx.drawImage(I,le[0],le[1],le[2],le[3],x,y,L.Lw,ch.h*s);
    ctx.drawImage(I,ri[0],ri[1],ri[2],ri[3],x+L.Lw+mid,y,L.Rw,ch.h*s);
    /* numbers on the plates */
    const font=(px,wt)=>(wt||800)+' '+Math.max(6,Math.round(px))+'px "Rajdhani",sans-serif';
    const put=(str,px,col,tx0,ty0,al,fit)=>{
      let p=px;ctx.font=font(p);while(fit&&ctx.measureText(str).width>fit&&p>6){p-=.5;ctx.font=font(p);}
      ctx.textAlign=al;ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=Math.max(2,p*.22);ctx.strokeStyle='rgba(8,6,30,.9)';
      ctx.strokeText(str,tx0,ty0);ctx.fillStyle=col;ctx.fillText(str,tx0,ty0);return ctx.measureText(str).width;
    };
    const P=(bx,by,bw,bh,ox,oy)=>({x:ox+bx*s,y:oy+by*s,w:bw*s,h:bh*s});
    const rx0=x+L.Lw+mid;
    {   /* upper-right plate: XP / next */
      const b=P(61,41,206,34,rx0,y),cy=b.y+b.h*.52,full=tx.cur+' / '+tx.need;
      let p=b.h*.86;ctx.font=font(p);while(ctx.measureText(full).width>b.w-10*s&&p>6){p-=.5;ctx.font=font(p);}
      const wc=ctx.measureText(tx.cur+' ').width,ws=ctx.measureText('/ ').width,wn=ctx.measureText(tx.need).width,x0=b.x+(b.w-(wc+ws+wn))/2;
      put(tx.cur,p,'#f5c84a',x0,cy,'left');put('/',p,'#cfd3ee',x0+wc,cy,'left');put(tx.need,p,'#ffffff',x0+wc+ws,cy,'left');
    }
    {   /* the inset: percentage */
      const b=P(153,88,114,52,rx0,y),cy=b.y+b.h*.53;
      put(tx.pct,b.h*.62,'#ffd23f',b.x+b.w/2,cy,'center',b.w-14*s);
    }
    {   /* the level, big, at the start of the bar (the plates are too small to read at a glance) */
      const fs=chH*1.12,bx=cx0+12*s,cy=cy0+chH*.52;
      ctx.save();ctx.shadowColor='rgba(0,0,0,.75)';ctx.shadowBlur=4*s;
      const w1=put('LV',fs*.56,'#f5c84a',bx,cy+fs*.06,'left');
      put(String(tx.lv),fs,'#ffffff',bx+w1+4*s,cy,'left');
      ctx.restore();
    }
    ctx.restore();
  }
};
