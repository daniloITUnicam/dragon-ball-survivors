/* ============================================================
   Enemy skills: every enemy of a stage can have its own abilities (wind-up telegraph -> attack),
   plus rage / evolution transformations. Data lives in SK_MAP (per enemy id), the mechanics in SKD.
   ============================================================ */

/* ---- stronger forms enemies can turn into (rage with a new look, or evolution) ---- */
(function(){
  const M=(from,to,o)=>{
    const b=ENEMIES[from];if(!b)return;
    const sp=Object.assign({},b.sp);delete sp._c;
    if(o.cfg)sp.cfg=Object.assign({},b.sp.cfg,o.cfg);
    if(o.pal)sp.pal=o.pal;
    if(o.u)sp.u=o.u;
    ENEMIES[to]=Object.assign({},b,{n:o.n,hp:Math.round(b.hp*(o.hp||1.6)),spd:b.spd*(o.spd||1.12),dmg:b.dmg*(o.dmg||1.25),r:o.r||b.r+1,xp:Math.round(b.xp*1.5),sp,evo:true,sk:undefined});
  };
  M('ssol','ssol2',{n:T('Soldato Saiyan (Super Saiyan)','Saiyan Soldier (Super Saiyan)'),cfg:{hair:'#ffd23f',eye:'#3aa8a8'},hp:1.7,u:1.75});
  M('sberserk','sberserk2',{n:T('Guerriero Furioso (Oozaru)','Raging Warrior (Great Ape)'),cfg:{hair:'#ff5a3d',eye:'#ffffff',wide:true},hp:1.8,u:2.05,r:15});
  M('majinsol','majinsol2',{n:T('Soldato Majin Potenziato','Empowered Majin Soldier'),cfg:{skin:'#e87aa8',outfit:'#b0306a',hair:'#ffd0f0',wide:true},hp:1.8,u:1.85,r:14});
  M('dem','dem2',{n:T('Demone Infuriato','Enraged Demon'),cfg:{skin:'#e03a2a',outfit:'#6a1010',hair:'#ffb13b',eye:'#ffffff',wide:true},hp:1.7,u:1.95,r:14});
  M('celsol','celsol2',{n:T('Soldato Celeste Ascendente','Ascended Celestial Soldier'),cfg:{skin:'#fff0c8',outfit:'#ffd23f',hair:'#ffffff',eye:'#ffffff',wide:true},hp:1.6,u:1.95,r:14});
  M('cyber','cyber2',{n:T('Cyborg Sovraccarico','Overclocked Cyborg'),cfg:{outfit:'#c83a3a',eye:'#ff3b3b',wide:true},hp:1.6,u:1.75,r:13});
  M('war','war2',{n:T('Guerriero Ascendente','Ascended Warrior'),cfg:{hair:'#8ad8ff',eye:'#ffffff',wide:true},hp:1.5,u:1.95,r:14});
  M('pirate','pirate2',{n:T('Pirata Capitano','Pirate Captain'),cfg:{outfit:'#8a1a1a',hair:'#15121c',wide:true},hp:1.7,u:1.9,r:14});
  M('swwarrior','swwarrior2',{n:T('Guerriero Infernale','Netherworld Champion'),cfg:{outfit:'#ff7a3a',eye:'#ffffff',wide:true},hp:1.5,u:1.95,r:15});
  if(ENEMIES.rap)ENEMIES.rap2=Object.assign({},ENEMIES.rap,{n:T('Raptor Furioso','Furious Raptor'),hp:Math.round(ENEMIES.rap.hp*1.5),spd:ENEMIES.rap.spd*1.2,dmg:ENEMIES.rap.dmg*1.25,r:ENEMIES.rap.r+1,sp:Object.assign({},ENEMIES.rap.sp,{u:(ENEMIES.rap.sp.u||1.5)*1.18,pal:['#c8402a','#7a1a10','#ffd0a0']}),evo:true,sk:undefined});
  Object.assign(ENEMY_DESC,{
    ssol2:T('Il guerriero si è trasformato: capelli dorati e aura.','The warrior transformed: golden hair and an aura.'),
    sberserk2:T('Furia incontenibile: più grosso e più veloce.','Unstoppable fury: bigger and faster.'),
    majinsol2:T('Il potere di Bu lo ha gonfiato.','Buu\'s power made it swell.'),
    dem2:T('Il demone ha perso il controllo.','The demon lost control.'),
    celsol2:T('Ascende: armatura dorata e occhi bianchi.','Ascends: golden armor and white eyes.'),
    cyber2:T('Il reattore è sovraccarico: attenti.','The reactor is overloaded: watch out.'),
    war2:T('Ha risvegliato un potere nascosto.','Awakened a hidden power.'),
    pirate2:T('Il capitano in persona.','The captain himself.'),
    swwarrior2:T('Il campione dell\'aldilà.','The champion of the afterlife.'),
    rap2:T('Raptor infuriato: più veloce e più cattivo.','Enraged raptor: faster and meaner.')});
})();

