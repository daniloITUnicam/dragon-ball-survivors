'use strict';
/* ====== v118: anti-cheat deterrents (release builds only; DBS_DEV=1 builds skip them).
   A browser page cannot really stop its owner from inspecting it: this only makes it awkward, and a session where the developer tools
   were opened or the save was edited by hand does not go on the leaderboards. The real checks are on the server (supabase/online.sql:
   run tokens, real-time and plausibility checks). ====== */
const GUARD_DEV='__DEV__'==='1',GUARD_SALT='dbs-ck-7f3a91';
const GUARD={
  tainted:false,why:'',
  taint(why){if(this.tainted)return;this.tainted=true;this.why=why;try{this.onTaint&&this.onTaint(why);}catch(e){}},
  /* a light checksum of the stored save (FNV-1a over the text + a salt): a hand-edited save is noticed */
  ck(raw){let h=2166136261;const s=raw+GUARD_SALT;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(36);},
  start(){
    if(GUARD_DEV||typeof window==='undefined')return;
    const edit=t=>t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable);
    window.addEventListener('contextmenu',e=>{if(!edit(e.target))e.preventDefault();},true);
    window.addEventListener('keydown',e=>{const k=(e.key||'').toLowerCase(),c=e.ctrlKey||e.metaKey;
      if(e.key==='F12'||(c&&e.shiftKey&&['i','j','c','k'].includes(k))||(c&&e.altKey&&['i','j','c'].includes(k))||(c&&k==='u'&&!edit(e.target))){e.preventDefault();e.stopPropagation();}},true);
    window.addEventListener('dragstart',e=>{if(e.target&&e.target.tagName==='CANVAS')e.preventDefault();},true);
    /* developer tools: a "debugger" statement only stops when they are open (and freezes the page while they are); a long stop = open.
       (No window-size check: side panels and vertical tabs would trip it.) */
    setInterval(()=>{const t0=performance.now();debugger;if(performance.now()-t0>120)this.taint('devtools');},1500);   // eslint-disable-line no-debugger
  }
};
