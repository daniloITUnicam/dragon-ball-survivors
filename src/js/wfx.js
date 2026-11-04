'use strict';
/* ====== v123: weapon effects from painted sheets (assets/sprites/armi/wfx<id>.webp, made by tools/import_wfx.py from the AI art).
   Each sheet is a grid: cols frames per row, rows rows (fw x fh each); hx/hy = the hot spot (where the core of a projectile is, as a
   fraction of the frame). While a weapon has no sheet (or it has not loaded yet) the weapon keeps its drawn-by-code look.
   v125 metadata: rc = frames in each row when a row has fewer than cols, pad = the art was shrunk by pad inside a bigger cell (art wider
   than the AI grid: every draw makes the cell pad times bigger, so the art keeps its size), bx = centre of each frame's art (fraction of
   the frame, row by row), ord = the order the frames are played in. ====== */
/* v129: second evolutions (<id>ev2) and the final forms of the abilities (<ability>2). Sheets cut by boxes (seq: 1 row, every frame
   aligned on its centre of light by tools/import_wfx.py) carry cores = [x, y, art height / frame width] and ab = the art box of every frame,
   plus the frame ranges the game reads (fly, boom, form, charge, loop, ch / mz / body / tip for beams). Animations blend: between two frames
   the next one fades in over the current one (WFX.blend), so 8-12 painted frames play smoothly at any frame rate. ====== */