/* ---- per-enemy ability lists. cd = cooldown range (s), c = color, others are per-skill options ---- */
const SK_MAP={
  /* Roshi's Island */
  crab:[{id:'lunge',cd:[5,7],c:'#ff7a5a'}],
  pter:[{id:'lunge',cd:[4.5,6.5],c:'#cfe8ff'}],
  ninja:[{id:'fan',cd:[5,7],n:3,sp:.3,v:210,c:'#cfd8e8',dm:.6}],
  pirate:[{id:'sweep',cd:[4,6],c:'#ffd27a'},{id:'evolve',to:'pirate2',at:70,l:T('Capitano!','Captain!'),c:'#ff5a3d'}],
  rap:[{id:'rage',to:'rap2',c:'#ff5a3d',l:T('Furia!','Fury!')}],
  cave:[{id:'quake',cd:[6,8],c:'#d8b080'}],
  dino:[{id:'rage',c:'#ff5a3d',l:T('Ruggito!','Roar!')}],
  turtle:[{id:'guard',cd:[6,9],c:'#9ad07a'}],
  cave2:[{id:'strike',cd:[5,7],n:3,r:50,c:'#c8a070',ex:.5},{id:'rage',c:'#ff7a3a'}],
  ninja2:[{id:'fan',cd:[4,6],n:5,sp:.22,c:'#a8b8d8',dm:.6},{id:'lunge',cd:[6,8],c:'#a8b8d8'}],
  /* Saiyan Plains */
  sol:[{id:'lunge',cd:[6,8],c:'#c9a0d8'}],
  ssol:[{id:'rage',to:'ssol2',c:'#ffd23f',l:T('Super Saiyan!','Super Saiyan!')}],
  acid:[{id:'mine',cd:[3.6,5.2],c:'#9aff6a',r:42}],
  armsai:[{id:'guard',cd:[6,9],c:'#c8c8d8'}],
  bigsai:[{id:'quake',cd:[5,7],c:'#9aff6a'},{id:'rage',c:'#ff5a3d',l:T('Furia!','Fury!')}],
  /* Planet Namek */
  app:[{id:'rage',c:'#c8a0f0',l:T('Potere!','Power!')}],
  ginyurec:[{id:'warcry',cd:[8,11],c:'#ff7ad0',l:T('Squadra Ginyu!','Ginyu Force!')}],
  tel:[{id:'strike',cd:[6,8],n:2,r:46,c:'#9aff6a'}],
  fsol2:[{id:'radial',cd:[6,9],n:6,c:'#7aa0ff'}],
  nam2:[{id:'heal',cd:[7,10],c:'#8be07a'}],
  scud:[{id:'guard',cd:[6,9],c:'#b0b8c8'}],
  bru:[{id:'rage',c:'#e87aa8',l:T('Furia!','Fury!')}],
  dod:[{id:'quake',cd:[5,7],c:'#e87aa8'},{id:'rage',c:'#ff5a3d',l:T('Furia!','Fury!')}],
  namfish:[{id:'lunge',cd:[4.5,6.5],c:'#6ad0ff'}],
  snp:[{id:'beam',cd:[6,9],c:'#ff5a5a'}],
  /* Android Ruins */
  scav:[{id:'mine',cd:[4,6],c:'#ffb13b',r:40}],
  cyber:[{id:'orbs',n:2,c:'#6ad0ff'},{id:'evolve',to:'cyber2',at:60,l:T('Sovraccarico!','Overload!'),c:'#ff3b3b'}],
  rrs2:[{id:'fan',cd:[4.5,6.5],n:3,sp:.25,c:'#ffb13b'}],
  drn:[{id:'beam',cd:[7,10],c:'#6ad0ff'}],
  wolf3:[{id:'rage',c:'#ff5a3d',l:T('Furia!','Fury!')}],
  andgun:[{id:'radial',cd:[7,9],n:8,c:'#ff7a7a'}],
  andtank:[{id:'guard',cd:[7,10],c:'#8ad8ff'},{id:'beam',cd:[7,10],c:'#ff7a7a'}],
  gol:[{id:'quake',cd:[5,7],c:'#d8b080'},{id:'guard',cd:[8,11],c:'#d8b080'}],
  /* Buu's Dimension */
  rubber:[{id:'lunge',cd:[4.5,6.5],c:'#ffb0d8'}],
  majinsol:[{id:'evolve',to:'majinsol2',at:45,l:T('Potere di Bu!','Buu\'s power!'),c:'#ff7ac8'}],
  majinshot:[{id:'fan',cd:[4,6],n:3,sp:.3,c:'#ff7ac8'}],
  orbm:[{id:'orbs',n:3,c:'#ff7ac8'}],
  majinfury:[{id:'rage',c:'#ff7ac8',l:T('Furia Majin!','Majin fury!')}],
  candygolem:[{id:'summon',cd:[9,12],m:'gel',n:2,c:'#ffb0d8',l:T('Dolcetti!','Sweets!')},{id:'guard',cd:[7,10],c:'#ffb0d8'}],
  cake:[{id:'quake',cd:[5,7],c:'#ffb0d8'},{id:'rage',c:'#ff7ac8',l:T('Furia!','Fury!')}],
  /* Tournament of Power */
  fighter:[{id:'lunge',cd:[5,7],c:'#cfd8ff'}],
  war:[{id:'warcry',cd:[8,11],c:'#8ad8ff',l:T('Per l\'universo!','For the universe!')},{id:'evolve',to:'war2',at:70,l:T('Risveglio!','Awakening!'),c:'#8ad8ff'}],
  archer:[{id:'fan',cd:[3.6,5],n:5,sp:.16,v:240,c:'#ffd27a',dm:.55}],
  phantom:[{id:'strike',cd:[5,7],n:3,r:46,c:'#c9a0ff'}],
  messenger:[{id:'beam',cd:[6,9],c:'#ffd23f'}],
  cosmberserk:[{id:'rage',c:'#ff2a8a',l:T('Berserk!','Berserk!')}],
  champ:[{id:'quake',cd:[5,7],c:'#ffd23f'},{id:'rage',c:'#ff5a3d',l:T('Furia!','Fury!')}],
  col:[{id:'quake',cd:[5,7],c:'#cfd8ff'},{id:'guard',cd:[8,11],c:'#cfd8ff'}],
  silvercol:[{id:'guard',cd:[6,9],c:'#e8e8f0'},{id:'orbs',n:3,c:'#e8e8f0'}],
  /* Planet Vegeta */
  srenegade:[{id:'lunge',cd:[6,8],c:'#ff9d5a'}],
  rasin:[{id:'fan',cd:[4.5,6.5],n:3,sp:.3,c:'#ff9d5a'}],
  sberserk:[{id:'rage',to:'sberserk2',c:'#ff5a3d',l:T('Furia Oozaru!','Great Ape rage!')}],
  lakasei:[{id:'strike',cd:[5,7],n:2,r:46,c:'#ff7a3a'}],
  cacao:[{id:'radial',cd:[6,9],n:8,c:'#ffb13b'}],
  pter2:[{id:'fan',cd:[4,6],n:3,sp:.26,c:'#ff7a3a'}],
  amond:[{id:'warcry',cd:[8,11],c:'#ff9d5a',l:T('Avanti!','Charge!')}],
  daiz:[{id:'guard',cd:[6,9],c:'#c8a070'},{id:'warcry',cd:[9,12],c:'#ff9d5a',l:T('Avanti!','Charge!')}],
  treant:[{id:'quake',cd:[5,7],c:'#ff7a3a'},{id:'mine',cd:[4,6],c:'#ff7a3a',r:46}],
  /* Cell Games Arena */
  cel:[{id:'lunge',cd:[4.5,6.5],c:'#9aff6a'}],
  brawler:[{id:'lunge',cd:[5,7],c:'#ffd27a'}],
  fan:[{id:'rage',c:'#ffd23f',l:T('Fan scatenato!','Fan frenzy!')}],
  camcopter:[{id:'beam',cd:[7,10],c:'#ffffff'}],
  sensei:[{id:'fan',cd:[4,6],n:3,sp:.3,c:'#ffd23f'},{id:'rage',c:'#ffd23f',l:T('Maestro!','Master!')}],
  celltank:[{id:'summon',cd:[9,12],m:'cel',n:2,c:'#9aff6a',l:T('Cell Jr.!','Cell Jrs.!')},{id:'guard',cd:[7,10],c:'#7aa84a'}],
  gladiator:[{id:'quake',cd:[5,7],c:'#ffd27a'},{id:'warcry',cd:[9,12],c:'#ffd27a',l:T('Gloria!','Glory!')}],
  /* Realm of the Gods */
  celsol:[{id:'evolve',to:'celsol2',at:55,l:T('Ascensione!','Ascension!'),c:'#fff0c8'}],
  cloudspirit:[{id:'lunge',cd:[4.5,6.5],c:'#ffffff'}],
  thunderbird:[{id:'strike',cd:[5,7],n:3,r:44,c:'#ffe24d'}],
  seraph:[{id:'heal',cd:[7,10],c:'#fff0c8'}],
  monk:[{id:'orbs',n:3,c:'#fff0c8'}],
  ang:[{id:'radial',cd:[6,8],n:10,c:'#ffe9a0'}],
  orb:[{id:'orbs',n:4,c:'#ffe9a0'}],
  comet:[{id:'rage',c:'#ffe24d',l:T('Cometa!','Comet!')}],
  guard:[{id:'guard',cd:[6,9],c:'#fff0c8'},{id:'quake',cd:[6,8],c:'#fff0c8'}],
  /* Hell */
  dem:[{id:'rage',to:'dem2',c:'#ff3b2a',l:T('Furia Infernale!','Hellfire rage!')}],
  imp:[{id:'fan',cd:[3.6,5.2],n:3,sp:.3,c:'#ff7a3a'}],
  wolf2:[{id:'rage',c:'#ff3b2a',l:T('Ululato!','Howl!')}],
  damned:[{id:'burrow',cd:[7,10],c:'#9a6a4a'}],
  gho:[{id:'strike',cd:[5,7],n:2,r:44,c:'#9a6aff'}],
  mag:[{id:'radial',cd:[6,9],n:8,c:'#ff7a3a'},{id:'mine',cd:[5,7],c:'#ff5a2a',r:44}],
  ass:[{id:'burrow',cd:[7,10],c:'#6a3a5a'}],
  firebird:[{id:'strike',cd:[5,7],n:3,r:46,c:'#ff7a3a'}],
  flamegiant:[{id:'quake',cd:[5,7],c:'#ff5a2a'},{id:'mine',cd:[4,6],c:'#ff5a2a',r:50},{id:'rage',c:'#ff3b2a',l:T('Eruzione!','Eruption!')}],
  executioner:[{id:'sweep',cd:[4,6],c:'#c8c8d8'},{id:'guard',cd:[7,10],c:'#c8c8d8'}],
  /* Snake Way */
  swghost:[{id:'orbs',n:2,c:'#b8e8ff'}],
  swspit:[{id:'mine',cd:[4,6],c:'#9aff6a',r:40}],
  swguard:[{id:'sweep',cd:[5,7],c:'#ffd27a'}],
  swknight:[{id:'guard',cd:[6,9],c:'#c8d0e0'}],
  swbat:[{id:'lunge',cd:[4.5,6.5],c:'#c9a0ff'}],
  swhound:[{id:'rage',c:'#ff5a3d',l:T('Ululato!','Howl!')}],
  swcaster:[{id:'radial',cd:[6,9],n:8,c:'#b8a0ff'}],
  swwarrior:[{id:'quake',cd:[5,7],c:'#ffb13b'},{id:'evolve',to:'swwarrior2',at:50,l:T('Campione!','Champion!'),c:'#ff7a3a'}],
  swmage:[{id:'orbs',n:3,c:'#b8a0ff'},{id:'strike',cd:[6,8],n:2,r:44,c:'#b8a0ff'}],
  swbrute:[{id:'quake',cd:[5,7],c:'#ff9d5a'},{id:'summon',cd:[10,13],m:'swsoul',n:3,c:'#b8e8ff',l:T('Anime!','Souls!')}],
  swlancer:[{id:'lunge',cd:[4.5,6.5],c:'#ffd27a'}],
  swreaper:[{id:'strike',cd:[5,7],n:3,r:46,c:'#9a6aff'},{id:'burrow',cd:[9,12],c:'#4a3a6a'}],
  mbgozu:[{id:'quake',cd:[5,7],c:'#ff5a3d'},{id:'warcry',cd:[9,12],c:'#ff5a3d',l:T('Mandria!','Herd!')}],
  mbmezu:[{id:'rage',c:'#ff5a3d',l:T('Furia!','Fury!')}],
  mbwraith:[{id:'radial',cd:[6,8],n:10,c:'#c9a0ff'},{id:'orbs',n:3,c:'#c9a0ff'}],
  mbking:[{id:'guard',cd:[6,9],c:'#ff9d5a'},{id:'summon',cd:[10,13],m:'swsoul',n:3,c:'#b8e8ff',l:T('Anime!','Souls!')}],
  mbsnake:[{id:'burrow',cd:[8,11],c:'#4a8a3a'},{id:'quake',cd:[5,7],c:'#4a8a3a'}]
};
for(const id in SK_MAP){if(ENEMIES[id])ENEMIES[id].sk=SK_MAP[id];}

