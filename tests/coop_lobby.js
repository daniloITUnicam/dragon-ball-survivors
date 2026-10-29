/* v119: co-op lobby - hub (create / join with a code / find a match / invitations / leaderboard) and the room (destination, team, chat, invite panel, ready bar).
   The server is replaced by an in-page fake of supabase/coop.sql (same function names and answers). */
const pp=require('/opt/npm-tools/node_modules/puppeteer');const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const b=await pp.launch({executablePath:'/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',args:['--no-sandbox']});
const pg=await b.newPage();await pg.setViewport({width:1600,height:900});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file:///home/claude/dbs/dist/dragon-ball-survivors.html');await wait(1500);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m)||(!c&&(process.exitCode=1));
const OUT=process.env.SHOTS||'/tmp/o';
await pg.evaluate(()=>{const A=__app,cl=A.cloud;A.save.d.settings.hints=false;
  /* fake server: me = Kakarot, a friend Vegeta_IV who joins later */
  const S={rooms:{},friends:[{nick:'Vegeta_IV',title:null,status:'friend',online:true,room:null},{nick:'Bulma',title:null,status:'incoming',online:false,room:null}],invites:[{nick:'Vegeta_IV',code:'ZZ99',created_at:new Date().toISOString()}],msgs:[],id:0,calls:[]};window.__S=S;
  const mine=()=>Object.values(S.rooms).find(r=>r.members.some(m=>m.nick==='Kakarot'));
  cl.enabled=true;Object.defineProperty(cl,'uid',{get:()=>'u1',configurable:true});cl.nick='Kakarot';
  cl.rpc=async(n,a)=>{S.calls.push(n);const r=mine();switch(n){
    case'room_create':{const c='AB'+String(10+Object.keys(S.rooms).length);S.rooms[c]={code:c,size:a.p_size,open:a.p_open,stage:0,mode:'classic',diff:'normal',status:'lobby',host:'Kakarot',members:[{nick:'Kakarot',ch:'goku',ready:false}]};return c;}
    case'room_join':{if(a.p_code==='ZZ99'){S.rooms.ZZ99={code:'ZZ99',size:4,open:false,stage:1,mode:'classic',diff:'hard',status:'lobby',host:'Vegeta_IV',members:[{nick:'Vegeta_IV',ch:'vegeta',ready:true},{nick:'Kakarot',ch:'goku',ready:false}]};return 'ok';}return 'not_found';}
    case'room_find':{const c='FD01';S.rooms[c]={code:c,size:a.p_size||4,open:true,stage:a.p_stage==null?0:a.p_stage,mode:a.p_mode||'classic',diff:a.p_diff||'normal',status:'lobby',host:'Kakarot',members:[{nick:'Kakarot',ch:'goku',ready:false}]};return c;}
    case'room_leave':{for(const k in S.rooms)S.rooms[k].members=S.rooms[k].members.filter(m=>m.nick!=='Kakarot');return null;}
    case'room_set':{if(r&&r.host==='Kakarot'){for(const k of['stage','mode','diff','size','open']){const v=a['p_'+k];if(v!=null)r[k]=v;}}return null;}
    case'room_me':{const m=r&&r.members.find(x=>x.nick==='Kakarot');if(m){if(a.p_ch)m.ch=a.p_ch;if(a.p_ready!=null)m.ready=a.p_ready;}return null;}
    case'room_say':{S.msgs.push({id:++S.id,nick:'Kakarot',text:a.p_text,me:true});return null;}
    case'room_invite':return 'sent';
    case'room_start':{r.status='starting';S.msgs=[];return 'ok';}
    case'room_state':{if(!r||r.code!==a.p_code)return{gone:true};return{code:r.code,size:r.size,open:r.open,stage:r.stage,mode:r.mode,diff:r.diff,status:r.status,host:r.host,me_host:r.host==='Kakarot',
      members:r.members.map(m=>({nick:m.nick,title:null,ch:m.ch,ready:m.ready,host:m.nick===r.host,me:m.nick==='Kakarot'})),messages:S.msgs.filter(x=>x.id>a.p_after)};}
    case'friend_list':return S.friends;case'friend_request':{S.friends.push({nick:a.p_nick,title:null,status:'outgoing',online:false,room:null});return 'sent';}
    case'friend_respond':{const f=S.friends.find(x=>x.nick===a.p_nick);if(f)f.status=a.p_accept?'friend':'gone';S.friends=S.friends.filter(x=>x.status!=='gone');return null;}
    case'invite_list':return S.invites;case'coop_searching':return 7;case'coop_touch':return null;
    case'coop_board':return a.p_size===2?[{rank:1,members:['Kakarot','Vegeta_IV'],chs:['goku','vegeta'],kills:4400000,t:3840,win:true,me:true}]:[];
  }};
  A.ui.show('main');});
