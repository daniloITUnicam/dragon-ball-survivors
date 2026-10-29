'use strict';
/* ====== TgtArt: the weapon-target indicator of the HUD (TAB), from assets/tgt.webp (tools/gen_tgt.py) ======
   The atlas holds four panels side by side, each one TGT_CELL[0] x TGT_CELL[1] px: 0 closest ("VICINO"), 1 most HP ("HP+"),
   2 least HP ("HP-"), 3 boss ("BOSS"). Only the active mode is drawn; a short pop when it changes. */
const TGT_URL=('__TGTART__'?'data:image/webp;base64,__TGTART__':'');
const TGT_CELL=[232,240];
const TgtArt={
  img:null,ok:false,
  load(){
    if(this.img||!TGT_URL||typeof Image==='undefined')return;
    const i=new Image();i.onload=()=>{this.ok=true;};i.src=TGT_URL;this.img=i;
  },
  /* draws panel `mode` with its top-left corner at (x,y), w px wide; returns the height drawn (0 while the art is not ready) */
  draw(ctx,mode,x,y,w,pop){
    this.load();
    if(!this.ok)return 0;
    const h=w*TGT_CELL[1]/TGT_CELL[0],k=1+.16*clamp(pop||0,0,1);
    ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.translate(x+w/2,y+h/2);ctx.scale(k,k);
    ctx.drawImage(this.img,mode*TGT_CELL[0],0,TGT_CELL[0],TGT_CELL[1],-w/2,-h/2,w,h);
    ctx.restore();
    return h;
  }
};
