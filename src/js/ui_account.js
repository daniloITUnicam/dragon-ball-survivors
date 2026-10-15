'use strict';
/* ====== Account screens: login / sign up / password reset, account status, save-conflict chooser ====== */
Object.assign(UI.prototype,{
  /* map a Supabase/network error to a localized message */
  cloudErrText(e){
    const m=String((e&&e.message)||''),code=String((e&&e.code)||'');
    if(e&&e.net)return this.t('clErrNet');
    if(/invalid login|invalid_credentials/i.test(m+code))return this.t('clErrCreds');
    if(/not confirmed|email_not_confirmed/i.test(m+code))return this.t('clErrConfirm');
    if(/already|exists/i.test(m+code))return this.t('clErrExists');
    if(/at least|weak|short|password/i.test(m)&&/6|weak|short|character/i.test(m))return this.t('clErrWeak');
    if(/rate|too many|over_.*limit/i.test(m+code)||(e&&e.status===429))return this.t('clErrRate');
    if(/valid email|invalid.*email|email_address/i.test(m+code))return this.t('clErrEmail');
    return this.t('clErrGeneric',{m});
  },
  cloudStatusText(){
    const c=this.app.cloud,s=c.status;
    const k={ok:'clStOk',syncing:'clStSync',offline:'clStOff',conflict:'clStConf',error:'clStErr',idle:'clStIdle'}[s]||'clStIdle';
    return this.t(k);
  },
  cloudIcon(){
    const s=this.app.cloud.status;
    return s==='ok'?'✓':s==='syncing'?'↻':s==='offline'?'⚠':s==='conflict'?'❗':s==='error'?'⚠':'…';
  },
  /* small "☁" button for the main menu */
  cloudMenuBtn(){
    const c=this.app.cloud;if(!c||!c.enabled)return null;
    const em=c.email.length>22?c.email.slice(0,20)+'…':c.email;
    return h('button',{class:'btn alt cloudbtn'+(c.signedIn?' on':''),'data-fid':'mcloud',onclick:()=>{this.sfx();this.push('account');}},
      '☁ '+(c.signedIn?em+' '+this.cloudIcon():this.t('clLoginCta')));
  },
  screen_account(){
    const c=this.app.cloud,st=this.acct||(this.acct={tab:'login',email:'',pw:'',pw2:'',msg:null,busy:false});
    const say=(k,text)=>{st.msg=text?{k,text}:null;st.busy=false;if(this.top&&this.top.name==='account')this.rebuild(true);};
    const field=(id,type,label,key,ac)=>h('label',{class:'afield'},h('span',null,label),
      h('input',{type,'data-fid':id,autocomplete:ac,value:st[key]||'',autocapitalize:'off',spellcheck:'false',
        oninput:e=>{st[key]=e.target.value;},
        onkeydown:e=>{if(e.key==='Enter'){e.preventDefault();go();}}}));
    const msg=st.msg?h('div',{class:'amsg '+st.msg.k,role:'status'},st.msg.text):null;
    const validEmail=()=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((st.email||'').trim());
    let go=()=>{};
    /* ----- password reset (opened from the e-mail link) ----- */
    if(c.recovery&&c.signedIn){
      go=async()=>{
        if(st.busy)return;
        if((st.pw||'').length<6)return say('err',this.t('clErrWeak'));
        if(st.pw!==st.pw2)return say('err',this.t('clErrMatch'));
        st.busy=true;this.rebuild(true);
        try{await c.updatePassword(st.pw);c.recovery=false;st.pw=st.pw2='';say('ok',this.t('clOkPass'));}
        catch(e){say('err',this.cloudErrText(e));}
      };
      return h('div',{class:'acct'},this.header('clAccount'),
        h('h3',null,this.t('clNewPass')),
        field('apw','password',this.t('clPass'),'pw','new-password'),field('apw2','password',this.t('clPass2'),'pw2','new-password'),msg,
        h('div',{class:'row'},h('button',{class:'btn primary',disabled:st.busy,'data-fid':'asubmit',onclick:()=>{this.sfx();go();}},this.t('clSave'))));
    }
    /* ----- signed in ----- */
    if(c.signedIn){
      const cf=c.status==='conflict';
      return h('div',{class:'acct'},this.header('clAccount'),
        h('div',{class:'accard'},
          h('div',{class:'lbl'},this.t('clSignedAs')),h('div',{class:'aemail'},'☁ '+c.email),
          h('div',{class:'ast '+c.status},this.cloudIcon()+' '+this.cloudStatusText()),
          c.lastSync?h('div',{class:'lbl'},this.t('clLast',{t:new Date(c.lastSync).toLocaleTimeString()})):null,
          h('p',{class:'sub'},this.t('clAutoNote'))),
        msg,
        h('div',{class:'row'},
          cf?h('button',{class:'btn primary','data-fid':'aresolve',onclick:()=>{this.sfx();this.push('cloudConflict');}},this.t('clResolve'))
            :h('button',{class:'btn','data-fid':'async',disabled:c.status==='syncing',onclick:()=>{this.sfx();c.sync();}},this.t('clSyncNow')),
          h('button',{class:'btn alt','data-fid':'alogout',onclick:async()=>{this.sfx();st.msg=null;await c.signOut();}},this.t('clLogout'))));
    }
    /* ----- signed out: login / sign up ----- */
    const reg=st.tab==='register',tabBtn=(id,key)=>h('button',{class:'btn small tab'+(st.tab===id?'':' alt'),'data-fid':'atab'+id,onclick:()=>{this.sfx('uiTab');st.tab=id;st.msg=null;st.pw2='';this.rebuild(true);}},this.t(key));
    go=async()=>{
      if(st.busy)return;
      if(!validEmail())return say('err',this.t('clErrEmail'));
      if(reg){if((st.pw||'').length<6)return say('err',this.t('clErrWeak'));if(st.pw!==st.pw2)return say('err',this.t('clErrMatch'));}
      else if(!st.pw)return say('err',this.t('clErrCreds'));
      st.busy=true;st.msg=null;this.rebuild(true);
      try{
        const email=st.email.trim();
        if(reg){const r=await c.signUp(email,st.pw);if(r.confirm){st.tab='login';st.pw=st.pw2='';say('ok',this.t('clOkConfirm'));}else{st.pw=st.pw2='';st.busy=false;}}
        else{await c.signIn(email,st.pw);st.pw='';st.busy=false;}
      }catch(e){say('err',this.cloudErrText(e));}
    };
    const forgot=async()=>{
      if(st.busy)return;
      if(!validEmail())return say('err',this.t('clErrEmail'));
      st.busy=true;this.rebuild(true);
      try{await c.recover(st.email.trim());say('ok',this.t('clOkRecover'));}catch(e){say('err',this.cloudErrText(e));}
    };
    return h('div',{class:'acct'},this.header('clAccount'),
      h('p',{class:'sub'},this.t('clGuestNote')),
      h('div',{class:'row'},tabBtn('login','clLogin'),tabBtn('register','clRegister')),
      h('form',{class:'aform',onsubmit:e=>{e.preventDefault();go();}},
        field('aem','email',this.t('clEmail'),'email','email'),
        field('apw','password',this.t('clPass'),'pw',reg?'new-password':'current-password'),
        reg?field('apw2','password',this.t('clPass2'),'pw2','new-password'):null,
        msg,
        h('div',{class:'row'},h('button',{type:'button',class:'btn primary','data-fid':'asubmit',disabled:st.busy,onclick:()=>{this.sfx();go();}},st.busy?'…':this.t(reg?'clRegister':'clLogin'))),
        !reg?h('div',{class:'row'},h('button',{type:'button',class:'btn small alt','data-fid':'aforgot',disabled:st.busy,onclick:()=>{this.sfx();forgot();}},this.t('clForgot'))):null),
      c.cfg.google?h('div',{class:'row'},h('button',{class:'btn gbtn','data-fid':'agoogle',onclick:()=>{this.sfx();c.google();}},'G  '+this.t('clGoogle'))):null,
      h('div',{class:'row'},h('button',{class:'btn small alt','data-fid':'aguest','data-back':true,onclick:()=>{this.sfx('uiBack');this.pop();}},this.t('clGuest'))));
  },
  /* guest progress and cloud progress differ: let the player choose */
  screen_cloudConflict(){
    const c=this.app.cloud,p=c.pending;
    if(!p)return h('div',null,this.header('clAccount'),h('p',{class:'sub'},this.t('clStOk')));
    const side=(title,s,btnKey,choice,cls)=>h('div',{class:'card opt cat conflict',style:'--fc:'+(choice==='cloud'?'#4aa8ff':'#ffc233')},
      h('div',{class:'cn'},this.t(title)),
      h('div',{class:'cd'},this.t('clSummary',{r:s.runs,z:s.zenny,u:s.unlocked,a:s.ach})),
      h('button',{class:'btn '+cls,'data-fid':'cf'+choice,onclick:async()=>{this.sfx('uiStart');await c.resolve(choice);if(this.top&&this.top.name==='cloudConflict')this.pop();}},this.t(btnKey)));
    return h('div',null,this.header('clConfTitle'),h('p',{class:'sub'},this.t('clConfSub')),
      h('div',{class:'cards'},side('clCloudSide',p.remote,'clConfCloud','cloud','primary'),side('clLocalSide',p.local,'clConfLocal','local','')),
      h('div',{class:'row'},h('button',{class:'btn small alt','data-back':true,onclick:()=>{this.sfx('uiBack');this.pop();}},this.t('clLater'))));
  }
});
