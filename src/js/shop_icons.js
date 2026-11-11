'use strict';
/* Pixel-art icons of the shop upgrades (assets/shopicons/<shop id>.webp, embedded by build.py): one per shop upgrade (hp, armor, speed, exp, might, crit, scan, broly, gold, regen, magnet, cd, luck, revive, proj, tslot, ban, rr, sk, bn).
   Also used in the game for the matching upgrades (level-up cards, pause list). An upgrade without a file keeps its kanji. */
const SHOP_IMG=/*__SHOPICONS__*/{};
/* v137: weapon icons (assets/weaponicons/<weapon id>.webp, embedded by build.py): menus, level-up cards, the HUD. A weapon without a file keeps its kanji */
const WEAPON_IMG=/*__WEAPONICONS__*/{};
/* v137: trinket icons (assets/trinketicons/<trinket id>.webp): a trinket without a file keeps its kanji */
const TRINKET_IMG=/*__TRINKETICONS__*/{};
/* passive upgrade of a run -> the shop icon that shows it */
const PASS_IMG={might:'might',vit:'hp',speed:'speed',armor:'armor',growth:'exp',haste:'cd',magnet:'magnet',regen:'regen',proj:'proj'};   /* haste/magnet/regen reuse the icons of Ritmo, Magnetismo and Rigenerazione */
