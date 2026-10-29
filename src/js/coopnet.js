'use strict';
/* ====== v120: co-op transport — a star of WebRTC data channels (the host in the middle), signalled through Supabase
   (signal_send / signal_take, polled). For tests and two tabs on one computer, BroadcastChannel signalling does the same job
   without a server (?coopLocal=1 or NET.localSignal = true). Messages are JSON; "u" (unreliable) messages use a second channel
   that drops late packets (snapshots, inputs), everything else goes on the reliable one. ====== */
const NET_ICE=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}],NET_SIG_POLL=.6;
class CoopNet{
  constructor(o){
    this.me=o.me;this.host=o.host;this.isHost=o.me===o.host;this.code=o.code;this.cloud=o.cloud||null;
    this.peers=new Map();   /* nick -> {pc, rel, unr, open} */
    this.onMsg=o.onMsg||(()=>{});this.onPeer=o.onPeer||(()=>{});this.sigT=0;this.closed=false;this.sigQ=Promise.resolve();this.pend=new Map();
    this.local=!!o.local||(typeof location!=='undefined'&&/[?&]coopLocal=1/.test(location.search));
    if(this.local&&typeof BroadcastChannel!=='undefined'){this.bc=new BroadcastChannel('dbs-coop-'+o.code);this.bc.onmessage=e=>{const m=e.data;if(m&&m.to===this.me)this.onSignal(m.from,m.kind,m.data);};}
  }
  /* the host waits for offers; every other member calls the host */
  start(){if(!this.isHost)this.connect(this.host);}
  peer(nick){let P=this.peers.get(nick);if(P)return P;
    const pc=new RTCPeerConnection({iceServers:this.local?[]:NET_ICE});P={pc,rel:null,unr:null,open:false,nick,q:[]};this.peers.set(nick,P);
    pc.onicecandidate=e=>{if(e.candidate)this.signal(nick,'ice',e.candidate.toJSON?e.candidate.toJSON():e.candidate);};
    pc.onconnectionstatechange=()=>{const s=pc.connectionState;if(s==='failed'||s==='closed'||s==='disconnected'){if(P.open){P.open=false;this.onPeer(nick,false);}}};
    pc.ondatachannel=e=>this.wire(P,e.channel);
    return P;}
  wire(P,ch){
    if(ch.label==='rel')P.rel=ch;else P.unr=ch;
    ch.onopen=()=>{if(P.rel&&P.rel.readyState==='open'&&P.unr&&P.unr.readyState==='open'&&!P.open){P.open=true;this.onPeer(P.nick,true);for(const m of P.q)this.send(P.nick,m);P.q=[];}};
    ch.onmessage=e=>{let m;try{m=JSON.parse(e.data);}catch(x){return;}this.onMsg(P.nick,m);};
    ch.onclose=()=>{if(P.open){P.open=false;this.onPeer(P.nick,false);}};
  }
  async connect(nick){const P=this.peer(nick),pc=P.pc;
    this.wire(P,pc.createDataChannel('rel',{ordered:true}));this.wire(P,pc.createDataChannel('unr',{ordered:false,maxRetransmits:0}));
    const off=await pc.createOffer();await pc.setLocalDescription(off);this.signal(nick,'offer',{type:off.type,sdp:off.sdp});}
  async onSignal(from,kind,data){
    if(this.closed)return;
    try{
      if(kind==='offer'){if(!this.isHost)return;const old=this.peers.get(from);if(old){try{old.pc.close();}catch(e){}this.peers.delete(from);}
        const P=this.peer(from);await P.pc.setRemoteDescription(data);await this.flush(from);const ans=await P.pc.createAnswer();await P.pc.setLocalDescription(ans);this.signal(from,'answer',{type:ans.type,sdp:ans.sdp});}
      else if(kind==='answer'){const P=this.peers.get(from);if(P){await P.pc.setRemoteDescription(data);await this.flush(from);}}
      else if(kind==='ice'){const P=this.peers.get(from);if(!P||!P.pc.remoteDescription){const L=this.pend.get(from)||[];L.push(data);this.pend.set(from,L);return;}try{await P.pc.addIceCandidate(data);}catch(e){}}
      else if(kind==='bye'){this.drop(from);}
    }catch(e){}
  }
  /* candidates that came before the offer / answer they belong to */
  async flush(from){const L=this.pend.get(from);if(!L)return;this.pend.delete(from);const P=this.peers.get(from);if(P)for(const c of L)try{await P.pc.addIceCandidate(c);}catch(e){}}
  signal(to,kind,data){
    if(this.bc){this.bc.postMessage({from:this.me,to,kind,data});return;}
    if(this.cloud)this.sigQ=this.sigQ.then(()=>this.cloud.rpc('signal_send',{p_to:to,p_kind:kind,p_data:data})).catch(()=>{});   /* one at a time: the server keeps the order */
  }
  /* server signalling: polled while the run starts and while a peer is missing */
  async tick(dt){if(this.bc||!this.cloud||this.closed)return;this.sigT-=dt;if(this.sigT>0||this.sigBusy)return;
    const need=this.isHost||[...this.peers.values()].some(P=>!P.open)||!this.peers.size;if(!need){this.sigT=3;return;}
    this.sigT=NET_SIG_POLL;this.sigBusy=true;try{const L=await this.cloud.rpc('signal_take',{})||[];for(const s of L)await this.onSignal(s.nick,s.kind,s.data);}catch(e){}finally{this.sigBusy=false;}}
  send(nick,m,unreliable){const P=this.peers.get(nick);if(!P)return false;const ch=unreliable?P.unr:P.rel;
    if(!P.open||!ch||ch.readyState!=='open'){if(!unreliable){P.q.push(m);}return false;}
    if(unreliable&&ch.bufferedAmount>256*1024)return false;   /* the link is busy: skip this snapshot */
    try{ch.send(JSON.stringify(m));return true;}catch(e){return false;}}
  all(m,unreliable){for(const n of this.peers.keys())this.send(n,m,unreliable);}
  drop(nick){const P=this.peers.get(nick);if(!P)return;try{P.pc.close();}catch(e){}this.peers.delete(nick);if(P.open)this.onPeer(nick,false);}
  close(){this.closed=true;for(const n of[...this.peers.keys()]){this.signal(n,'bye',{});this.drop(n);}if(this.bc)this.bc.close();}
  get openPeers(){return[...this.peers.values()].filter(P=>P.open).map(P=>P.nick);}
}
