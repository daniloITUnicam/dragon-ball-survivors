'use strict';
/* ====== HpBar: the life bar of the HUD, made from the artwork in assets/hpbar.webp (see tools/gen_hpbar.py) ======
   The atlas holds: the left cap (medallion with a transparent hole for the character's portrait + the HP / level plate), the right cap
   (Dragon Ball with spikes and flames), the fill (red to yellow, stretched over the channel and clipped to the current HP) and two rails
   that run between the caps. The game draws: the live portrait of the character in the hole (it follows the transformations), the
   level on the plate, "HP / max" above the bar, a trail that shows the life just lost and a light sweep. Layout numbers: HPB_META (generated). */
const HPBAR_URL=('__HPBAR__'?'data:image/webp;base64,__HPBAR__':'');
const mixHex=(a,b,k)=>{const x=parseInt(a.slice(1,7),16),y=parseInt(b.slice(1,7),16),m=(s)=>Math.round(((x>>s)&255)*(1-k)+((y>>s)&255)*k);return 'rgb('+m(16)+','+m(8)+','+m(0)+')';};
const HpBar={
  img:null,ok:false,gf:1,lastT:0,
  load(){
    if(this.img||!HPBAR_URL||typeof Image==='undefined')return;
    const i=new Image();i.onload=()=>{this.ok=true;};i.src=HPBAR_URL;this.img=i;
  },
  /* size on screen: the bar sits under the EXP bar; null when the screen is too narrow (the old plain bar is used) */
  layout(U,W){
    this.load();
    const s=.3*U,Lw=HPB_META.left[2]*s,Rw=HPB_META.right[2]*s,h=HPB_META.ch.h*s;
    const w=Math.min(310*U,W*.46);
    if(!this.ok||w<Lw+Rw+30*U)return null;
    return{s,w,h,Lw,Rw};
  },
  /* the portrait of the character in the medallion: backdrop in the colour of the form + the head of the sprite; sp = Sprites.player(...) result (or null) */
  portrait(ctx,sp,cx,cy,r,col,t,pulse){
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,6.2832);ctx.clip();
    const base=col||'#ff9d1c',gr=ctx.createRadialGradient(cx,cy-r*.2,r*.05,cx,cy,r*1.05);
    gr.addColorStop(0,mixHex(base,'#ffffff',.62));gr.addColorStop(.55,mixHex(base,'#ffffff',.08));gr.addColorStop(1,mixHex(base,'#000000',.5));
    ctx.fillStyle=gr;ctx.fillRect(cx-r,cy-r,r*2,r*2);
    if(col){   /* a transformed form: slowly turning light rays */
      ctx.globalAlpha=.22+.1*Math.sin(t*3);ctx.fillStyle=mixHex(base,'#ffffff',.7);
      for(let i=0;i<8;i++){const a=t*.5+i*Math.PI/4;ctx.beginPath();ctx.moveTo(cx,cy+r*.1);ctx.arc(cx,cy+r*.1,r*1.3,a,a+.2);ctx.closePath();ctx.fill();}
      ctx.globalAlpha=1;
    }
    if(sp&&sp.c){
      let bb=sp._pb;
      if(!bb){   /* bounding box of the painted pixels, once per sprite */
        const c=sp.c,d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let x0=1e9,y0=1e9,x1=-1,y1=-1;
        for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
        bb=sp._pb=x1<0?[0,0,c.width,c.height]:[x0,y0,x1,y1];
      }
      const bw=bb[2]-bb[0],bh=bb[3]-bb[1],side=Math.max(bw*1.1,bh*.74),sx=(bb[0]+bb[2])/2-side/2,sy=bb[1]-bh*.03;
      ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      ctx.drawImage(sp.c,sx,sy,side,side,cx-r*1.04,cy-r*1.04,r*2.08,r*2.08);
    }
    if(pulse){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=pulse;ctx.fillStyle=col||'#ffcf5a';ctx.fillRect(cx-r,cy-r,r*2,r*2);}
    ctx.restore();
  },
  /* x,y: top-left of the whole bar; f: current life fraction 0..1; tx: {cur, max, lv, plateLv}; t: seconds (animation); drawPortrait(ctx,cx,cy,r): draws the character */
  draw(ctx,x,y,L,f,tx,t,drawPortrait){
    const M=HPB_META,I=this.img,s=L.s,ch=M.ch,mid=L.w-L.Lw-L.Rw;
    const cx0=x+ch.x0*s,cx1=x+L.Lw+mid,cy0=y+ch.y0*s,chH=(ch.y1-ch.y0)*s,chW=cx1-cx0;
    if(t<this.lastT-.5||this.gf<f)this.gf=f;   /* a new run, or healed: the trail snaps to the life */
    const dt=Math.max(0,Math.min(.1,t-this.lastT));this.lastT=t;this.gf=Math.max(f,this.gf-dt*.35);
    ctx.save();ctx.imageSmoothingEnabled=true;
    /* empty channel */
    const gr=ctx.createLinearGradient(0,cy0,0,cy0+chH);gr.addColorStop(0,'#1c0707');gr.addColorStop(.25,'#2e0c0a');gr.addColorStop(.8,'#2a0a09');gr.addColorStop(1,'#140404');
    ctx.fillStyle=gr;ctx.fillRect(cx0,cy0,chW,chH);
    /* the life just lost (fades out toward the current value) */
    if(this.gf>f+.002){ctx.fillStyle='#d8d0c8';ctx.globalAlpha=.55;ctx.fillRect(cx0+chW*f,cy0,chW*(this.gf-f),chH);ctx.globalAlpha=1;}
    /* rails between the caps */
    const rt=M.railT,rb=M.railB;
    ctx.drawImage(I,rt[0],rt[1],rt[2],rt[3],x+L.Lw-s,y+ch.railT*s,mid+2*s,rt[3]*s);
    ctx.drawImage(I,rb[0],rb[1],rb[2],rb[3],x+L.Lw-s,y+ch.railB*s,mid+2*s,rb[3]*s);
    /* the fill: the whole gradient stretched over the channel, clipped to the life (low life = only the red end) */
    const fw=Math.max(0,chW*f);
    if(fw>.5){
      const fi=M.fill;
      ctx.save();ctx.beginPath();ctx.rect(cx0,cy0,fw,chH);ctx.clip();
      ctx.drawImage(I,fi[0],fi[1],fi[2],fi[3],cx0,cy0,chW,chH);
      ctx.globalCompositeOperation='lighter';
      const sp=((t*.45)%1.7)-.35,sx=cx0+chW*sp,sg=ctx.createLinearGradient(sx-34*s,0,sx+34*s,0);   /* a light sweep */
      sg.addColorStop(0,'rgba(255,230,170,0)');sg.addColorStop(.5,'rgba(255,240,200,.34)');sg.addColorStop(1,'rgba(255,230,170,0)');
      ctx.fillStyle=sg;ctx.fillRect(cx0,cy0,fw,chH);
      if(f<.3){ctx.fillStyle='rgba(255,40,30,'+(.14+.12*Math.sin(t*9))+')';ctx.fillRect(cx0,cy0,fw,chH);}   /* danger pulse */
      ctx.restore();
      /* flare at the end of the life */
      if(f<.995){
        const tipx=cx0+fw,tr=chH*(.8+.1*Math.sin(t*12)),tg=ctx.createRadialGradient(tipx,cy0+chH/2,0,tipx,cy0+chH/2,tr);
        tg.addColorStop(0,'rgba(255,255,230,.5)');tg.addColorStop(.4,'rgba(255,200,90,.2)');tg.addColorStop(1,'rgba(255,160,40,0)');
        ctx.globalCompositeOperation='lighter';ctx.fillStyle=tg;ctx.fillRect(tipx-tr,cy0-chH*.3,tr*2,chH*1.6);ctx.globalCompositeOperation='source-over';
      }
    }
    /* the portrait goes under the left cap (its ring covers the edge) */
    const pt=M.pt;if(drawPortrait)drawPortrait(ctx,x+pt.cx*s,y+pt.cy*s,(pt.r+2.5)*s);
    /* caps */
    const le=M.left,ri=M.right;
    ctx.drawImage(I,le[0],le[1],le[2],le[3],x,y,L.Lw,ch.h*s);
    ctx.drawImage(I,ri[0],ri[1],ri[2],ri[3],x+L.Lw+mid,y,L.Rw,ch.h*s);
    /* text: orange gradient letters with a dark outline, like the artwork's */
    const font=(px)=>'800 '+Math.max(7,Math.round(px))+'px "Rajdhani",sans-serif';
    const put=(str,px,x0,y0,al,fit,c1,c2)=>{
      let p=px;ctx.font=font(p);while(fit&&ctx.measureText(str).width>fit&&p>7){p-=.5;ctx.font=font(p);}
      ctx.textAlign=al;ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=Math.max(2,p*.24);ctx.strokeStyle='rgba(20,8,6,.95)';
      ctx.strokeText(str,x0,y0);
      const g=ctx.createLinearGradient(0,y0-p*.5,0,y0+p*.5);g.addColorStop(0,c1);g.addColorStop(1,c2);ctx.fillStyle=g;ctx.fillText(str,x0,y0);
    };
    {   /* the plate under the medallion: the level */
      const pl=M.plate,bx=x+pl[0]*s,by=y+pl[1]*s,bw=pl[2]*s,bh=pl[3]*s;
      put(tx.plate,bh*1.05,bx+bw/2,by+bh*.5,'center',bw+4*s,'#fff1a0','#ff9a2a');   /* big enough to read the level at a glance */
    }
    {   /* HP numbers above the right end of the bar */
      const rx0=x+L.Lw+mid,ht=M.hpText,px=Math.max(11,ch.h*s*.17),x1=rx0+ht.x1*s,yy=y+ht.y*s-px*.15;
      put(tx.cur+' / '+tx.max,px,x1,yy,'right',null,f<.3?'#ffd0c0':'#ffe9a8',f<.3?'#ff4a3a':'#ff9a2a');
    }
    ctx.restore();
  }
};
