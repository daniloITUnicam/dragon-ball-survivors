'use strict';
/* ====== Small effect icons (inline SVG) shown next to upgrade text, so a card reads at a glance:
   sword = damage, heart = health, shield = armor, boot-bolt = speed, clock = cooldown ... ====== */
const SI_STROKE='fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"';
const SI={
  dmg:{s:1,p:'<path d="M20.5 3.5L9.5 14.5"/><path d="M6.5 12.5l5 5"/><path d="M8 16.5l-4 4"/><path d="M16 3.5h4.5V8"/>'},
  hp:{p:'<path d="M12 21s-8.2-5.2-8.2-11.3A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.2 2.7C20.2 15.8 12 21 12 21z"/>'},
  spd:{p:'<path d="M13.5 2L4.5 13.5h6L9.5 22l9-11.5h-6z"/>'},
  magnet:{s:1,p:'<path d="M6 3.5v8.5a6 6 0 0 0 12 0V3.5"/><path d="M3.8 6.5h4.4M15.8 6.5h4.4"/>'},
  cd:{s:1,p:'<circle cx="12" cy="13" r="8"/><path d="M12 8.5V13l3 2"/><path d="M9.5 2.8h5"/>'},
  armor:{p:'<path d="M12 2l8 3v6.2c0 5-3.4 8.8-8 10.8-4.6-2-8-5.8-8-10.8V5z"/>'},
  regen:{s:1,p:'<path d="M12 4.5v15M4.5 12h15"/>'},
  xp:{p:'<path d="M12 2l3.1 6.4 7 .9-5.1 4.9 1.3 7L12 17.8 5.7 21.2l1.3-7L1.9 9.3l7-.9z"/>'},
  area:{s:1,p:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.4" fill="currentColor"/>'},
  shots:{p:'<circle cx="12" cy="5.5" r="2.8"/><circle cx="5" cy="17" r="2.8"/><circle cx="19" cy="17" r="2.8"/>'},
  pierce:{s:1,p:'<path d="M3 12h18"/><path d="M15 6l6 6-6 6"/>'},
  range:{s:1,p:'<path d="M3 12h18"/><path d="M7 8l-4 4 4 4M17 8l4 4-4 4"/>'},
  stun:{s:1,p:'<path d="M12 12m-1.6 0a1.6 1.6 0 1 1 3.2 0a3.6 3.6 0 1 1-7.2 0a5.6 5.6 0 1 1 11.2 0a7.6 7.6 0 1 1-15.2 0"/>'},
  up:{s:1,p:'<path d="M12 20V5"/><path d="M5.5 11.5L12 5l6.5 6.5"/>'},
  wpn:{s:1,p:'<circle cx="12" cy="12" r="4.2" fill="currentColor"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>'},
  coin:{s:1,p:'<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.8 1.8 0 0 1 0 3.6h-3a1.8 1.8 0 0 0 0 3.6h4"/>'},
  star:{p:'<path d="M12 2l2.2 6.8H21l-5.6 4.1 2.2 6.8L12 15.6 6.4 19.7l2.2-6.8L3 8.8h6.8z"/>'}
};
/* weapon level-up stat keys -> icon */
const WS_ICON={dmg:'dmg',n:'shots',cd:'cd',pi:'pierce',rad:'area',r:'area',wid:'area',len:'range',stun:'stun'};
/* passive id -> icon */
const PASS_ICON={might:'dmg',vit:'hp',speed:'spd',magnet:'magnet',haste:'cd',armor:'armor',regen:'regen',growth:'xp',proj:'shots'};
/* effect category -> card colour (red = damage, blue = speed, green = healing ...) */
const CAT_COL={dmg:'#ff5a4a',hp:'#5fd35f',regen:'#5fd35f',spd:'#4aa8ff',range:'#4aa8ff',cd:'#ffc233',armor:'#9db4c8',magnet:'#b980ff',xp:'#2fdcc4',area:'#ff9a3d',shots:'#ff7ac8',pierce:'#ff7ac8',stun:'#ffe14a',wpn:'#ff8a2a',coin:'#ffd23f',star:'#ffd23f',up:'#9db4c8'};
function siIcon(name,color,cls){
  const d=SI[name];if(!d)return document.createTextNode('');
  const el=document.createElement('span');el.className='ic'+(cls?' '+cls:'');if(color)el.style.setProperty('--c',color);
  el.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" '+(d.s?SI_STROKE:'fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"')+'>'+d.p+'</svg>';
  return el;
}
