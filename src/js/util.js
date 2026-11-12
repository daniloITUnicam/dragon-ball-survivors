'use strict';
const TAU=Math.PI*2;
/* "reduced effects" (settings.reduceFx, set by App.applySettings): fewer particles, no electric arcs / flame tongues / turning rays, softer glows and flashes, calmer screen shake */
/* v141: every special effect of the game's fx list (ring, bolt, pillar, shock wave, beam, painted blast...) is built here, with the same fields in the same order.
   The plain particles are one kind of object, these are a second one: before, each special effect was a kind of its own, and with more than four kinds in one
   list the engine falls back to slow, generic field access that makes a new number object at every read (~70 bytes of garbage per particle per frame) */
/* v141: every sprite object (a picture + where its foot is) is built here, with the same fields in the same order and its numbers as fractions from the start.
   They were four different kinds of object, and whole / fractional anchors made the engine re-shape them one by one while the game ran: drawEnemy lost its
   optimized code about five times a second for the whole run (s: sprite pixels per unit, 0 = the default; px: pixel art; sheet: the pack sheet, if any) */
function SPR(c,ox,oy,s,px,sheet){const o={c:null,ox:.5,oy:.5,s:.5,px:false,sheet:null};o.c=c;o.ox=ox;o.oy=oy;o.s=s||0;o.px=!!px;o.sheet=sheet||null;return o;}
function FXS(o){return{x:o.x,y:o.y,vx:o.vx,vy:o.vy,l:o.l,m:o.m,c:o.c,s:o.s,ring:o.ring,r:o.r,bolt:o.bolt,pts:o.pts,pillar:o.pillar,kfz:o.kfz,a:o.a,sd:o.sd,shock:o.shock,max:o.max,
  beam:o.beam,len:o.len,w:o.w,ab:o.ab,fol:o.fol,t2:o.t2,sbc:o.sbc,abfx:o.abfx,R:o.R,wfx:o.wfx,f0:o.f0,f1:o.f1};}
const FXL={on:false,a:1,m:1};   /* a = the player's "effect opacity" slider (0..1), m = the multiplier in force right now (a while one of the player's own effect layers is drawn, otherwise 1) */
const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const angDiff=(a,b)=>{const d=a-b;return Math.atan2(Math.sin(d),Math.cos(d));};
function hash(x,y){let h=(Math.imul(x,374761393)+Math.imul(y,668265263))|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967295;}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function wpick(items,wf){let s=0;for(const i of items)s+=wf(i);let r=Math.random()*s;for(const i of items){r-=wf(i);if(r<=0)return i;}return items[items.length-1];}
const fmtT=s=>{s=Math.floor(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
const fmtN=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'k':String(Math.floor(n));
/* Security: a save comes from localStorage, a file or the cloud, so it is never trusted. Keys that could change an object's prototype are dropped when it is parsed and merged,
   and sanitizeData() repairs numbers / sizes before the game reads it (NaN and Infinity become 0, huge numbers, strings, arrays and nesting are cut) */
const UNSAFE_KEYS=new Set(['__proto__','constructor','prototype']);
const safeJSON=t=>JSON.parse(t,(k,v)=>UNSAFE_KEYS.has(k)?undefined:v);
function sanitizeData(v,depth){
  depth=depth||0;
  if(typeof v==='number')return Number.isFinite(v)?Math.max(-1e15,Math.min(1e15,v)):0;
  if(typeof v==='string')return v.length>4000?v.slice(0,4000):v;
  if(!v||typeof v!=='object')return v;
  if(depth>14)return Array.isArray(v)?[]:{};
  if(Array.isArray(v)){const n=v.length>50000?50000:v.length,a=new Array(n);for(let i=0;i<n;i++)a[i]=sanitizeData(v[i],depth+1);return a;}
  const o={};let c=0;for(const k in v){if(UNSAFE_KEYS.has(k)||!Object.prototype.hasOwnProperty.call(v,k))continue;if(++c>5000)break;o[k]=sanitizeData(v[k],depth+1);}
  return o;
}
function deepMerge(base,over){
  if(over===undefined||over===null)return base;
  if(base===null||Array.isArray(base)||typeof base!=='object')return over;   /* a null default (the equipped trinket) takes whatever was stored */
  const o={...base};
  for(const k in over){if(UNSAFE_KEYS.has(k))continue;o[k]=(k in base&&typeof base[k]==='object'&&!Array.isArray(base[k]))?deepMerge(base[k],over[k]):over[k];}
  return o;
}
