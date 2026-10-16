'use strict';
/* ====== Input: keyboard + any gamepad (Gamepad API), fully rebindable ====== */
const ACTIONS=['up','down','left','right','confirm','cancel','pause','interact','pet','kaioken','senzu','dash','debug'];
const PAD_NAMES=['A / ✕','B / ○','X / □','Y / △','LB / L1','RB / R1','LT / L2','RT / R2','Select / Share','Start / Options','L3','R3','D-Up','D-Down','D-Left','D-Right','Home'];
class Input{
  constructor(save){
    this.save=save;this.keys=new Set();this.latch=new Set();this.down={};this.prev={};this.mode='kb';this.padName='';
    this.rebind=null;this.rep={};this.ax=0;this.ay=0;this.padPrev=[];
    for(const a of ACTIONS){this.down[a]=false;this.prev[a]=false;}
  }
  get binds(){return this.save.d.binds;}
  attach(){
    addEventListener('keydown',e=>this.onKey(e,true));
    addEventListener('keyup',e=>this.onKey(e,false));
    addEventListener('blur',()=>this.keys.clear());
    addEventListener('gamepadconnected',e=>{this.padName=e.gamepad.id;this.mode='pad';});
    addEventListener('gamepaddisconnected',()=>{this.padName='';if(this.mode==='pad')this.mode='kb';});
  }
  onKey(e,down){
    if(this.rebind&&this.rebind.dev==='kb'){
      if(!down)return;e.preventDefault();e.stopPropagation();
      this.finishRebind(e.code==='Escape'?null:e.code);return;
    }
    /* typing in a text field (login form): the game must not treat letters/Backspace/Enter as menu or move keys */
    const tg=e.target,typing=tg&&tg.tagName==='INPUT'&&/^(text|email|password)$/.test(tg.type||'text');
    if(typing&&e.code!=='Escape'&&e.code!=='ArrowUp'&&e.code!=='ArrowDown'){if(!down)this.keys.delete(e.code);return;}
    if(down){
      this.keys.add(e.code);this.latch.add(e.code);this.mode='kb';
      const t=e.target&&e.target.tagName;
      if((e.code.startsWith('Arrow')||e.code==='Space')&&t!=='INPUT'&&t!=='SELECT')e.preventDefault();
    }else this.keys.delete(e.code);
  }
  getPad(){
    if(typeof navigator==='undefined'||!navigator.getGamepads)return null;
    const l=navigator.getGamepads();
    for(const p of l)if(p&&p.connected){this.padName=p.id;return p;}
    return null;
  }
  poll(dt){
    const pad=this.getPad(),B=this.binds;
    let sx=0,sy=0;
    if(pad){
      sx=pad.axes[0]||0;sy=pad.axes[1]||0;
      if(Math.hypot(sx,sy)<.25){sx=0;sy=0;}
      if(this.rebind&&this.rebind.dev==='pad'){
        for(let i=0;i<pad.buttons.length;i++){
          const pr=pad.buttons[i].pressed;
          if(pr&&!this.padPrev[i]){this.padPrev[i]=true;this.finishRebind(i);break;}
          this.padPrev[i]=pr;
        }
      }else{
        for(let i=0;i<pad.buttons.length;i++)if(pad.buttons[i].pressed){this.mode='pad';break;}
        if(sx||sy)this.mode='pad';
      }
    }
    for(const a of ACTIONS){
      this.prev[a]=this.down[a];let d=false;
      for(const k of(B.kb[a]||[]))if(this.keys.has(k)||this.latch.has(k)){d=true;break;}
      if(!d&&pad)for(const b of(B.pad[a]||[]))if(pad.buttons[b]&&pad.buttons[b].pressed){d=true;break;}
      this.down[a]=d;
    }
    this.latch.clear();
    if(sx<-.55)this.down.left=true;if(sx>.55)this.down.right=true;
    if(sy<-.55)this.down.up=true;if(sy>.55)this.down.down=true;
    this.ax=sx;this.ay=sy;
    for(const a of['up','down','left','right']){
      if(this.down[a]){this.rep[a]=(this.rep[a]||0)+dt;}else this.rep[a]=0;
    }
  }
  pressed(a){return this.down[a]&&!this.prev[a];}
  held(a){return !!this.down[a];}
  /* menu navigation: press, then auto-repeat while held */
  navPressed(a){
    if(!this.down[a])return false;
    if(!this.prev[a])return true;
    const t=this.rep[a]||0;
    if(t>.45){const n=Math.floor((t-.45)/.12),p=Math.floor((t-.45-1/60)/.12);return n!==p&&t>.45;}
    return false;
  }
  move(){
    let x=0,y=0;
    if(this.down.left)x-=1;if(this.down.right)x+=1;if(this.down.up)y-=1;if(this.down.down)y+=1;
    if(Math.hypot(this.ax,this.ay)>0){x=this.ax;y=this.ay;}
    return{x,y};
  }
  startRebind(action,dev,slot,cb){
    this.rebind={action,dev,slot,cb};
    const pad=this.getPad();this.padPrev=[];
    if(pad)for(let i=0;i<pad.buttons.length;i++)this.padPrev[i]=pad.buttons[i].pressed;
  }
  cancelRebind(){this.rebind=null;}
  finishRebind(code){
    const r=this.rebind;this.rebind=null;if(!r)return;
    if(code!==null&&code!==undefined){
      const arr=this.binds[r.dev][r.action]=this.binds[r.dev][r.action]||[];
      arr[r.slot]=code;
      for(let i=arr.length-1;i>=0;i--)if(arr[i]===undefined)arr.splice(i,1);
      this.save.write();
    }
    if(r.cb)r.cb(code);
  }
  resetBinds(){this.save.d.binds=this.save.defaults().binds;this.save.write();}
  static keyLabel(c){
    if(!c)return '—';
    return c.replace('Key','').replace('Digit','').replace('Arrow','').replace('ShiftLeft','Shift').replace('ShiftRight','Shift').replace('Escape','Esc').replace('Backspace','⌫').replace('Backquote','`')
      .replace('Space','Space').replace('Enter','Enter').replace('Numpad','Num ');
  }
  static padLabel(i){return i===undefined||i===null?'—':(PAD_NAMES[i]||('Btn '+i));}
}
