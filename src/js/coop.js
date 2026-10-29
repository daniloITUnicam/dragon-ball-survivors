'use strict';
/* ====== v119: co-op lobby — client side (server: supabase/coop.sql). Rooms with a 4-letter code, room chat, friends, invites, "find a match".
   Everything is polled (the lobby every COOP_POLL s, presence + invites every COOP_BG s in the menus); phase 2 adds the shared run. ====== */
const COOP_POLL=1.5,COOP_BG=15,COOP_SIZES=[2,3,4],COOP_QUICK=[T6('Ciao!','Hi!','¡Hola!','Salut !','Hallo!','Oi!'),T6('Pronto!','Ready!','¡Listo!','Prêt !','Bereit!','Pronto!'),T6('Un attimo','One moment','Un momento','Un instant','Einen Moment','Um momento'),T6('Andiamo!','Let\'s go!','¡Vamos!','C\'est parti !','Los geht\'s!','Vamos!'),T6('Quale mappa?','Which map?','¿Qué mapa?','Quelle carte ?','Welche Karte?','Qual mapa?')];
Object.assign(Cloud.prototype,{
  async rpc(name,args){if(!this.enabled)throw new Error('offline');const t=this.uid?await this.token():null;return await this.req('/rest/v1/rpc/'+name,{method:'POST',token:t||undefined,body:args||{}});}
});
const COOP={
  app:null,code:null,st:null,after:0,msgs:[],busy:false,last:0,bgLast:0,invites:[],friends:[],searching:0,listeners:new Set(),err:'',
  on(f){this.listeners.add(f);return()=>this.listeners.delete(f);},
  emit(k){for(const f of this.listeners)try{f(k);}catch(e){}},
  ready(){const c=this.app&&this.app.cloud;return !!(c&&c.enabled&&c.uid&&c.nick);},
  rpc(n,a){return this.app.cloud.rpc(n,a);},
  /* ---- rooms ---- */
  async create(size,open){const c=await this.rpc('room_create',{p_size:size,p_open:open});this.enter(c);return c;},
  async join(code){code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(code.length!==4)return 'bad';const r=await this.rpc('room_join',{p_code:code});if(r==='ok')this.enter(code);return r;},
  async find(o){const c=await this.rpc('room_find',{p_size:o.size||0,p_mode:o.mode||null,p_stage:o.stage==null?null:o.stage,p_diff:o.diff||null});this.enter(c);return c;},
  enter(code){if(this.code!==code){this.code=code;this.st=null;this.after=0;this.msgs=[];}this.poll(true);},
  async leave(){const c=this.code;this.code=null;this.st=null;this.msgs=[];if(c)try{await this.rpc('room_leave',{});}catch(e){}this.emit('room');},
  set(o){if(!this.code)return;return this.rpc('room_set',{p_code:this.code,p_stage:o.stage==null?null:o.stage,p_mode:o.mode||null,p_diff:o.diff||null,p_size:o.size||null,p_open:o.open==null?null:o.open}).then(()=>this.poll(true));},
  me(o){return this.rpc('room_me',{p_ch:o.ch||null,p_ready:o.ready==null?null:o.ready}).then(()=>this.poll(true));},
  say(t){t=String(t||'').trim().slice(0,120);if(!t)return Promise.resolve();return this.rpc('room_say',{p_text:t}).then(()=>this.poll(true)).catch(()=>{});},
  start(){return this.rpc('room_start',{p_code:this.code}).then(r=>{this.poll(true);return r;});},
  invite(nick){return this.rpc('room_invite',{p_nick:nick});},
  /* ---- friends / invites / searching ---- */
  async loadFriends(){try{this.friends=await this.rpc('friend_list',{})||[];}catch(e){}this.emit('friends');return this.friends;},
  async addFriend(n){const r=await this.rpc('friend_request',{p_nick:n});this.loadFriends();return r;},
  async respond(n,yes){await this.rpc('friend_respond',{p_nick:n,p_accept:!!yes});return this.loadFriends();},
  async removeFriend(n){await this.rpc('friend_remove',{p_nick:n});return this.loadFriends();},
  async loadInvites(){try{const L=await this.rpc('invite_list',{})||[];const fresh=L.filter(i=>!this.invites.some(o=>o.nick===i.nick&&o.code===i.code));this.invites=L;if(fresh.length)this.emit('invite:'+fresh[0].nick+':'+fresh[0].code);this.emit('invites');}catch(e){}},
  async loadSearching(){try{this.searching=+(await this.rpc('coop_searching',{}))||0;}catch(e){}this.emit('searching');},
  board(o){return this.rpc('coop_board',{p_size:o.size,p_mode:o.mode,p_stage:o.stage,p_diff:o.diff});},
  /* ---- the lobby state ---- */
  async poll(now){
    if(!this.code||this.busy||!this.ready())return;if(!now&&performance.now()-this.last<COOP_POLL*1000)return;
    this.busy=true;this.last=performance.now();
    try{const s=await this.rpc('room_state',{p_code:this.code,p_after:this.after});
      if(!s||s.gone){const was=this.code;this.code=null;this.st=null;this.emit('gone:'+was);return;}
      for(const m of s.messages||[]){this.msgs.push(m);this.after=Math.max(this.after,m.id);}if(this.msgs.length>60)this.msgs.splice(0,this.msgs.length-60);
      const prev=this.st;this.st=s;this.err='';
      if(s.status!=='lobby'&&(!prev||prev.status==='lobby'))this.msgs=[];   /* the chat is cleared when the run starts */
      if((s.status==='starting'||s.status==='playing')&&s.seed&&COOPG.seed!==s.seed&&!COOPG.net){COOPG.seed=s.seed;COOPG.begin(this.app,s);}   /* v120: the run begins */
      this.emit('state');}
    catch(e){this.err=e.net?'net':String(e.message||e);this.emit('error');}
    finally{this.busy=false;}
  },
  /* called every frame by the app: the lobby poll, and presence + invites in the background (menus only) */
  tick(){if(!this.ready())return;const t=performance.now();
    if(this.code)this.poll();
    if(t-this.bgLast>COOP_BG*1000&&this.app.state==='menu'){this.bgLast=t;this.rpc('coop_touch',{}).catch(()=>{});this.loadInvites();}},
  link(code){try{if(/^https?:$/.test(location.protocol))return location.origin+location.pathname+'?room='+code;}catch(e){}return code;},
  /* ?room=ABCD in the address: join it once signed in */
  linkCode(){try{const q=new URLSearchParams(location.search).get('room');return q&&/^[A-Za-z0-9]{4}$/.test(q)?q.toUpperCase():null;}catch(e){return null;}}
};
