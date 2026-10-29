'use strict';
/* ====== v123: weapon effects from painted sheets (assets/sprites/armi/wfx<id>.webp, made by tools/import_wfx.py from the AI art).
   Each sheet is a grid: cols frames per row, rows rows (fw x fh each); hx/hy = the hot spot (where the core of a projectile is, as a
   fraction of the frame). While a weapon has no sheet (or it has not loaded yet) the weapon keeps its drawn-by-code look. ====== */
const WFX={
  S(id){const S=Sprites.sheets['wfx'+id];return S&&S.img&&S.img.complete?S:null;},
  has(id){return !!this.S(id);},
  meta(id){return SPRITE_PACK['wfx'+id]||{};},
  /* frame f of row r, centred on (x,y) - or on the hot spot when hot - w world units wide, turned by a */
  draw(ctx,id,f,x,y,w,a,al,r,hot){const S=this.S(id);if(!S)return false;const n=S.cols,fr=((Math.floor(f)%n)+n)%n,h=w*S.fh/S.fw,M=this.meta(id);
    const ox=hot?-(M.hx!=null?M.hx:.5)*w:-w/2,oy=hot?-(M.hy!=null?M.hy:.5)*h:-h/2;
    ctx.save();ctx.translate(x,y);if(a)ctx.rotate(a);ctx.globalAlpha*=(al==null?1:al)*(FXL.m||1);ctx.imageSmoothingEnabled=true;
    ctx.drawImage(S.img,fr*S.fw,(r||0)*S.fh,S.fw,S.fh,ox,oy,w,h);ctx.restore();return true;},
  /* a projectile of a weapon that has a sheet (Ki Blast, Homing Orbs, Rebel Javelin): turned to where it flies, the core on the shot */
  PROJ:{ki:[10,'r'],homing:[10,'r'],javelin:[92,'w']},
  proj(ctx,b,t){const P=this.PROJ[b.wid];if(!P||!this.has(b.wid))return false;
    const a=b.spear!==undefined?b.spear:Math.atan2(b.vy,b.vx),w=P[1]==='r'?b.r*P[0]:P[0]*(b.r?Math.max(.8,b.r/8):1),seed=(b.x*.13+b.y*.07)|0;
    return this.draw(ctx,b.wid,t*14+seed,b.x,b.y,w,a,1,b.wid==='javelin'&&b.pi>2?1:0,true);},
  /* character abilities with a painted sheet: id of the character -> sheet */
  AB:{vegeta:'abff',freezer:'abnova',cooler:'abnova',frost:'abdb',black:'abkib',sbc:'absbc',tien:'abdodon',chaozu:'abdodon',gohan:'abmasenko'},
  /* an ability effect (game fx): beams stretched along their length, the Supernova growing around the hero, Frost's Death Beam as rays
     all around, the Ki Blade in front of the dashing hero. One-shot: the frame follows the effect's life */
  abFx(ctx,f,g){const id=f.abfx||this.AB[f.ab];if(!this.has(id))return false;const S=this.S(id),n=S.cols*Math.round(S.img.height/S.fh),k=clamp(1-f.l/f.m,0,1);
    const fr=Math.min(n-1,Math.floor(k*n)),row=Math.floor(fr/S.cols),col=fr%S.cols,src=[col*S.fw,row*S.fh,S.fw,S.fh];
    const put=(x,y,a,w,h,al)=>{ctx.save();ctx.translate(x,y);if(a)ctx.rotate(a);ctx.globalAlpha=(al==null?1:al)*(FXL.m||1);ctx.imageSmoothingEnabled=true;ctx.drawImage(S.img,...src,-w*.06,-h/2,w,h);ctx.restore();};
    if(f.beam){const fr2=id==='absbc'?Math.min(n-1,2+Math.floor(k*(n-2))):fr,c2=fr2%S.cols,r2=Math.floor(fr2/S.cols);src[0]=c2*S.fw;src[1]=r2*S.fh;
      put(f.x,f.y,f.a,f.len*1.08,Math.max(f.w*2.6,f.len*1.08*S.fh/S.fw*.35),1);return true;}
    if(id==='abnova'){const r=f.R*(.35+.8*Math.sqrt(k));ctx.save();ctx.translate(f.x,f.y);ctx.scale(1,.85);ctx.globalAlpha=(k>.7?(1-k)/.3:1)*(FXL.m||1);ctx.imageSmoothingEnabled=true;ctx.drawImage(S.img,...src,-r,-r*S.fh/S.fw,r*2,r*2*S.fh/S.fw);ctx.restore();return true;}
    if(id==='abdb'){for(let i=0;i<8;i++){const a=i/8*TAU+.2;put(f.x,f.y,a,f.R*1.05,f.R*1.05*S.fh/S.fw*.6,1);}return true;}
    if(id==='abkib'){const p=g.p,w=f.R*1.4;put(p.x+Math.cos(f.a)*8,p.y-18+Math.sin(f.a)*8,f.a,w,w*S.fh/S.fw,1);return true;}
    return false;},
  /* a beam along +x from the current origin (the caller has translated and rotated): row 0 = muzzle (frames m0..m1), row 1 = body tile,
     row 2 = tip. th = the beam's thickness on screen; the art's band is about a third of the cell height */
  beam(ctx,id,len,th,t,al,m0,m1){const S=this.S(id);if(!S)return false;const n=S.cols,fps=14,f=Math.floor(t*fps),A=(al==null?1:al)*(FXL.m||1);
    const ch=th*2.4,cw=ch*S.fw/S.fh,cut=Math.round(S.fw*.04),bw=cw*(S.fw-2*cut)/S.fw;
    ctx.save();ctx.globalAlpha*=A;ctx.imageSmoothingEnabled=true;
    const mw=Math.min(cw*.6,95),mh=mw*S.fh/S.fw;
    for(let x=Math.min(cw*.12,mw*.45),i=0;x<len-cw*.35;x+=bw*.96,i++){const fr=(f+i)%n,ww=Math.min(bw,len-cw*.35-x+bw*.1);
      ctx.drawImage(S.img,fr*S.fw+cut,S.fh,(S.fw-2*cut)*Math.max(.05,ww/bw),S.fh,x,-ch/2,ww,ch);}   /* the body, tile after tile */
    {const mm=m1!=null?m1:n-1,m=(m0||0)+f%(mm-(m0||0)+1);ctx.drawImage(S.img,m*S.fw,0,S.fw,S.fh,-mw*.2,-mh/2,mw,mh);}   /* muzzle: a burst that starts at the origin, in front of the hands */
    {const tf=f%n;ctx.drawImage(S.img,tf*S.fw,2*S.fh,S.fw,S.fh,len-cw*.8,-ch/2,cw,ch);}   /* tip */
    ctx.restore();return true;}
};
