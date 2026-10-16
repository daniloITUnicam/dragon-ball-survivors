'use strict';
/* ====== Audio: SFX + procedural lo-fi music (original compositions) ====== */
const mtof=m=>440*Math.pow(2,(m-69)/12);
const PENT_MAJ=[0,2,4,7,9],PENT_MIN=[0,3,5,7,10];
const TRACKS={
  menu:{bpm:74,root:60,scale:PENT_MAJ,prog:[[0,4,7,11],[-3,0,4,7],[-7,-3,0,4],[-5,-1,2,5]],mode:'chill',lead:.30},
  stage1:{bpm:80,root:62,scale:PENT_MIN,prog:[[0,3,7,10],[-4,0,3,7],[-7,-4,0,3],[-5,-1,2,5]],mode:'chill',lead:.34},
  stage2:{bpm:70,root:65,scale:PENT_MAJ,prog:[[0,4,7,11],[-1,2,6,9],[-3,0,4,7],[-5,-1,2,7]],mode:'chill',lead:.30},
  stage3:{bpm:86,root:57,scale:PENT_MIN,prog:[[0,3,7,10],[-4,0,3,7],[-7,-4,0,3],[-5,-1,2,5]],mode:'chill',lead:.36},
  stage4:{bpm:74,root:64,scale:PENT_MAJ,prog:[[0,4,7,11],[-3,0,4,7],[-7,-3,0,4],[-5,0,2,5]],mode:'chill',lead:.32},
  stage5:{bpm:92,root:55,scale:PENT_MIN,prog:[[0,3,7,10],[-4,0,3,7],[-7,-4,0,3],[-5,-1,2,5]],mode:'chill',lead:.38},
  stage6:{bpm:84,root:64,scale:PENT_MAJ,prog:[[0,4,7,11],[-5,-1,2,7],[-3,0,4,7],[-7,-3,0,4]],mode:'chill',lead:.36},
  stage7:{bpm:88,root:52,scale:PENT_MIN,prog:[[0,3,7,10],[-2,2,5,9],[-4,0,3,7],[-7,-4,0,3]],mode:'chill',lead:.34},
  stage8:{bpm:90,root:59,scale:PENT_MIN,prog:[[0,3,7,10],[-5,-2,2,7],[-7,-4,0,3],[-4,0,3,7]],mode:'chill',lead:.38},
  stage9:{bpm:68,root:67,scale:PENT_MAJ,prog:[[0,4,7,11],[-3,0,4,9],[-5,-1,2,7],[-8,-4,-1,4]],mode:'chill',lead:.28},
  stage10:{bpm:96,root:50,scale:PENT_MIN,prog:[[0,3,6,10],[-4,0,3,6],[-7,-4,-1,3],[-6,-2,1,5]],mode:'chill',lead:.4},
  stage11:{bpm:78,root:53,scale:PENT_MIN,prog:[[0,3,7,10],[-2,2,5,9],[-5,-1,2,7],[-7,-4,0,5]],mode:'chill',lead:.36},
  boss2:{bpm:106,root:50,scale:PENT_MIN,prog:[[0,3,7,10],[-2,2,5,9],[-5,-1,2,5],[-7,-4,0,3]],mode:'boss',lead:.5},
  boss3:{bpm:96,root:53,scale:PENT_MIN,prog:[[0,3,7,10],[-4,0,3,7],[-9,-5,-2,3],[-5,-1,2,5]],mode:'boss',lead:.46},
  finalboss:{bpm:114,root:45,scale:PENT_MIN,prog:[[0,3,7,10],[-4,0,3,7],[-7,-4,0,3],[-2,2,5,9]],mode:'boss',lead:.62},
  boss:{bpm:100,root:48,scale:PENT_MIN,prog:[[0,3,7,10],[-4,0,3,7],[-7,-4,0,3],[-5,-1,2,5]],mode:'boss',lead:.5}
};

