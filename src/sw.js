'use strict';
/* Dragon Ball: Survivors - offline cache of the published site (registered by src/js/update.js when the build has DBS_SHEETS=ext).
   - the sprite sheets (s/<id>.<hash>.<ext>) and the music / sounds (assets/<file>?v=<hash>) change URL when they change: cache first, kept across releases;
   - the page itself: network first, the last copy when offline (a new release always arrives as soon as there is a connection);
   - the page posts the URLs of its build ({keep:[...]}): sheets and tracks of older releases are deleted;
   - byte-range requests (an <audio> element streaming a track) are answered from the cache when the whole file is there, otherwise left to the network. */
const CACHE='dbs-v1';
const fixed=u=>u.origin===location.origin&&(/\/s\/[a-z0-9_]+\.[0-9a-f]{10}\.(webp|png)$/.test(u.pathname)||(/\/assets\/[^/]+$/.test(u.pathname)&&u.searchParams.has('v')));
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
async function ranged(hit,range){
  const b=await hit.blob(),m=/bytes=(\d*)-(\d*)/.exec(range||''),n=b.size;
  let s=m&&m[1]!==''?+m[1]:0,t=m&&m[2]!==''?+m[2]:n-1;if(m&&m[1]===''&&m[2]!==''){s=Math.max(0,n-(+m[2]));t=n-1;}
  if(s>=n)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+n}});t=Math.min(t,n-1);
  return new Response(b.slice(s,t+1),{status:206,headers:{'Content-Type':hit.headers.get('Content-Type')||'application/octet-stream','Content-Range':'bytes '+s+'-'+t+'/'+n,'Content-Length':String(t-s+1),'Accept-Ranges':'bytes'}});
}
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);if(u.origin!==location.origin)return;
  if(fixed(u)){
    const range=r.headers.get('range');
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit=await c.match(u.href);
      if(hit)return range?ranged(hit,range):hit;
      const res=await fetch(r);
      if(!range&&res.status===200)c.put(u.href,res.clone()).catch(()=>{});
      return res;
    }));
    return;
  }
  if(r.mode==='navigate'){
    const key=u.origin+u.pathname;
    e.respondWith(fetch(r).then(res=>{if(res.status===200){const cp=res.clone();caches.open(CACHE).then(c=>c.put(key,cp)).catch(()=>{});}return res;})
      .catch(async()=>(await caches.match(key))||Response.error()));
  }
});
self.addEventListener('message',e=>{
  const k=e.data&&e.data.keep;if(!Array.isArray(k))return;
  const keep=new Set(k.map(x=>new URL(x,self.registration.scope).href));
  e.waitUntil(caches.open(CACHE).then(async c=>{for(const q of await c.keys()){const u=new URL(q.url);if(fixed(u)&&!keep.has(q.url))await c.delete(q);}}));
});
