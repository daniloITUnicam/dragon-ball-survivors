'use strict';
/* ====== v115: online — nicknames, scores, leaderboards (stage + difficulty, by time / kills / damage),
   the weekly challenge (same stage, character, difficulty and random seed for everybody) and the shareable end-of-run card.
   Server side: supabase/online.sql (tables profiles + scores, RPC leaderboard). ====== */
const NICK_RE=/^[A-Za-z0-9_ .-]{3,16}$/,BOARD_METRICS=['t','kills','dmg'],WEEK_DIFFS=['normal','normal','hard'];
const Online={
  /* ISO-8601 week, UTC: "2026-W44" */
  weekId(d){d=d?new Date(d):new Date();const t=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())),wd=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-wd);
    const y=t.getUTCFullYear(),w=Math.ceil(((t-Date.UTC(y,0,1))/864e5+1)/7);return y+'-W'+String(w).padStart(2,'0');},
  weekLeft(d){d=d?new Date(d):new Date();const wd=d.getUTCDay()||7,n=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+8-wd);return Math.max(0,n-d.getTime());},
  hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;},
  rng(a){a>>>=0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};},
  weekly(id){id=id||this.weekId();const r=this.rng(this.hash('dbs-weekly-'+id));
    return{id,stage:Math.floor(r()*STAGES.length),char:CHARS[Math.floor(r()*CHARS.length)].id,diff:WEEK_DIFFS[Math.floor(r()*WEEK_DIFFS.length)],seed:(Math.floor(r()*2147483646)|0)+1};},
  /* the weekly run draws every random number from the week's seed (map layout, offers, drops) */
  seed(s){if(!this._mr)this._mr=Math.random;Math.random=this.rng(s);},
  unseed(){if(this._mr){Math.random=this._mr;this._mr=null;}},
  build(g){return{w:[...g.weapons.values()].map(w=>[w.id,w.lv,w.evo|0,w.fz?1:0]),tr:g.trinkets.slice(0,16).map(id=>[id,g.tRar[id]|0]),f:g.formsUnlocked|0,p:g.pacts||[],m:g.mastLv|0};},
  /* one row of public.scores; null when the run does not go on a board (Test mode, Endless) */
  row(g,res){
    if(!g||!res||res.sandbox||g.sandbox||g.endless)return null;
    let dmg=0;for(const k in g.dmgBy)dmg+=g.dmgBy[k]||0;
    return{stage:g.stageIdx,diff:g.diffId,ch:g.C.id,x2:!!g.x2,win:!!res.win,t:Math.round(g.t*10)/10,kills:g.kills|0,dmg:Math.round(dmg),lvl:Math.max(1,g.lvl|0),pacts:(g.pacts||[]).length,week:g.week||null,build:this.build(g)};
  },
  fmt(metric,r){return metric==='kills'?String(r.kills):metric==='dmg'?this.big(r.dmg):fmtT(r.t);},
  big(n){n=+n||0;return n>=1e9?(n/1e9).toFixed(2)+'B':n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e4?(n/1e3).toFixed(1)+'K':String(Math.round(n));},
  /* ---------- the shareable card: 1200×630 PNG (Discord embeds it at full width) ---------- */
  card(g,res,tr){
    const W=1200,H=630,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
    const st=STAGES[g.stageIdx],C=g.C,F=(s,w)=>(w||700)+' '+s+'px "Rajdhani","Segoe UI",sans-serif',J=(s)=>'900 '+s+'px "Noto Sans JP","Hiragino Sans",sans-serif';
    const bg=x.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#141a3a');bg.addColorStop(.55,'#2a1440');bg.addColorStop(1,'#3a1a10');x.fillStyle=bg;x.fillRect(0,0,W,H);
    x.globalAlpha=.08;x.fillStyle='#ffd23f';for(let i=0;i<14;i++){x.beginPath();x.moveTo(300,330);x.arc(300,330,900,i*Math.PI/7,i*Math.PI/7+Math.PI/14);x.fill();}x.globalAlpha=1;
    const tx=(s,X,Y,col,font,al)=>{x.font=font;x.textAlign=al||'left';x.lineWidth=5;x.strokeStyle='rgba(0,0,0,.7)';x.strokeText(s,X,Y);x.fillStyle=col;x.fillText(s,X,Y);};
    /* the character (its mastery colours too) */
    try{const sp=Sprites.player(g.pcKey,g.pc,0,false,null),k=Math.min(430/sp.c.height,300/sp.c.width)*(sp.px?1:1);x.imageSmoothingEnabled=!sp.px;
      const gl=x.createRadialGradient(300,360,20,300,360,260);gl.addColorStop(0,(g.formColor||'#ffd23f')+'66');gl.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gl;x.fillRect(40,100,520,520);
      x.drawImage(Mastery.skinned(sp.c,g.skin),300-sp.c.width*k/2,585-sp.c.height*k,sp.c.width*k,sp.c.height*k);}catch(e){}
    tx('DRAGON BALL SURVIVORS',40,62,'#ffd23f',F(40,800));
    tx(tr(C.n)+(g.mastLv>=MAST_TITLE_LV?'  « '+tr(Mastery.title(C.id))+' »':''),40,108,'#fff',F(30));
    const R=600;tx((res.win?'✓ ':'✗ ')+tr(st.n),R,62,res.win?'#8be07a':'#ff8a8a',F(36,800));
    tx(tr(DIFF[g.diffId].n)+(g.x2?' · x2':'')+(g.week?' · '+tr(T6('Sfida','Challenge','Desafío','Défi','Herausforderung','Desafio'))+' '+g.week:'')+((g.pacts||[]).length?' · ☠'+g.pacts.length:''),R,100,'#cfd8ff',F(24,600));
    let dmg=0;for(const k in g.dmgBy)dmg+=g.dmgBy[k]||0;
    const stats=[[tr(T6('Tempo','Time','Tiempo','Temps','Zeit','Tempo')),fmtT(g.t)],[tr(T6('Uccisioni','Kills','Bajas','Éliminations','Kills','Abates')),String(g.kills)],[tr(T6('Danni','Damage','Daño','Dégâts','Schaden','Dano')),this.big(dmg)],[tr(T6('Livello','Level','Nivel','Niveau','Level','Nível')),String(g.lvl)]];
    stats.forEach(([a,b],i)=>{const X=R+i*148;x.fillStyle='rgba(0,0,0,.35)';x.fillRect(X,124,138,76);tx(b,X+69,166,'#ffd23f',F(34,800),'center');tx(a,X+69,190,'#cfd8ff',F(16,600),'center');});
    tx(tr(T6('Armi','Weapons','Armas','Armes','Waffen','Armas')),R,236,'#fff',F(22));
    [...g.weapons.values()].slice(0,8).forEach((w,i)=>{const X=R+(i%4)*148,Y=250+Math.floor(i/4)*86;x.fillStyle='rgba(0,0,0,.4)';x.fillRect(X,Y,138,76);x.strokeStyle=w.fz?(FUSIONS.find(f=>f.id===w.fz)||{}).c||'#fff':w.evo?'#ffd23f':'rgba(255,255,255,.25)';x.lineWidth=2;x.strokeRect(X,Y,138,76);
      tx(w.def.k,X+30,Y+50,w.def.c,J(34),'center');{const fz=w.fz&&FUSIONS.find(f=>f.id===w.fz);let nm=tr(fz?fz.n:w.evo?w.evoName:w.def.n),fs=15;x.font=F(fs,700);while(x.measureText(nm).width>78&&fs>11){fs-=1;x.font=F(fs,700);}while(x.measureText(nm).width>78&&nm.length>4)nm=nm.slice(0,-2)+'…';tx(nm,X+56,Y+30,fz?fz.c:'#fff',F(fs,700));}tx('Lv '+w.lv+(w.evo?' '+'★'.repeat(w.evo):'')+(w.fz?' ✦':''),X+56,Y+54,'#ffd23f',F(15,700));});
    const ty=g.weapons.size>4?440:356;tx(tr(T6('Cimeli','Trinkets','Reliquias','Reliques','Relikte','Relíquias')),R,ty,'#fff',F(22));
    g.trinkets.slice(0,12).forEach((id,i)=>{const t=TRINKETS.find(q=>q.id===id);if(!t)return;const r=g.tRar[id]|0,X=R+(i%6)*98,Y=ty+12+Math.floor(i/6)*58;
      x.fillStyle='rgba(0,0,0,.4)';x.fillRect(X,Y,90,50);x.strokeStyle=RARITY[r].c;x.lineWidth=2;x.strokeRect(X,Y,90,50);tx(t.k,X+45,Y+36,RARITY[r].c,J(26),'center');});
    if(g.trinkets.length>12)tx('+'+(g.trinkets.length-12),R+590,ty,'#cfd8ff',F(20),'right');
    tx(new Date().toISOString().slice(0,10),W-20,H-18,'rgba(255,255,255,.5)',F(16,600),'right');
    return c;
  },
  /* download the card, and copy it to the clipboard where the browser allows it */
  async share(c,name){
    const blob=await new Promise(r=>c.toBlob(r,'image/png'));let copied=false;
    try{if(navigator.clipboard&&window.ClipboardItem){await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);copied=true;}}catch(e){}
    try{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name||'dbs-run.png';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000);}catch(e){}
    return copied;
  }
};
/* ---------- Cloud: nickname, scores, leaderboard ---------- */
Object.assign(Cloud.prototype,{
  async loadNick(){if(!this.enabled||!this.uid)return '';try{const t=await this.token(),j=await this.req('/rest/v1/profiles?select=nick&user_id=eq.'+encodeURIComponent(this.uid),{token:t});this.nick=j&&j[0]?j[0].nick:'';}catch(e){}this.notify({type:'nick'});return this.nick||'';},
  /* returns '' when saved, otherwise an error key: bad | taken | net */
  async setNick(n){n=String(n||'').trim();if(!NICK_RE.test(n))return 'bad';if(!this.uid)return 'net';
    try{const t=await this.token();await this.req('/rest/v1/profiles?on_conflict=user_id',{method:'POST',token:t,headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:[{user_id:this.uid,nick:n,updated_at:new Date().toISOString()}]});this.nick=n;this.notify({type:'nick'});return '';}
    catch(e){return e.status===409||e.code==='23505'?'taken':e.net?'net':'bad';}},
  async submitScore(row){if(!row||!this.enabled||!this.uid||!this.nick)return false;const t=await this.token();
    await this.req('/rest/v1/scores',{method:'POST',token:t,headers:{Prefer:'return=minimal'},body:[Object.assign({user_id:this.uid},row)]});return true;},
  async board(stage,diff,metric,week){if(!this.enabled)throw new Error('offline');let t=null;if(this.uid)try{t=await this.token();}catch(e){}
    return await this.req('/rest/v1/rpc/leaderboard',{method:'POST',token:t||undefined,body:{p_stage:stage,p_diff:diff,p_metric:BOARD_METRICS.includes(metric)?metric:'t',p_week:week||null,p_limit:50}})||[];}
});
{const aa=Cloud.prototype.afterAuth;Cloud.prototype.afterAuth=function(){aa.call(this);this.loadNick();};}
{const st=Cloud.prototype.start;Cloud.prototype.start=async function(){await st.call(this);if(this.sess)this.loadNick();};}
