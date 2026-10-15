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
    const sd=60/tr.bpm/4;
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

/* the menu theme is a user-supplied track embedded by build.py (placeholder stays empty in plain src) */
const MENU_MP3_URI='data:audio/mpeg;base64,__MENU_MP3__';
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
  play(track){
    this.wantTrack=track;
    const file=track==='menu'&&MENU_MP3_URI.length>400;
    if(this.music)this.music.play(file?null:track);
    this.setFile(file);
  }
  setFile(on){
    this.fileOn=on;
    if(!this.ctx)return;
    const c=this.ctx;
    if(on){
      if(!this.fileEl){
        const el=new Audio(MENU_MP3_URI);el.loop=true;el.preload='auto';this.fileEl=el;
        try{const src=c.createMediaElementSource(el);this.fileG=c.createGain();this.fileG.gain.value=0;src.connect(this.fileG);this.fileG.connect(this.musicG);}catch(e){this.fileG=null;}
      }
      if(this.fileG){this.fileG.gain.cancelScheduledValues(c.currentTime);this.fileG.gain.setTargetAtTime(1.15,c.currentTime,.35);}
      const pr=this.fileEl.play();if(pr&&pr.catch)pr.catch(()=>{});
    }else if(this.fileEl&&this.fileG){
      this.fileG.gain.cancelScheduledValues(c.currentTime);this.fileG.gain.setTargetAtTime(0,c.currentTime,.18);
      clearTimeout(this.fileStop);this.fileStop=setTimeout(()=>{if(!this.fileOn)this.fileEl.pause();},900);
    }
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
  sfx(n){
    if(!this.ctx)return;
    const now=performance.now(),gap={shot:90,hit:50,pop:60,gem:45,kame:300,coin:60,fuse:200}[n]||80;
    if(this.last[n]&&now-this.last[n]<gap)return;this.last[n]=now;
    const T=(f,d,ty,v,s)=>this.tone(f,d,ty,v,s);
    switch(n){
      case'shot':T(880,.08,'square',.02,-440);break;
      case'hit':T(170,.06,'triangle',.035,-90);break;
      case'pop':T(300,.1,'square',.025,-200);break;
      case'gem':T(1100,.05,'sine',.03,300);break;
      case'coin':T(1500,.07,'square',.025,500);break;
      case'kame':T(180,.45,'sawtooth',.045,700);break;
      case'boom':T(110,.45,'sawtooth',.08,-70);break;
      case'hurt':T(130,.18,'square',.06,-60);break;
      case'boss':T(70,.7,'sawtooth',.08,40);break;
      case'flare':T(1500,.4,'sine',.05,-1000);break;
      case'slash':T(700,.12,'sawtooth',.035,-450);break;
      case'fuse':T(900,.5,'square',.02,600);break;
      case'lvl':[392,523,659,784,1046,1318].forEach((f,i)=>this.toneAt(f,.16,'square',.035,0,i*.06));this.toneAt(300,.5,'sawtooth',.03,900,0);this.noise(.4,.04,6000,800,.05);break;
      case'kameCharge':[190,230,270,310].forEach((f,i)=>{this.toneAt(f,.13,'sawtooth',.05,f*.25,i*.12);this.toneAt(f*2,.13,'triangle',.025,f*.3,i*.12);});this.toneAt(500,.5,'sine',.03,700,0);break;
      case'kameChargeEvo':[210,260,310,370,440].forEach((f,i)=>{this.toneAt(f,.12,'sawtooth',.05,f*.3,i*.1);this.toneAt(f*2,.12,'square',.02,f*.4,i*.1);});this.toneAt(600,.55,'sine',.04,1000,0);break;
      case'kameFire':this.noise(.8,.14,5000,300,0);this.toneAt(230,.8,'sawtooth',.09,-150,0);this.toneAt(120,.9,'square',.05,-60,0);this.toneAt(460,.5,'triangle',.04,-200,0);break;
      case'kameFireEvo':this.noise(1.4,.24,9000,160,0);this.noise(.5,.2,2400,90,0);this.toneAt(58,1.3,'sine',.2,-26,0);this.toneAt(90,1.2,'sawtooth',.11,-50,0);this.toneAt(180,1.3,'sawtooth',.1,-110,0);this.toneAt(260,1.1,'square',.06,-150,0);this.toneAt(900,.9,'triangle',.05,-500,.04);for(let i=0;i<14;i++)this.toneAt(1800+Math.random()*2600,.04,'square',.03,-900,i*.055);break;
      case'spirit':for(let i=0;i<18;i++)this.toneAt(900+i*70+Math.random()*300,.05,'square',.02,0,i*.045);this.toneAt(120,.9,'sawtooth',.04,500,0);break;
      case'thunder':this.noise(1.1,.22,4000,120,0);this.toneAt(70,1,'sine',.12,-30,0);this.toneAt(1400,.18,'sawtooth',.06,-1200,0);break;
      case'buy':[1320,1760,2093].forEach((f,i)=>this.toneAt(f,.14,'triangle',.05,0,i*.07));this.noise(.08,.04,9000,3000,0);break;
      case'senzu':T(500,.2,'sine',.05,500);break;
      case'pickup':T(660,.12,'triangle',.05,330);break;
      case'ball':[660,880,1320].forEach((f,i)=>setTimeout(()=>T(f,.2,'triangle',.05),i*90));break;
      case'chest':this.noise(.25,.05,3000,500,0);[523,659,784,1046,1318].forEach((f,i)=>this.toneAt(f,.2,'triangle',.05,0,.12+i*.08));break;
      case'evolve':[330,440,554,659,880,1108,1318].forEach((f,i)=>{this.toneAt(f,.28,'sawtooth',.035,0,i*.075);this.toneAt(f*2,.2,'sine',.03,0,i*.075+.02);});this.noise(.9,.07,5000,500,0);break;
      case'transform':this.noise(1.6,.16,300,5000,0);this.toneAt(60,1.4,'sawtooth',.1,800,0);this.toneAt(90,1.4,'square',.04,500,0);[392,494,587].forEach(f=>this.toneAt(f,.9,'sawtooth',.045,0,1.2));this.noise(.5,.12,6000,400,1.25);break;
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
      case'kaioken':this.noise(.5,.14,300,3500,0);this.toneAt(70,.5,'sawtooth',.1,260,0);this.toneAt(140,.45,'square',.05,300,0);this.toneAt(700,.25,'triangle',.04,700,.12);break;
      case'kaioken2':this.noise(.8,.22,200,6000,0);this.toneAt(50,.8,'sawtooth',.13,500,0);this.toneAt(100,.7,'square',.07,500,0);this.toneAt(900,.35,'sawtooth',.05,900,.1);this.toneAt(1400,.3,'triangle',.04,1000,.2);break;
      case'xcharge':this.noise(1.0,.13,200,4200,0);this.toneAt(48,1.0,'sawtooth',.09,520,0);this.toneAt(96,1.0,'square',.04,700,0);this.toneAt(300,1.0,'triangle',.04,1500,0);for(let i=0;i<9;i++)this.toneAt(500+i*130,.1,'square',.018,300,i*.1);break;
      case'xburst':this.noise(1.1,.26,9000,120,0);this.toneAt(55,1.1,'sine',.24,-34,0);this.toneAt(110,.9,'sawtooth',.1,-60,0);[392,494,587,784].forEach((f,i)=>this.toneAt(f,.9,'sawtooth',.04,0,.05+i*.02));break;
      case'xburst2':this.noise(1.6,.32,12000,90,0);this.noise(.4,.22,2600,80,0);this.toneAt(42,1.6,'sine',.3,-24,0);this.toneAt(84,1.3,'sawtooth',.13,-50,0);this.toneAt(160,1.2,'square',.07,-90,0);[330,440,554,659,880,1108].forEach((f,i)=>this.toneAt(f,1.3,'sawtooth',.04,0,.04+i*.03));this.toneAt(1760,.9,'sine',.04,-900,.1);break;
      case'trinket':[784,988,1175,1568].forEach((f,i)=>this.toneAt(f,.2,'sine',.05,0,i*.07));this.noise(.2,.03,9000,4000,.05);break;
      case'shrine':T(440,.3,'sine',.05,440);break;
      case'click':T(520,.05,'square',.02,100);break;
      case'ach':[659,784,988,1318].forEach((f,i)=>setTimeout(()=>T(f,.18,'triangle',.05),i*90));break;
    }
  }
}
