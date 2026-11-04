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
  Renderer.prototype.resize=function(){rs0.call(this);if(M.phone){const sh=Math.max(1,Math.min(innerWidth,innerHeight));this.U=Math.max(.8,Math.min(this.W,this.H)/720)*clamp(560/sh,1,1.45);}};   /* measured on the short side, so portrait (Play anyway) gets the same HUD as landscape */
  /* a tap on the weapon target panel cycles the target (it is only a hover zone with a mouse) */
  const tapZone=e=>{
    const a=M.app;if(!a||a.state!=='play'||!a.game||e.pointerType==='mouse')return;
    const R=a.renderer,k=R.W/innerWidth,x=e.clientX*k,y=e.clientY*k,z=(R.zones||[]).find(z=>z.k==='target'&&x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h);
    if(z){e.stopImmediatePropagation();a.game.cycleTarget();try{navigator.vibrate&&navigator.vibrate(8);}catch(_){}}
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
    M.ctl=mkCtl();M.rot=mkRot();
    M.app.input.mode=M.app.input.getPad()?'pad':'touch';
    const cv=M.app.canvas;cv.addEventListener('pointerdown',tapZone,true);
    addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,120));
    fit();M.app.renderer.resize();
    /* the button states follow the game every frame */
    const loop=()=>{try{update();}catch(e){}requestAnimationFrame(loop);};requestAnimationFrame(loop);
  });
})();
