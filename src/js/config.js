'use strict';
/* ====== Cloud account settings. The values are injected by build.py from the environment
   (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_GOOGLE / SUPABASE_RESET) or from cloud.config.json. The anon/publishable key is
   public by design: security comes from the Row Level Security policies in supabase/schema.sql. ====== */
const CLOUD={url:'__SUPABASE_URL__',key:'__SUPABASE_KEY__',google:'__SUPABASE_GOOGLE__'==='1',reset:'__SUPABASE_RESET__'==='1'};   /* reset: "Forgot password?" by e-mail; needs the Supabase e-mail setup of docs/SUPABASE.md (off by default) */
CLOUD.on=!!(CLOUD.url&&CLOUD.key&&CLOUD.url.indexOf('__SUPABASE')!==0&&CLOUD.key.indexOf('__SUPABASE')!==0);
