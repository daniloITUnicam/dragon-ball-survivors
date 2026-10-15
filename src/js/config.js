'use strict';
/* ====== Cloud account settings. The values are injected by build.py from the environment
   (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_GOOGLE) or from cloud.config.json. The anon/publishable key is
   public by design: security comes from the Row Level Security policies in supabase/schema.sql. ====== */
const CLOUD={url:'__SUPABASE_URL__',key:'__SUPABASE_KEY__',google:'__SUPABASE_GOOGLE__'==='1'};
CLOUD.on=!!(CLOUD.url&&CLOUD.key&&CLOUD.url.indexOf('__SUPABASE')!==0&&CLOUD.key.indexOf('__SUPABASE')!==0);
