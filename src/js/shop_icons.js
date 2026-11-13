'use strict';
/* Pixel-art icons of the shop upgrades (assets/icons/shop/<shop id>.webp, embedded by build.py): one per shop upgrade (hp, armor, speed, exp, might, crit, scan, broly, gold, regen, magnet, cd, luck, revive, proj, tslot, ban, rr, sk, bn).
   Also used in the game for the matching upgrades (level-up cards, pause list). An upgrade without a file keeps its kanji. */
const SHOP_IMG=/*__SHOPICONS__*/{};
/* main-menu button art (assets/ui/menu/<name>.webp): the Play row and the three panels (keyed from the artwork; the labels are part of the picture) */
const MENU_IMG=/*__MENUBTNS__*/{};
/* v137: weapon icons (assets/icons/weapons/<weapon id>.webp, embedded by build.py): menus, level-up cards, the HUD. A weapon without a file keeps its kanji */
const WEAPON_IMG=/*__WEAPONICONS__*/{};
/* v137: trinket icons (assets/icons/trinkets/<trinket id>.webp): a trinket without a file keeps its kanji */
const TRINKET_IMG=/*__TRINKETICONS__*/{};
/* character abilities (key = character id), double evolutions (key = fusion id), 'senzu' and 'dash' (assets/icons/abilities/<key>.webp): the HUD buttons, the character screen, the cards. Without a file the kanji stays */
const ABIL_IMG=/*__ABILICONS__*/{};
/* v141: rarity card art (assets/ui/cardframes): exposed as CSS variables (--fr0..--fr4, --frt4) so the style sheet can use them as images */
const CARD_ART=Object.assign({},/*__CARDFRAMES__*/{});
for(const k in CARD_ART)document.documentElement.style.setProperty('--'+k,'url('+CARD_ART[k]+')');
/* swap machine (assets/ui/machine.webp, embedded by build.py): 4x2 frames of w x h px - 0 idle (drawer open), 1 sparks, 2 dome lit + capsule, 3 glowing capsule in the drawer, 4 electric, 5 flash, 6 dim + capsule, 7 dim, empty drawer.
   dome / drawer / foot: points in frame pixels (the UI overlays the trinkets there). frame(i): a canvas of that frame, null until the image has loaded */
const MACH={url:'__MACHINE__'?'data:image/webp;base64,__MACHINE__':'',w:231,h:270,dome:{x:118,y:56,rx:34,ry:11},drawer:{x:67,y:214},foot:{x:118,y:250},img:null,cv:[],
  load(){if(this.img||!this.url)return;const im=new Image();im.onload=()=>{this.ok=true;};im.src=this.url;this.img=im;},
  frame(i){this.load();if(!this.ok)return null;let c=this.cv[i];if(!c){c=document.createElement('canvas');c.width=this.w;c.height=this.h;c.getContext('2d').drawImage(this.img,(i%4)*this.w,((i/4)|0)*this.h,this.w,this.h,0,0,this.w,this.h);this.cv[i]=c;}return c;}};
/* passive upgrade of a run -> the shop icon that shows it */
const PASS_IMG={might:'might',vit:'hp',speed:'speed',armor:'armor',growth:'exp',haste:'cd',magnet:'magnet',regen:'regen',proj:'proj',luck:'luck',area:'area'};   /* haste/magnet/regen reuse the icons of Ritmo, Magnetismo and Rigenerazione */
