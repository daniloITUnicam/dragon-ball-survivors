'use strict';
/* ====== Account screens: login / sign up / password reset, account status, save-conflict chooser ====== */
Object.assign(UI.prototype,{
  /* map a Supabase/network error to a localized message */
  cloudErrText(e){
    const m=String((e&&e.message)||''),code=String((e&&e.code)||'');
    if(e&&e.net)return this.t('clErrNet');
    if(e&&e.locked)return this.t('clErrLock',{s:e.wait});
    if(/invalid login|invalid_credentials/i.test(m+code))return this.t('clErrCreds');
    if(/not confirmed|email_not_confirmed/i.test(m+code))return this.t('clErrConfirm');
    if(/otp_expired|token has expired|invalid.*token|otp/i.test(m+code))return this.t('clErrCode');
    if(/same_password|different from the old/i.test(m+code))return this.t('clErrSame');
    if(/already|exists/i.test(m+code))return this.t('clErrExists');
    if(/at least|weak|short|password/i.test(m)&&/\d|weak|short|character/i.test(m))return this.t('clErrWeak');
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
    return h('button',{class:'btn alt cloudbtn'+(c.signedIn?' on '+c.status:''),'data-fid':'mcloud',title:c.signedIn?this.cloudStatusText():this.t('clLoginCta'),'aria-label':this.t('clAccount')+(c.signedIn?': '+this.cloudStatusText():''),
      onclick:()=>{this.sfx();this.push('account');}},
      c.signedIn?'☁ '+this.cloudIcon():'☁ '+this.t('clLoginCta'));
  },
  /* e-mail as shown on screen: fully masked in streamer mode */
  maskEmail(e){return this.save.settings.streamer?'•••••••@•••••••.•••':e;},
  streamerToggle(){
    const s=this.save.settings,on=!!s.streamer;
    return h('button',{class:'btn small alt streamerbtn'+(on?' on':''),'data-fid':'astreamer',onclick:()=>{this.sfx();s.streamer=!on;this.app.save.write();this.rebuild(true);}},
      '🎥 '+this.t('streamerMode')+': '+this.t(on?'on':'off'));
  },
  screen_account(){
    const c=this.app.cloud,st=this.acct||(this.acct={tab:'login',email:'',pw:'',pw2:'',code:'',step:1,msg:null,busy:false});
    const say=(k,text)=>{st.msg=text?{k,text}:null;st.busy=false;if(this.top&&this.top.name==='account')this.rebuild(true);};
    const field=(id,type,label,key,ac,extra)=>h('label',{class:'afield'},h('span',null,label),
      h('input',Object.assign({type,class:(key==='email'&&this.save.settings.streamer)?'hide':null,'data-fid':id,autocomplete:ac,value:st[key]||'',autocapitalize:'off',spellcheck:'false',
        oninput:e=>{st[key]=e.target.value;},
        onkeydown:e=>{if(e.key==='Enter'){e.preventDefault();go();}}},extra||{})));
    const msg=st.msg?h('div',{class:'amsg '+st.msg.k,role:'status'},st.msg.text):null;
    const validEmail=()=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((st.email||'').trim());
    let go=()=>{};
    /* ----- password reset (opened from the e-mail link) ----- */
    if(c.recovery&&c.signedIn){
      go=async()=>{
        if(st.busy)return;
        if(Cloud.weakPw(st.pw,c.sess&&c.sess.user&&c.sess.user.email))return say('err',this.t('clErrWeak'));
        if(st.pw!==st.pw2)return say('err',this.t('clErrMatch'));
        st.busy=true;this.rebuild(true);
        try{await c.updatePassword(st.pw);c.recovery=false;st.pw=st.pw2='';say('ok',this.t('clOkPass'));}
        catch(e){say('err',this.cloudErrText(e));}
      };
      return h('div',{class:'acct acctscr'},this.header('clAccount'),
        h('h3',null,this.t('clNewPass')),
        field('apw','password',this.t('clPass'),'pw','new-password'),field('apw2','password',this.t('clPass2'),'pw2','new-password'),msg,
        h('div',{class:'row'},h('button',{class:'btn primary',disabled:st.busy,'data-fid':'asubmit',onclick:()=>{this.sfx();go();}},this.t('clSave'))));
    }
    /* ----- signed in ----- */
    if(c.signedIn){
      const cf=c.status==='conflict';
      return h('div',{class:'acct acctscr'},this.header('clAccount'),
        h('div',{class:'accard'},
          h('div',{class:'lbl'},this.t('clSignedAs')),h('div',{class:'aemail'},'☁ '+this.maskEmail(c.email)),
          h('div',{class:'ast '+c.status},this.cloudIcon()+' '+this.cloudStatusText()),
          c.lastSync?h('div',{class:'lbl'},this.t('clLast',{t:new Date(c.lastSync).toLocaleTimeString()})):null,
          h('p',{class:'sub'},this.t('clAutoNote'))),
        msg,
        h('div',{class:'row'},
          cf?h('button',{class:'btn primary','data-fid':'aresolve',onclick:()=>{this.sfx();this.push('cloudConflict');}},this.t('clResolve'))
            :h('button',{class:'btn','data-fid':'async',disabled:c.status==='syncing',onclick:()=>{this.sfx();c.sync();}},this.t('clSyncNow')),
          h('button',{class:'btn alt','data-fid':'alogout',onclick:async()=>{this.sfx();st.msg=null;await c.signOut();}},this.t('clLogout'))),
        h('div',{class:'row'},this.streamerToggle()));
    }
    /* ----- signed out ----- */
    const tabBtn=(id,key)=>h('button',{class:'btn small tab'+(st.tab===id?'':' alt'),'data-fid':'atab'+id,onclick:()=>{this.sfx('uiTab');st.tab=id;st.step=1;st.msg=null;st.pw2='';st.code='';this.rebuild(true);}},this.t(key));
    /* the Google button is always offered; while the provider is not enabled in the Supabase project (known from /auth/v1/settings) it explains that instead of sending the player to an error page */
    const googleBlock=c.enabled?[h('div',{class:'aor'},h('span',null,this.t('clOr'))),
      h('div',{class:'row'},h('button',{class:'btn gbtn','data-fid':'agoogle',onclick:()=>{this.sfx();if(c.prov&&!c.prov.google)return say('info',this.t('clGoogleOff'));c.google();}},h('span',{class:'gmark'},'G'),' '+this.t('clGoogle')))]:[];
    const guest=h('div',{class:'row'},h('button',{class:'btn small alt','data-fid':'aguest','data-back':true,onclick:()=>{this.sfx('uiBack');this.pop();}},this.t('clGuest')));
    /* ----- password reset: 1) the e-mail address, 2) the code from the e-mail + the new password (opening the link in the e-mail works too) ----- */
    if(st.tab==='reset'&&!c.resetOn)st.tab='login';   /* e-mail recovery is off unless the build enables it */
    if(st.tab==='reset'){
      const sent=st.step===2;
      const back=()=>{st.tab='login';st.step=1;st.msg=null;st.pw=st.pw2=st.code='';this.rebuild(true);};
      go=async()=>{
        if(st.busy)return;
        if(!validEmail())return say('err',this.t('clErrEmail'));
        if(!sent){
          st.busy=true;st.msg=null;this.rebuild(true);
          try{await c.recover(st.email.trim());st.step=2;st.code='';say('ok',this.t('clOkRecover'));}catch(e){say('err',this.cloudErrText(e));}
          return;
        }
        const code=(st.code||'').replace(/\s+/g,'');
        if(code.length<4)return say('err',this.t('clErrCode'));
        if(Cloud.weakPw(st.pw,st.email))return say('err',this.t('clErrWeak'));
        if(st.pw!==st.pw2)return say('err',this.t('clErrMatch'));
        st.busy=true;st.msg=null;this.rebuild(true);
        try{await c.resetWithCode(st.email.trim(),code,st.pw);st.pw=st.pw2=st.code='';st.tab='login';st.step=1;say('ok',this.t('clOkReset'));}
        catch(e){say('err',this.cloudErrText(e));}
      };
      const resend=async()=>{
        if(st.busy)return;
        if(!validEmail())return say('err',this.t('clErrEmail'));
        const w=c.recoverAt?60-Math.floor((Date.now()-c.recoverAt)/1000):0;
        if(w>0)return say('err',this.t('clResendIn',{n:w}));
        st.busy=true;st.msg=null;this.rebuild(true);
        try{await c.recover(st.email.trim());say('ok',this.t('clOkResent'));}catch(e){say('err',this.cloudErrText(e));}
      };
      return h('div',{class:'acct acctscr'},this.header('clAccount'),
        h('h3',null,this.t('clResetTitle')),
        h('p',{class:'sub'},sent?this.t('clResetSub2',{e:this.maskEmail((st.email||'').trim())}):this.t('clResetSub1')),
        h('form',{class:'aform',onsubmit:e=>{e.preventDefault();go();}},
          field('aem','email',this.t('clEmail'),'email','email'),
          sent?[field('acode','text',this.t('clCode'),'code','one-time-code',{inputmode:'numeric',maxlength:'12'}),
                field('apw','password',this.t('clPassNew'),'pw','new-password'),field('apw2','password',this.t('clPass2'),'pw2','new-password')]:null,
          msg,
          h('div',{class:'row'},h('button',{type:'button',class:'btn primary','data-fid':'asubmit',disabled:st.busy,onclick:()=>{this.sfx();go();}},st.busy?'…':this.t(sent?'clResetDo':'clSendCode'))),
          h('div',{class:'row'},
            sent?h('button',{type:'button',class:'btn small alt','data-fid':'aresend',disabled:st.busy,onclick:()=>{this.sfx();resend();}},this.t('clResend'))
                :h('button',{type:'button',class:'btn small alt','data-fid':'ahavecode',disabled:st.busy,onclick:()=>{this.sfx();if(!validEmail())return say('err',this.t('clErrEmail'));st.step=2;st.msg=null;this.rebuild(true);}},this.t('clHaveCode')),
            h('button',{type:'button',class:'btn small alt','data-fid':'aback',onclick:()=>{this.sfx('uiBack');back();}},this.t('clBackLogin')))),
        guest);
    }
    const reg=st.tab==='register';
    go=async()=>{
      if(st.busy)return;
      if(!validEmail())return say('err',this.t('clErrEmail'));
      if(reg){if(Cloud.weakPw(st.pw,st.email))return say('err',this.t('clErrWeak'));if(st.pw!==st.pw2)return say('err',this.t('clErrMatch'));}
      else if(!st.pw)return say('err',this.t('clErrCreds'));
      st.busy=true;st.msg=null;this.rebuild(true);
      try{
        const email=st.email.trim();
        if(reg){const r=await c.signUp(email,st.pw);if(r.confirm){st.tab='login';st.pw=st.pw2='';say('ok',this.t('clOkConfirm'));}else{st.pw=st.pw2='';st.busy=false;}}
        else{await c.signIn(email,st.pw);st.pw='';st.busy=false;}
      }catch(e){say('err',this.cloudErrText(e));}
    };
    return h('div',{class:'acct acctscr'},this.header('clAccount'),
      h('p',{class:'sub'},this.t('clGuestNote')),
      h('div',{class:'row'},tabBtn('login','clLogin'),tabBtn('register','clRegister')),
      h('form',{class:'aform',onsubmit:e=>{e.preventDefault();go();}},
        field('aem','email',this.t('clEmail'),'email','email'),
        field('apw','password',this.t('clPass'),'pw',reg?'new-password':'current-password'),
        reg?field('apw2','password',this.t('clPass2'),'pw2','new-password'):null,
        msg,
        h('div',{class:'row'},h('button',{type:'button',class:'btn primary','data-fid':'asubmit',disabled:st.busy,onclick:()=>{this.sfx();go();}},st.busy?'…':this.t(reg?'clRegister':'clLogin'))),
        reg?h('p',{class:'sub anorec'},this.t(c.resetOn?'clPassTip':'clNoRecovery')):null,
        !reg?h('div',{class:'row'},c.resetOn
          ?h('button',{type:'button',class:'btn small alt','data-fid':'aforgot',disabled:st.busy,onclick:()=>{this.sfx();st.tab='reset';st.step=1;st.msg=null;st.pw=st.pw2=st.code='';this.rebuild(true);}},this.t('clForgot'))
          /* no e-mail recovery in this build: the button stays, with a tooltip (hover / focus) and, for touch screens, a message when pressed, saying so */
          :h('button',{type:'button',class:'btn small alt forgotno','data-fid':'aforgot','data-tip':this.t('clForgotTip'),'aria-label':this.t('clForgot')+'. '+this.t('clForgotTip'),onclick:()=>{this.sfx();say('info',this.t('clForgotTip'));}},this.t('clForgot'))):null),
      googleBlock,
      h('div',{class:'row'},this.streamerToggle()),
      guest);
  },
  /* the e-mail link was already used or expired (mail scanners often open it first): go straight to the code / new-link form (called from App.onCloud) */
  openReset(msgKey){
    const st=this.acct||(this.acct={tab:'login',email:'',pw:'',pw2:'',code:'',step:1,msg:null,busy:false});
    st.tab='reset';st.step=1;st.msg=msgKey?{k:'err',text:this.t(msgKey)}:null;st.busy=false;
    if(this.top&&this.top.name==='account')this.rebuild(true);else this.push('account');
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