/* ---- skill mechanics ---- */
const SKD={
  fan:{w:.5,rng:[60,400],start(g,e,s,ux,uy){const n=g.shotN(s.n||3),a0=Math.atan2(uy,ux);for(let i=0;i<n;i++)g.skShot(e,a0+(i-(n-1)/2)*(s.sp||.28),s.v||200,s);}},
  radial:{w:.65,rng:[0,320],start(g,e,s){const n=g.shotN(s.n||8),o=rnd(0,TAU);for(let i=0;i<n;i++)g.skShot(e,o+i/n*TAU,s.v||130,s);g.ring(e.x,e.y,60,s.c,.4);}},
  lunge:{w:.45,rng:[70,340],dur:.42,start(g,e,s,ux,uy){e.lg=[ux,uy];g.audio.sfx('leap');},
    tick(g,e,s,dt){if(g.fx.length<440&&Math.random()<.7)g.fx.push({x:e.x+rnd(-4,4),y:e.y-e.r*.6,vx:-e.lg[0]*30,vy:-e.lg[1]*30,l:.3,m:.3,c:s.c||'#fff',s:rnd(2,4)});return{mv:[e.lg[0],e.lg[1],3.4]};},
    end(g,e){e.stun=Math.max(e.stun,.22);}},
  quake:{w:.7,rng:[0,190],start(g,e,s){const c=s.c||'#ff7a3a';g.bz.push({x:e.x,y:e.y,r:e.r*2.6+16,t:0,dur:.4,dmg:e.dmg*.85,c});g.bz.push({x:e.x,y:e.y,r:e.r*4.2+20,t:0,dur:.85,dmg:e.dmg*.85,c});g.audio.sfx('warn');}},
  strike:{w:.55,rng:[0,430],start(g,e,s){const p=g.p,n=s.n||3;for(let i=0;i<n;i++){const a=rnd(0,TAU),r=i?rnd(40,120):0;g.bz.push({x:p.x+(p.vx||0)*.35*(i?0:1)+Math.cos(a)*r,y:p.y+(p.vy||0)*.35*(i?0:1)+Math.sin(a)*r,r:s.r||48,t:0,dur:.85+i*.13+(s.ex||0),dmg:e.dmg*.85,c:s.c||'#ffd23f'});}g.audio.sfx('warn');}},   /* s.ex: extra seconds of warning before the blast (Roshi's Island: +0.5) */
  mine:{w:0,rng:[0,520],start(g,e,s){g.bz.push({x:e.x,y:e.y,r:s.r||42,t:0,dur:1.5,dmg:e.dmg*.8,c:s.c||'#ff7a3a'});}},
  guard:{w:.3,rng:[0,400],start(g,e,s){e.shield=s.d||2.4;e.shA=e.shA||0;const a=s.a||6;e.armor+=a;e.shA+=a;g.ring(e.x,e.y,e.r*2.4,s.c||'#8ad8ff',.4);}},
  summon:{w:.8,rng:[0,440],can(g,e,s){let k=0;for(const o of g.en)if(o.par===e&&!o.dead)k++;return k<5&&g.en.length<g.spawnCap()*1.15+8;},
    start(g,e,s){const d=ENEMIES[s.m];if(!d)return;for(let i=0;i<(s.n||2);i++){const a=i/(s.n||2)*TAU+rnd(0,1),m=g.mkEnemy(d,e.x+Math.cos(a)*(e.r+18),e.y+Math.sin(a)*(e.r+12));m.par=e;m.sum=1;m.age=0;g.en.push(m);g.ring(m.x,m.y,26,s.c||'#fff',.4);}
      g.floatText(e.x,e.y-e.r*2.4,g.env.tr(s.l||T('Rinforzi!','Reinforcements!')),1);g.audio.sfx('shrine');}},
  heal:{w:.6,rng:[0,9999],can(g,e){for(const o of g.en)if(!o.dead&&!o.boss&&o!==e&&o.hp<o.max*.75&&Math.hypot(o.x-e.x,o.y-e.y)<170)return true;return e.hp<e.max*.6;},
    start(g,e,s){g.ring(e.x,e.y,150,s.c||'#8be07a',.6);for(const o of g.en){if(o.dead||o.boss||Math.hypot(o.x-e.x,o.y-e.y)>160)continue;o.hp=Math.min(o.max,o.hp+o.max*.2);g.burst(o.x,o.y-o.r,3,s.c||'#8be07a');}}},
  beam:{w:.3,rng:[100,520],dur:1.35,start(g,e,s,ux,uy){g.jbeams.push({x:e.x,y:e.y-e.r*.6,a:Math.atan2(uy,ux),t:0,charge:.85,fire:.35,w:11,len:640,col:s.c||'#ff5a5a',dmg:e.dmg*1.1,e,hcd:0});g.audio.sfx('xcharge');},
    tick(){return{hold:true};}},
  spin:{w:.35,rng:[0,260],dur:1.1,start(g,e){e.sa=rnd(0,TAU);e.sT=0;},
    tick(g,e,s,dt,ux,uy){e.sT-=dt;if(e.sT<=0){e.sT=.2;e.sa+=.9;for(let i=0;i<3;i++)g.skShot(e,e.sa+i*TAU/3,170,s);}return{mv:[ux,uy,1.4]};}},
  burrow:{w:.3,rng:[110,430],dur:1.1,start(g,e,s){e.under=true;g.burst(e.x,e.y,8,s.c||'#8a6a4a');g.audio.sfx('land');},
    tick(g,e,s,dt,ux,uy){if(g.fx.length<440&&Math.random()<.6)g.fx.push({x:e.x+rnd(-8,8),y:e.y,vx:rnd(-30,30),vy:rnd(-60,-20),l:.35,m:.35,c:s.c||'#8a6a4a',s:rnd(2,4)});return{mv:[ux,uy,2.5]};},
    end(g,e,s){e.under=false;g.bz.push({x:e.x,y:e.y,r:56,t:0,dur:.5,dmg:e.dmg*.9,c:s.c||'#8a6a4a'});g.ring(e.x,e.y,50,s.c||'#8a6a4a',.4);g.burst(e.x,e.y,12,s.c||'#8a6a4a');e.stun=Math.max(e.stun,.45);}},
  warcry:{w:.6,rng:[0,500],can(g,e){let k=0;for(const o of g.en)if(!o.dead&&o!==e&&!o.boss&&Math.hypot(o.x-e.x,o.y-e.y)<240)k++;return k>=2;},
    start(g,e,s){g.ring(e.x,e.y,230,s.c||'#ffd23f',.6);for(const o of g.en){if(o.dead||o.boss||Math.hypot(o.x-e.x,o.y-e.y)>240)continue;o.buff=4;}
      g.floatText(e.x,e.y-e.r*2.4,g.env.tr(s.l||T('Avanti!','Charge!')),1);g.audio.sfx('shrine');}},
  sweep:{w:.4,rng:[0,125],start(g,e,s,ux,uy){const c=s.c||'#ffd27a';for(let i=0;i<3;i++)g.bz.push({x:e.x+ux*(e.r+16+i*30)-uy*(i-1)*14,y:e.y+uy*(e.r+16+i*30)+ux*(i-1)*14,r:38,t:0,dur:.22+i*.1,dmg:e.dmg*.95,c});
    const a=Math.atan2(uy,ux);for(let i=-5;i<=5;i++){if(g.fx.length>450)break;const q=a+i*.2;g.fx.push({x:e.x+Math.cos(q)*(e.r+30),y:e.y-e.r*.4+Math.sin(q)*(e.r+24)*.8,vx:Math.cos(q)*50,vy:Math.sin(q)*40,l:.25,m:.25,c:i%2?'#ffffff':c,s:4});}g.audio.sfx('leap');}},
  /* transformations: trigger on their own (not on a cooldown) */
  rage:{w:.8,rng:[0,9999],once:true,can(g,e){return e.hp<e.max*.5&&!e.enr;},
    start(g,e,s){e.enr=1;e.rc=s.c||'#ff3b2a';
      if(s.to)g.skMorph(e,ENEMIES[s.to]);
      e.spd*=1.3;e.dmg*=1.22;e.armor+=.8;
      g.ring(e.x,e.y,120,e.rc,.6);g.ring(e.x,e.y,60,'#ffffff',.4);g.burst(e.x,e.y-e.r,18,e.rc);g.shake=Math.max(g.shake,.18);g.audio.sfx('xburst');
      g.floatText(e.x,e.y-e.r*2.6,g.env.tr(s.l||T('Furia!','Fury!')),1);}},
  evolve:{w:1.0,rng:[0,9999],once:true,can(g,e,s,dist){return e.age>=(s.at||50)&&dist<g.viewR*1.05&&!!ENEMIES[s.to];},
    start(g,e,s){g.skMorph(e,ENEMIES[s.to]);e.enr=1;e.rc=s.c||'#ffffff';
      g.ring(e.x,e.y,140,e.rc,.7);g.ring(e.x,e.y,70,'#ffffff',.5);g.pillar(e.x,e.y,e.rc,.9);g.burst(e.x,e.y-e.r,26,e.rc);g.flash=Math.max(g.flash,.12);g.flashC=e.rc;g.shake=Math.max(g.shake,.25);g.audio.sfx('transform');
      g.floatText(e.x,e.y-e.r*2.6,g.env.tr(s.l||T('Evoluzione!','Evolution!')),1);}}
};

