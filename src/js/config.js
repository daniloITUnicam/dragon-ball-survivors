'use strict';
/* ====== Cloud account settings. The values are injected by build.py from the environment
   (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_GOOGLE / SUPABASE_RESET) or from cloud.config.json. The anon/publishable key is
   public by design: security comes from the Row Level Security policies in supabase/schema.sql. ====== */
const CLOUD={url:'__SUPABASE_URL__',key:'__SUPABASE_KEY__',google:'__SUPABASE_GOOGLE__'==='1',reset:'__SUPABASE_RESET__'==='1'};   /* reset: "Forgot password?" by e-mail; needs the Supabase e-mail setup of docs/SUPABASE.md (off by default) */
CLOUD.on=!!(CLOUD.url&&CLOUD.key&&CLOUD.url.indexOf('__SUPABASE')!==0&&CLOUD.key.indexOf('__SUPABASE')!==0);

/* Test mode (Settings > General, the "Dati di gioco" screen and the test run) exists only for the owner's account and for the whitelisted ones. It is a gate of the interface, not a security barrier: the game runs on the player's own device.
   The addresses are NOT in the source: build.py injects their testHash() from tester.config.json (git-ignored; owner + a fixed whitelist) or from the env vars TEST_OWNER / TEST_LIST (CI secrets), so no plain e-mail ends up in the repo or in the page.
   More players are added by the owner at run time (Settings > General > Test mode, table public.testers, supabase/schema.sql). Without any of this nobody has Test mode; a build made with DBS_TEST=1 (local development, private artifact) has it for everybody. */
const TEST_OWNER='__TEST_OWNER__',TEST_LIST='__TEST_LIST__',TEST_DEV='__TEST_DEV__'==='1',TEST_KEY='dbs-tester';
function testHash(s){s=String(s||'').trim().toLowerCase();let h1=0xdeadbeef,h2=0x41c6ce57;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677);}
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return(4294967296*(2097151&h2)+(h1>>>0)).toString(36);}
