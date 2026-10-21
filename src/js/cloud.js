'use strict';
/* ====== Cloud account + save sync on Supabase (plain fetch, no library) ======
   - Auth: GoTrue REST (email/password, optional Google, password reset).
   - Data: one row per user in public.saves (PostgREST), protected by Row Level Security.
   - The local save always works (guest mode); when signed in, every change is uploaded after a short delay. */
const SESS_KEY='dbs-cloud-session',FAIL_KEY='dbs-auth-fails',OAUTH_KEY='dbs-oauth-wait';
const LOCK_AFTER=5,LOCK_WINDOW=5*60000,LOCK_FOR=60000;   /* 5 wrong passwords within 5 minutes: sign-in is paused for a minute (the server has its own limits too) */
class Cloud{
  constructor(sd,notify){
    this.sd=sd;this.notify=notify||(()=>{});this.cfg=CLOUD;this.enabled=!!CLOUD.on&&Cloud.urlOk(CLOUD.url);   /* never send a password or a token over plain http */
    this.sess=this.loadSess();this.status='idle';this.err='';this.dirty=false;this.timer=0;this.busy=false;
    this.lastSync=0;this.pending=null;this.recovery=false;this.ready=false;this.applying=false;
    this.prov=null;this.recoverEmail='';this.recoverAt=0;this.hashCode='';
    if(this.enabled){
      sd.onWrite=()=>this.touch();
      if(typeof document!=='undefined'){
        document.addEventListener('visibilitychange',()=>{if(document.hidden)this.flush(true);else if(this.sess&&Date.now()-this.lastSync>60000)this.sync();});
        addEventListener('pagehide',()=>this.flush(true));
        addEventListener('online',()=>{if(this.sess)this.sync();});
        /* another tab / the Google popup signed in, refreshed the token or signed out: follow it (v57) */
        addEventListener('storage',e=>{if(e.key===SESS_KEY)this.followTab(e.newValue);});
      }
    }
  }
  /* the project address must be https (plain http only for a server on this computer, for testing) */
  static urlOk(u){return /^https:\/\/[^\s/]+/i.test(u||'')||/^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/i.test(u||'');}
  /* a password that is too easy to guess: under 8 characters, one repeated character, the e-mail address or a very common one */
  static weakPw(pw,email){
    pw=String(pw||'');const l=pw.toLowerCase();
    return pw.length<8||/^(.)\1+$/.test(pw)||(!!email&&(l===String(email).toLowerCase()||l===String(email).split('@')[0].toLowerCase()))||/^(password|passw0rd|12345678|123456789|1234567890|qwertyui|qwerty123|dragonball|dragonballz|gokugoku|iloveyou|11111111|00000000)$/.test(l);
  }
  /* wrong-password counter kept in this browser: it survives a page reload */
  fails(){try{return(safeJSON(localStorage.getItem(FAIL_KEY)||'[]')||[]).filter(t=>typeof t==='number'&&Date.now()-t<LOCK_WINDOW);}catch(e){return[];}}
  lockLeft(){const f=this.fails();if(f.length<LOCK_AFTER)return 0;const left=f[f.length-1]+LOCK_FOR-Date.now();return left>0?Math.ceil(left/1000):0;}
  noteFail(){try{const f=this.fails();f.push(Date.now());localStorage.setItem(FAIL_KEY,JSON.stringify(f.slice(-20)));}catch(e){}}
  clearFails(){try{localStorage.removeItem(FAIL_KEY);}catch(e){}}
  get signedIn(){return !!(this.enabled&&this.sess);}
  /* Google button: shown when the provider is enabled in the Supabase project (read from /auth/v1/settings); SUPABASE_GOOGLE=1 only decides while that is unknown */
  /* "Forgot password?" by e-mail: only when the project sends e-mails (SMTP + template, docs/SUPABASE.md) and the build says so (SUPABASE_RESET=1) */
  get resetOn(){return !!this.enabled&&!!this.cfg.reset;}
  get googleOn(){return !!this.enabled&&(this.prov?!!this.prov.google:!!this.cfg.google);}
  async loadSettings(){
    try{const j=await this.req('/auth/v1/settings'),ex=(j&&j.external)||{};this.prov={google:!!ex.google,autoconfirm:!!(j&&j.mailer_autoconfirm),signup:!(j&&j.disable_signup)};this.notify({type:'prov'});}
    catch(e){}
  }
  followTab(raw){
    let o=null;try{o=raw?safeJSON(raw):null;}catch(e){}
    if(o&&(typeof o.access_token!=='string'||typeof o.refresh_token!=='string'))o=null;   /* anything that is not a session is ignored */
    if(!o){if(this.sess){this.sess=null;this.pending=null;this.ready=false;this.dirty=false;this.setStatus('idle');this.notify({type:'auth'});}return;}
    const had=!!this.sess&&this.sess.user&&o.user&&this.sess.user.id===o.user.id;
    this.sess=o;
    if(had)return;   /* same account: just a fresher token */
    this.ready=false;this.afterAuth();}
  get email(){return this.sess&&this.sess.user?this.sess.user.email||'':'';}
  get uid(){return this.sess&&this.sess.user?this.sess.user.id:'';}
  setStatus(s,err){this.status=s;this.err=err||'';this.notify({type:'status'});}
  /* ---------- session storage ---------- */
  loadSess(){try{const r=localStorage.getItem(SESS_KEY),o=r?safeJSON(r):null;return o&&typeof o.access_token==='string'&&typeof o.refresh_token==='string'?o:null;}catch(e){return null;}}
  saveSess(){try{if(this.sess)localStorage.setItem(SESS_KEY,JSON.stringify(this.sess));else localStorage.removeItem(SESS_KEY);}catch(e){}}
  setSession(o,user){
    if(!o||typeof o.access_token!=='string'||typeof o.refresh_token!=='string')throw new Error('invalid session');   /* never store anything that is not a session */
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
    let j=null;try{const t=await r.text();j=t?safeJSON(t):null;}catch(e){}
    if(!r.ok){const m=(j&&(j.msg||j.error_description||j.message||j.error))||('HTTP '+r.status);const x=new Error(m);x.status=r.status;x.code=j&&(j.error_code||j.code);throw x;}
    return j;
  }
  /* where Supabase sends the person after an e-mail link / Google: this page. Opaque origins (file:, sandboxed frames) cannot be a redirect target: then Supabase uses the Site URL of the project */
  redirect(){try{return /^https?:$/.test(location.protocol)&&location.origin&&location.origin!=='null'?location.origin+location.pathname:'';}catch(e){return '';}}
  rq(){const r=this.redirect();return r?'?redirect_to='+encodeURIComponent(r):'';}
  /* ---------- auth ---------- */
  async signUp(email,pw){
    const j=await this.req('/auth/v1/signup'+this.rq(),{method:'POST',body:{email,password:pw}});
    if(j&&j.access_token){this.setSession(j);this.afterAuth();return{session:true};}
    return{confirm:true};
  }
  async signIn(email,pw){
    const w=this.lockLeft();if(w>0){const x=new Error('locked');x.locked=true;x.wait=w;throw x;}
    let j;
    try{j=await this.req('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password:pw}});}
    catch(e){if(!e.net&&(e.status===400||e.status===401||/invalid/i.test(String(e.code)+e.message)))this.noteFail();throw e;}
    this.clearFails();this.setSession(j);this.afterAuth();return{session:true};
  }
  /* password reset, step 1: Supabase e-mails a link AND (when the "Reset Password" template contains {{ .Token }}, see docs/SUPABASE.md) a one-time code */
  async recover(email){await this.req('/auth/v1/recover'+this.rq(),{method:'POST',body:{email}});this.recoverEmail=email;this.recoverAt=Date.now();}
  async updatePassword(pw){const t=await this.token();await this.req('/auth/v1/user',{method:'PUT',token:t,body:{password:pw}});}
  /* step 2 with the code from the e-mail (no redirect involved, so it cannot land on a wrong address and a mail scanner opening the link cannot use it up) */
  async resetWithCode(email,code,pw){
    const j=await this.req('/auth/v1/verify',{method:'POST',body:{type:'recovery',email,token:String(code||'').replace(/\s+/g,'')}});
    this.setSession(j);this.recovery=true;
    await this.req('/auth/v1/user',{method:'PUT',token:j.access_token,body:{password:pw}});   /* if this fails the "choose a new password" form stays open */
    this.recovery=false;this.afterAuth();
  }
  /* Google: in a normal page the whole tab goes to Google and comes back with the session in the address (see start()); inside a frame (embedded / preview) Google refuses to open, so a popup is used
     and the page of the popup hands the session over through localStorage (followTab) */
  googleUrl(){return this.cfg.url+'/auth/v1/authorize?provider=google'+(this.redirect()?'&redirect_to='+encodeURIComponent(this.redirect()):'');}
  google(){
    const u=this.googleUrl();
    let framed=false;try{framed=window.top!==window.self;}catch(e){framed=true;}
    try{localStorage.setItem(OAUTH_KEY,String(Date.now()));}catch(e){}   /* "this device started a Google sign-in": a session handed over in the address without this is refused (see start) */
    if(framed){
      let w=null;try{w=window.open(u,'dbs-google','width=520,height=680');}catch(e){}
      if(w)return true;
    }
    location.href=u;return true;
  }
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
    this.loadSettings();
    const hs=typeof location!=='undefined'?location.hash:'';
    if(hs&&hs.length>1){
      const q=new URLSearchParams(hs.slice(1));
      if(q.get('error_description')||q.get('error')){this.hashErr=(q.get('error_description')||q.get('error')).replace(/\+/g,' ').slice(0,200);   /* text from the address bar: shown as plain text, short */
        this.hashCode=q.get('error_code')||q.get('error')||'';this.cleanHash();this.notify({type:'hashError'});}
      else if(q.get('access_token')){
        const tok=q.get('access_token'),type=q.get('type');
        /* a Google return carries no "type". Somebody could send you a link holding THEIR session so that your progress ends up in their account: it is only accepted when this device has just started a Google sign-in */
        if(!type&&!this.oauthWaiting()){this.hashErr='Sign-in not started here';this.hashCode='oauth_state';this.cleanHash();this.notify({type:'hashError'});if(this.sess){this.notify({type:'auth'});await this.sync();}return;}
        try{
          const u=await this.req('/auth/v1/user',{token:tok});
          this.setSession({access_token:tok,refresh_token:q.get('refresh_token'),expires_in:+q.get('expires_in')||3600,expires_at:+q.get('expires_at')||0},u);
          if(type==='recovery'){this.recovery=true;this.notify({type:'recovery'});}
          else if(this.popupHandover())return;   /* this was the Google popup: the page that opened it takes over */
          if(!type)try{localStorage.removeItem(OAUTH_KEY);}catch(e){}
        }catch(e){this.hashErr=e.message;this.hashCode='';this.notify({type:'hashError'});}
        this.cleanHash();
      }
    }
    if(this.sess){this.notify({type:'auth'});await this.sync();}
  }
  oauthWaiting(){try{const w=+localStorage.getItem(OAUTH_KEY)||0;return !!w&&Date.now()-w<15*60000;}catch(e){return false;}}
  popupHandover(){
    try{
      const w=+localStorage.getItem(OAUTH_KEY)||0;
      if(window.opener&&w&&Date.now()-w<15*60000){localStorage.removeItem(OAUTH_KEY);this.cleanHash();window.close();return true;}
    }catch(e){}
    return false;
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
    if(!rd||typeof rd!=='object'||Array.isArray(rd)||JSON.stringify(rd).length>400000)throw new Error('invalid save');   /* a cloud save must be an object of reasonable size */
    const sd=this.sd,keepSet=sd.d.settings,keepBinds=sd.d.binds;
    const nd=sd.normalize(rd);nd.settings=keepSet;nd.binds=keepBinds;nd.cloud={uid:this.uid};nd.updated=rd.updated||Date.now();
    nd.patchSeen=Cloud.newerPatch(sd.d.patchSeen,nd.patchSeen);   /* the patch notes read on this device stay read after the cloud save is applied */
    sd.d=nd;this.silentWrite();this.notify({type:'applied'});
  }
  /* the more recent of two patch-note ids (PATCHES[0] is the newest; unknown / empty ids count as the oldest) */
  static newerPatch(a,b){
    const rank=id=>{const i=typeof PATCHES!=='undefined'?PATCHES.findIndex(p=>p.id===id):-1;return i<0?1e9:i;};
    return rank(a)<=rank(b)?(a||b||''):(b||a||'');
  }
  /* the account remembers the patch notes you read: updates only that field of the cloud row (progress and its timestamp stay untouched) */
  async pushSeen(id){
    if(!this.signedIn||this.busy||this.pending||!this.ready)return;
    try{
      const t=await this.token(),r=await this.fetchRemote();if(!r||!r.data)return;
      const nid=Cloud.newerPatch(r.data.patchSeen,id);if(nid===r.data.patchSeen)return;
      r.data.patchSeen=nid;
      await this.req('/rest/v1/saves?on_conflict=user_id',{method:'POST',token:t,headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
        body:[{user_id:this.uid,data:r.data,updated_at:r.updated_at}]});
    }catch(e){}
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
