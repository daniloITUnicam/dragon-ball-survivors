'use strict';
/* ====== Sprite-sheet import (optional) ======
   Drop PNG sheets into assets/sprites/ and rebuild: they replace the code-generated art of the playable characters.
   - <id>.png      base form of character <id>            (e.g. goku.png)
   - <id>_<n>.png  transformation number n (0 = first)    (e.g. goku_0.png, goku_1.png ...)
   A form without its own sheet reuses the highest lower sheet of the same character; a character without any sheet keeps the procedural art.
   Layout: one row of equally wide frames: 0 idle, 1-4 walk cycle, 5 attack wind-up, 6 attack thrust (see docs/SPRITES.md).
   build.py embeds the files + optional assets/sprites/sprites.json (frame/anchor/ppu overrides) as SPRITE_PACK. */
const SPRITE_PACK=__SPRITE_PACK__;
Sprites.sheets={};
/* player cache key ('goku:2', 'menu:goku:-1', 'bg:goku:0') -> best available sheet id */
Sprites.sheetFor=function(key){
  if(!Object.keys(Sprites.sheets).length)return null;
  const m=/(?:^|:)([a-z0-9_]+):(-?\d+)$/i.exec(key);if(!m)return null;
  const id=m[1];let f=+m[2];
  for(;f>=0;f--)if(Sprites.sheets[id+'_'+f])return id+'_'+f;
  return Sprites.sheets[id]?id:null;
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
      Sprites.sheets[id]={img,cols,fw,fh,ax:d.ax!==undefined?d.ax:fw/2,ay:d.ay!==undefined?d.ay:fh-2,ppu:d.ppu||2};
      if(Sprites.pcache)Sprites.pcache.clear();
      if(onLoad)onLoad(id);
    };
    img.src=d.u;
  }
};
