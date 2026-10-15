'use strict';
/* ====== Cloud account + save sync on Supabase (plain fetch, no library) ======
   - Auth: GoTrue REST (email/password, optional Google, password reset).
   - Data: one row per user in public.saves (PostgREST), protected by Row Level Security.
   - The local save always works (guest mode); when signed in, every change is uploaded after a short delay. */
const SESS_KEY='dbs-cloud-session';
class Cloud{
  constructor(sd,notify){
    this.sd=sd;this.notify=notify||(()=>{});this.cfg=CLOUD;this.enabled=!!CLOUD.on;
    this.sess=this.loadSess();this.status='idle';this.err='';this.dirty=false;this.timer=0;this.busy=false;
    this.lastSync=0;this.pending=null;this.recovery=false;this.ready=false;this.applying=false;
    if(this.enabled){
      sd.onWrite=()=>this.touch();
      if(typeof document!=='undefined'){
        document.addEventListener('visibilitychange',()=>{if(document.hidden)this.flush(true);else if(this.sess&&Date.now()-this.lastSync>60000)this.sync();});
        addEventListener('pagehide',()=>this.flush(true));
        addEventListener('online',()=>{if(this.sess)this.sync();});
      }
    }
  }
  get signedIn(){return !!(this.enabled&&this.sess);}
  get email(){return this.sess&&this.sess.user?this.sess.user.email||'':'';}
  get uid(){return this.sess&&this.sess.user?this.sess.user.id:'';}
  setStatus(s,err){this.status=s;this.err=err||'';this.notify({type:'status'});}
  /* ---------- session storage ---------- */
  loadSess(){try{const r=localStorage.getItem(SESS_KEY);return r?JSON.parse(r):null;}catch(e){return null;}}
  saveSess(){try{if(this.sess)localStorage.setItem(SESS_KEY,JSON.stringify(this.sess));else localStorage.removeItem(SESS_KEY);}catch(e){}}
  setSession(o,user){
    const exp=o.expires_at?o.expires_at*1000:Date.now()+(o.expires_in||3600)*1000;
    this.sess={access_token:o.access_token,refresh_token:o.refresh_token,expires_at:exp,user:user||o.user||(this.sess&&this.sess.user)||null};
    this.saveSess();
  }
  /* ---------- HTTP ---------- */
  async req(path,o){
    o=o||{};const h={'apikey':this.cfg.key,'Content-Type':'application/json'};
    if(o.token)h.Authorization='Bearer '+o.token;else h.Authorization='Bearer '+this.cfg.key;
    if(o.headers)Object.assign(h,o.headers);
    let r;
    try{r=await fetch(this.cfg.url+path,{method:o.method||'GET',headers:h,body:o.body!==undefined?JSON.stringify(o.body):undefined,keepalive:!!o.keepalive});}
    catch(e){const x=new Error('network');x.net=true;throw x;}
    let j=null;try{const t=await r.text();j=t?JSON.parse(t):null;}catch(e){}
    if(!r.ok){const m=(j&&(j.msg||j.error_description||j.message||j.error))||('HTTP '+r.status);const x=new Error(m);x.status=r.status;x.code=j&&(j.error_code||j.code);throw x;}
    return j;
  }
  redirect(){return location.origin+location.pathname;}
  /* ---------- auth ---------- */
  async signUp(email,pw){
    const j=await this.req('/auth/v1/signup?redirect_to='+encodeURIComponent(this.redirect()),{method:'POST',body:{email,password:pw}});
    if(j&&j.access_token){this.setSession(j);this.afterAuth();return{session:true};}
    return{confirm:true};
  }
  async signIn(email,pw){
    const j=await this.req('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password:pw}});
    this.setSession(j);this.afterAuth();return{session:true};
  }
  async recover(email){await this.req('/auth/v1/recover?redirect_to='+encodeURIComponent(this.redirect()),{method:'POST',body:{email}});}
  async updatePassword(pw){const t=await this.token();await this.req('/auth/v1/user',{method:'PUT',token:t,body:{password:pw}});}
  google(){location.href=this.cfg.url+'/auth/v1/authorize?provider=google&redirect_to='+encodeURIComponent(this.redirect());}
  async signOut(){
    try{if(this.dirty&&this.ready&&!this.pending)await this.flush();}catch(e){}   /* upload pending changes first */
    clearTimeout(this.timer);
    const t=this.sess&&this.sess.access_token,safe=!this.dirty&&!this.pending&&this.ready;
    if(t){try{await this.req('/auth/v1/logout',{method:'POST',token:t});}catch(e){}}
    /* everything is in the cloud: clear this device so the next person starts fresh (settings are kept) */
    if(safe){const sd=this.sd,keep={settings:sd.d.settings,binds:sd.d.binds},nd=sd.defaults();nd.settings=keep.settings;nd.binds=keep.binds;sd.d=nd;this.silentWrite();this.notify({type:'applied'});}
    this.sess=null;this.saveSess();this.pending=null;this.ready=false;this.dirty=false;this.lastSync=0;this.setStatus('idle');this.notify({type:'auth'});
  }
  afterAuth(){this.notify({type:'auth'});this.sync();}
  async token(){
    const s=this.sess;if(!s)throw new Error('signed-out');
    if(s.expires_at-Date.now()>60000)return s.access_token;
    try{
      const j=await this.req('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:s.refresh_token}});
      this.setSession(j,s.user);return this.sess.access_token;
    }catch(e){
      if(e.net)throw e;
      this.sess=null;this.saveSess();this.setStatus('idle');this.notify({type:'auth'});throw e;
    }
  }
  /* called once at start: handles the redirect from Google / e-mail links, then syncs */
  async start(){
    if(!this.enabled)return;
    const hs=typeof location!=='undefined'?location.hash:'';
    if(hs&&hs.length>1){
      const q=new URLSearchParams(hs.slice(1));
      if(q.get('error_description')||q.get('error')){this.hashErr=(q.get('error_description')||q.get('error')).replace(/\+/g,' ');this.cleanHash();this.notify({type:'hashError'});}
      else if(q.get('access_token')){
        const tok=q.get('access_token'),type=q.get('type');
        try{
          const u=await this.req('/auth/v1/user',{token:tok});
          this.setSession({access_token:tok,refresh_token:q.get('refresh_token'),expires_in:+q.get('expires_in')||3600,expires_at:+q.get('expires_at')||0},u);
          if(type==='recovery'){this.recovery=true;this.notify({type:'recovery'});}
        }catch(e){this.hashErr=e.message;this.notify({type:'hashError'});}
        this.cleanHash();
      }
    }
    if(this.sess){this.notify({type:'auth'});await this.sync();}
  }
  cleanHash(){try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}}
  /* ---------- sync ---------- */
  payload(){const d=this.sd.d,o={};for(const k in d)if(k!=='settings'&&k!=='binds'&&k!=='cloud')o[k]=d[k];return o;}
  static hasProgress(d){
    return !!d&&((d.stats&&d.stats.runs>0)||(d.unlocked&&d.unlocked.length>4)||Object.keys(d.shop||{}).length>0||Object.keys(d.ach||{}).length>0||d.zenny>0);
  }
  static summary(d){
    const s=d.stats||{};return{runs:s.runs||0,zenny:d.zenny||0,unlocked:(d.unlocked||[]).length,ach:Object.keys(d.ach||{}).length};
  }
  async fetchRemote(){
    const t=await this.token();
    const j=await this.req('/rest/v1/saves?select=data,updated_at&user_id=eq.'+encodeURIComponent(this.uid),{token:t});
    return j&&j[0]?j[0]:null;
  }
  async push(keep){
    const t=await this.token(),d=this.sd.d;
    await this.req('/rest/v1/saves?on_conflict=user_id',{method:'POST',token:t,keepalive:!!keep,
      headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
      body:[{user_id:this.uid,data:this.payload(),updated_at:new Date(d.updated||Date.now()).toISOString()}]});
    d.cloud={uid:this.uid};this.silentWrite();
  }
  silentWrite(){this.sd.silent=true;try{this.sd.write();}finally{this.sd.silent=false;}}
  apply(rd){
    const sd=this.sd,keepSet=sd.d.settings,keepBinds=sd.d.binds;
    const nd=sd.normalize(rd);nd.settings=keepSet;nd.binds=keepBinds;nd.cloud={uid:this.uid};nd.updated=rd.updated||Date.now();
    sd.d=nd;this.silentWrite();this.notify({type:'applied'});
  }
  /* reconcile local save and cloud save (login / start / tab focus) */
  async sync(){
    if(!this.signedIn||this.busy||(this.isPlaying&&this.isPlaying()))return;
    this.busy=true;this.setStatus('syncing');
    try{
      const remote=await this.fetchRemote(),local=this.sd.d;
      const rd=remote?remote.data:null,ru=rd?(rd.updated||Date.parse(remote.updated_at)||0):0,lu=local.updated||0;
      const linked=local.cloud&&local.cloud.uid===this.uid;
      if(!rd){await this.push();this.done();}
      else if(linked){
        if(ru>lu)this.apply(rd);else if(lu>ru)await this.push();
        this.done();
      }else if(!Cloud.hasProgress(local)){this.apply(rd);this.done();}
      else if(!Cloud.hasProgress(rd)){await this.push();this.done();}
      else{this.pending={local:Cloud.summary(local),remote:Cloud.summary(rd),rd};this.setStatus('conflict');this.notify({type:'conflict'});}
    }catch(e){this.fail(e);}
    this.busy=false;
    if(this.dirty&&this.status==='ok')this.touch();
  }
  done(){this.pending=null;this.ready=true;this.lastSync=Date.now();this.dirty=false;this.setStatus('ok');}
  fail(e){
    if(e&&e.net){this.setStatus('offline');clearTimeout(this.timer);this.timer=setTimeout(()=>this.sync(),30000);}
    else if(!this.sess)return;
    else this.setStatus('error',e&&e.message);
  }
  async resolve(choice){
    const p=this.pending;if(!p)return;
    this.busy=true;this.setStatus('syncing');
    try{
      if(choice==='cloud')this.apply(p.rd);else await this.push();
      this.done();
    }catch(e){this.fail(e);}
    this.busy=false;
  }
  /* local change -> upload after a short delay */
  touch(){
    if(!this.signedIn||this.applying)return;
    this.dirty=true;if(!this.ready||this.pending)return;
    clearTimeout(this.timer);this.timer=setTimeout(()=>this.flush(),4000);
  }
  async flush(keep){
    if(!this.signedIn||!this.dirty||!this.ready||this.pending||this.busy)return;
    clearTimeout(this.timer);this.busy=true;if(!keep)this.setStatus('syncing');
    try{await this.push(keep);this.dirty=false;this.lastSync=Date.now();if(!keep)this.setStatus('ok');}
    catch(e){if(!keep)this.fail(e);}
    this.busy=false;
  }
}
