'use strict';
/* ====== v123: weapon effects from painted sheets (assets/sprites/armi/wfx<id>.webp, made by tools/import_wfx.py from the AI art).
   Each sheet is a grid: cols frames per row, rows rows (fw x fh each); hx/hy = the hot spot (where the core of a projectile is, as a
   fraction of the frame). While a weapon has no sheet (or it has not loaded yet) the weapon keeps its drawn-by-code look.
   v125 metadata: rc = frames in each row when a row has fewer than cols, pad = the art was shrunk by pad inside a bigger cell (art wider
   than the AI grid: every draw makes the cell pad times bigger, so the art keeps its size), bx = centre of each frame's art (fraction of
   the frame, row by row), ord = the order the frames are played in. ====== */
const WFX={
  S(id){const S=Sprites.sheets['wfx'+id];return S&&S.img&&S.img.complete?S:null;},
  has(id){return !!this.S(id);},
  meta(id){return SPRITE_PACK['wfx'+id]||{};},
  n(id,r){const M=this.meta(id);return M.rc?M.rc[r||0]:M.cols||1;},
  pad(id){return this.meta(id).pad||1;},
  /* frame number k of the whole sheet (row by row, in play order) -> [column, row] */
  at(id,k){const M=this.meta(id),rc=M.rc,o=M.ord;if(o)k=o[Math.min(o.length-1,k)];if(!rc)return[k%M.cols,Math.floor(k/M.cols)];for(let r=0;r<rc.length;r++){if(k<rc[r])return[k,r];k-=rc[r];}return[rc[rc.length-1]-1,rc.length-1];},
  total(id){const M=this.meta(id);return M.rc?M.rc.reduce((a,b)=>a+b,0):(M.cols||1)*(M.rows||1);},
  /* frame f of row r, centred on (x,y) - on the hot spot when hot, on the art of that frame when hot==='a' - w world units wide, turned by a */
  draw(ctx,id,f,x,y,w,a,al,r,hot){const S=this.S(id);if(!S)return false;const M=this.meta(id),n=this.n(id,r),fr=((Math.floor(f)%n)+n)%n;w*=M.pad||1;const h=w*S.fh/S.fw;
    const bx=hot==='a'&&M.bx?M.bx[(M.rc?M.rc.slice(0,r||0).reduce((p,q)=>p+q,0):(r||0)*M.cols)+fr]:null;
    const ox=bx!=null?-bx*w:hot?-(M.hx!=null?M.hx:.5)*w:-w/2,oy=hot&&hot!=='a'?-(M.hy!=null?M.hy:.5)*h:-h/2;
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
  abFx(ctx,f,g){const id=f.abfx||this.AB[f.ab];if(!this.has(id))return false;const S=this.S(id),M=this.meta(id),n=this.total(id),k=clamp(1-f.l/f.m,0,1),P=M.pad||1;
    let fr=Math.min(n-1,Math.floor(k*n));if(f.beam&&id==='absbc')fr=Math.min(n-1,2+Math.floor(k*(n-2)));   /* the Special Beam Cannon's frames 0-1 are its charge */
    const[col,row]=this.at(id,fr),src=[col*S.fw,row*S.fh,S.fw,S.fh],bx=M.bx?M.bx[fr]:.5;
    /* left: where the art starts in the frame (beams start at the hands, not at the edge of a padded cell) */
    const put=(x,y,a,w,h,al,left)=>{w*=P;h*=P;ctx.save();ctx.translate(x,y);if(a)ctx.rotate(a);ctx.globalAlpha=(al==null?1:al)*(FXL.m||1);ctx.imageSmoothingEnabled=true;ctx.drawImage(S.img,...src,left?-w*left:-w*.06,-h/2,w,h);ctx.restore();};
    const o=f.fol?{x:f.fol.x,y:f.fol.y-18}:f;   /* v125: a beam fired by a hero follows that hero while it lasts */
    if(f.beam){const L=f.len*1.08/P;   /* stretched along the beam: the art (not the padded cell) spans the length */
      put(o.x,o.y,f.a,L,Math.max(f.w*2.6,L*S.fh/S.fw*.35)/P,1,M.bx?.001:.06);return true;}
    if(id==='abnova'){const r=f.R*(.35+.8*Math.sqrt(k))*P;ctx.save();ctx.translate(o.x,o.y);ctx.scale(1,.85);ctx.globalAlpha=(k>.7?(1-k)/.3:1)*(FXL.m||1);ctx.imageSmoothingEnabled=true;ctx.drawImage(S.img,...src,-r,-r*S.fh/S.fw,r*2,r*2*S.fh/S.fw);ctx.restore();return true;}
    if(id==='abdb'){for(let i=0;i<8;i++){const a=i/8*TAU+.2;put(o.x,o.y,a,f.R*1.05,f.R*1.05*S.fh/S.fw*.6,1);}return true;}
    if(id==='abkib'){const p=f.fol||g.p,w=f.R*1.4;ctx.save();ctx.translate(p.x+Math.cos(f.a)*(8+w*.25),p.y-18+Math.sin(f.a)*(8+w*.25));ctx.rotate(f.a);ctx.globalAlpha=FXL.m||1;ctx.imageSmoothingEnabled=true;
      const W=w*P,H=W*S.fh/S.fw;ctx.drawImage(S.img,...src,-W*bx,-H/2,W,H);ctx.restore();return true;}
    return false;},
  /* a beam along +x from the current origin (the caller has translated and rotated): row 0 = muzzle (frames m0..m1), row 1 = body tile,
     row 2 = tip. th = the beam's thickness on screen; the art's band is about a third of the cell height. pr = how far the beam is in its
     life (0..1): the muzzle burst and the tip play their frames once along it (the head forms, then breaks up as the beam ends) instead of
     looping; only the body keeps flowing */
  beam(ctx,id,len,th,t,al,m0,m1,pr){const S=this.S(id);if(!S)return false;const n=this.n(id,1),nt=this.n(id,2),fps=14,f=Math.floor(t*fps),A=(al==null?1:al)*(FXL.m||1);
    const ch=th*2.4,cw=ch*S.fw/S.fh,cut=Math.round(S.fw*.04),bw=cw*(S.fw-2*cut)/S.fw;
    ctx.save();ctx.globalAlpha*=A;ctx.imageSmoothingEnabled=true;
    const mw=Math.min(cw*.6,95),mh=mw*S.fh/S.fw;
    for(let x=Math.min(cw*.12,mw*.45),i=0;x<len-cw*.35;x+=bw*.96,i++){const fr=(f+i)%n,ww=Math.min(bw,len-cw*.35-x+bw*.1);
      ctx.drawImage(S.img,fr*S.fw+cut,S.fh,(S.fw-2*cut)*Math.max(.05,ww/bw),S.fh,x,-ch/2,ww,ch);}   /* the body, tile after tile */
    {const mm=m1!=null?m1:n-1,a0=m0||0,m=pr!=null?a0+Math.min(mm-a0,Math.floor(pr/.3*(mm-a0+1))):a0+f%(mm-a0+1);ctx.drawImage(S.img,m*S.fw,0,S.fw,S.fh,-mw*.2,-mh/2,mw,mh);}   /* muzzle: a burst that starts at the origin, in front of the hands */
    if(len>mw*.4){const tf=pr!=null?Math.min(nt-1,Math.floor(pr*nt)):Math.floor(t*10)%nt,q=Math.min(1,len/(cw*1.2)),tw=cw*q,th2=ch*(.6+.4*q);   /* tip: its frames have the head on the right edge (import_wfx 'r'), so it does not jump; */
      ctx.drawImage(S.img,tf*S.fw,2*S.fh,S.fw,S.fh,len-tw*.8,-th2/2,tw,th2);}   /* a short beam (still coming out) gets a smaller tip, always in front of the muzzle */
    ctx.restore();return true;}
};