class MusicEngine{
  constructor(a){
    this.a=a;const c=this.ctx=a.ctx;
    this.out=c.createGain();this.out.gain.value=0;this.out.connect(a.musicG);
    this.lp=c.createBiquadFilter();this.lp.type='lowpass';this.lp.frequency.value=2600;this.lp.Q.value=.4;this.lp.connect(this.out);
    const nb=c.createBuffer(1,c.sampleRate*1.5,c.sampleRate),d=nb.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    this.noise=nb;this.name=null;this.tr=null;this.step=0;this.next=0;this.timer=null;
  }
  /* death slow-down: tempo (and a darker filter) of the synth music */
  setRate(r){this.rate=r;try{this.lp.frequency.setTargetAtTime(r<1?650:2600,this.ctx.currentTime,.25);}catch(e){}}
  play(name){
    if(name===this.name)return;
    this.name=name;const c=this.ctx;
    this.out.gain.cancelScheduledValues(c.currentTime);
    this.out.gain.setTargetAtTime(0,c.currentTime,.12);
    clearTimeout(this.sw);
    this.sw=setTimeout(()=>{
      this.tr=name?TRACKS[name]:null;this.step=0;this.next=c.currentTime+.08;
      if(this.tr){this.out.gain.cancelScheduledValues(c.currentTime);this.out.gain.setTargetAtTime(1,c.currentTime,.6);if(!this.timer)this.timer=setInterval(()=>this.tick(),60);}
      else if(this.timer){clearInterval(this.timer);this.timer=null;}
    },520);
  }
  tick(){
    const tr=this.tr,c=this.ctx;if(!tr)return;
    const sd=60/tr.bpm/4/(this.rate||1);
    if(this.next<c.currentTime-.5)this.next=c.currentTime+.05;
    while(this.next<c.currentTime+.3){
      const sw=(this.step%2)?sd*.14:0;
      this.sched(tr,this.step,this.next+sw,sd);
      this.next+=sd;this.step++;
    }
  }
  note(type,f,t,dur,vol,att,rel,dst){
    const c=this.ctx,o=c.createOscillator(),g=c.createGain();
    o.type=type;o.frequency.value=f;o.detune.value=rnd(-7,7);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+att);g.gain.setTargetAtTime(0,t+dur,rel);
    o.connect(g);g.connect(dst||this.lp);o.start(t);o.stop(t+dur+rel*6);
  }
  hit(t,dur,vol,hp,lp){
    const c=this.ctx,s=c.createBufferSource(),g=c.createGain(),f=c.createBiquadFilter();
    s.buffer=this.noise;f.type='highpass';f.frequency.value=hp;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(f);let last=f;
    if(lp){const l=c.createBiquadFilter();l.type='lowpass';l.frequency.value=lp;f.connect(l);last=l;}
    last.connect(g);g.connect(this.lp);s.start(t,rnd(0,1));s.stop(t+dur+.05);
  }
  kick(t,vol){
    const c=this.ctx,o=c.createOscillator(),g=c.createGain();
    o.type='sine';o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(42,t+.13);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+.22);
    o.connect(g);g.connect(this.lp);o.start(t);o.stop(t+.25);
  }
  sched(tr,step,t,sd){
    const bar=Math.floor(step/16),s=step%16,ch=tr.prog[bar%tr.prog.length],boss=tr.mode==='boss';
    const dm=boss?.9:.7;
    if(s===0){
      for(const n of ch)this.note('triangle',mtof(tr.root+n),t,sd*15,.045,.25,.5);
      this.note('sine',mtof(tr.root+ch[0]-12),t,sd*3,.13,.01,.25);
    }
    const bassSteps=boss?[0,3,6,8,11,14]:[0,6,10];
    if(bassSteps.includes(s)&&s>0)this.note('sine',mtof(tr.root+ch[0]-12),t,sd*(boss?1.5:2.5),.11,.01,.18);
    if(s===0||s===(boss?8:10)||(boss&&s===11))this.kick(t,.28*dm);
    if(s===4||s===12){this.hit(t,.16,.12*dm,1800,6000);this.note('sine',mtof(54),t,.05,.05,.002,.05);}
    if(boss?true:(s%2===0))this.hit(t,.04,(s%4===2?.05:.028)*dm,7000,null);
    if(boss&&(s===14))this.hit(t,.12,.08,1200,5000);
    if(Math.random()<tr.lead*(s%2===0?1:.35)&&s!==0){
      const sc=tr.scale,deg=sc[Math.floor(Math.random()*sc.length)];
      const oct=Math.random()<.25?24:12;
      this.note('triangle',mtof(tr.root+deg+oct),t,.12,.06,.004,.16);
    }
    if(Math.random()<.12)this.hit(t+rnd(0,sd),.012,.02,3500,null);
  }
}

/* user-supplied music: build.py scans assets/*.mp3 and maps each file to the menu or a stage by its NAME
   (e.g. "android ruins.mp3" -> stage 3, "menu.mp3" -> menu). Key = track name used by the game: 'menu', 'stage<id>'.
   Values are data: URIs (embedded) or relative URLs (link mode). Without any file the synth music plays. */
