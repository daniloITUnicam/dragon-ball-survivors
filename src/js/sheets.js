'use strict';
/* ====== Sprite-sheet import (optional) ======
   Drop PNG sheets into assets/sprites/ and rebuild: they replace the code-generated art of the playable characters.
   - <id>.png      base form of character <id>            (e.g. goku.png)
   - <id>_<n>.png  transformation number n (0 = first)    (e.g. goku_0.png, goku_1.png ...)
   A form without its own sheet reuses the highest lower sheet of the same character; a character without any sheet keeps the procedural art.
   Layout: one row of equally wide frames: 0 idle, 1-4 walk cycle, 5 attack wind-up, 6 attack thrust, and optionally 7 power-up pose (transformations), 8 dash pose, 9 dash speed-lines,
   10 Kamehameha charge, 11 Kamehameha fire / two-handed shot, 12 Ki Blast wind-up (ball on the palm), 13 Ki Blast throw (arm extended), 14 arms raised (Spirit Bomb), 15 one arm to the sky (see docs/SPRITES.md and docs/SPRITES_AI.md).
   sprites.json "hand": {"10":[x,y],...} = where the game draws the energy ball (frames 10, 12, 14) or where the shot leaves the hand (frame 13), in px of the frame, character facing right.
   build.py embeds the files + optional assets/sprites/sprites.json (frame/anchor/ppu overrides) as SPRITE_PACK. */
const SPRITE_PACK=__SPRITE_PACK__;
Sprites.sheets={};
/* player cache key ('goku:2', 'menu:goku:-1', 'bg:goku:0') -> best available sheet id */
/* Zeno-sama (playable): the picture of his shop, scaled once to the height of a character and registered as a one-frame sheet (null until the picture has loaded) */
Sprites.zenoSheet=function(){
  if(Sprites.sheets.zeno)return Sprites.sheets.zeno;
  const im=typeof ZENO_SPR!=='undefined'?ZENO_SPR:null;if(!(im&&im.complete&&im.naturalWidth))return null;
  const h=72,w=Math.round(h*im.naturalWidth/im.naturalHeight),c=document.createElement('canvas');c.width=w;c.height=h;
  const g=c.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(im,0,0,w,h);
  Sprites.sheets.zeno={img:c,cols:1,fw:w,fh:h,ax:w/2,ay:h-2,ppu:1.85,has:[],walk:null,pw:null,dh:null,rects:null,hand:null};
  if(Sprites.pcache)Sprites.pcache.clear();if(Sprites.ecache)Sprites.ecache.clear();
  return Sprites.sheets.zeno;
};
Sprites.sheetFor=function(key){
  if(/(?:^|:)zeno:-?\d+$/.test(key)&&Sprites.zenoSheet())return'zeno';
  if(!Object.keys(Sprites.sheets).length)return null;
  const m=/(?:^|:)([a-z0-9_]+):(-?\d+)$/i.exec(key);if(!m)return null;
  const id=m[1];let f=+m[2];
  for(;f>=0;f--)if(Sprites.sheets[id+'_'+f])return id+'_'+f;
  return Sprites.sheets[id]?id:null;
};
/* does the sheet of this player key have an optional frame (7 power-up, 8 dash pose, 9 dash streak)? */
Sprites.sheetHas=function(key,f){const id=Sprites.sheetFor&&Sprites.sheetFor(key),S=id&&Sprites.sheets[id];return !!(S&&S.has&&S.has.indexOf(f)>=0);};
/* walk-cycle frame of a player key: sheets may carry a longer hand-made cycle (meta.walk = frame indexes), otherwise frames 1-4 */
Sprites.walkFrame=function(key,t){
  const id=Sprites.sheetFor&&Sprites.sheetFor(key),S=id&&Sprites.sheets[id],w=S&&S.walk;
  return w&&w.length?w[((t*(w.length>4?12:10))|0)%w.length]:1+((t*10)|0)%4;
};
/* animated pose of a player key: kind 'pw' (transformation charge) or 'dh' (dash); sheets with several frames of it list them in meta.pw / meta.dh,
   k in 0..1 is the progress through the pose; others use the single frame 7 / 8 */