const clickF=async f=>{await pg.click('[data-fid="'+f+'"]');await wait(250);};
/* hub */
ok(!!(await pg.$('[data-fid=coop]')),'main menu has the Co-op button');
await clickF('coop');await wait(400);
const hub=await pg.evaluate(()=>({panels:document.querySelectorAll('.coop.hub .cpanel').length,srch:(document.querySelector('.csearch')||{}).textContent||'',inv:document.querySelectorAll('.cinvr').length,board:document.querySelectorAll('.cbrow').length,boxes:document.querySelectorAll('.cbox').length}));
ok(hub.panels>=5&&/7/.test(hub.srch)&&hub.boxes===4,'hub: with friends, how to play, find a match, leaderboard, invitations ('+hub.srch+')');
ok(hub.inv===2&&hub.board===1,'hub: an invitation and a friend request, a team on the Duo board');
await pg.screenshot({path:OUT+'/coop_hub.png'});
/* join with the code of the invitation */
await pg.type('[data-fid=cb0]','zz99');await wait(150);await clickF('cjoin');await wait(800);
const room=await pg.evaluate(()=>({top:__app.ui.top.name,slots:document.querySelectorAll('.cslot.full').length,empty:document.querySelectorAll('.cslot.empty').length,dest:(document.querySelector('.cdname b')||{}).textContent,host:document.querySelector('.cdest .cmap:not([disabled])')===null,code:[...document.querySelectorAll('.ccode span')].map(s=>s.textContent).join('')}));
ok(room.top==='coopRoom'&&room.slots===2&&room.empty===2&&room.code==='ZZ99','joining by code opens the room: 2 trainers, 2 free slots, code ZZ99');
ok(/Namek/.test(room.dest)&&room.host,'the host\'s destination is shown and only the host can change it');
/* chat */
await pg.type('[data-fid=cmsg]','ciao squadra');await pg.keyboard.press('Enter');await wait(2200);
const chat=await pg.evaluate(()=>[...document.querySelectorAll('.cline')].map(l=>l.textContent).join('|'));
ok(/ciao squadra/.test(chat),'chat: a message shows in the room ('+chat+')');
await clickF('cq0');await wait(1800);ok(await pg.evaluate(()=>document.querySelectorAll('.cline').length===2),'quick phrases send a message');
/* ready + character */
await clickF('cready');await wait(1800);ok(await pg.evaluate(()=>__S.rooms.ZZ99.members[1].ready===true&&/Non pronto|Not ready/.test(document.querySelector('[data-fid=cready]').textContent)),'"I\'m ready!" toggles ready');
await clickF('slot1');await wait(200);ok(await pg.evaluate(()=>document.querySelectorAll('.cpk').length>=4),'my card opens the character picker');
await clickF('pk_vegeta');await wait(1800);ok(await pg.evaluate(()=>__S.rooms.ZZ99.members[1].ch==='vegeta'),'picking a character updates my slot');
/* invite panel */
const iv=await pg.evaluate(()=>({fr:document.querySelectorAll('.cfrow').length,inv:!!document.querySelector('[data-fid="cinvVegeta_IV"]'),inRoom:!!document.querySelector('.cfrow .cin')}));
ok(iv.fr===2&&iv.inRoom,'friends list: Vegeta_IV is marked as already in the room, the request from Bulma can be answered');
await pg.type('[data-fid=cadd]','Gohan');await clickF('caddb');await wait(600);ok(await pg.evaluate(()=>__S.friends.some(f=>f.nick==='Gohan'&&f.status==='outgoing')),'a friend request by nickname');
await pg.screenshot({path:OUT+'/coop_room.png'});
/* leave, create my own room: I am the host */
await clickF('cleave');await wait(500);await clickF('ccreate');await wait(1000);
const host=await pg.evaluate(()=>({top:__app.ui.top.name,canPick:!!document.querySelector('.cdest .cmap:not([disabled])'),start:document.querySelector('[data-fid=cstart]').disabled,open:!!document.querySelector('[data-fid=copen]:not([disabled])')}));
ok(host.top==='coopRoom'&&host.canPick&&host.start&&host.open,'my own room: I pick the destination, the start waits for a second trainer, I can open it to matchmaking');
const tgt=await pg.evaluate(()=>{const bt=[...document.querySelectorAll('.cdest .cmap:not([disabled]):not(.on)')][0];return bt?{f:bt.dataset.fid,n:bt.textContent}:null;});
if(tgt){await clickF(tgt.f);await wait(1800);}ok(tgt&&await pg.evaluate(n=>document.querySelector('.cdname b').textContent.startsWith(n.trim().slice(0,5)),tgt.n),'the host changes the map'+(tgt?'':' (no second open map)'));
/* a friend arrives and gets ready: start */
await pg.evaluate(()=>{const r=Object.values(__S.rooms).find(r=>r.host==='Kakarot'&&r.code!=='FD01');r.members.push({nick:'Vegeta_IV',ch:'vegeta',ready:true});});await wait(1900);
ok(await pg.evaluate(()=>!document.querySelector('[data-fid=cstart]').disabled&&document.querySelectorAll('.cslot.full').length===2),'with 2 ready trainers the host can start');
await clickF('cstart');await wait(1800);ok(await pg.evaluate(()=>__S.calls.includes('room_start')),'start asks the server (the run itself comes with phase 2)');
/* find a match from the hub */
await clickF('cleave');await wait(400);await clickF('fs2');await clickF('cfindgo');await wait(900);ok(await pg.evaluate(()=>__app.ui.top.name==='coopRoom'&&__S.rooms.FD01&&__S.rooms.FD01.size===2),'find a match (Duo) puts me in a room');
ok(!errs.length,'no JS errors '+errs.slice(0,2).join(' | '));
await b.close();})();