Object.assign(Game.prototype,{
  skillInit(e){
    const l=e.def.sk;if(!l){e.sk=null;return;}
    e.sk={l:l.map(s=>({s,cd:s.cd?rnd(s.cd[0]*.6,s.cd[1]):0,done:false})),cur:null,ph:0,t:0};
  },
  /* an enemy projectile (capped so crowds of shooters can't flood the screen) */
  skShot(e,a,v,s){
    if(this.eb.length>=EB_CAP||!this.shotOK(.5))return;   /* a skill's bullets cost half a shot of the shared budget (see Game.shotOK) */
    this.eb.push({x:e.x,y:e.y-14,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:s.r||6,dmg:e.dmg*(s.dm||.7),life:4.5,c:s.c||'#ff7a3a'});
  },
  skEnd(e,cancel){
    const S=e.sk;if(!S||!S.cur)return;
    const c=S.cur,d=SKD[c.s.id];
    if(!cancel&&d.end)d.end(this,e,c.s);
    if(cancel&&e.under){e.under=false;}
    c.en.cd=c.s.cd?rnd(c.s.cd[0],c.s.cd[1]):0;
    if(d.once&&!cancel)c.en.done=true;
    S.cur=null;S.ph=0;e.tel=null;
  },
  /* the enemy turns into a stronger kind (keeps the damage it already took, as a ratio) */
  skMorph(e,nd){
    if(!nd)return;
    const ratio=Math.max(.15,e.hp/e.max),esc=this.escSteps(),F=this.escF,spdMul=Math.max(1,e.spd/Math.max(1,e.def.spd*this.spdK));
    e.def=nd;e.r=nd.r;e.max=nd.hp*this.hpMul()*(1+F.hp*esc);e.hp=e.max*Math.min(1,ratio+.18);
    e.spd=nd.spd*this.spdK*spdMul;e.dmg=nd.dmg*this.dmgMul()*(1+F.dmg*esc);
    e.ai=nd.ai;e.esid=undefined;e.st=0;e.stT=rnd(1,2);e.sh=rnd(1,2);
    if(nd.sk)this.skillInit(e);
  },
  /* returns {hold:true} (stand still), {mv:[dx,dy,speedMul]} (forced movement) or null */
  skillTick(e,dt,dist,ux,uy){
    const S=e.sk;let ctl=null;
    if(e.shield>0){e.shield-=dt;ctl={mv:[ux,uy,.5]};if(e.shield<=0){e.armor-=e.shA;e.shA=0;}}
    /* orbiting balls */
    for(const en of S.l){
      const s=en.s;
      if(s.id==='orbs'){
        e.oa=(e.oa||0)+dt*2.8;e.ocd=(e.ocd||0)-dt;
        if(dist<e.r+60&&e.ocd<=0){
          for(let k=0;k<(s.n||3);k++){const a=e.oa+k/(s.n||3)*TAU,ox=e.x+Math.cos(a)*(e.r+24),oy=e.y-e.r*.8+Math.sin(a)*(e.r+16)*.8;
            if(Math.hypot(this.p.x-ox,this.p.y-14-oy)<14){e.ocd=.7;this.hurt(e.dmg*.55,{bs:1});break;}}
        }
      }
    }
    if(S.cur){
      const c=S.cur,d=SKD[c.s.id];c.t+=dt;
      if(S.ph===1){
        e.tel=c.s.c||'#ffffff';e.telK=Math.min(1,c.t/c.w);
        if(c.t>=c.w){S.ph=2;c.t=0;e.tel=null;d.start(this,e,c.s,ux,uy,dist);e.atk=Math.max(e.atk||0,.4);if(!d.dur)this.skEnd(e);}
        return{hold:true};
      }
      const r=d.tick?d.tick(this,e,c.s,dt,ux,uy,dist,c):null;
      if(c.t>=d.dur)this.skEnd(e);
      return r||ctl;
    }
    for(const en of S.l){
      const s=en.s,d=SKD[s.id];if(!d||s.id==='orbs'||en.done)continue;
      if(en.cd>0){en.cd-=dt;if(!d.once)continue;}
      if(!d.once&&en.cd>0)continue;
      if(dist<d.rng[0]||dist>d.rng[1])continue;
      if(this.viewR&&dist>this.viewR*1.05)continue;
      if(d.can&&!d.can(this,e,s,dist))continue;
      S.cur={s,en,t:0,w:d.w};S.ph=1;S.t=0;
      if(!d.w){S.ph=2;d.start(this,e,s,ux,uy,dist);e.atk=Math.max(e.atk||0,.3);if(!d.dur)this.skEnd(e);}
      break;
    }
    return ctl;
  }
});
