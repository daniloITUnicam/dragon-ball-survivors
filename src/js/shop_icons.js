'use strict';
/* Pixel-art icons of the shop upgrades (assets/shopicons/<shop id>.webp, embedded by build.py): one per shop upgrade (hp, armor, speed, exp, might, crit, scan, broly, gold, regen, magnet, cd, luck, revive, proj, tslot, ban, rr, sk, bn).
   Also used in the game for the matching upgrades (level-up cards, pause list). An upgrade without a file keeps its kanji. */
const SHOP_IMG=/*__SHOPICONS__*/{};
/* passive upgrade of a run -> the shop icon that shows it */
const PASS_IMG={might:'might',vit:'hp',speed:'speed',armor:'armor',growth:'exp',haste:'cd',magnet:'magnet',regen:'regen'};   /* haste/magnet/regen reuse the icons of Ritmo, Magnetismo and Rigenerazione */
