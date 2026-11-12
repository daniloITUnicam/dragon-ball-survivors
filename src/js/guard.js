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
  /* v141: the stored save is not readable JSON any more (the Application tab of the developer tools used to show every value, editable). pack: UTF-8 bytes, XOR with a
     keystream seeded by a random byte (the same save never looks the same twice) and chained with the previous byte (editing one character breaks everything after
     it), then base64. A deterrent, not encryption: the key is in the page. unpack also accepts the old plain JSON (saves from before this version) and returns null when
     the text is damaged. Dev builds keep plain JSON. */
  packOn:!GUARD_DEV,
  pack(json){
    const b=new TextEncoder().encode(json),n=(Math.random()*255|0)+1,o=new Uint8Array(b.length+1);o[0]=n;
    let p=n,s=(n^0x5bd1e995)>>>0;
    for(let i=0;i<b.length;i++){s=(Math.imul(s,1664525)+1013904223)>>>0;const c=b[i]^(s>>>24)^p;o[i+1]=c;p=c;}
    let t='';for(let i=0;i<o.length;i+=8192)t+=String.fromCharCode.apply(null,o.subarray(i,i+8192));
    return 'DBS1:'+btoa(t);
  },
  unpack(raw){
    if(typeof raw!=='string'||raw.slice(0,5)!=='DBS1:')return raw;
    try{
      const t=atob(raw.slice(5)),o=new Uint8Array(t.length);for(let i=0;i<t.length;i++)o[i]=t.charCodeAt(i);
      if(o.length<2)return null;
      const b=new Uint8Array(o.length-1);let p=o[0],s=(o[0]^0x5bd1e995)>>>0;
      for(let i=0;i<b.length;i++){s=(Math.imul(s,1664525)+1013904223)>>>0;const c=o[i+1];b[i]=c^(s>>>24)^p;p=c;}
      return new TextDecoder('utf-8',{fatal:true}).decode(b);
    }catch(e){return null;}
  },
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
