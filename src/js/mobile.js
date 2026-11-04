'use strict';
/* ====== Mobile: phones and tablets. Everything touch lives in this file and in css/mobile.css (rules under html.mob).
   On a PC MOBILE.on is false and nothing below runs: no class on <html>, no patched method, no extra element.
   ?mobile=1 in the address forces it (to try it from a PC), ?mobile=0 turns it off on a phone.
   - phones: the menus are zoomed to fit the short screen (#ui, #toasts), the HUD is drawn bigger;
   - touch buttons on the right (dash, ability, Senzu, pet, E = interact) and pause in the corner, fed to Input as virtual keys,
     so holding and tapping behave exactly like the keyboard (holding the ability still charges the Kamehameha);
   - a "rotate your device" screen in portrait, with Fullscreen (landscape lock where the browser allows it) and Play anyway. ====== */
const MOBILE=(()=>{
  let q=null;try{q=new URLSearchParams(location.search).get('mobile');}catch(e){}
  const mm=s=>{try{return matchMedia(s).matches;}catch(e){return false;}};
  const touch=(navigator.maxTouchPoints||0)>0||'ontouchstart' in window;
  const on=q==='1'||(q!=='0'&&touch&&mm('(pointer:coarse)'));
  const phone=on&&(q==='1'||Math.min(screen.width||0,screen.height||0)<=600);
  return{on,phone,keys:new Set(),latch:new Set(),z:1,app:null,ctl:null,rot:null,rotOk:false};
})();
/* the joystick art (assets/sprites/mobile/mobjoy.png) is decoded only when a phone asks for it (Sprites.need('mobile')): a PC never decodes it */
if(typeof SPRITE_LAZY!=='undefined')SPRITE_LAZY.mobile=/^mobjoy$/;
if(MOBILE.on)(()=>{
  const M=MOBILE,TS=(it,en,es,fr,de,pt)=>T6(it,en,es,fr,de,pt),tr=o=>M.app?M.app.i18n.t(o):o.it;
  const STR={
    rotT:TS('Ruota il dispositivo','Rotate your device','Gira el dispositivo','Tourne ton appareil','Dreh dein Gerät','Gire o dispositivo'),
    rotS:TS('Dragon Ball Survivors si gioca in orizzontale','Dragon Ball Survivors is played in landscape','Dragon Ball Survivors se juega en horizontal','Dragon Ball Survivors se joue à l\'horizontale','Dragon Ball Survivors wird im Querformat gespielt','Dragon Ball Survivors é jogado na horizontal'),
    full:TS('Schermo intero','Fullscreen','Pantalla completa','Plein écran','Vollbild','Tela cheia'),
    any:TS('Gioca comunque','Play anyway','Jugar igualmente','Jouer quand même','Trotzdem spielen','Jogar assim mesmo'),
    tap:TS('Tocca','Tap','Toca','Touche','Tippen','Toque'),
    pause:TS('Pausa','Pause','Pausa','Pause','Pause','Pausa'),
    use:TS('Interagisci','Interact','Interactuar','Interagir','Interagieren','Interagir')
  };
  const root=document.documentElement;root.classList.add('mob',M.phone?'mphone':'mtab');
  /* no pinch / double-tap zoom while playing */
  {const v=document.querySelector('meta[name=viewport]');if(v)v.content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';}

  /* ---------- size: the DOM menus are zoomed to the short side of a phone (the PC layout, smaller, never re-flowed by hand) ---------- */
  const fit=()=>{
    const w=innerWidth,h=innerHeight;
    M.z=M.phone?clamp(Math.min(h/540,w/860),.55,1):1;
    root.style.setProperty('--mz',M.z);
    for(const id of['ui','toasts','sandbox']){const el=document.getElementById(id);if(el)el.style.zoom=M.z===1?'':String(M.z);}
    root.classList.toggle('mport',h>w);root.classList.toggle('mwide',M.phone&&w/M.z>900);
    rotCheck();
  };

  /* ---------- input: virtual keys from the touch buttons, read like held keyboard keys ---------- */
  const poll0=Input.prototype.poll;
  Input.prototype.poll=function(dt){
    poll0.call(this,dt);
    for(const a of M.keys)this.down[a]=true;
    for(const a of M.latch)this.down[a]=true;   /* a tap shorter than a frame still counts once */
    M.latch.clear();
  };
  const press=(a,on)=>{if(on){M.keys.add(a);M.latch.add(a);if(M.app)M.app.input.mode='touch';try{navigator.vibrate&&navigator.vibrate(8);}catch(e){}}else M.keys.delete(a);};
  addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&M.app&&M.app.input.mode!=='pad')M.app.input.mode='touch';},true);

  /* key labels: with touch the HUD and the hints speak of the buttons, not of keys */
  const kh0=App.prototype.keyHints;
  App.prototype.keyHints=function(){
    kh0.call(this);const h=this.renderer.keyHints,t=this.input.mode==='touch';
    this.renderer.mobBtns=t;   /* the round buttons of the canvas HUD give way to the touch ones */
    if(t){h.interact='E';h.target=tr(STR.tap);h._touch=true;}
  };
  /* hints that name a key */
  {const tw={
    move:TS('Trascina il dito a sinistra per muoverti: le armi sparano da sole.','Drag your finger on the left to move: your weapons fire on their own.','Arrastra el dedo a la izquierda para moverte: las armas disparan solas.','Fais glisser ton doigt à gauche pour bouger : les armes tirent toutes seules.','Zieh links mit dem Finger, um dich zu bewegen: die Waffen feuern von selbst.','Arraste o dedo à esquerda para se mover: as armas disparam sozinhas.'),
    dash:TS('Il tasto 走 è lo scatto: attraversi i nemici senza subire danni.','The 走 button is the dash: you pass through enemies without taking damage.','El botón 走 es la esquiva: atraviesas a los enemigos sin recibir daño.','Le bouton 走 est l\'esquive : tu traverses les ennemis sans dégâts.','Die Taste 走 ist der Sprint: du gehst ohne Schaden durch Gegner.','O botão 走 é a esquiva: você atravessa os inimigos sem sofrer dano.'),
    ability:TS('Il tasto in alto a destra è l\'abilità speciale del personaggio: tienila per i momenti difficili.','The top button on the right is your character\'s special ability: save it for tough moments.','El botón de arriba a la derecha es la habilidad especial: guárdala para los momentos difíciles.','Le bouton du haut à droite est la technique spéciale : garde-la pour les moments durs.','Die obere Taste rechts ist die Spezialfähigkeit: spar sie für harte Momente.','O botão de cima à direita é a habilidade especial: guarde-a para os momentos difíceis.'),
    kcharge:TS('Tieni premuto il tasto dell\'abilità per caricare un Kamehameha più grosso.','Hold the ability button to charge a bigger Kamehameha.','Mantén el botón de la habilidad para cargar un Kamehameha más grande.','Maintiens le bouton de la technique pour charger un Kamehameha plus gros.','Halte die Fähigkeitstaste, um ein größeres Kamehameha aufzuladen.','Segure o botão da habilidade para carregar um Kamehameha maior.'),
    senzu:TS('Il tasto 豆 mangia un Fagiolo Senzu per curarti.','The 豆 button eats a Senzu Bean to heal.','El botón 豆 come una Semilla del Ermitaño para curarte.','Le bouton 豆 mange un Haricot Magique pour te soigner.','Die Taste 豆 isst eine Magische Bohne zum Heilen.','O botão 豆 come um Feijão Senzu para se curar.')};
   for(const H of HINTS)if(tw[H.id]){const t0=H.txt,tm=tw[H.id];H.txt=k=>k&&k._touch?tm:t0(k);}}

  /* ---------- HUD: bigger on a phone (the canvas keeps its resolution, only the HUD unit grows) ---------- */
  const rs0=Renderer.prototype.resize;
  /* world zoom and HUD from the SCREEN's short side, not the window's: the browser bar that slides in and out (and the switch to fullscreen)
     changes the window height by ~20%, and the zoom followed it in jumps. Now the zoom never moves: with the bar shown you just see a strip less */
  const short=()=>{const s=Math.min(screen.width||0,screen.height||0),w=Math.min(innerWidth,innerHeight);return s>=w?s:w;};
  Renderer.prototype.resize=function(){rs0.call(this);
    const sh=Math.max(1,short()),sc=this.W/Math.max(1,innerWidth);   /* sc: canvas px per CSS px (device ratio, scale setting, dynamic resolution) */
    this.Z=clamp(sh*sc/560,.6,3.4);
    if(M.phone)this.U=Math.max(.8,sh*sc/720)*clamp(560/sh,1,1.45);   /* bigger HUD on a phone; measured on the short side, so portrait (Play anyway) gets the same HUD as landscape */
  };
  /* a tap on the weapon target panel cycles the target (it is only a hover zone with a mouse) */
  const tapZone=e=>{
    const a=M.app;if(!a||a.state!=='play'||!a.game||e.pointerType==='mouse')return;
    const R=a.renderer,k=R.W/innerWidth,x=e.clientX*k,y=e.clientY*k,z=(R.zones||[]).find(z=>z.k==='target'&&x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h);
    if(z){e.stopImmediatePropagation();a.game.cycleTarget();try{navigator.vibrate&&navigator.vibrate(8);}catch(_){}}
  };

  /* ---------- the joystick: the painted ring, the ball that follows the finger and, while moving, its flame and the small Dragon Ball
     pointing the way; the pieces are rotated to the exact angle of the finger (any direction, not 8). tools/make_joystick.py cuts them ---------- */
  const JOY_R=64;   /* half size of the ring art on screen, in HUD units */
  const drawJoy=(R,j,S)=>{
    const P=SPRITE_PACK.mobjoy,c=R.ctx,U=R.U,r=S.rects,s=JOY_R*U/(r.ring[2]/2),mag=Math.min(1,Math.hypot(j.x,j.y)),ang=Math.atan2(j.y,j.x),cs=Math.cos(ang),sn=Math.sin(ang);
    const kx=j.ox+j.x*P.trav*s,ky=j.oy+j.y*P.trav*s,mv=clamp((mag-.1)/.35,0,1);
    const pc=(n,x,y,a)=>{const q=r[n],w=q[2]*s,h=q[3]*s;if(a===undefined)c.drawImage(S.img,q[0],q[1],q[2],q[3],x-w/2,y-h/2,w,h);else{c.save();c.translate(x,y);c.rotate(a);c.drawImage(S.img,q[0],q[1],q[2],q[3],-w/2,-h/2,w,h);c.restore();}};
    c.save();c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=true;c.globalAlpha=.92;
    c.fillStyle='rgba(4,8,20,.28)';c.beginPath();c.arc(j.ox,j.oy,P.rin*s,0,TAU);c.fill();   /* the inside of the ring a little darker: the ball reads on any ground */
    pc('ring',j.ox,j.oy);
    if(mv>0){
      c.globalAlpha=.92*mv;pc('trail',kx,ky,ang);
      /* the arrow from the ball to the marker, then the marker */
      const a0=P.kr*s*1.05,a1=(P.mark-P.mr*.95)*s,ex=j.ox+cs*a1,ey=j.oy+sn*a1,sx=kx+cs*a0,sy=ky+sn*a0;
      if(a1>Math.hypot(sx-j.ox,sy-j.oy)){c.strokeStyle='rgba(255,236,190,.9)';c.lineWidth=Math.max(1.5,2.2*s);c.lineCap='round';c.beginPath();c.moveTo(sx,sy);c.lineTo(ex,ey);c.stroke();
        const ah=5.5*s*1.6;c.fillStyle='rgba(255,236,190,.95)';c.beginPath();c.moveTo(ex+cs*ah*.4,ey+sn*ah*.4);c.lineTo(ex-cs*ah+sn*ah*.6,ey-sn*ah-cs*ah*.6);c.lineTo(ex-cs*ah-sn*ah*.6,ey-sn*ah+cs*ah*.6);c.closePath();c.fill();}
      pc('ball',j.ox+cs*P.mark*s,j.oy+sn*P.mark*s);
    }
    c.globalAlpha=.95;pc('knob',kx,ky);
    c.restore();
  };
  const hud0=Renderer.prototype.hud;
  Renderer.prototype.hud=function(g,dt,cx,cy){
    const j=this.joy,S=Sprites.sheets.mobjoy;   /* (its metrics - inner radius, travel, marker - are read from SPRITE_PACK: the loader keeps only rects) */
    if(!j||!j.on||!S||!S.rects)return hud0.call(this,g,dt,cx,cy);   /* (until the art is decoded: the plain circles of the base game) */
    j.on=false;try{hud0.call(this,g,dt,cx,cy);}finally{j.on=true;}   /* the base HUD without its two circles... */
    drawJoy(this,j,S);   /* ...and the painted joystick instead */
  };

  /* ---------- the touch buttons ---------- */
  const B=[   /* id, action, size class */
    {id:'dash',a:'dash',c:'big'},{id:'e',a:'interact',c:'mid'},{id:'ab',a:'kaioken',c:'mid'},{id:'sz',a:'senzu',c:'sml'},{id:'pet',a:'pet',c:'sml'}
  ];
  const mkCtl=()=>{
    const el=document.createElement('div');el.id='mobctl';
    const btn=(o)=>{const b=document.createElement('button');b.className='mb mb-'+o.id+' '+(o.c||'');b.type='button';b.setAttribute('aria-label',o.id);
      b.innerHTML='<i class="mpie"></i><b class="mg"></b><small class="ml"></small><span class="mdots"></span>';
      const up=e=>{press(o.a,false);b.classList.remove('dn');};
      b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();try{b.setPointerCapture(e.pointerId);}catch(_){}press(o.a,true);b.classList.add('dn');});
      b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);
      b.addEventListener('contextmenu',e=>e.preventDefault());
      o.el=b;return b;};
    for(const o of B)el.append(btn(o));
    const pz=btn({id:'pause',a:'pause',c:'pz'});pz.querySelector('.mg').textContent='❚❚';pz.setAttribute('aria-label',tr(STR.pause));el.append(pz);
    B.find(o=>o.id==='e').el.querySelector('.mg').textContent='E';
    document.body.append(el);return el;
  };
  const set=(o,{show=true,glyph,col,prog=1,ready=false,act=false,label='',dots=null})=>{
    const b=o.el;b.hidden=!show;if(!show)return;
    const g=b.querySelector('.mg');if(glyph!=null&&g.textContent!==glyph)g.textContent=glyph;
    b.style.setProperty('--c',col||'#fff');b.style.setProperty('--p',String(clamp(prog,0,1)));
    b.classList.toggle('rdy',ready);b.classList.toggle('act',act);b.classList.toggle('cd',prog<1);
    const l=b.querySelector('.ml');if(l.textContent!==label)l.textContent=label;
    const d=b.querySelector('.mdots');if(dots){const s=dots.map(x=>x?'●':'○').join('');if(d.textContent!==s)d.textContent=s;}else if(d.textContent)d.textContent='';
  };
  /* per frame: the same states the canvas buttons show (cooldown pie, ready glow, seconds) */
  const update=()=>{
    const a=M.app,ctl=M.ctl;if(!a||!ctl)return;
    const g=a.game,vis=a.state==='play'&&g&&!g.ended&&!g.coopView&&a.input.mode!=='pad'&&!M.rot.classList.contains('on');
    ctl.classList.toggle('on',!!vis);if(!vis){if(M.keys.size)M.keys.clear();return;}
    const by=id=>B.find(o=>o.id===id);
    {const rdy=g.dashCd<=0,act=g.dashT>0;set(by('dash'),{glyph:'走',col:'#7fd4ff',prog:rdy?1:1-g.dashCd/g.dashCdMax,ready:rdy,act,label:rdy?'':(g.dashCd<10?g.dashCd.toFixed(1):Math.ceil(g.dashCd))+'s'});}
    {const n=g.senzu,ok=n>0&&g.p.hp<g.p.maxHp-.5&&g.senzuCd<=0;set(by('sz'),{glyph:'豆',col:n>0?'#8be07a':'#6a7688',ready:ok,dots:Array.from({length:SENZU_MAX},(_,i)=>i<n)});}
    {const ab=g.abil;let prog=1,label='',act=false;
      if(ab.m==='berserk'){act=g.bers>0;prog=act?g.bers/(g.bersMax||10):g.bersCd>0?1-g.bersCd/g.bersCdMax:1;label=act?Math.ceil(g.bers)+'s':g.bersCd>0?Math.ceil(g.bersCd)+'s':'';}
      else if(ab.m==='kaioken'){act=g.kai>0;label=g.kai?'x'+(g.kai===1?10:20):g.kaiAvail?'':'Lv '+FORM_TIERS[0].lvl;}
      else{prog=g.abCd>0?Math.max(0,1-g.abCd/Math.max(1,g.abCdMax)):1;label=g.abCd>0?Math.ceil(g.abCd)+'s':'';act=!!(g.regenT>0||g.abBuf||g.clones||g.critT>0||g.shieldT>0||g.tsT>0);}
      const usable=ab.m==='kaioken'?g.kaiAvail:g.abReady;
      set(by('ab'),{glyph:ab.k,col:usable||act?ab.c:'#9aa6b8',prog,ready:usable,act,label});}
    {const q=g.pet;if(q){const d=q.d,rdy=q.cd<=0;set(by('pet'),{glyph:d.k,col:rdy?d.c:'#9aa6b8',prog:rdy?1:1-q.cd/d.cd,ready:rdy,label:rdy?'':Math.ceil(q.cd)+'s'});}else set(by('pet'),{show:false});}
    {const near=(g.feat||[]).some(f=>f.near&&!f.used&&f.fade===undefined);
      set(by('e'),{col:near?'#ffd23f':'#c8d2e0',ready:near,label:near?tr(STR.use):''});}
  };

  /* ---------- portrait: rotate your device ---------- */
  const fsOk=!!(root.requestFullscreen||root.webkitRequestFullscreen);
  const goFull=()=>{try{const r=root.requestFullscreen?root.requestFullscreen({navigationUI:'hide'}):root.webkitRequestFullscreen();
    Promise.resolve(r).then(()=>{try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{});}catch(e){}}).catch(()=>{});}catch(e){}};
  const mkRot=()=>{
    const el=document.createElement('div');el.id='mobrot';
    el.innerHTML='<div class="rbox"><div class="rph"><svg viewBox="0 0 120 120" aria-hidden="true">'+
      '<path class="rar" d="M30 26 A44 44 0 0 1 96 34"/><path class="rarh" d="M96 34 l-11 1 m11 -1 l-2 -11"/>'+
      '<g class="rp"><rect x="42" y="30" width="36" height="64" rx="7"/><rect x="47" y="38" width="26" height="46" rx="2" class="scr"/><circle cx="60" cy="89" r="2.2" class="hb"/></g></svg></div>'+
      '<h2></h2><p></p><div class="rbtns"></div></div>';
    const bs=el.querySelector('.rbtns');
    if(fsOk){const f=document.createElement('button');f.className='btn primary rfull';f.onclick=()=>{goFull();};bs.append(f);}
    const g=document.createElement('button');g.className='btn alt rany';g.onclick=()=>{M.rotOk=true;try{sessionStorage.setItem('dbsRotOk','1');}catch(e){}rotCheck();};bs.append(g);
    document.body.append(el);return el;
  };
  const rotText=()=>{const r=M.rot;if(!r)return;r.querySelector('h2').textContent=tr(STR.rotT);r.querySelector('p').textContent=tr(STR.rotS);
    const f=r.querySelector('.rfull');if(f)f.textContent='⛶ '+tr(STR.full);r.querySelector('.rany').textContent=tr(STR.any);};
  function rotCheck(){const r=M.rot;if(!r)return;const show=M.phone&&innerHeight>innerWidth&&!M.rotOk;
    if(show&&!r.classList.contains('on')){rotText();if(M.app&&M.app.state==='play')M.app.pause();}
    r.classList.toggle('on',show);}

  /* a phone goes fullscreen (and locks landscape where it can) when the first run of the session starts: the view is steadier and bigger.
     Only once: if the player leaves fullscreen it is not forced again (Settings > Fullscreen still works) */
  const sg0=App.prototype.startGame;
  App.prototype.startGame=function(o){
    if(M.phone&&fsOk&&!M.fsTried&&!document.fullscreenElement&&!document.webkitFullscreenElement){M.fsTried=true;goFull();}
    return sg0.call(this,o);
  };
  /* ---------- pause screen helpers measured in the zoomed space ---------- */
  UI.prototype.fitPause=function(root0){
    const run=(n)=>{
      const wrap=root0.querySelector('.pfitwrap'),fitEl=root0.querySelector('.pfit');
      if(!wrap||!fitEl)return;
      if(!root0.isConnected){if(n<20)requestAnimationFrame(()=>run(n+1));return;}
      const avail=(innerHeight-wrap.getBoundingClientRect().top)/M.z-(M.phone?16:126);let z=1;   /* phone: no HUD row under the pause screen to keep free */
      for(let i=0;i<8;i++){
        fitEl.style.width=(100/z)+'%';fitEl.style.transform=z<1?'scale('+z+')':'';
        const need=fitEl.offsetHeight*z;wrap.style.height=Math.ceil(need)+'px';
        if(need<=avail+1||z<=.62)break;   /* never below 62%: past that it scrolls instead (text stays readable) */
        z=Math.max(.62,z*avail/need*.99);
      }
    };
    requestAnimationFrame(()=>run(0));
    if(!this._fitRs){this._fitRs=true;addEventListener('resize',()=>{const r=document.querySelector('.prunmode');if(r&&r.isConnected)this.fitPause(r);});}
  };
  const pm0=UI.prototype.pauseMap;
  UI.prototype.pauseMap=function(g){   /* the map canvas is sized from the window: in the zoomed menus the window is 1/zoom bigger */
    const iw=innerWidth,ih=innerHeight,z=M.z;if(z===1)return pm0.call(this,g);
    const W0=Object.getOwnPropertyDescriptor(window,'innerWidth'),H0=Object.getOwnPropertyDescriptor(window,'innerHeight');
    try{Object.defineProperty(window,'innerWidth',{configurable:true,get:()=>iw/z});Object.defineProperty(window,'innerHeight',{configurable:true,get:()=>ih/z+(M.phone?110:0)});return pm0.call(this,g);}
    finally{if(W0)Object.defineProperty(window,'innerWidth',W0);else delete window.innerWidth;if(H0)Object.defineProperty(window,'innerHeight',H0);else delete window.innerHeight;}
  };

  /* ---------- start ---------- */
  document.addEventListener('DOMContentLoaded',()=>{
    M.app=APP_REF;if(!M.app)return;
    try{M.rotOk=sessionStorage.getItem('dbsRotOk')==='1';}catch(e){}
    M.ctl=mkCtl();M.rot=mkRot();try{Sprites.need('mobile');}catch(e){}
    M.app.input.mode=M.app.input.getPad()?'pad':'touch';
    const cv=M.app.canvas;cv.addEventListener('pointerdown',tapZone,true);
    /* the ring stays where the finger first touched (the base game drags it along when the finger goes past the edge): the direction is
       always measured from that point, and past the edge the push is simply full. Runs before the base handler and replaces it */
    cv.addEventListener('pointermove',e=>{const a=M.app,j=a.joy;if(!j||!j.on||e.pointerId!==j.id)return;e.stopImmediatePropagation();
      const k=a.renderer.W/innerWidth,m=48*a.renderer.U;let dx=e.clientX*k-j.ox,dy=e.clientY*k-j.oy;const d=Math.hypot(dx,dy);
      if(d>m){dx=dx/d*m;dy=dy/d*m;}j.x=dx/m;j.y=dy/m;},true);
    addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,120));
    fit();M.app.renderer.resize();
    /* the button states follow the game every frame */
    const loop=()=>{try{update();}catch(e){}requestAnimationFrame(loop);};requestAnimationFrame(loop);
  });
})();
