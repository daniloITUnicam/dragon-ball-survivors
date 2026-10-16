'use strict';
/* ====== Automatic update: a new release must never cost a player the run in progress ======
   build.py stamps every build with BUILD_ID (a hash of everything in the page) and writes version.json next to it; the deploy workflow
   publishes both. This watcher fetches version.json (never cached) a few seconds after the start, then every minute and whenever the tab
   comes back to the foreground. When the id differs from BUILD_ID:
     1. a big notice with a 10 second countdown is shown (the run keeps going, the notice never intercepts clicks);
     2. at 0 the run in progress is ended with EVERY coin kept (no defeat penalty), the cloud save is flushed;
     3. the page reloads itself with ?u=<new id> (the cache-buster that makes the browser/CDN hand out the new HTML).
   It does nothing on file:// or when version.json is missing (local builds, the claude.ai preview...). */
const BUILD_ID='__BUILD_ID__';
const UPD_SECS=10;
const updWait=ms=>new Promise(r=>setTimeout(r,ms));
class Updater{
  constructor(app){
    this.app=app;this.id=BUILD_ID;this.phase='idle';this.newId='';this.until=0;this.lastCheck=0;this.poll=60000;this.secs=UPD_SECS;
    this.el=null;this.timer=0;this.lastS=-1;
  }
  get live(){return typeof location!=='undefined'&&/^https?:$/.test(location.protocol)&&/^[0-9a-f]{8,}$/.test(this.id);}
  start(){
    this.cleanUrl();
    if(!this.live)return;
    setTimeout(()=>this.check(),8000);
    setInterval(()=>this.check(),this.poll);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.check();});
    addEventListener('focus',()=>this.check());
    addEventListener('online',()=>this.check());
  }
  /* after an automatic reload: drop the ?u= cache-buster from the address bar and forget the attempt if it worked */
  cleanUrl(){
    try{const u=new URL(location.href);if(u.searchParams.has('u')){u.searchParams.delete('u');history.replaceState(null,'',u.pathname+u.search+u.hash);}}catch(e){}
    try{const r=JSON.parse(sessionStorage.getItem('dbs-upd')||'null');if(r&&r.id===this.id)sessionStorage.removeItem('dbs-upd');}catch(e){}
  }
  /* true when a different build is online (and the notice has been started) */
  async check(force){
    if(!this.live||this.phase!=='idle')return false;
    const now=Date.now();if(!force&&now-this.lastCheck<20000)return false;this.lastCheck=now;
    let j;
    try{
      const r=await fetch(new URL('version.json',location.href).href+'?t='+now,{cache:'no-store'});
      if(!r.ok)return false;j=await r.json();
    }catch(e){return false;}
    const id=j&&typeof j.id==='string'?j.id:'';
    if(!/^[0-9a-f]{8,}$/.test(id)||id===this.id)return false;
    /* safety net: if two automatic reloads did not bring this build in (stale CDN copy), stop insisting until the player reloads by hand */
    try{const t=JSON.parse(sessionStorage.getItem('dbs-upd')||'null');if(t&&t.id===id&&t.n>=2)return false;}catch(e){}
    this.announce(id);return true;
  }
  inRun(){const a=this.app,g=a.game;return !!(g&&!g.ended&&['play','modal','pause'].includes(a.state));}
  announce(id){
    if(this.phase!=='idle')return;
    const a=this.app;this.phase='count';this.newId=id;this.until=Date.now()+this.secs*1000;
    this.num=h('div',{class:'unum'},String(this.secs));
    this.sec=h('div',{class:'usec'},a.t('updSecs'));
    this.bar=h('i');
    this.sub=h('div',{class:'usub'},a.t(this.inRun()?'updRun':'updMenu'));
    this.msg=h('div',{class:'umsg'});
    this.el=h('div',{id:'upd',role:'alert','aria-live':'assertive'},h('div',{class:'utitle'},a.t('updTitle')),h('div',{class:'urow'},this.num,this.sec),h('div',{class:'ubar'},this.bar),this.sub,this.msg);
    document.body.append(this.el);
    a.audio.sfx('warn');
    this.timer=setInterval(()=>this.update(),200);this.update();
  }
  update(){
    if(this.phase!=='count')return;
    const left=Math.max(0,this.until-Date.now()),s=Math.ceil(left/1000);
    this.num.textContent=String(s);this.bar.style.transform='scaleX('+(left/(this.secs*1000)).toFixed(3)+')';
    this.sub.textContent=this.app.t(this.inRun()?'updRun':'updMenu');
    if(s!==this.lastS){this.lastS=s;if(s>0&&s<=3)this.app.audio.sfx('warn');}
    if(left<=0)this.finish();
  }
  async flushCloud(){
    const c=this.app.cloud;if(!c||!c.signedIn)return;
    await Promise.race([c.flush(),updWait(3500)]);
  }
  async finish(){
    if(this.phase!=='count')return;
    this.phase='save';clearInterval(this.timer);
    const a=this.app;let coins=null;
    this.el.classList.add('done');this.msg.textContent=a.t('updSaving');
    try{const res=a.endRunForUpdate();if(res&&!res.sandbox)coins=res.total||0;}catch(e){console.error('update: could not end the run',e);}
    try{await this.flushCloud();}catch(e){}
    this.msg.textContent=coins>0?a.t('updSaved',{n:coins}):a.t('updSavedNone');
    this.el.classList.add('saved');
    await updWait(1700);
    this.msg.textContent=a.t('updReload');
    await updWait(500);
    this.reload();
  }
  reload(){
    try{const t=JSON.parse(sessionStorage.getItem('dbs-upd')||'null');sessionStorage.setItem('dbs-upd',JSON.stringify({id:this.newId,n:(t&&t.id===this.newId?t.n:0)+1}));}catch(e){}
    try{const u=new URL(location.href);u.searchParams.set('u',this.newId);u.hash='';location.replace(u.href);}catch(e){location.reload();}
  }
}
