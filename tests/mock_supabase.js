/* Minimal in-memory Supabase stand-in (auth + saves table with per-user "RLS") for tests. */
const http=require('http'),crypto=require('crypto');
function start(port,opt){
  opt=opt||{};
  const profiles=new Map(),scores=[],users=new Map(),byTok=new Map(),refresh=new Map(),saves=new Map(),log=[],codes=new Map(),sentAt=new Map();
  const mk=u=>{const a='at_'+crypto.randomBytes(6).toString('hex'),r='rt_'+crypto.randomBytes(6).toString('hex');byTok.set(a,u.id);refresh.set(r,u.id);return{access_token:a,refresh_token:r,expires_in:opt.expires||30,expires_at:Math.floor(Date.now()/1000)+(opt.expires||30),user:{id:u.id,email:u.email}};};
  const srv=http.createServer((req,res)=>{
    const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS','Content-Type':'application/json'};
    if(req.method==='OPTIONS'){res.writeHead(204,cors);return res.end();}
    let b='';req.on('data',c=>b+=c);req.on('end',()=>{
      const url=new URL(req.url,'http://x'),p=url.pathname,j=b?JSON.parse(b):{};
      const send=(c,o)=>{res.writeHead(c,cors);res.end(o===undefined?'':JSON.stringify(o));};
      log.push(req.method+' '+p+url.search);
      const bearer=(req.headers.authorization||'').replace('Bearer ','');
      const uid=byTok.get(bearer);
      if(p==='/auth/v1/signup'){
        if([...users.values()].some(u=>u.email===j.email))return send(422,{error_code:'user_already_exists',msg:'User already registered'});
        if((j.password||'').length<6)return send(422,{error_code:'weak_password',msg:'Password should be at least 6 characters.'});
        const u={id:crypto.randomUUID(),email:j.email,pw:j.password};users.set(u.id,u);
        return opt.confirm?send(200,{id:u.id,email:u.email}):send(200,mk(u));
      }
      if(p==='/auth/v1/token'){
        const g=url.searchParams.get('grant_type');
        if(g==='password'){const u=[...users.values()].find(x=>x.email===j.email&&x.pw===j.password);if(!u)return send(400,{error_code:'invalid_credentials',msg:'Invalid login credentials'});return send(200,mk(u));}
        if(g==='refresh_token'){const id=refresh.get(j.refresh_token);if(!id)return send(400,{error_code:'refresh_token_not_found',msg:'Invalid Refresh Token'});refresh.delete(j.refresh_token);return send(200,mk(users.get(id)));}
      }
      if(p==='/auth/v1/user'){if(!uid)return send(401,{msg:'bad jwt'});const u=users.get(uid);if(req.method==='PUT'){u.pw=j.password;log.push('PASSWORD-SET');}return send(200,{id:u.id,email:u.email});}
      if(p==='/auth/v1/logout'){byTok.delete(bearer);return send(204);}
      if(p==='/auth/v1/settings')return send(200,{external:{email:true,google:opt.google!==false},mailer_autoconfirm:false,disable_signup:false});
      if(p==='/auth/v1/recover'){
        log.push('RECOVER '+j.email+(url.search?' '+url.search:''));
        if(opt.rate&&sentAt.has(j.email)&&Date.now()-sentAt.get(j.email)<opt.rate*1000)return send(429,{error_code:'over_email_send_rate_limit',msg:'For security purposes, you can only request this after 60 seconds.'});
        sentAt.set(j.email,Date.now());
        if([...users.values()].some(u=>u.email===j.email))codes.set(j.email,String(100000+Math.floor(Math.random()*899999)));
        return send(200,{});
      }
      if(p==='/auth/v1/verify'){
        const u=[...users.values()].find(x=>x.email===j.email);
        if(!u||j.type!=='recovery'||codes.get(j.email)!==j.token)return send(403,{error_code:'otp_expired',msg:'Token has expired or is invalid'});
        codes.delete(j.email);log.push('VERIFY '+j.email);return send(200,mk(u));
      }
      if(p==='/rest/v1/saves'){
        if(!uid)return send(401,{message:'JWT required'});
        if(req.method==='GET'){const f=url.searchParams.get('user_id');const id=f&&f.replace('eq.','');const r=(id===uid&&saves.has(uid))?[saves.get(uid)]:[];return send(200,r);}
        if(req.method==='POST'){for(const row of j){if(row.user_id!==uid)return send(403,{message:'new row violates row-level security policy'});saves.set(uid,{data:row.data,updated_at:row.updated_at});}return send(201);}
      }
      /* v115: nicknames, scores and the leaderboard RPC (same rules as supabase/online.sql) */
      if(p==='/rest/v1/profiles'){
        if(!uid)return send(401,{message:'JWT required'});
        if(req.method==='GET')return send(200,profiles.has(uid)?[{nick:profiles.get(uid)}]:[]);
        if(req.method==='POST'){for(const row of j){if(row.user_id!==uid)return send(403,{message:'rls'});if(!/^[A-Za-z0-9_ .-]{3,16}$/.test(row.nick))return send(400,{message:'check',code:'23514'});
          for(const [u,n] of profiles)if(u!==uid&&n.toLowerCase()===row.nick.toLowerCase())return send(409,{message:'duplicate key',code:'23505'});profiles.set(uid,row.nick);}return send(201);}
      }
      if(p==='/rest/v1/scores'&&req.method==='POST'){
        if(!uid)return send(401,{message:'JWT required'});
        for(const row of j){if(row.user_id!==uid)return send(403,{message:'rls'});if(!profiles.has(uid))return send(400,{message:'nickname required'});scores.push(Object.assign({},row,{created_at:Date.now()+scores.length}));}return send(201);
      }
      if(p==='/rest/v1/rpc/leaderboard'&&req.method==='POST'){
        const sc=r=>j.p_metric==='kills'?r.kills:j.p_metric==='dmg'?r.dmg:r.t*1e7+r.kills,best=new Map();
        for(const r of scores)if(r.stage===j.p_stage&&r.diff===j.p_diff&&(r.week||null)===(j.p_week||null)){const o=best.get(r.user_id);if(!o||sc(r)>sc(o))best.set(r.user_id,r);}
        const rows=[...best.values()].sort((a,b)=>sc(b)-sc(a)||a.created_at-b.created_at).slice(0,j.p_limit||50).map((r,i)=>({rank:i+1,nick:profiles.get(r.user_id),ch:r.ch,t:r.t,kills:r.kills,dmg:r.dmg,lvl:r.lvl,win:r.win,pacts:r.pacts,build:r.build,me:r.user_id===uid}));
        return send(200,rows);
      }
      send(404,{message:'nope '+p});
    });
  });
  return new Promise(r=>srv.listen(port,()=>r({srv,users,saves,log,profiles,scores,byTok,codes,close:()=>srv.close()})));
}
module.exports={start};