const WFX={
  blend:true,
  /* v131: part (sx,sy,sw,sh) of cell (c,r) - in pixels of the cell - drawn on the box (dx,dy,dw,dh), cut to the cell's crop box (cb,
     tools/wfx_crop.py): the transparent rest of the cell is not filled (same picture, ~40% fewer pixels). A whole cell: sw = sh = 0 */
  blit(ctx,S,M,c,r,sx,sy,sw,sh,dx,dy,dw,dh){if(!sw){sw=S.fw;sh=S.fh;}let x0=sx,y0=sy,x1=sx+sw,y1=sy+sh;const B=M.cb,i=(r*(M.cols||1)+c)*4;
    if(B&&i+3<B.length){if(B[i]>x0)x0=B[i];if(B[i+1]>y0)y0=B[i+1];if(B[i+2]<x1)x1=B[i+2];if(B[i+3]<y1)y1=B[i+3];if(x1<=x0||y1<=y0)return;}
    const kx=dw/sw,ky=dh/sh;ctx.drawImage(S.img,c*S.fw+x0,r*S.fh+y0,x1-x0,y1-y0,dx+(x0-sx)*kx,dy+(y0-sy)*ky,(x1-x0)*kx,(y1-y0)*ky);},
  S(id){const S=Sprites.sheets['wfx'+id];return S&&S.img&&S.img.complete?S:null;},
  has(id){return !!this.S(id);},
  meta(id){return SPRITE_PACK['wfx'+id]||{};},
  /* the sheet of a weapon: <id>ev2 from the second evolution on, <id>evo from the first, when that sheet is there */
  sid(id,evo){return evo>=2&&this.has(id+'ev2')?id+'ev2':evo&&this.has(id+'evo')?id+'evo':id;},
  /* an ability: its final-form sheet (<ability>2) when t2 */
  abs(id,t2){return t2&&this.has(id+'2')?id+'2':id;},
  rng(id,k,d){const r=this.meta(id)[k];return r||d;},
  n(id,r){const M=this.meta(id);return M.rc?M.rc[r||0]:M.cols||1;},
  pad(id){return this.meta(id).pad||1;},
  /* frame number k of the whole sheet (row by row, in play order) -> [column, row] */
  at(id,k){const M=this.meta(id),rc=M.rc,o=M.ord;if(o)k=o[Math.min(o.length-1,k)];if(!rc)return[k%M.cols,Math.floor(k/M.cols)];for(let r=0;r<rc.length;r++){if(k<rc[r])return[k,r];k-=rc[r];}return[rc[rc.length-1]-1,rc.length-1];},
  total(id){const M=this.meta(id);return M.rc?M.rc.reduce((a,b)=>a+b,0):(M.cols||1)*(M.rows||1);},
  /* a one-shot that plays its frames once over k = 0..1 (never wraps back to the first frame) */
  once(id,k,r){return clamp(k,0,1)*(this.n(id,r)-1);},
  /* f (fractional, a running counter) -> [frame, next frame, how far to the next], looping over the frames [a, b] (default: all n) */
  fr(f,n,lp){const a=lp?lp[0]:0,m=lp?Math.min(n-1,lp[1])-a+1:n,i=Math.floor(f),u=f-i;return[a+((i%m)+m)%m,a+(((i+1)%m)+m)%m,u];},
  /* alpha of the current frame and of the next one while they blend: both stay strong in the middle, so the effect does not thin out */
  mix(u){return u<.02||!this.blend||FXL.on?[1,0]:[Math.min(1,(1-u)*1.7),Math.min(1,u*1.7)];},
  /* frame f of row r, centred on (x,y) - on the hot spot when hot, on the art of that frame when hot==='a' - w world units wide, turned by a */
  draw(ctx,id,f,x,y,w,a,al,r,hot,lp){const S=this.S(id);if(!S)return false;const M=this.meta(id),rows=M.rows||1;r=Math.min(r||0,rows-1);const n=this.n(id,r);w*=M.pad||1;const h=w*S.fh/S.fw;
    const [f0,f1,u]=this.fr(f,n,lp||(r?null:M.loop)),[A0,A1]=this.mix(u),base=(r&&M.rc?M.rc.slice(0,r).reduce((p,q)=>p+q,0):r*M.cols);
    ctx.save();ctx.translate(x,y);if(a)ctx.rotate(a);const G=ctx.globalAlpha*(al==null?1:al)*(FXL.m||1);ctx.imageSmoothingEnabled=true;
    const one=(fr,A)=>{if(A<=0)return;const bx=hot==='a'&&M.bx?M.bx[base+fr]:null;
      const ox=bx!=null?-bx*w:hot?-(M.hx!=null?M.hx:.5)*w:-w/2,oy=hot&&hot!=='a'?-(M.hy!=null?M.hy:.5)*h:-h/2;
      ctx.globalAlpha=G*A;this.blit(ctx,S,M,fr,r,0,0,0,0,ox,oy,w,h);};
    one(f0,A0);if(f1!==f0)one(f1,A1);ctx.restore();return true;},
  /* frame f drawn with its own centre of light (cores) on (x,y): a ball whose tail trails behind it.
     d > 0: the frame is sized so its art is d world units TALL; d < 0: |d| wide (art box); otherwise w is the frame width */
  ball(ctx,id,f,x,y,w,a,al,d,lp){const S=this.S(id);if(!S)return false;const M=this.meta(id),n=this.n(id,0),[f0,f1,u]=this.fr(f,n,lp||M.loop),[A0,A1]=this.mix(u);
    ctx.save();ctx.translate(x,y);if(a)ctx.rotate(a+(M.rot||0));const G=ctx.globalAlpha*(al==null?1:al)*(FXL.m||1);ctx.imageSmoothingEnabled=true;
    const one=(fr,A)=>{if(A<=0)return;const C=M.cores&&M.cores[fr]||[.5,.5,.3],B=M.ab&&M.ab[fr];let ww=w*(M.pad||1);
      if(d>0)ww=d/Math.max(.08,C[2]||.3);else if(d<0)ww=-d/Math.max(.08,B?B[2]-B[0]:.8);const hh=ww*S.fh/S.fw;
      ctx.globalAlpha=G*A;this.blit(ctx,S,M,fr,0,0,0,0,0,-C[0]*ww,-C[1]*hh,ww,hh);};
    one(f0,A0);if(f1!==f0)one(f1,A1);ctx.restore();return true;},
  /* a projectile of a weapon that has a sheet: turned to where it flies, the core on the shot. [size, 'r' = size x radius ('d': the ball's
     height, x radius) / 'w' = width, first frame, last frame] (no range = every frame of the row; a sheet's own 'fly' range wins) */
  PROJ:{ki:[3.2,'d'],homing:[3.3,'d'],javelin:[92,'w'],breaker:[7.5,'r',2,4]},
  TIER:[1,1.12,1.25],
  proj(ctx,b,t){const P=this.PROJ[b.wid];if(!P)return false;const id=this.sid(b.wid,b.we);if(!this.has(id))return false;const M=this.meta(id);
    const a=b.spear!==undefined?b.spear:Math.atan2(b.vy,b.vx),seed=(b.x*.13+b.y*.07)%7;
    if(P[1]==='d'){const d=b.r*P[0]*this.TIER[Math.min(2,b.we|0)];return M.seq?this.ball(ctx,id,t*14+seed,b.x,b.y,0,a,1,d):this.draw(ctx,id,t*14+seed,b.x,b.y,d/.33,a,1,0,true);}
    const w=P[1]==='r'?b.r*P[0]:P[0]*(b.r?Math.max(.8,b.r/8):1),fl=M.fly||(P[2]!=null?[P[2],P[3]]:null);
    if(fl){const f=t*12+seed;return M.seq?this.ball(ctx,id,f,b.x,b.y,0,a,1,b.r*2.6*this.TIER[Math.min(2,b.we|0)],fl):this.ball(ctx,id,f,b.x,b.y,w,a,1,0,fl);}
    return this.draw(ctx,id,t*14+seed,b.x,b.y,w,a,1,b.wid==='javelin'&&b.pi>2?1:0,true);},
  /* v130: a beam sheet cut by boxes with anc 'l' (every frame's art starts at x = 0 and is centred vertically): frame f stretched from the
     origin along +a, L world units long (the widest frame spans L, a shorter one less: the head coming out), the art TH units thick
     (the sheet's mean art height is mapped to TH, so the thickness does not change from frame to frame). Blended, loops over lp */
  strip(ctx,id,f,x,y,a,L,TH,al,lp){const S=this.S(id);if(!S)return false;const M=this.meta(id),n=this.n(id,0),[f0,f1,u]=this.fr(f,n,lp),[A0,A1]=this.mix(u);
    if(M._ah==null){const ab=M.ab||[];M._ah=ab.length?ab.reduce((s,b)=>s+(b[3]-b[1]),0)/ab.length:.5;}
    const hh=TH/Math.max(.05,M._ah);ctx.save();ctx.translate(x,y);if(a)ctx.rotate(a);const G=ctx.globalAlpha*(al==null?1:al)*(FXL.m||1);ctx.imageSmoothingEnabled=true;
    const one=(fr,A)=>{if(A<=0)return;ctx.globalAlpha=G*A;this.blit(ctx,S,M,fr,0,0,0,0,0,0,-hh/2,L,hh);};
    one(f0,A0);if(f1!==f0)one(f1,A1);ctx.restore();return true;},
  /* a one-shot painted effect left in the world (the blast of a Break Cannon shell): frames f0..f1 over its life, R = blast radius */
  boom(g,id,x,y,R,f0,f1,life){if(!this.has(id)||g.fx.length>440)return;const bm=this.meta(id).boom;if(bm){f0=bm[0];f1=bm[1];}g.fx.push({wfx:id,x,y,R,f0,f1,l:life||.42,m:life||.42});},
  fxDraw(ctx,f){const k=clamp(1-f.l/f.m,0,1),fr=f.f0+k*(f.f1-f.f0),al=k>.7?(1-k)/.3:1;
    return this.meta(f.wfx).seq?this.ball(ctx,f.wfx,Math.min(f.f1,fr),f.x,f.y,0,0,al,f.R*1.7*(.85+.3*k)):this.ball(ctx,f.wfx,Math.floor(f.f0+Math.min(f.f1-f.f0,Math.floor(k*(f.f1-f.f0+1)))),f.x,f.y,f.R*2.6*(.85+.3*k),0,al);},
  /* character abilities with a painted sheet: id of the character -> sheet */
  AB:{vegeta:'abff',freezer:'abnova',cooler:'abnova',frost:'abdb',black:'abkib',sbc:'absbc',tien:'abdodon',chaozu:'abdodon',gohan:'abmasenko'},
  /* an ability effect (game fx): beams stretched along their length, the Supernova growing around the hero, Frost's Death Beam as rays
     all around, the Ki Blade in front of the dashing hero. One-shot: the frame follows the effect's life (blended) */
  abFx(ctx,f,g){const id=this.abs(f.abfx||this.AB[f.ab],f.t2);if(!this.has(id))return false;const S=this.S(id),M=this.meta(id),n=this.total(id),k=clamp(1-f.l/f.m,0,1),P=M.pad||1,sq=!!M.seq;
    const sbc=f.beam&&id.indexOf('absbc')===0,f0=sbc?2:0,ff=Math.min(n-1,f0+k*(n-1-f0));   /* the Special Beam Cannon's frames 0-1 are its charge */
    const i0=Math.floor(ff),i1=Math.min(n-1,i0+1),[A0,A1]=this.mix(ff-i0);
    const o=f.fol?{x:f.fol.x,y:f.fol.y-18}:f;   /* a beam fired by a hero follows that hero while it lasts */
    /* one frame as a box w x h at (x,y) turned by a; left = where along the box the origin is (0 = the art starts there) */
    const put=(fr,x,y,a,w,h,al,left,top)=>{if(al<=0)return;const[col,row]=this.at(id,fr);ctx.save();ctx.translate(x,y);if(a)ctx.rotate(a);ctx.globalAlpha=al*(FXL.m||1);ctx.imageSmoothingEnabled=true;
      this.blit(ctx,S,M,col,row,0,0,0,0,-w*left,-h*(top==null?.5:top),w,h);ctx.restore();};
    const both=fn=>{fn(i0,A0);if(i1!==i0)fn(i1,A1);};
    if(f.beam){const L=f.len*1.08/P;
      const H=sq?clamp(L*S.fh/S.fw,f.w*1.1,f.w*1.9):Math.max(f.w*2.6,L*S.fh/S.fw*.35)/P;   /* box sheets keep their proportions (within reason); the old grids are squashed */
      if(sbc&&sq){   /* v129: the final Special Beam Cannon: the painted drill travels out along the line, the base sheet's beam is its trail */
        const Hd=f.w*4.2,Wd=Hd*S.fw/S.fh,xh=Wd*.6+(L-Wd*.6)*Math.min(1,k/.7),tr=this.S('absbc');   /* the drill reaches the end of the line at 70% of the beam's life */
        if(tr&&xh>Wd*.5){const tn=this.total('absbc'),tf=Math.min(tn-1,2+Math.floor(k*(tn-2))),[c2,r2]=this.at('absbc',tf);ctx.save();ctx.translate(o.x,o.y);ctx.rotate(f.a);ctx.globalAlpha=(FXL.m||1)*(k>.75?(1-k)/.25:1);ctx.imageSmoothingEnabled=true;
          this.blit(ctx,tr,this.meta('absbc'),c2,r2,0,0,0,0,0,-f.w*1.3,xh-Wd*.45,f.w*2.6);ctx.restore();}
        both((fr,A)=>put(fr,o.x+Math.cos(f.a)*(xh-Wd),o.y+Math.sin(f.a)*(xh-Wd),f.a,Wd,Hd,A,0));return true;}
      both((fr,A)=>put(fr,o.x,o.y,f.a,L*P,H*P,A,sq?0:M.bx?.001:.06));return true;}
    if(id.indexOf('abnova')===0){const R=f.R*(.35+.8*Math.sqrt(k)),al=k>.7?(1-k)/.3:1;
      if(sq){const D=f.R*1.4*(.35+.65*Math.sqrt(k));ctx.save();ctx.translate(o.x,o.y);ctx.scale(1,.85);both((fr,A)=>this.ball(ctx,id,fr,0,0,0,0,al*A,D));ctx.restore();return true;}
      both((fr,A)=>{ctx.save();ctx.translate(o.x,o.y);ctx.scale(1,.85);put(fr,0,0,0,R*2*P,R*2*P*S.fh/S.fw,al*A,.5);ctx.restore();});return true;}
    if(id.indexOf('abdb')===0){const L=f.R*1.05;for(let q=0;q<8;q++){const a=q/8*TAU+.2;both((fr,A)=>put(fr,o.x,o.y,a,L,L*S.fh/S.fw*(sq?.5:.6),A,sq?0:.06));}return true;}
    if(id.indexOf('abkib')===0){const p=f.fol||g.p,w=f.R*1.4,W=w*P,Hh=W*S.fh/S.fw;
      both((fr,A)=>put(fr,p.x+Math.cos(f.a)*(8+w*.25),p.y-18+Math.sin(f.a)*(8+w*.25),f.a,W,Hh,A,M.bx?M.bx[fr]:.5));return true;}
    return false;},
  /* a beam along +x from the current origin (the caller has translated and rotated): row 0 = muzzle (frames m0..m1), row 1 = body tile,
     row 2 = tip. th = the beam's thickness on screen; the art's band is about a third of the cell height. pr = how far the beam is in its
     life (0..1): the muzzle burst and the tip play their frames once along it (the head forms, then breaks up as the beam ends) instead of
     looping; only the body keeps flowing (blended tile after tile). A sheet's own mz / body / tip ranges win over m0..m1 */
  beam(ctx,id,len,th,t,al,m0,m1,pr){const S=this.S(id);if(!S)return false;const M=this.meta(id),fps=14,ft=t*fps,A=(al==null?1:al)*(FXL.m||1);
    const bd=M.body||[0,this.n(id,1)-1],tp=M.tip||[0,this.n(id,2)-1],mz=M.mz||[m0||0,m1!=null?m1:this.n(id,0)-1];
    const ch=th*2.4*(M.thk||1),cw=ch*S.fw/S.fh,tx=M.tx||[.04,.96],cut=Math.round(S.fw*tx[0]),tw0=Math.round(S.fw*(tx[1]-tx[0])),bw=cw*tw0/S.fw;   /* tx: the part of a body frame that tiles */
    ctx.save();ctx.imageSmoothingEnabled=true;const G=ctx.globalAlpha*A;
    const mw=Math.min(cw*.6,Math.max(95,ch*.8)),mh=mw*S.fh/S.fw;   /* the muzzle covers the start of a thick beam */
    for(let x=Math.min(cw*.12,mw*.45),i=0;x<len-cw*.35;x+=bw*.96,i++){const[f0,f1,u]=this.fr(ft+i,bd[1]-bd[0]+1),[A0,A1]=this.mix(u),ww=Math.min(bw,len-cw*.35-x+bw*.1),sw=tw0*Math.max(.05,ww/bw);
      ctx.globalAlpha=G*A0;this.blit(ctx,S,M,bd[0]+f0,1,cut,0,sw,S.fh,x,-ch/2,ww,ch);
      if(A1>0){ctx.globalAlpha=G*A1;this.blit(ctx,S,M,bd[0]+f1,1,cut,0,sw,S.fh,x,-ch/2,ww,ch);}}   /* the body, tile after tile */
    {const L=mz[1]-mz[0],m=pr!=null?Math.min(L,pr/.3*(L+1)):(ft%(L+1)),i0=Math.floor(m),i1=Math.min(L,i0+1),[A0,A1]=this.mix(m-i0);   /* muzzle: a burst that starts at the origin, in front of the hands */
      ctx.globalAlpha=G*A0;this.blit(ctx,S,M,mz[0]+i0,0,0,0,0,0,-mw*.2,-mh/2,mw,mh);if(A1>0&&i1!==i0){ctx.globalAlpha=G*A1;this.blit(ctx,S,M,mz[0]+i1,0,0,0,0,0,-mw*.2,-mh/2,mw,mh);}}
    if(len>mw*.4){const L=tp[1]-tp[0],m=pr!=null?Math.min(L,pr*(L+1)):((t*10)%(L+1)),i0=Math.floor(m),i1=pr!=null?Math.min(L,i0+1):(i0+1)%(L+1),[A0,A1]=this.mix(m-i0),q=Math.min(1,len/(cw*1.2)),tw=cw*q,th2=ch*(.6+.4*q);   /* tip: the head on the right edge (import_wfx 'r'), so it does not jump; */
      ctx.globalAlpha=G*A0;this.blit(ctx,S,M,tp[0]+i0,2,0,0,0,0,len-tw*.8,-th2/2,tw,th2);   /* a short beam (still coming out) gets a smaller tip, always in front of the muzzle */
      if(A1>0&&i1!==i0){ctx.globalAlpha=G*A1;this.blit(ctx,S,M,tp[0]+i1,2,0,0,0,0,len-tw*.8,-th2/2,tw,th2);}}
    ctx.restore();return true;}
};
