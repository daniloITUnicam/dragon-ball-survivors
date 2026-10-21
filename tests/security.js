/* Security hardening: poisoned save in localStorage, safe JSON, content-security-policy (when the build has one).
   Optional: HTML=/path/to/built.html  (default dist/dragon-ball-survivors.html) */
const pp=require('/opt/npm-tools/node_modules/puppeteer'),http=require('http'),fs=require('fs'),path=require('path');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const HTML=process.env.HTML||path.join(__dirname,'..','dist','dragon-ball-survivors.html');
(async()=>{
  const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
  /* ---------- 1. a save written by somebody else (shared computer, pasted by a stranger, tampered cloud copy) ---------- */
  const evil='{"__proto__":{"polluted":"yes"},"constructor":{"prototype":{"polluted2":"yes"}},"zenny":1e300,"gems":-5,"settings":{"__proto__":{"polluted3":1},"lang":"it"},"xp":"NaN","wu":{"__proto__":{"ki":1}},"shop":{"hp":99999999999},"name":"'+'A'.repeat(100000)+'"}';
  const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.evaluateOnNewDocument(t=>{try{if(!localStorage.getItem('__seeded')){localStorage.setItem('dragonball-survivors-v2',t);localStorage.setItem('__seeded','1');}}catch(e){}},evil);
  await pg.goto('file://'+HTML);await wait(1500);
  const r=await pg.evaluate(()=>({
    p1:({}).polluted,p2:({}).polluted2,p3:({}).polluted3,p4:Object.prototype.hasOwnProperty('polluted'),
    zenny:__app.save.d.zenny,gems:__app.save.d.gems,
    len:JSON.stringify(__app.save.d).length,
    finite:(function f(v){if(typeof v==='number')return Number.isFinite(v);if(v&&typeof v==='object')return Object.values(v).every(f);return true;})(__app.save.d)}));
  ok(r.p1===undefined&&r.p2===undefined&&r.p3===undefined&&!r.p4,'prototype pollution from a poisoned save is ignored');
  ok(Number.isFinite(r.zenny)&&r.zenny>=0&&r.zenny<=1e15,'absurd amount of money is clamped ('+r.zenny+')');
  ok(r.finite,'every number in the loaded save is finite');
  ok(r.len<400000,'a 100 KB name does not blow up the save ('+r.len+' chars)');
  ok(await pg.evaluate(()=>{const o=safeJSON('{"__proto__":{"x":1},"a":{"constructor":2,"b":3}}');return !('x' in {})&&o.a.b===3&&!Object.prototype.hasOwnProperty.call(o,'__proto__')&&!('constructor' in Object.assign({},o.a)&&Object.prototype.hasOwnProperty.call(o.a,'constructor'));}),'safeJSON drops __proto__ / constructor keys');
  ok(await pg.evaluate(()=>{const m=deepMerge({a:1,b:{c:2}},JSON.parse('{"b":{"__proto__":{"z":1},"d":3},"__proto__":{"y":1}}'));return m.b.c===2&&m.b.d===3&&({}).z===undefined&&({}).y===undefined;}),'deepMerge skips unsafe keys');
  ok(await pg.evaluate(()=>{const s=sanitizeData({a:[1,NaN,Infinity,-1e40],s:'x'.repeat(9000),o:{n:null}});return s.a[1]===0&&s.a[2]===0&&Math.abs(s.a[3])<=1e15&&s.s.length<=4000&&s.o.n===null;}),'sanitizeData clamps numbers / strings');
  ok(await pg.evaluate(()=>{try{const s=new SaveData({getItem:()=>'[1,2,3]',setItem(){}});return typeof s.d==='object'&&!Array.isArray(s.d)&&typeof s.d.zenny==='number';}catch(e){return false;}}),'a save that is not an object (array) falls back to a fresh one');
  ok(await pg.evaluate(()=>{try{const s=new SaveData({getItem:()=>'{not json',setItem(){}});return typeof s.d.zenny==='number';}catch(e){return false;}}),'a corrupt save falls back to a fresh one');
  ok(errs.length===0,'no JS errors '+errs.join(' | '));
  await pg.close();

  /* ---------- 2. the content-security-policy of the built page (link builds have one; the single-file embed build does not) ---------- */
  const html=fs.readFileSync(HTML,'utf8');
  const m=html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
  if(!m){console.log('SKIP no CSP in this build (embed mode)');}
  else{
    const csp=m[1];
    ok(/default-src 'none'/.test(csp)&&/script-src 'sha256-[A-Za-z0-9+/=]+'/.test(csp)&&!/script-src[^;]*unsafe/.test(csp),'CSP: scripts only by hash, no unsafe-inline / unsafe-eval');
    ok(/object-src 'none'/.test(csp)&&/base-uri 'none'/.test(csp)&&/form-action 'none'/.test(csp),'CSP: no plugins, no <base>, no form posts');
    ok(/<meta name="referrer" content="no-referrer">/.test(html),'referrer is not sent');
    /* serve the page like GitHub Pages (http, with assets/ next to it) and watch for violations while playing a bit */
    const dir=path.dirname(HTML),srv=http.createServer((q,s)=>{
      let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/'+path.basename(HTML);
      const ROOT=path.join(__dirname,'..'),tryRead=(list,i)=>{if(i>=list.length){s.writeHead(404);return s.end();}
        const f=path.normalize(path.join(list[i],p));if(!f.startsWith(list[i])){s.writeHead(403);return s.end();}
        fs.readFile(f,(e,d)=>{if(e)return tryRead(list,i+1);s.writeHead(200,{'Content-Type':/\.html$/.test(f)?'text/html':/\.json$/.test(f)?'application/json':/\.mp3$/.test(f)?'audio/mpeg':'application/octet-stream'});s.end(d);});};
      tryRead([dir,ROOT],0);
    }).listen(0);
    const port=srv.address().port;
    const pg2=await b.newPage();await pg2.setViewport({width:1100,height:700});
    const viol=[],pe=[];
    await pg2.evaluateOnNewDocument(()=>{window.__v=[];document.addEventListener('securitypolicyviolation',e=>window.__v.push(e.violatedDirective+' '+e.blockedURI));});
    pg2.on('pageerror',e=>pe.push(e.message));
    pg2.on('console',m=>{const t=m.text();if(/Content Security Policy|Refused to/i.test(t))viol.push(t.slice(0,200));});
    await pg2.goto('http://127.0.0.1:'+port+'/');await wait(2000);
    await pg2.evaluate(()=>{__app.startGame({stage:0,char:'goku',diff:'normal',x2:false,sandbox:true});});await wait(2500);
    await pg2.keyboard.press('Escape');await wait(400);
    const v=await pg2.evaluate(()=>window.__v);
    /* fonts from Google are blocked in the sandbox (no internet), that is a network failure, not a policy violation */
    ok(v.length===0&&viol.length===0,'CSP: no violation while the menu and a run load ('+[...v,...viol].join(' | ')+')');
    ok(pe.length===0,'CSP: no JS errors under the policy '+pe.join(' | '));
    ok(await pg2.evaluate(()=>!!document.querySelector('canvas')&&__app.state!==undefined),'game boots under the CSP');
    /* an injected script / inline handler must not run */
    const inj=await pg2.evaluate(()=>new Promise(res=>{
      window.__pwn=0;const s=document.createElement('script');s.textContent='window.__pwn=1';document.body.append(s);
      const d=document.createElement('div');d.innerHTML='<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" onload="window.__pwn=2">';document.body.append(d);
      setTimeout(()=>res(window.__pwn),400);}));
    ok(inj===0,'CSP: an injected <script> and an inline onload handler do not run');
    await pg2.close();srv.close();
  }
  await b.close();
  console.log(fails?'FAILED '+fails:'ALL OK');process.exit(fails?1:0);
})().catch(e=>{console.log('ERR',e);process.exit(2)});