Sprites.poseFrame=function(key,kind,k){
  const id=Sprites.sheetFor&&Sprites.sheetFor(key),S=id&&Sprites.sheets[id],l=S&&S[kind];
  return l&&l.length?l[Math.max(0,Math.min(l.length-1,Math.floor(k*l.length)))]:(kind==='pw'?7:8);
};
/* character-select portraits: sheet emo<id>[_<form>] (4 emotes in a row, see docs/SPRITES.md) of a character id and form index (-1 = base); falls back to lower forms */
Sprites.emoSheet=function(id,form){
  for(let f=form;f>=0;f--)if(Sprites.sheets['emo'+id+'_'+f])return 'emo'+id+'_'+f;
  return Sprites.sheets['emo'+id]?'emo'+id:null;
};
/* rock sprites of the planets (atlas rocks.png, meta.rects = [x,y,w,h] per rock), optionally multiplied by a tint colour; origin = bottom centre */
Sprites.rockImg=function(i,tint){
  const S=Sprites.sheets.rocks;if(!S||!S.rects||!S.rects[i])return null;
  S.rc=S.rc||new Map();const k=i+'|'+(tint||'');let o=S.rc.get(k);if(o)return o;
  const r=S.rects[i],c=document.createElement('canvas');c.width=r[2];c.height=r[3];const x=c.getContext('2d');x.imageSmoothingEnabled=false;
  x.drawImage(S.img,r[0],r[1],r[2],r[3],0,0,r[2],r[3]);
  if(tint){x.globalCompositeOperation='multiply';x.fillStyle=tint;x.fillRect(0,0,r[2],r[3]);x.globalCompositeOperation='destination-in';x.drawImage(S.img,r[0],r[1],r[2],r[3],0,0,r[2],r[3]);}
  o={c,ox:r[2]/2,oy:r[3]-1};S.rc.set(k,o);return o;
};
Sprites.sheetFrame=function(sid,frame){
  const S=Sprites.sheets[sid];if(!S)return null;
  const i=S.cols<=1?0:Math.max(0,Math.min(S.cols-1,frame|0));
  const c=document.createElement('canvas');c.width=S.fw;c.height=S.fh;
  const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  g.drawImage(S.img,i*S.fw,0,S.fw,S.fh,0,0,S.fw,S.fh);
  return{c,ox:S.ax,oy:S.ay,s:S.ppu,px:true,sheet:sid};
};
/* decode the embedded sheets; onLoad(id) fires for each one so open menus can refresh */
Sprites.loadPack=function(onLoad){
  for(const id of Object.keys(SPRITE_PACK)){
    const d=SPRITE_PACK[id],img=new Image();
    img.onload=()=>{
      const cols=Math.max(1,d.cols||7),fw=d.fw||Math.floor(img.width/cols),fh=d.fh||img.height;
      Sprites.nSheets=(Sprites.nSheets||0)+1;
      Sprites.sheets[id]={img,cols,fw,fh,ax:d.ax!==undefined?d.ax:fw/2,ay:d.ay!==undefined?d.ay:fh-2,ppu:d.ppu||2,has:d.has||[],walk:d.walk||null,pw:d.pw||null,dh:d.dh||null,rects:d.rects||null,hand:d.hand||null};
      if(id==='rocks'&&typeof World!=='undefined'){World.rockOn=true;World.cache.clear();}
      if(Sprites.pcache)Sprites.pcache.clear();if(Sprites.ecache)Sprites.ecache.clear();
      if(onLoad)onLoad(id);
    };
    img.src=d.u;
  }
};

/* Kamehameha beam drawn from the pack's effect frame (fxkame: muzzle burst | thin body | bulb head), along +x from the origin.
   Segments are found from the column heights of the frame, the body is stretched to `len`, the colour is tinted per weapon colour. */
Sprites.beamSeg=function(){
  const S=Sprites.sheets.fxkame;if(!S)return null;if(S.seg)return S.seg;
  const w=S.img.width,h=S.img.height,cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d');x.drawImage(S.img,0,0);
  const d=x.getImageData(0,0,w,h).data,col=new Array(w).fill(0);
  for(let i=0;i<w;i++)for(let j=0;j<h;j++)if(d[(j*w+i)*4+3]>40)col[i]++;
  const thin=Math.max(8,Math.round(h*.16));let a=0;while(a<w&&col[a]>thin)a++;          /* end of the muzzle burst */
  let b=w-1;while(b>a&&col[b]<=thin)b--;let hd=b;while(hd>a&&col[hd]>thin)hd--;                /* start of the head */
  const mx=(a+hd)>>1;let y0=h,y1=0;for(let j=0;j<h;j++)if(d[(j*w+mx)*4+3]>40){if(j<y0)y0=j;if(j>y1)y1=j;}
  S.seg={w,h,a:Math.max(2,a),hd:Math.max(a+3,hd),by:Math.max(0,y0-1),bh:Math.max(3,y1-y0+3),cy:(y0+y1)/2};return S.seg;
};
Sprites.beamTint=function(color){
  const S=Sprites.sheets.fxkame;if(!S)return null;S.tints=S.tints||new Map();
  let c=S.tints.get(color);if(c)return c;
  c=document.createElement('canvas');c.width=S.img.width;c.height=S.img.height;const x=c.getContext('2d');
  x.drawImage(S.img,0,0);x.globalCompositeOperation='source-atop';x.globalAlpha=.5;x.fillStyle=color;x.fillRect(0,0,c.width,c.height);
  S.tints.set(color,c);return c;
};
Sprites.drawBeam=function(ctx,len,wid,color,k,t){
  const sg=Sprites.beamSeg();if(!sg)return false;const im=Sprites.beamTint(color);if(!im)return false;
  const pul=(.94+.06*Math.sin(t*38)),kk=(.35+.65*k)*pul;
  const sc=Math.max(.4,wid*.034),hh=sg.h*sc*kk,mw=sg.a*sc,hw=(sg.w-sg.hd)*sc,bl=Math.max(2,len-mw*.55-hw);
  const bh=Math.max(6,wid*.62*kk);                                              /* body is thin in the art: thickened to match the beam's hit width */
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.drawImage(im,sg.a,sg.by,sg.hd-sg.a,sg.bh,mw*.45,-bh/2,bl+2,bh);               /* body, stretched */
  ctx.drawImage(im,0,0,sg.a,sg.h,-mw*.55,-hh/2,mw,hh);                          /* muzzle burst */
  ctx.drawImage(im,sg.hd,0,sg.w-sg.hd,sg.h,mw*.45+bl,-hh/2,hw,hh);              /* head */
  ctx.restore();return true;
};