const FILE_TRACKS=/*__TRACKS__*/{};
const trackUri=t=>FILE_TRACKS[t]||null;
const XFADE=3.2; /* seconds of equal-power crossfade between the end and the start of a looping file track */
const xfCurve=(up)=>{const n=48,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1);c[i]=Math.sin((up?x:1-x)*Math.PI/2);}return c;};
class AudioSys{
  constructor(settings){this.s=settings;this.ctx=null;this.music=null;this.last={};this.wantTrack=null;}
  unlock(){
    if(!this.ctx){
      try{
        const C=window.AudioContext||window.webkitAudioContext;this.ctx=new C();
        this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);
        this.musicG=this.ctx.createGain();this.musicG.connect(this.master);
        this.sfxG=this.ctx.createGain();this.sfxG.connect(this.master);
        const nb=this.ctx.createBuffer(1,this.ctx.sampleRate,this.ctx.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;this.nbuf=nb;
        this.music=new MusicEngine(this);this.applyVolumes();
        if(this.wantTrack)this.play(this.wantTrack);
      }catch(e){this.ctx=null;}
    }
    if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume();
  }
  applyVolumes(){
    if(!this.ctx)return;
    this.master.gain.value=this.s.master;this.musicG.gain.value=this.s.music*.55;this.sfxG.gain.value=this.s.sfx;
  }
  /* slow (rate<1) or restore (1) the music: synth tempo + playbackRate of file tracks */
  slowMusic(rate){
    this.slow=rate;if(this.music)this.music.setRate(rate);
    for(const k in this.files||{}){const f=this.files[k];for(const w of['a','b'])try{if(f[w]&&f[w].el)f[w].el.playbackRate=rate;}catch(e){}}
  }
  play(track){
    this.wantTrack=track;
    const uri=trackUri(track);
    if(this.music)this.music.play(uri?null:track);
    this.setFile(uri?track:null);
  }
  /* play the file of a track, looping with a crossfade (two <audio> elements overlap at the seam: no gap, no click);
     every other file fades out and keeps its position for when its stage music comes back */
  setFile(name){
    this.fileOn=name;
    if(!this.ctx)return;
    const c=this.ctx;this.files=this.files||{};
    for(const k in this.files){
      if(k===name)continue;const f=this.files[k];
      if(f.on){f.on=false;f.out.gain.cancelScheduledValues(c.currentTime);f.out.gain.setTargetAtTime(0,c.currentTime,.18);
        clearTimeout(f.stop);f.stop=setTimeout(()=>{if(!f.on)this.parkFile(f);},900);}
    }
    if(name){
      let f=this.files[name];
      if(!f){
        const uri=trackUri(name),mk=(v)=>{const el=new Audio(uri);el.preload='auto';let g=null;
          try{const src=c.createMediaElementSource(el);g=c.createGain();g.gain.value=v;src.connect(g);g.connect(f.out);}catch(e){g=null;}
          el.addEventListener('ended',()=>{if(f.on&&!f.xf&&f[f.cur].el===el){el.currentTime=0;const q=el.play();if(q&&q.catch)q.catch(()=>{});}}); /* fallback if the loop timer missed the seam */
          return{el,g};};
        f={out:c.createGain(),on:false,xf:false,cur:'a'};f.out.gain.value=0;f.out.connect(this.musicG);
        f.a=mk(1);f.b=mk(0);this.files[name]=f;
      }
      clearTimeout(f.stop);
      if(!f.on){
        const cu=f[f.cur];if(cu.g){cu.g.gain.cancelScheduledValues(c.currentTime);cu.g.gain.value=1;}
        f.out.gain.cancelScheduledValues(c.currentTime);f.out.gain.setTargetAtTime(name==='menu'?1.15:1.05,c.currentTime,.35);
      }
      f.on=true;const pr=f[f.cur].el.play();if(pr&&pr.catch)pr.catch(()=>{});
      if(!this.loopT)this.loopT=setInterval(()=>this.loopTick(),200);
    }
  }
  parkFile(f){ /* stop a faded-out file: settle any crossfade in progress and pause (position is kept) */
    const c=this.ctx;
    if(f.xf){f.xf=false;const o=f.cur==='a'?f.b:f.a;o.el.pause();if(o.g){o.g.gain.cancelScheduledValues(c.currentTime);o.g.gain.value=0;}const cu=f[f.cur];if(cu.g){cu.g.gain.cancelScheduledValues(c.currentTime);cu.g.gain.value=1;}}
    f.a.el.pause();f.b.el.pause();
  }
  loopTick(){
    const f=this.fileOn&&this.files&&this.files[this.fileOn];if(!f||!f.on||!this.ctx)return;
    const c=this.ctx,now=c.currentTime;
    if(f.xf){if(now>=f.xfEnd){f.xf=false;const o=f.cur==='a'?f.b:f.a;o.el.pause();}return;}
    const cu=f[f.cur],el=cu.el,d=el.duration;
    if(!isFinite(d)||d<XFADE*3||el.paused||el.currentTime<d-XFADE-.2)return;
    const nx=f.cur==='a'?f.b:f.a;
    if(!nx.g||!cu.g)return;
    try{
      nx.el.currentTime=0;const q=nx.el.play();if(q&&q.catch)q.catch(()=>{});
      nx.g.gain.cancelScheduledValues(now);cu.g.gain.cancelScheduledValues(now);
      nx.g.gain.setValueCurveAtTime(xfCurve(true),now,XFADE);cu.g.gain.setValueCurveAtTime(xfCurve(false),now,XFADE);
      f.xf=true;f.xfEnd=now+XFADE+.1;f.cur=f.cur==='a'?'b':'a';
    }catch(e){}
  }
  tone(f,d,type,vol,slide){
    if(!this.ctx||this.s.sfx<=0)return;
    const c=this.ctx,o=c.createOscillator(),g=c.createGain(),t=c.currentTime;
    o.type=type||'square';o.frequency.setValueAtTime(f,t);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);
    g.gain.setValueAtTime(vol||.04,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(g);g.connect(this.sfxG);o.start(t);o.stop(t+d);
  }
  noise(dur,vol,f0,f1,delay){
    if(!this.ctx||this.s.sfx<=0)return;
    const c=this.ctx,t=c.currentTime+(delay||0),s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
    s.buffer=this.nbuf;s.loop=true;f.type='lowpass';f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(40,f1),t+dur);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(.05,dur/4));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(f);f.connect(g);g.connect(this.sfxG);s.start(t);s.stop(t+dur+.05);
  }
  toneAt(f,d,type,vol,slide,delay){
    if(!this.ctx||this.s.sfx<=0)return;
    const c=this.ctx,o=c.createOscillator(),g=c.createGain(),t=c.currentTime+(delay||0);
    o.type=type||'square';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);
    g.gain.setValueAtTime(vol||.04,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(this.sfxG);o.start(t);o.stop(t+d+.02);
  }
  /* ---- anime-style synth helpers ---- */
  distCurve(){if(!this._dc){const n=256,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.tanh(x*4.5);}this._dc=c;}return this._dc;}
  /* crackling electricity: gated high noise + distorted buzz */
  elec(dur,vol,delay,rate,buzz){
    if(!this.ctx||this.s.sfx<=0)return;
    const c=this.ctx,t=c.currentTime+(delay||0),env=(g,v)=>{g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.03);g.gain.setValueAtTime(v,t+dur*.55);g.gain.exponentialRampToValueAtTime(.0001,t+dur);};
    const s=c.createBufferSource();s.buffer=this.nbuf;s.loop=true;
    const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=1600;
    const am=c.createGain();am.gain.value=0;
    const lfo=c.createOscillator();lfo.type='square';
    for(let i=0;i*.045<dur;i++)lfo.frequency.setValueAtTime((rate||70)*(.55+Math.random()*1.0),t+i*.045);
    const lg=c.createGain();lg.gain.value=.5;lfo.connect(lg);lg.connect(am.gain);
    const g=c.createGain();env(g,vol);
    s.connect(hp);hp.connect(am);am.connect(g);g.connect(this.sfxG);s.start(t);lfo.start(t);s.stop(t+dur+.05);lfo.stop(t+dur+.05);
    if(buzz!==0){
      const o=c.createOscillator(),ws=c.createWaveShaper(),bp=c.createBiquadFilter(),g2=c.createGain();
      o.type='sawtooth';o.frequency.setValueAtTime(buzz||95,t);o.frequency.linearRampToValueAtTime((buzz||95)*1.35,t+dur);ws.curve=this.distCurve();
      bp.type='bandpass';bp.frequency.value=1100;bp.Q.value=1.4;env(g2,vol*.55);
      o.connect(ws);ws.connect(bp);bp.connect(g2);g2.connect(this.sfxG);o.start(t);o.stop(t+dur+.05);
    }
  }
  /* aura wind: band-passed noise sweeping with a slow flutter, like the anime power-up */
  wind(dur,vol,f0,f1,delay,q){
    if(!this.ctx||this.s.sfx<=0)return;
    const c=this.ctx,t=c.currentTime+(delay||0),s=c.createBufferSource();s.buffer=this.nbuf;s.loop=true;
    const bp=c.createBiquadFilter();bp.type='bandpass';bp.Q.value=q||1.1;bp.frequency.setValueAtTime(f0,t);bp.frequency.exponentialRampToValueAtTime(Math.max(60,f1),t+dur);
    const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(.5,dur*.3));g.gain.setValueAtTime(vol,t+dur*.7);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=6.5;lg.gain.value=vol*.35;lfo.connect(lg);lg.connect(g.gain);
    s.connect(bp);bp.connect(g);g.connect(this.sfxG);s.start(t);lfo.start(t);s.stop(t+dur+.05);lfo.stop(t+dur+.05);
  }
  /* deep impact: pitch-dropping sine + low noise thud */
  thump(vol,f,dur,delay){this.toneAt(f,dur,'sine',vol,-f*.65,delay||0);this.noise(dur*.6,vol*.8,700,70,delay||0);}
  /* distorted energy sweep */
  zap(f0,f1,dur,vol,delay){
    if(!this.ctx||this.s.sfx<=0)return;
    const c=this.ctx,t=c.currentTime+(delay||0),o=c.createOscillator(),o2=c.createOscillator(),ws=c.createWaveShaper(),g=c.createGain();
    o.type='sawtooth';o2.type='square';ws.curve=this.distCurve();
    o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);
    o2.frequency.setValueAtTime(f0*1.5,t);o2.frequency.exponentialRampToValueAtTime(Math.max(30,f1*1.5),t+dur);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(.04,dur/4));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(ws);o2.connect(ws);ws.connect(g);g.connect(this.sfxG);o.start(t);o2.start(t);o.stop(t+dur+.03);o2.stop(t+dur+.03);
  }
  sfx(n){
    if(!this.ctx)return;
    const now=performance.now(),gap={shot:90,hit:50,pop:60,gem:45,kame:300,coin:60,fuse:200,abBeam:200,land:120,leap:120,warn:300,uiMove:35}[n]||80;
    if(this.last[n]&&now-this.last[n]<gap)return;this.last[n]=now;
    if(n==='click'||n==='buy'||n[0]==='u'&&n[1]==='i')this.lastUi=now;
    const T=(f,d,ty,v,s)=>this.tone(f,d,ty,v,s);
    switch(n){
      case'shot':this.zap(2100,520,.09,.03);this.toneAt(3200,.05,'square',.012,-1800,0);this.noise(.05,.03,9000,2500,0);break;
      case'hit':T(190,.07,'triangle',.04,-110);this.noise(.04,.035,6000,900,0);break;
      case'pop':T(300,.1,'square',.025,-200);break;
      case'gem':T(1100,.05,'sine',.03,300);break;
      case'coin':T(1318,.06,'square',.022,300);this.toneAt(1976,.14,'square',.02,200,.055);break;
      case'pkheal':[523,659,784,1047].forEach((f,i)=>this.toneAt(f,.22,'sine',.045,0,i*.06));this.toneAt(2093,.25,'sine',.02,0,.2);break;
      case'pkmagnet':this.noise(.5,.07,300,3600,0);this.toneAt(110,.45,'sawtooth',.04,900,0);this.toneAt(1900,.06,'square',.04,-600,.42);this.thump(.07,90,.45);break;
      case'pkdmg':this.thump(.12,120,.35);this.toneAt(150,.3,'sawtooth',.06,-90,0);this.toneAt(300,.22,'square',.04,500,.03);this.noise(.2,.07,4200,300,0);break;
      case'pkhaste':[700,1050,1500,2100].forEach((f,i)=>this.toneAt(f,.08,'square',.026,400,i*.035));this.noise(.18,.04,9000,2500,.05);break;
      case'pkxp':this.toneAt(1568,.1,'sine',.04,0,0);this.toneAt(2349,.22,'sine',.035,0,.07);break;
      case'pkluck':[988,1175,1480,1976,2637].forEach((f,i)=>this.toneAt(f,.14,'triangle',.035,0,i*.05));break;
      case'pkcapsule':this.noise(.06,.05,6000,1500,0);this.toneAt(440,.12,'triangle',.05,0,.05);this.toneAt(880,.12,'triangle',.05,0,.14);this.toneAt(1760,.3,'sine',.04,0,.24);break;
      case'kame':this.zap(240,1500,.35,.05);this.elec(.45,.07,0,85);this.thump(.08,110,.4);break;
      case'death':T(260,1.3,'sawtooth',.07,-200);this.toneAt(130,1.6,'triangle',.08,-90,.1);this.noise(1,.09,2200,90,0);this.thump(.2,90,.6);break;
      case'boom':this.thump(.13,150,.5);this.noise(.5,.12,2600,90,0);break;
      case'hurt':T(130,.18,'square',.06,-60);break;
      case'boss':T(70,.7,'sawtooth',.08,40);break;
      case'flare':this.toneAt(2600,.5,'sine',.06,-2000,0);this.toneAt(1300,.5,'triangle',.03,-900,0);this.noise(.35,.08,12000,3000,0);this.elec(.3,.04,0,120,0);break;
      case'slash':this.noise(.14,.06,7500,1800,0);this.toneAt(1400,.12,'sawtooth',.03,-1000,0);this.toneAt(3400,.1,'triangle',.02,-600,.02);break;
      case'fuse':T(900,.5,'square',.02,600);break;
      case'lvl':[392,523,659,784,1046,1318].forEach((f,i)=>this.toneAt(f,.16,'square',.035,0,i*.06));this.toneAt(300,.5,'sawtooth',.03,900,0);this.noise(.4,.04,6000,800,.05);break;
      case'kameCharge':this.zap(110,900,1.0,.05);this.elec(1.0,.05,0,60,80);this.wind(1.0,.04,300,2600,0,1.6);for(let i=0;i<7;i++)this.toneAt(900+i*180,.07,'square',.014,500,.25+i*.1);break;
      case'kameChargeEvo':this.zap(90,1300,1.15,.06);this.elec(1.15,.07,0,50,70);this.wind(1.2,.05,250,3200,0,1.4);this.thump(.1,70,1.1,.05);for(let i=0;i<9;i++)this.toneAt(800+i*210,.07,'square',.016,600,.2+i*.1);break;
      case'kameFire':this.thump(.2,130,.55);this.zap(260,1700,.5,.07);this.elec(1.25,.12,0,90,100);this.wind(1.2,.07,500,3000,0,.9);this.noise(.8,.12,6000,400,0);this.toneAt(1900,.5,'triangle',.03,-900,.05);break;
      case'kameFireEvo':this.thump(.3,90,.9);this.thump(.18,170,.5,.04);this.zap(200,2100,.7,.09);this.zap(90,900,1.3,.07,.1);this.elec(1.7,.16,0,75,70);this.elec(1.2,.1,.15,130,140);this.wind(1.6,.09,400,3800,0,.8);this.noise(1.3,.16,9000,200,0);[880,1320,1760].forEach((f,i)=>this.toneAt(f,.9,'triangle',.025,-200,.06+i*.04));break;
      case'spirit':for(let i=0;i<14;i++)this.toneAt(700+i*95+Math.random()*260,.07,'square',.016,300,i*.06);this.zap(100,800,1.0,.045);this.wind(1.0,.04,500,3500,0,1.3);this.elec(.8,.03,.1,60,0);break;
      case'thunder':this.thump(.2,95,.9);this.noise(1.1,.22,4000,120,0);this.elec(.55,.14,0,95,110);this.toneAt(1600,.2,'sawtooth',.05,-1400,0);break;
      case'buy':this.sfx('uiBuy');break;
      case'senzu':T(500,.2,'sine',.05,500);break;
      case'pickup':T(660,.12,'triangle',.05,330);break;
      case'ball':[660,880,1320].forEach((f,i)=>setTimeout(()=>T(f,.2,'triangle',.05),i*90));break;
      case'chest':this.noise(.25,.05,3000,500,0);[523,659,784,1046,1318].forEach((f,i)=>this.toneAt(f,.2,'triangle',.05,0,.12+i*.08));break;
      case'evolve':[330,440,554,659,880,1108,1318].forEach((f,i)=>{this.toneAt(f,.28,'sawtooth',.035,0,i*.075);this.toneAt(f*2,.2,'sine',.03,0,i*.075+.02);});this.noise(.9,.07,5000,500,0);break;
      case'transform':this.wind(1.7,.12,250,3800,0,1);this.zap(60,700,1.4,.07);this.elec(1.4,.05,0,60,70);this.thump(.25,65,.9,1.2);this.noise(.5,.14,6000,400,1.25);this.wind(2.0,.08,3200,220,1.25,.9);break;
      case'broly':{
        this.noise(1.6,.3,400,5000,0);this.noise(.5,.25,1800,200,.05);
        this.toneAt(52,1.6,'sine',.28,-18,0);this.toneAt(78,1.5,'sawtooth',.13,-30,0);
        const ctx=this.ctx,t=ctx.currentTime;
        for(const [f0,f1,v] of [[170,95,.09],[255,140,.06],[340,190,.04]]){
          const o=ctx.createOscillator(),g=ctx.createGain(),lf=ctx.createOscillator(),lg=ctx.createGain(),bp=ctx.createBiquadFilter();
          o.type='sawtooth';o.frequency.setValueAtTime(f0*1.25,t);o.frequency.linearRampToValueAtTime(f0*1.5,t+.25);o.frequency.exponentialRampToValueAtTime(f1,t+1.7);
          lf.frequency.value=22;lg.gain.value=f0*.05;lf.connect(lg);lg.connect(o.frequency);
          bp.type='bandpass';bp.frequency.setValueAtTime(700,t);bp.frequency.linearRampToValueAtTime(1300,t+.3);bp.frequency.exponentialRampToValueAtTime(400,t+1.7);bp.Q.value=2.2;
          g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.08);g.gain.setValueAtTime(v,t+1.0);g.gain.exponentialRampToValueAtTime(.0001,t+1.8);
          o.connect(bp);bp.connect(g);g.connect(this.sfxG);o.start(t);lf.start(t);o.stop(t+1.85);lf.stop(t+1.85);
        }
        break;}
      case'kaioken':this.wind(.9,.1,300,3000,0,1.1);this.zap(80,420,.55,.06);this.elec(.5,.05,.05,70,60);this.thump(.12,75,.5,.1);break;
      case'kaioken2':this.wind(1.2,.14,250,4200,0,1);this.zap(60,640,.8,.08);this.elec(.8,.08,0,60,60);this.thump(.2,60,.8,.1);this.toneAt(1000,.3,'sawtooth',.04,900,.1);break;
      case'xcharge':this.wind(1.9,.12,250,3800,0,1.0);this.wind(1.9,.07,120,1400,0,2.0);this.zap(60,640,1.8,.07);this.thump(.12,55,1.7);this.elec(1.7,.05,.2,55,70);for(let i=0;i<12;i++)this.toneAt(500+i*130,.1,'square',.016,300,i*.14);break;
      case'xburst':this.thump(.3,70,1.0);this.noise(1.1,.26,9000,120,0);this.elec(.9,.14,0,100,120);this.wind(2.6,.1,2800,260,.05,.9);this.wind(2.4,.05,1500,150,.1,2);[392,494,587,784].forEach((f,i)=>this.toneAt(f,.9,'sawtooth',.04,0,.05+i*.02));break;
      case'xburst2':this.thump(.36,52,1.5);this.thump(.2,110,.7,.05);this.noise(1.6,.32,12000,90,0);this.elec(1.5,.17,0,85,90);this.elec(1.0,.1,.2,140,160);this.wind(3.2,.13,3400,200,.05,.8);this.wind(3.0,.07,1800,120,.1,2);[330,440,554,659,880,1108].forEach((f,i)=>this.toneAt(f,1.1,'sawtooth',.036,0,.05+i*.02));break;
      /* character ability sounds */
      case'abBeam':this.thump(.22,120,.5);this.zap(300,1900,.4,.07);this.elec(.9,.13,0,90,100);this.wind(.9,.06,600,3200,0,.9);break;
      case'abNova':this.thump(.3,85,.8);this.noise(.7,.18,6000,160,0);this.wind(1.0,.09,3000,300,0,.9);this.elec(.5,.08,0,100,0);break;
      case'abHeal':[523,659,784,1046,1318].forEach((f,i)=>this.toneAt(f,.35,'sine',.04,0,i*.08));this.wind(.9,.03,800,2600,0,2);break;
      case'abDash':this.noise(.22,.1,9000,1200,0);this.zap(1500,300,.18,.04);this.toneAt(500,.1,'triangle',.04,-300,.05);break;
      case'abClone':[0,.07,.14].forEach((d,i)=>{this.toneAt(900+i*250,.12,'square',.03,-500,d);this.noise(.08,.05,8000,1500,d);});this.wind(.5,.04,1200,3000,.1,2);break;
      case'abPower':this.wind(.9,.1,300,3500,0,1.1);this.zap(100,700,.7,.06);this.elec(.7,.07,0,70,70);this.toneAt(660,.4,'triangle',.04,700,.2);break;
      case'abBarrier':this.toneAt(520,.7,'sine',.05,300,0);this.toneAt(1040,.6,'triangle',.03,200,.03);this.noise(.5,.04,5000,1500,0);this.elec(.4,.03,0,150,0);break;
      case'abAbsorb':this.noise(.8,.12,500,5000,0);this.zap(1400,200,.8,.05);this.wind(.9,.06,3500,300,0,1.3);break;
      case'abTime':this.toneAt(1760,.08,'square',.03,0,0);this.toneAt(1320,.08,'square',.03,0,.12);this.toneAt(70,1.6,'sine',.1,-20,.2);this.wind(1.4,.07,2600,200,.2,1.5);break;
      case'abErase':this.thump(.3,60,1.1);this.zap(1900,70,.9,.08);this.elec(1.0,.12,0,100,60);this.wind(1.2,.07,600,3000,0,.8);this.noise(.7,.14,9000,200,0);break;
      case'leap':this.noise(.25,.08,3000,900,0);this.toneAt(300,.2,'triangle',.03,400,0);break;
      case'land':this.thump(.1,110,.3);break;
      case'warn':this.toneAt(880,.1,'square',.03,0,0);this.toneAt(880,.1,'square',.03,0,.16);break;
      case'trinket':[784,988,1175,1568].forEach((f,i)=>this.toneAt(f,.2,'sine',.05,0,i*.07));this.noise(.2,.03,9000,4000,.05);break;
      case'shrine':T(440,.3,'sine',.05,440);break;
      /* ---- arcade menu sounds: bright square-wave chip blips, deliberately loud so they cut through the music ---- */
      case'uiMove':this.toneAt(1568,.045,'square',.085,0,0);this.toneAt(2349,.05,'square',.06,0,.035);this.toneAt(784,.05,'triangle',.05,0,0);break;
      case'click':case'uiClick':
        this.toneAt(784,.07,'square',.13,0,0);this.toneAt(1175,.2,'square',.12,0,.065);
        this.toneAt(392,.09,'triangle',.09,0,0);this.toneAt(2349,.16,'square',.03,0,.07);this.noise(.03,.05,9000,3000,0);break;
      case'uiBack':
        this.toneAt(740,.07,'square',.12,0,0);this.toneAt(494,.07,'square',.12,0,.06);this.toneAt(330,.16,'square',.12,0,.12);
        this.toneAt(165,.2,'triangle',.09,0,.12);break;
      case'uiStart':
        [523,659,784,1046,1318,1568].forEach((f,i)=>{this.toneAt(f,.11,'square',.12,0,i*.055);this.toneAt(f/2,.11,'triangle',.08,0,i*.055);});
        this.toneAt(1568,.42,'square',.12,0,.34);this.toneAt(2093,.42,'square',.07,0,.34);this.toneAt(784,.42,'triangle',.09,0,.34);
        this.zap(200,1800,.3,.05);this.noise(.5,.06,9000,1500,.34);break;
      case'uiBuy':
        [1319,1568,2093].forEach((f,i)=>{this.toneAt(f,.09,'square',.12,0,i*.06);this.toneAt(f*1.5,.09,'square',.04,0,i*.06);});
        this.toneAt(2637,.32,'square',.1,0,.18);this.toneAt(1319,.32,'triangle',.08,0,.18);this.noise(.12,.05,12000,4000,.16);break;
      case'uiErr':
        this.toneAt(196,.11,'square',.14,0,0);this.toneAt(147,.22,'square',.14,-20,.11);this.toneAt(98,.3,'sawtooth',.07,0,.05);break;
      case'uiTab':this.toneAt(988,.05,'square',.11,0,0);this.toneAt(1480,.12,'square',.1,0,.045);this.toneAt(494,.08,'triangle',.07,0,0);break;
      case'ach':[659,784,988,1318].forEach((f,i)=>setTimeout(()=>T(f,.18,'triangle',.05),i*90));break;
    }
  }
}
