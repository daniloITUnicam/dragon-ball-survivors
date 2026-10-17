'use strict';
/* ====== App: state machine + main loop ====== */
class App{
  constructor(){
    this.save=new SaveData();
    this.i18n=new I18n();this.i18n.setLang(this.save.d.settings.lang);
    this.t=(k,v)=>this.i18n.t(k,v);
    this.audio=new AudioSys(this.save.d.settings);
    this.input=new Input(this.save);
    this.progress=new Progress(this.save,n=>this.ui.toast(n));
    this.canvas=document.getElementById('c');
    this.renderer=new Renderer(this.canvas,this.save);
    this.ui=new UI(this);
    this.cloud=new Cloud(this.save,ev=>this.onCloud(ev));
    this.cloud.isPlaying=()=>this.state==='play'||this.state==='modal';
    this.game=null;this.state='menu';this.last=performance.now();this.hintT=0;this.trackT=0;this.lastOpts=null;this.lastRes=null;
    this.joy={on:false,id:-1,ox:0,oy:0,x:0,y:0};
    this.updater=new Updater(this);
  }
  init(){
    this.input.attach();
    addEventListener('resize',()=>this.renderer.resize());
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.state==='play')this.pause();});
    addEventListener('blur',()=>{if(this.state==='play')this.pause();});
    document.addEventListener('fullscreenchange',()=>{const s=this.save.d.settings,on=!!document.fullscreenElement;if(s.fullscreen!==on){s.fullscreen=on;this.save.write();if(this.ui.active&&this.ui.top.name==='settings')this.ui.rebuild(true);}});
    const unlock=()=>{this.audio.unlock();this.audio.applyVolumes();if(this.state==='menu')this.audio.play('menu');};
    addEventListener('pointerdown',unlock);addEventListener('keydown',unlock);addEventListener('gamepadconnected',unlock);
    /* choice windows: the number keys pick option 1-9 (0 = the tenth), Space presses the highlighted button (the chest's "Collect", or the card in focus) */
    addEventListener('keydown',e=>{
      const m=this.game&&this.game.modal;
      if(this.state!=='modal'||!m||e.repeat||e.ctrlKey||e.altKey||e.metaKey)return;
      const dg=/^(?:Digit|Numpad)(\d)$/.exec(e.code);
      if(dg){
        const i=+dg[1]===0?9:+dg[1]-1,n={level:(m.options||[]).length,totem:(m.opts||[0,1]).length,wish:(m.options||[]).length,tswap:(m.curs||[0]).length+1,pick:(m.opts||[]).length,chest:1}[m.type]||0;
        if(i<n)this.resolveModal(i);
        return;
      }
      if(e.code==='Space'&&m.type!=='trial'){
        const root=this.ui.modalEl&&this.ui.modalEl.isConnected?this.ui.modalEl:document,ae=document.activeElement;
        const b=ae&&ae.tagName==='BUTTON'&&root.contains(ae)?ae:root.querySelector('[data-focus]');
        if(b&&!b.disabled){e.preventDefault();b.click();}
      }
    });
    const cv=this.canvas;
    /* hover explanations for the HUD (weapons, upgrades, relics, abilities); also while the game is paused */
    const tip=document.createElement('div');tip.id='tip';document.body.append(tip);
    document.addEventListener('pointermove',e=>{
      const R=this.renderer,hide=()=>{tip.style.display='none';};
      if(e.pointerType==='touch'||!this.game||!R.zones||(this.state!=='play'&&this.state!=='pause')||e.target!==cv)return hide();
      const k0=R.W/innerWidth,mx=e.clientX*k0,my=e.clientY*k0,z=R.zones.find(q=>mx>=q.x&&mx<=q.x+q.w&&my>=q.y&&my<=q.y+q.h);
      if(!z)return hide();
      const el=this.ui.tipFor(z,this.game);if(!el)return hide();
      tip.replaceChildren(el);tip.style.display='block';
      const w=tip.offsetWidth,hh=tip.offsetHeight;tip.style.left=Math.min(innerWidth-w-8,e.clientX+16)+'px';tip.style.top=Math.min(innerHeight-hh-8,e.clientY+16)+'px';
    });
    document.addEventListener('pointerleave',()=>{tip.style.display='none';});
    cv.addEventListener('pointerdown',e=>{
      if(this.state==='play'&&this.renderer.petBtn&&this.game){const k0=this.renderer.W/innerWidth,pb=this.renderer.petBtn;if(Math.hypot(e.clientX*k0-pb.x,e.clientY*k0-pb.y)<pb.r+8){this.game.usePet();return;}}
      if(this.state==='play'&&this.renderer.abBtn&&this.game){const k0=this.renderer.W/innerWidth,pb=this.renderer.abBtn;if(Math.hypot(e.clientX*k0-pb.x,e.clientY*k0-pb.y)<pb.r+8){this.game.useAbility();return;}}
      if(this.state==='play'&&this.renderer.dashBtn&&this.game){const k0=this.renderer.W/innerWidth,pb=this.renderer.dashBtn;if(Math.hypot(e.clientX*k0-pb.x,e.clientY*k0-pb.y)<pb.r+8){this.game.dash();return;}}
      if(this.state==='play'&&this.renderer.szBtn&&this.game){const k0=this.renderer.W/innerWidth,pb=this.renderer.szBtn;if(Math.hypot(e.clientX*k0-pb.x,e.clientY*k0-pb.y)<pb.r+8){this.game.useSenzu();return;}}
      if(e.pointerType==='mouse'||this.state!=='play'||this.joy.on)return;
      const k=this.renderer.W/innerWidth;
      this.joy={on:true,id:e.pointerId,ox:e.clientX*k,oy:e.clientY*k,x:0,y:0};this.renderer.joy=this.joy;
      try{cv.setPointerCapture(e.pointerId);}catch(_){}
    });
    cv.addEventListener('pointermove',e=>{
      const j=this.joy;if(!j.on||e.pointerId!==j.id)return;
      const k=this.renderer.W/innerWidth,m=48*this.renderer.U;
      let dx=e.clientX*k-j.ox,dy=e.clientY*k-j.oy;const d=Math.hypot(dx,dy);
      if(d>m){j.ox+=dx/d*(d-m);j.oy+=dy/d*(d-m);dx=dx/d*m;dy=dy/d*m;}
      j.x=dx/m;j.y=dy/m;
    });
    const end=e=>{if(e.pointerId===this.joy.id){this.joy.on=false;this.joy.x=this.joy.y=0;}};
    cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
    this.applySettings();
    this.ui.show('main');
    Sprites.loadPack(()=>{const t=this.ui.top;if(this.state==='menu'&&t&&(t.name==='chars'||t.name==='main'))this.ui.rebuild(true);});
    this.cloud.start();
    this.updater.start();
    requestAnimationFrame(n=>this.loop(n));
  }
  /* cloud events: refresh the open menu and surface conflicts / password reset */
  onCloud(ev){
    const ui=this.ui,top=ui&&ui.top&&ui.top.name;
    if(ev.type==='conflict'){if(this.state==='menu'&&top!=='cloudConflict')ui.push('cloudConflict');return;}
    if(ev.type==='recovery'){if(top!=='account')ui.push('account');return;}
    if(ev.type==='hashError'){ui.toast({type:'info',msg:this.cloud.hashErr});return;}
    if(ev.type==='applied')this.applySettings();
    if(top==='main'||top==='account'||(ev.type==='applied'&&this.state==='menu'))ui.rebuild(true);
  }
  applySettings(){
    const s=this.save.d.settings;
    this.i18n.setLang(s.lang);document.documentElement.lang=s.lang;
    FXL.on=!!s.reduceFx;this.audio.s=s;this.audio.applyVolumes();
    this.renderer.resize();this.renderer.tt=(k,v)=>this.t(k,v);this.renderer.tr=o=>this.i18n.t(o);
    try{
      if(s.fullscreen&&!document.fullscreenElement&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{s.fullscreen=false;});
      else if(!s.fullscreen&&document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen();
    }catch(e){}
    this.save.write();
    if(this.ui.active&&this.ui.top&&['main'].includes(this.ui.top.name)){}
  }
  makeEnv(){return{save:this.save,audio:this.audio,progress:this.progress,tr:(o,v)=>this.i18n.t(o,v),onEnd:(res,g)=>this.onEnd(res,g)};}
  startGame(o){
    this.lastOpts=o;this.ui.clear();this.ui.closeModal();this.ui.hideSandbox();
    this.game=new Game(o,this.makeEnv());this.state='play';
    this.audio.unlock();if(this.audio.slowMusic)this.audio.slowMusic(1);this.audio.play('stage'+STAGES[o.stage].id);
    this.game.say(this.i18n.t(STAGES[o.stage].n)+(o.x2?'  x2':''),'#ffd23f',3);
    this.joy.on=false;
    const st=STAGES[o.stage],defs=[];for(const r of st.roster)if(ENEMIES[r[0]])defs.push(ENEMIES[r[0]].sp);
    for(const b of st.bosses)if(BOSSES[b[0]])defs.push(BOSSES[b[0]].sp);
    Sprites._wq=[];Sprites.warm(defs);
  }
  pause(){if(this.state!=='play')return;const tp=document.getElementById('tip');if(tp)tp.style.display='none';this.state='pause';this.ui.show('pause');}
  resume(){if(this.state!=='pause')return;this.ui.clear();this.state='play';}
  resolveModal(i){
    if(!this.game||!this.game.modal)return;
    this.game.resolveModal(i);this.ui.closeModal();this.state='play';
  }
  onEnd(res,g){
    this.state='end';this.lastRes=res;this.ui.closeModal();this.ui.hideSandbox();
    this.audio.play('menu');this.ui.show('end',res);
  }
  /* used by the update watcher (update.js): ends the run in progress right now and keeps EVERY coin (no 25% defeat penalty);
     returns the run result, or null when there is no run to end */
  endRunForUpdate(){
    const g=this.game;this.lastRes=null;
    if(!g||g.ended||!['play','modal','pause'].includes(this.state))return null;
    const tp=document.getElementById('tip');if(tp)tp.style.display='none';
    this.ui.clear();this.ui.closeModal();g.modal=null;g.dying=null;g.timeScale=1;
    g.finish(false,{keep:true});
    return this.lastRes;
  }
  endRunManually(){const g=this.game;this.ui.clear();if(g&&!g.ended)g.finish(false);else this.toMenu();}
  continueRun(){if(!this.game)return;this.game.continued=true;this.game.continueAfterWin();this.ui.clear();this.state='play';this.audio.play('stage'+this.game.stage.id);}
  retry(){if(this.lastOpts)this.startGame(this.lastOpts);}
  toMenu(){if(this.audio.slowMusic)this.audio.slowMusic(1);this.game=null;this.state='menu';this.ui.closeModal();this.ui.show('main');this.audio.play('menu');}
  keyHints(){
    const I=this.input,B=I.binds,pad=I.mode==='pad',h={};
    for(const a of['interact','pet','kaioken','senzu','dash'])h[a]=pad?Input.padLabel((B.pad[a]||[])[0]):Input.keyLabel((B.kb[a]||[])[0]);
    this.renderer.keyHints=h;
  }
  loop(now){
    requestAnimationFrame(n=>this.loop(n));
    try{this.tick(now);}catch(e){console.error('frame error',e);try{this.renderer.resetCtx();}catch(_){}}
  }
  tick(now){
    const dt=Math.min(.05,(now-this.last)/1000);this.last=now;
    const I=this.input,g=this.game,r=this.renderer;
    I.poll(dt);
    this.canvas.classList.toggle('bgblur',this.state==='menu');
    this.hintT-=dt;if(this.hintT<=0){this.hintT=.5;this.keyHints();}
    if(this.state==='play'&&g){
      if(I.pressed('pause')){this.pause();}
      else{
        const mv=I.move();let x=mv.x,y=mv.y;if(this.joy.on){x+=this.joy.x;y+=this.joy.y;}
        g.input.x=x;g.input.y=y;
        if(I.pressed('interact'))g.input.interact=true;
        if(I.pressed('pet'))g.usePet();
        if(I.pressed('kaioken'))g.toggleKaioken();
        if(I.pressed('senzu'))g.useSenzu();
        if(I.pressed('dash'))g.dash();
        if(I.pressed('debug')&&g.sandbox)this.ui.toggleSandbox(g);
        g.update(dt);
        this.trackT-=dt;
        if(this.trackT<=0){this.trackT=1;this.audio.play(g.bossAlive>0?(g.en.some(e=>e.boss&&e.final)?'finalboss':['boss','boss2','boss3'][g.stageIdx%3]):'stage'+g.stage.id);}
        if(g.dying&&g.modal)g.modal=null;
        if(g.modal&&!this.ui.modalEl&&!g.ended){this.state='modal';this.ui.openModal(g.modal,g);}
      }
      r.draw(g,dt);
    }else if(g&&(this.state==='modal'||this.state==='pause'||this.state==='end')){
      if(this.state==='pause'&&this.ui.top&&this.ui.top.name==='pause'&&(I.pressed('pause')||I.pressed('cancel')))this.resume();
      else this.ui.update();
      r.draw(g,0);
    }else{
      r.drawMenuBg(dt);this.ui.update();this.ui.animate(dt);
    }
  }
}
document.addEventListener('DOMContentLoaded',()=>{const app=new App();app.init();window.__app=app;});