/* Bosses and regular enemies that have pack art: boss id (key of BOSSES) / enemy id (key of ENEMIES) -> sheet id.
   Transformed bosses (cooler2, kale2, ...) use the sheet of the matching form; a boss without an entry keeps the procedural art. */
Sprites.BOSS_SHEET={raditz:'raditz',bardock:'bardock',turles:'turles',cooler:'cooler',coolerm:'cooler',cooler2:'cooler',beerus:'beerus',beerus2:'beerus',
  hit:'hit',hit2:'hit',toppo:'toppo',toppo2:'toppo',toppo3:'toppo',jiren:'jiren',jiren2:'jiren',jiren3:'jiren',jiren4:'jiren',
  kale:'kale',kale2:'kale_0',kale3:'kale_0',caulifla:'caulifla',caulifla2:'caulifla',caulifla3:'caulifla',cabba:'cabba',cabba2:'cabba_1',
  frost:'frost',frost2:'frost_2',freezer:'freezer',cell:'cell',cellmax:'cell_1',c16:'c16',c17:'c17',
  vegeta:'vegeta',bu:'bu',superbu:'bu_2',kidbu:'bu_5',janemba:'janemba',janemba2:'janemba',broly:'broly_0',broly2:'broly_0',tama1:'tama1',tama2:'tama2',tama3:'tama3'};
/* sheets of the later forms of a boss that transforms (the boss keeps its id, e.pf counts the transformations: index 1 = first transformation); a missing sheet falls back to the previous art.
   Tamagami: sheets of 9 frames: 0 idle, 1-4 walk, 5 wind-up, 6 strike, 7 special, 8 hit */
Sprites.BOSS_FORMS={tama1:[null,'tama1f'],tama2:[null,'tama2f'],tama3:[null,'tama3f'],
  freezer:[null,'freezer_0','freezer_1','freezer_2','freezer_3'],cell:[null,'cell_0','cell_1'],cooler:[null,'cooler_0','cooler_1']};
Sprites.ENEMY_SHEET={sai:'saibaman'};
Sprites.enemySheet=function(e){
  const fl=e.boss&&e.bid&&e.pf&&Sprites.BOSS_FORMS[e.bid],fid=fl&&fl[Math.min(e.pf,fl.length-1)];
  const id=e.boss?(e.bid&&((fid&&Sprites.sheets[fid])?fid:Sprites.BOSS_SHEET[e.bid])):(e.def&&Object.keys(Sprites.ENEMY_SHEET).map(k=>ENEMIES[k]===e.def?Sprites.ENEMY_SHEET[k]:null).find(Boolean));
  return id&&Sprites.sheets[id]?id:null;
};
/* pack art id of an enemy, cached on it; a 'none' answer is recomputed whenever another sheet finishes loading (the pack decodes asynchronously, a boss spawned meanwhile must not stay procedural for good) */
Sprites.enemySid=function(e){
  const n=Sprites.nSheets||0;
  if(e.esid===undefined||(e.esid===null&&e.esn!==n)){e.esn=n;e.esid=n?Sprites.enemySheet(e):null;}
  return e.esid;
};
/* idle frame of the pack art of a boss / enemy id (glossary portraits), or null */
Sprites.packPortrait=function(id,isBoss){
  const sid=isBoss?Sprites.BOSS_SHEET[id]:Sprites.ENEMY_SHEET[id];
  return sid&&Sprites.sheets[sid]?Sprites.sheetEnemy(sid,0,false):null;
};
Sprites.sheetEnemy=function(sid,frame,flash){
  const m=Sprites.ecache||(Sprites.ecache=new Map()),k=sid+'|'+frame+(flash?'f':'');let s=m.get(k);
  if(!s){s=flash?Sprites.flashOf(Sprites.sheetEnemy(sid,frame,false)):Sprites.sheetFrame(sid,frame);m.set(k,s);}
  return s;
};
