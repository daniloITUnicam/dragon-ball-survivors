'use strict';
/* ====== Patch notes: the 📜 button (main menu, top right, red dot while there is a release the player has not read) + the list of releases ====== */
Object.assign(UI.prototype,{
  patchUnseen(){return PATCHES.length>0&&(this.save.patchSeen||'')!==PATCHES[0].id;},
  /* opening the list marks the newest release as read (silently: it must not look like a progress change to the cloud sync) */
  markPatchRead(){
    if(!PATCHES.length)return;
    const sv=this.app.save;this.save.patchSeen=PATCHES[0].id;
    sv.silent=true;try{sv.write();}finally{sv.silent=false;}
  },
  patchBtn(){
    if(!PATCHES.length)return null;
    const un=this.patchUnseen(),tip=this.t('patchTitle');
    return h('button',{class:'btn alt patchbtn'+(un?' unseen':''),'data-fid':'mpatch',title:tip,'aria-label':tip,
      onclick:()=>{this.sfx();this.patchOpened=this.save.patchSeen||'';this.markPatchRead();this.push('patch');}},
      '📜',un?h('i',{class:'pdot'}):null);
  },
  screen_patch(){
    const lang=this.save.settings.lang,seen=this.patchOpened!==undefined?this.patchOpened:(this.save.patchSeen||''),
      seenIdx=PATCHES.findIndex(p=>p.id===seen);   /* releases above this index were not read yet; -1 = none was */
    const sec=(cls,icon,key,list)=>list&&list.length
      ?h('div',{class:'pnsec '+cls},h('h4',null,icon+' '+this.t(key)),h('ul',null,list.map(x=>h('li',null,this.tr(x)))))
      :null;
    return h('div',{class:'patchs'},this.header('patchTitle'),
      h('div',{class:'pnlist'},PATCHES.map((p,i)=>{
        const fresh=seenIdx<0||i<seenIdx;
        return h('section',{class:'pncard'+(i===0?' latest':''),'data-patch':p.id},
          h('div',{class:'pnhead'},h('div',{class:'pndate'},patchDate(p,lang)),
            i===0?h('span',{class:'pntag'},this.t('patchLatest')):null,fresh?h('span',{class:'pntag nu'},this.t('patchNewTag')):null),
          sec('new','✨','patchNew',p.new),sec('fix','🔧','patchFix',p.fix),sec('bal','⚖️','patchBal',p.bal));
      })));
  }
});
