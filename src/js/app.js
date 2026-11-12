'use strict';
/* ====== App: state machine + main loop ====== */
class App{
  constructor(){
    this.save=new SaveData();
    this.i18n=new I18n();this.i18n.setLang(this.save.d.settings.lang);document.documentElement.lang=this.i18n.lang;   /* v137: the page language matches the game's, so phone browsers do not offer to translate it */
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
    /* v141: mouse wheel = camera zoom while playing (50%..150%, steps of 10%; also in Settings > Gameplay) */
    addEventListener('wheel',e=>{
      if(this.state!=='play'||e.ctrlKey||!this.game||this.game.modal)return;
      const s=this.save.d.settings,z=Math.round(((s.zoom>0?s.zoom:100)-Math.sign(e.deltaY)*10)/10)*10;
      s.zoom=clamp(z,50,150);this.renderer.zlabT=1.2;clearTimeout(this._zw);this._zw=setTimeout(()=>this.save.write(),600);e.preventDefault();
    },{passive:false});
    document.addEventListener('fullscreenchange',()=>{const s=this.save.d.settings,on=!!document.fullscreenElement;if(s.fullscreen!==on){s.fullscreen=on;this.save.write();if(this.ui.active&&this.ui.top.name==='settings')this.ui.rebuild(true);}});
    const unlock=()=>{this.audio.unlock();this.audio.applyVolumes();if(this.state==='menu')this.audio.play('menu');};
    addEventListener('pointerdown',unlock);addEventListener('keydown',unlock);addEventListener('gamepadconnected',unlock);
    /* choice windows: the number keys pick option 1-9 (0 = the tenth), Space presses the highlighted button (the chest's "Collect", or the card in focus) */
    addEventListener('keydown',e=>{
      const m=this.game&&this.game.modal;
      if(this.state!=='modal'||!m||e.repeat||e.ctrlKey||e.altKey||e.metaKey)return;
      const dg=/^(?:Digit|Numpad)(\d)$/.exec(e.code);
      if(dg){
        const i=+dg[1]===0?9:+dg[1]-1,n={level:(m.options||[]).length,totem:(m.opts||[0,1]).length,wish:(m.options||[]).length,tswap:(m.curs||[0]).length+1,pick:(m.opts||[]).length,chest:1,trial:(m.offers||[]).length+(m.trin?m.trin.length:0)}[m.type]||0;
        if(i<n){if((m.type==='level'&&m.banMode)||m.type==='trial'||m.type==='wish'){const b=this.ui.modalEl&&this.ui.modalEl.querySelector('[data-fid="o'+i+'"]');if(b&&!b.disabled)b.click();else if(m.type==='trial')this.ui.sfx('uiErr');}else this.resolveModal(i);}   /* ban mode: the number key bans that card */
        return;
      }
      /* v132: Room of Spirit and Time - Space leaves the room (like «Leave the room»); not in the first 0.6 s, so a Space still pressed from the fight does not throw the rewards away */
      if(e.code==='Space'&&m.type==='trial'){e.preventDefault();if(performance.now()-(m.t0||0)>600){this.ui.sfx();this.resolveModal(0);}return;}
      if(e.code==='Space'&&m.type!=='trial'){
        const root=this.ui.modalEl&&this.ui.modalEl.isConnected?this.ui.modalEl:document,ae=document.activeElement;
        const b=m.type!=='chest'&&ae&&ae.tagName==='BUTTON'&&root.contains(ae)?ae:root.querySelector('[data-focus]');   /* chest: Space is always "Collect" (a reward card may hold the focus) */
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
      /* the round buttons drawn on the canvas (pet, ability, dash, Senzu): a press uses them and flashes like a DOM button */
      if(this.state==='play'&&this.game){const R=this.renderer,k0=R.W/innerWidth,g=this.game;
        for(const [pb,fn] of [[R.petBtn,()=>g.usePet()],[R.abBtn,()=>g.useAbility()],[R.dashBtn,()=>g.dash()],[R.szBtn,()=>g.useSenzu()]])
          if(pb&&Math.hypot(e.clientX*k0-pb.x,e.clientY*k0-pb.y)<pb.r+8){fn();if(!(this.save.d.settings&&this.save.d.settings.reduceFx))UI.sparkAt((pb.x-pb.r)/k0,(pb.y-pb.r)/k0,2*pb.r/k0,2*pb.r/k0,'50%');return;}
        /* v137: the [E] button orbiting an altar: a tap or a click uses it */
        {const x=e.clientX*k0,y=e.clientY*k0,z=(R.zones||[]).find(z=>z.k==='interact'&&x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h);
          if(z){g.input.interact=true;if(!(this.save.d.settings&&this.save.d.settings.reduceFx))UI.sparkAt(z.x/k0,z.y/k0,z.w/k0,z.h/k0,'50%');return;}}}
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
    this.applySettings();this.enforceTest();
    this.ui.show('main');
    Sprites.loadPack(()=>{if(this._sbR)return;this._sbR=setTimeout(()=>{this._sbR=0;const t=this.ui.top;if(this.state==='menu'&&t&&(t.name==='chars'||t.name==='main'))this.ui.rebuild(true);},250);});   /* v114: one menu refresh for a burst of decoded sheets (it was one per sheet, ~50 at start) */
    this.cloud.start();
    this.updater.start();
    requestAnimationFrame(n=>this.loop(n));
  }
  /* cloud events: refresh the open menu and surface conflicts / password reset */
  onCloud(ev){
    const ui=this.ui,top=ui&&ui.top&&ui.top.name;
    if(ev.type==='conflict'){if(this.state==='menu'&&top!=='cloudConflict')ui.push('cloudConflict');return;}
    if(ev.type==='recovery'){if(top!=='account')ui.push('account');else ui.rebuild(true);return;}
    if(ev.type==='hashError'){if(this.cloud.resetOn&&/otp_expired|access_denied/.test(this.cloud.hashCode||'')&&!this.cloud.signedIn){ui.openReset('clErrLink');return;}ui.toast({type:'info',msg:this.cloud.hashCode==='oauth_state'?ui.t('clErrState'):this.cloud.hashErr});return;}
    if(ev.type==='nick'&&this.cloud.nick&&!this._roomLink){const c=COOP.linkCode();if(c){this._roomLink=1;COOP.join(c).then(r=>{if(r==='ok'){if(top!=='coop')ui.push('coop');ui.push('coopRoom');}else ui.coopErr(r);}).catch(()=>{});}}   /* v119: ?room=ABCD */
    if(ev.type==='overtaken'){for(const r of ev.list.slice(0,3)){const S=STAGES[r.stage];ui.toast({type:'info',msg:ui.tr(T6(`${r.nick} ti ha superato`,`${r.nick} overtook you`,`${r.nick} te ha superado`,`${r.nick} t'a dépassé`,`${r.nick} hat dich überholt`,`${r.nick} te superou`))+': '+(r.week?ui.tr(OT.weekly)+' '+r.week:(S?ui.tr(S.n):'')+' · '+ui.tr((DIFF[r.diff]||DIFF.normal).n))});}return;}   /* v116 */
    if(ev.type==='prov'){if(top==='main'||top==='account')ui.rebuild(true);return;}
    if(ev.type==='applied')this.applySettings();
    if(ev.type==='auth'||ev.type==='tester'||ev.type==='applied')this.enforceTest();
    if(top==='main'||top==='account'||(ev.type==='applied'&&this.state==='menu'))ui.rebuild(true);
  }
  /* Test mode needs the owner's account or a whitelisted one: with anything else (signed out, another account, no cloud in this build) it is switched off and what it gave for free is taken back.
     While the answer for a signed-in account is still unknown (first sign-in on this device, tester === null) it is left alone */
  enforceTest(){
    const s=this.save.d.settings,c=this.cloud;
    if(!s.sandbox||c.canTest||(c.signedIn&&c.tester===null))return;
    s.sandbox=false;this.progress.revertTest();this.save.write();this.applySettings();
    if(this.ui&&this.ui.top&&this.ui.top.name!=='play')this.ui.rebuild(true);
  }
  applySettings(){
    const s=this.save.d.settings;
    this.i18n.setLang(s.lang);document.documentElement.lang=this.i18n.lang;
    FXL.on=!!s.reduceFx;this.audio.s=s;this.audio.applyVolumes();
    this.renderer.resize();this.renderer.tt=(k,v)=>this.t(k,v);this.renderer.tr=o=>this.i18n.t(o);
    try{
      if(s.fullscreen&&!document.fullscreenElement&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{s.fullscreen=false;});
      else if(!s.fullscreen&&document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen();
    }catch(e){}
    this.save.write();
    if(this.ui.active&&this.ui.top&&['main'].includes(this.ui.top.name)){}
  }
  /* v120: co-op. The host plays a normal run with the room's seed and becomes the simulation; a client gets a Game it only draws */
  coopHostGame(st){const ch=COOPG.myChar();this.startGame({stage:st.stage,char:ch,diff:st.diff,x2:false,sandbox:false,pet:this.save.d.pet,seed:st.seed,coop:{me:COOPG.me,code:st.code}});return this.game;}
  coopViewGame(m,me){this.lastOpts=null;this.ui.clear();this.ui.closeModal();Online.unseed();Online.seed(m.seed);
    const g=new Game({stage:m.stage,char:m.ch,diff:m.diff,x2:false,sandbox:false,pet:this.save.d.pet},this.makeEnv());
    g.coopView=true;g.sb.nospawn=true;g.en=[];g.p.nick=me;g.coopNames=m.names;this.game=g;this.state='play';this.joy.on=false;this.audio.unlock();this.audio.play('stage'+STAGES[m.stage].id);
    g.say(this.i18n.t(STAGES[m.stage].n)+' · CO-OP','#ffd23f',3);return g;}
  makeEnv(){return{save:this.save,audio:this.audio,progress:this.progress,tr:(o,v)=>this.i18n.t(o,v),onEnd:(res,g)=>this.onEnd(res,g),pickTrinkets:(g,l,cb)=>this.pickTrinkets(g,l,cb)};}
  /* v136: after a win, the window that chooses which found trinkets go home (the run is over, the world is drawn frozen behind it) */
  pickTrinkets(g,list,cb){this.state='end';this.ui.closeModal();this.ui.show('tpick',{g,list,cb});this.audio.play('menu');}
  startGame(o){
    this.lastOpts=o;this.ui.clear();this.ui.closeModal();this.ui.hideSandbox();
    if(this.renderer.dynReset)this.renderer.dynReset();   /* every run starts at full resolution: the dynamic one measures again */
    Online.unseed();CLASH.unbind();if((o.week||o.coop||o.wait)&&o.seed)Online.seed(o.seed);   /* v115: the weekly challenge replays the week's random numbers */
    this.game=new Game(o,this.makeEnv());if(o.coop)this.game.coopInit(o.coop);
    if(!o.sandbox&&!o.coop&&this.cloud.uid&&this.cloud.nick){const g=this.game;this.cloud.runStart().then(id=>{if(id&&this.game===g)g.runId=id;}).catch(()=>{});}   /* v118: run token */
    if(GUARD.tainted)this.game.unranked=true;
    if(o.week&&this.cloud.enabled)this.cloud.weeklyGhost(o.week).then(gh=>{if(gh&&this.game&&this.game.week===o.week)this.game.ghost=gh;}).catch(()=>{});   /* v116: the weekly leader's ghost */this.state='play';
    this.audio.unlock();if(this.audio.slowMusic)this.audio.slowMusic(1);this.audio.play('stage'+STAGES[o.stage].id);
    this.game.say(this.i18n.t(STAGES[o.stage].n)+(o.x2?'  x2':''),'#ffd23f',3);
    {const g=this.game;if(g.fz){const p=g.p,c=g.formColor||'#ffd23f';g.say(this.i18n.t(T6('FUSIONE!','FUSION!','¡FUSIÓN!','FUSION !','FUSION!','FUSÃO!')),c,2.6,this.i18n.t(fuseKind(g.fz.k))+' · '+g.fz.parents.map(id=>this.i18n.t(CHARS.find(x=>x.id===id).n)).join(' + '));
      g.ring(p.x,p.y,220,c,.9);g.pillar(p.x,p.y,c,1.4);g.flash=.6;g.flashC='#ffffff';this.audio.sfx('transform');}}   /* v116 */
    this.joy.on=false;this.abHold=null;
    const st=STAGES[o.stage],defs=[];for(const r of st.roster)if(ENEMIES[r[0]])defs.push(ENEMIES[r[0]].sp);
    {const ids=new Set(bossPlan(st,(DIFF[o.diff]||DIFF.normal).dur,o.diff).map(b=>b[0]));for(const b of st.bosses)ids.add(b[0]);
      for(const id of ids)for(let q=BOSSES[id],n=0;q&&n<4;q=BOSSES[q.p2],n++)defs.push(q.sp);}
    if(st.sup)for(const id of['tama1','tama1f','tama2','tama2f','tama3','tama3f'])defs.push(BOSSES[id].sp);
    Sprites._wq=[];Sprites.warm(defs);
  }
  pause(){if(this.state!=='play')return;const tp=document.getElementById('tip');if(tp)tp.style.display='none';this.state='pause';this.ui.show('pause');}
  resume(){if(this.state!=='pause')return;this.ui.clear();this.state='play';}
  resolveModal(i){
    if(!this.game||!this.game.modal)return;
    if(this.game.coopView){COOPG.answer(i);this.state='play';return;}   /* v120: the host applies a co-op client's choice */
    this.game.resolveModal(i);this.ui.closeModal();this.state='play';
  }
  onEnd(res,g){
    this.state='end';this.lastRes=res;this.ui.closeModal();this.ui.hideSandbox();Online.unseed();
    {const row=Online.row(g||this.game,res),cl=this.cloud;if(row&&cl.uid&&cl.nick){const gg=g||this.game;cl.submitScore(row).then(ok=>{if(ok)this.ui.toast({type:'info',msg:this.ui.tr(OT.sent)});}).catch(()=>{});
      if(gg.week&&gg.gtrail)cl.ghostSubmit(gg.week,row.t*1e7+row.kills,gg.C.id,gg.gtrail.p).catch(()=>{});}}   /* v115: leaderboards */
    this.audio.play('menu');this.ui.show('end',res);
  }
  /* used by the update watcher (update.js): ends the run in progress right now and keeps EVERY coin (no 25% defeat penalty);
     returns the run result, or null when there is no run to end */
  endRunForUpdate(){
    const g=this.game;this.lastRes=null;
    if(!g||g.ended||!['play','modal','pause'].includes(this.state))return null;
    const tp=document.getElementById('tip');if(tp)tp.style.display='none';
    this.ui.clear();this.ui.closeModal();g.modal=null;g.dying=null;g.vic=null;g.timeScale=1;
    g.finish(false,{keep:true});
    return this.lastRes;
  }
  endRunManually(){const g=this.game;this.ui.clear();if(g&&g.coopView){COOPG.stop();this.toMenu();return;}if(g&&!g.ended)g.finish(!!g.continued);else this.toMenu();}   /* v141: after the final boss (Endless) "End and collect" counts as the win */
  continueRun(){if(!this.game)return;this.game.continued=true;this.game.continueAfterWin();this.ui.clear();this.state='play';this.audio.play('stage'+this.game.stage.id);}
  retry(){if(this.lastOpts&&this.lastOpts.coop){this.toMenu();return;}if(this.lastOpts)this.startGame(this.lastOpts);}   /* a co-op run starts again from the room */
  toMenu(){if(this.renderer.dynReset)this.renderer.dynReset();Online.unseed();CLASH.unbind();if(this.audio.slowMusic)this.audio.slowMusic(1);this.game=null;this.state='menu';this.ui.closeModal();this.ui.show('main');this.audio.play('menu');if(COOP.code){this.ui.push('coop');this.ui.push('coopRoom');}}   /* v120: after a co-op run, back to the room */
  keyHints(){
    const I=this.input,B=I.binds,pad=I.mode==='pad',h={};
    for(const a of['interact','pet','kaioken','senzu','dash','target'])h[a]=pad?Input.padLabel((B.pad[a]||[])[0]):Input.keyLabel((B.kb[a]||[])[0]);
    h._pad=pad;this.renderer.keyHints=h;
  }
  loop(now){
    requestAnimationFrame(n=>this.loop(n));
    try{COOP.tick();}catch(e){}   /* v119: co-op lobby polling, presence and invites */
    try{this.tick(now);}catch(e){console.error('frame error',e);try{this.renderer.resetCtx();}catch(_){}}
  }
  tick(now){
    const dt=Math.min(.05,(now-this.last)/1000);this.last=now;
    const I=this.input,g=this.game,r=this.renderer;
    I.poll(dt);
    try{COOPG.tick(dt);}catch(e){console.error('coop',e);}   /* v120: co-op connections, snapshots, inputs */
    this.canvas.classList.toggle('bgblur',this.state==='menu');I.noTab=this.state==='play';
    {const mr=this.state==='menu';if(r.menuRes!==mr){r.menuRes=mr;r.resize();}}   /* v131: menus draw their blurred backdrop at half resolution */
    this.hintT-=dt;if(this.hintT<=0){this.hintT=.5;this.keyHints();}
    if(this.state==='play'&&g){
      if(I.pressed('pause')){this.pause();}
      else{
        const mv=I.move();let x=mv.x,y=mv.y;if(this.joy.on){x+=this.joy.x;y+=this.joy.y;}
        g.input.x=x;g.input.y=y;
        if(g.coopView){   /* v120: a co-op client: the buttons go to the host, the world comes from its snapshots */
          if(I.pressed('pet'))COOPG.action('pet');if(I.pressed('kaioken'))COOPG.action('ab');if(I.pressed('senzu'))COOPG.action('senzu');if(I.pressed('dash'))COOPG.action('dash');
        }else{
        if(I.pressed('interact'))g.input.interact=true;
        if(I.pressed('pet'))g.usePet();
        {const kh=I.held('kaioken');
          /* v132: with the Kamehameha the key does two things: a tap (shorter than the charge threshold) uses the ability when it is let go,
             a hold only charges the beam (before, the press also switched the Kaioken on). Without the Kamehameha the ability starts on the press */
          if(g.weapons.has('kame')){if(I.pressed('kaioken'))this.abHold=0;if(kh&&this.abHold!=null)this.abHold+=dt;else if(!kh&&this.abHold!=null){if(this.abHold<KCH_MIN)g.toggleKaioken();this.abHold=null;}}
          else if(I.pressed('kaioken'))g.toggleKaioken();
          EXTRAS.hold(g,kh,dt);}   /* v117: holding it charges the next Kamehameha */
        if(I.pressed('senzu'))g.useSenzu();
        if(I.pressed('dash'))g.dash();
        if(I.pressed('target'))g.cycleTarget();
        if(I.pressed('debug')&&g.sandbox)this.ui.toggleSandbox(g);
        {const u0=performance.now();g.update(dt);const PF=this.renderer._pf||(this.renderer._pf={});PF.upd=(PF.upd||0)*.92+(performance.now()-u0)*.08;}
        }
        this.trackT-=dt;
        if(this.trackT<=0){this.trackT=1;this.audio.play(g.bossAlive>0?(g.en.some(e=>e.boss&&e.final)?(trackUri('fboss'+g.stage.id)?'fboss'+g.stage.id:trackUri('bossgen')?'bossgen':'finalboss'):(trackUri('bossgen')?'bossgen':['boss','boss2','boss3'][g.stageIdx%3])):'stage'+g.stage.id);}
        if(g.dying&&g.modal)g.modal=null;
        if(g.modal&&!this.ui.modalEl&&!g.ended){this.state='modal';this.ui.openModal(g.modal,g);}
      }
      r.draw(g,dt);
    }else if(g&&(this.state==='modal'||this.state==='pause'||this.state==='end')){
      if(this.state==='pause'&&this.ui.top&&this.ui.top.name==='pause'&&(I.pressed('pause')||I.pressed('cancel')))this.resume();
      else this.ui.update();
      const co=this.state==='modal'&&(g.coop||g.coopView);if(co&&g.coop)g.update(dt);   /* v121: co-op: a window does not stop the world */
      if(this.game===g)r.draw(g,co?dt:0);
    }else{
      const boot=typeof BOOT!=='undefined'&&BOOT.on;   /* v131: while the loading screen covers everything, nothing is drawn under it */
      if(!boot)r.drawMenuBg(dt);this.ui.update();this.ui.animate(dt);   /* (animate runs: the loading screen opens the character / stage screens behind itself to prepare them) */
    }
  }
}
document.addEventListener('DOMContentLoaded',()=>{const app=new App();APP_REF=app;COOP.app=app;app.init();if(GUARD_DEV)window.__app=app;   /* the console handle exists only in DEV builds */
  GUARD.onTaint=()=>{if(app.game)app.game.unranked=true;try{app.ui.toast({type:'info',msg:app.ui.tr(T6('Strumenti sviluppatore aperti: questa sessione non va in classifica.','Developer tools open: this session does not go on the leaderboards.','Herramientas de desarrollo abiertas: esta sesión no entra en las clasificaciones.','Outils de développement ouverts : cette session ne va pas au classement.','Entwicklertools offen: diese Sitzung kommt nicht in die Bestenlisten.','Ferramentas de desenvolvedor abertas: esta sessão não entra nas classificações.'))});}catch(e){}};
  GUARD.start();
  COOP.on(k=>{if(k.startsWith('invite:')){const[,n,c]=k.split(':');app.ui.toast({type:'info',msg:app.ui.tr(CO.invitesYou(n))+' · '+app.ui.tr(CO.room)+' '+c+' → 👥 '+app.ui.tr(CO.title)});}});});
let APP_REF=null;
