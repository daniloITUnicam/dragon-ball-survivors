'use strict';
/* ====== v131: loading screen. Its markup is static in index.html (#boot), so it shows while the page itself is still being read;
   once the game runs it fills the bar while it prepares, before the first menu, what used to be built the first time a menu needed it:
     1. the fonts;
     2. every sprite sheet (decoded by Sprites.loadPack, started in App.init);
     3. the 58 characters of the character screen, with their expressions (blink, happy, smug): the first opening took ~0.4 s and then
        stuttered every time a new expression appeared;
     4. the stage previews (tiles, decorations, props, lakes of every planet): the first opening of the stage screen took ~0.3 s.
     5. the character and stage screens themselves, opened once behind #boot (canvases, 2D contexts, layout), then the main menu.
   Work is cut in slices of ~12 ms, so the bar and the ball keep moving. While #boot is up the menu backdrop is not drawn (App.tick). ====== */
const BOOT={on:true};
(()=>{
  const el=document.getElementById('boot');if(!el){BOOT.on=false;return;}
  const TS=(it,en,es,fr,de,pt)=>T6(it,en,es,fr,de,pt);
  const L={
    sheets:TS('Carico gli sprite…','Loading sprites…','Cargando sprites…','Chargement des sprites…','Sprites werden geladen…','Carregando sprites…'),
    chars:TS('Preparo i guerrieri…','Getting the fighters ready…','Preparando a los guerreros…','Préparation des guerriers…','Kämpfer werden vorbereitet…','Preparando os guerreiros…'),
    stages:TS('Preparo i pianeti…','Preparing the planets…','Preparando los planetas…','Préparation des planètes…','Planeten werden vorbereitet…','Preparando os planetas…'),
    ready:TS('Pronto!','Ready!','¡Listo!','Prêt !','Bereit!','Pronto!')
  };
  let app=null;const tr=o=>app?app.i18n.t(o):o.en;
  const fill=el.querySelector('.bt-fill'),txt=el.querySelector('.bt-txt');
  const set=(p,o)=>{el.classList.add('det');fill.style.width=(clamp(p,0,1)*100).toFixed(1)+'%';txt.textContent=tr(o)+'  '+Math.round(clamp(p,0,1)*100)+'%';};
  const frame=()=>new Promise(r=>requestAnimationFrame(()=>r()));
  /* runs fn(i) for i in 0..n-1 in slices of ~12 ms, reporting the progress between p0 and p1 */
  const slices=async(n,fn,p0,p1,o)=>{let i=0;while(i<n){const t0=performance.now();while(i<n&&performance.now()-t0<12){try{fn(i);}catch(e){}i++;}set(p0+(p1-p0)*i/Math.max(1,n),o);await frame();}};
  const run=async()=>{
    app=APP_REF;
    {const lg=el.querySelector('.bt-logo');if(lg&&typeof LOGO_URL!=='undefined'&&LOGO_URL){const im=new Image();im.alt='Dragon Ball: Survivors';im.className='bt-img';im.onload=()=>lg.replaceChildren(im);im.src=LOGO_URL;}}
    set(.02,L.sheets);
    /* 1. fonts (at most 2.5 s: offline they never come) */
    try{if(document.fonts&&document.fonts.ready)await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,2500))]);}catch(e){}
    /* 2. sprite sheets: wait for the decodes started by App.init (at most 12 s) */
    {const ids=Object.keys(typeof SPRITE_PACK!=='undefined'?SPRITE_PACK:{}).filter(id=>!Sprites.lazyOf(id)),t0=performance.now();
      for(;;){const n=ids.filter(id=>Sprites.sheets[id]).length;set(.08+.47*n/Math.max(1,ids.length),L.sheets);if(n>=ids.length||performance.now()-t0>12000)break;await frame();}}
    /* 3. the character cards (the same keys as UI.animate: 'menu:<id>:-1', frame 0, every idle expression) */
    {const EX=[null,'blink','happy','smug'];
      await slices(CHARS.length*EX.length,i=>{const c=CHARS[(i/EX.length)|0];Sprites.player('menu:'+c.id+':-1',cfgForForm(c,-1),0,false,EX[i%EX.length]);},.55,.8,L.chars);
      /* the big animated preview of the selected fighter (every pose frame, every form unlocked) */
      const d=app.save.d,C=CHARS.find(c=>c.id===d.lastChar)||CHARS[0],nf=Math.min(((d.maxForm||{})[C.id]||0),(LINES[C.line||'saiyan']||[]).length),jobs=[];
      for(let fm=-1;fm<nf;fm++)for(let f=0;f<=9;f++)jobs.push([fm,f]);
      await slices(jobs.length,i=>{const [fm,f]=jobs[i];Sprites.player('menu:'+C.id+':'+fm,cfgForForm(C,fm),f,false,null);},.8,.85,L.chars);}
    /* 4. one frame of every stage preview, into a scratch canvas (the same drawing as UI.animStages) */
    {const r=app.renderer,cv=document.createElement('canvas');cv.width=240;cv.height=96;const pc=cv.getContext('2d');
      await slices(STAGES.length,i=>{const th=STAGES[i].theme,Sc=th==='void'?.2:.4,vw=240/Sc,vh=96/Sc,old=r.ctx;
        let cx=i*733,cy=i*411;if(th==='snake'){cx=-3000+i*50;cy=Snake.f(cx)-vh/2;}if(th==='void'){cx=200-vw/2;cy=-228-vh/2;}
        try{r.ctx=pc;pc.setTransform(Sc,0,0,Sc,-cx*Sc,-cy*Sc);r.terrain(cx,cy,vw,vh,0,th);if(th==='void'){pc.translate(0,TOPARENA.TR*.4);TopArt.tower(pc,0);}}finally{r.ctx=old;}
      },.85,.95,L.stages);}
    /* 5. the character and stage screens opened once behind the loading screen: their canvases, contexts and layout are made now
          (the character cards keep their canvases between openings: UI.cardCv), then back to the main menu */
    {const ui=app.ui;try{ui.push('stages');for(let i=0;i<4;i++)await frame();set(.97,L.chars);ui.push('chars');for(let i=0;i<10;i++)await frame();}catch(e){}
      try{ui.show('main');}catch(e){}}
    /* v132: the art of the life and XP bars, decoded off the main thread and kept decoded (see Sprites.prep) */
    for(const B of[typeof HpBar!=='undefined'?HpBar:null,typeof XpBar!=='undefined'?XpBar:null]){const im=B&&B.img;
      if(im&&im.src&&typeof createImageBitmap==='function')fetch(im.src).then(r=>r.blob()).then(b=>createImageBitmap(b)).then(bm=>{bm.complete=true;B.img=bm;}).catch(()=>{});}
    set(1,L.ready);await frame();
    BOOT.on=false;el.classList.add('done');setTimeout(()=>el.remove(),600);
  };
  document.addEventListener('DOMContentLoaded',()=>{run().catch(e=>{console.error('boot',e);BOOT.on=false;el.remove();});});
})();

/* ====== v131: the same loading screen before a run, when the run still has things to prepare: the sprites of the stage's enemies and bosses
   (every frame, also the hit flash: Sprites.warm fills Sprites._wq at startGame, and the game used to paint them in its idle time while you
   played), the big sheets the stage needs (Snake Way islands, Tamagami statues: decoded on demand) and one whole frame (terrain, props, HUD).
   The game is held (state 'loading': App.tick neither updates nor draws it). A run with nothing left to prepare (a retry, the same stage
   again) starts at once: the screen only shows up when the work takes longer than one frame. Co-op runs never wait.
   v132: also the sheets the run draws (the stage's ground and props, chests, landmarks, event zones, the pet, the weapons and the hero's
   ability) are decoded off the main thread and kept decoded (Sprites.prep); while the run goes on, the sheets of the weapons owned, of the
   next tier of a weapon about to evolve and of the weapons offered in a window are asked for ahead of time. ====== */
(()=>{
  const TS=(it,en,es,fr,de,pt)=>T6(it,en,es,fr,de,pt);
  const PREP=TS('Preparo','Preparing','Preparando','Préparation de','Bereite vor:','Preparando'),FIGHT=TS('Pronti a combattere!','Ready to fight!','¡Listos para luchar!','Prêts au combat !','Kampfbereit!','Prontos para lutar!');
  const frame=()=>new Promise(r=>requestAnimationFrame(()=>r()));
  const mkEl=()=>{const d=document.createElement('div');d.id='boot';d.className='det prep';
    d.innerHTML='<div class="bt-logo"></div><div class="bt-ball"><i>★</i><i>★</i><i>★</i><i>★</i></div><div class="bt-bar"><div class="bt-fill" style="width:0%"></div><span class="bt-txt"></span></div><div class="bt-stage"></div>';
    if(typeof LOGO_URL!=='undefined'&&LOGO_URL){const im=new Image();im.className='bt-img';im.alt='';im.src=LOGO_URL;d.querySelector('.bt-logo').append(im);}
    document.body.append(d);return d;};
  /* the effect sheets of weapon w at tier t (0 base, 1 evolution, 2 second evolution): wfx<w>..., not those of a longer weapon id */
  const WS=new Map(),wfxOf=(w,t)=>{const k=w+':'+t;let L=WS.get(k);if(L)return L;L=[];const pre='wfx'+w,ws=Object.keys(WEAPONS).filter(o=>o!==w&&o.startsWith(w));
    for(const id in SPRITE_PACK)if(id.startsWith(pre)&&!ws.some(o=>id.startsWith('wfx'+o))&&(/ev2$/.test(id)?2:/evo$/.test(id)?1:0)===t)L.push(id);WS.set(k,L);return L;};
  const THEMES_=new Set(STAGES.map(s=>s.theme));
  /* the sheets of a run: every decoded sheet but the ground / props of other planets, the other pets and the weapon effects, then the effects
     of the weapons owned (the next tier too when it is close) and of the hero's ability */
  const runSheets=g=>{const out=new Set(),th=g.stage.theme;
    for(const id in Sprites.sheets){if(/^wfx/.test(id))continue;
      if(/^pet/.test(id)){if(g.pet&&g.pet.d&&id==='pet'+g.pet.d.id)out.add(id);continue;}
      const m=/^([a-z]+?)(ground|props)$/.exec(id);if(m&&THEMES_.has(m[1])&&m[1]!==th)continue;
      out.add(id);}
    wantW(g,out);return out;};
  const wantW=(g,out)=>{
    for(const [w,o] of g.weapons){const t=o.evo|0;for(const id of wfxOf(w,t))out.add(id);if(o.lv>=WMAX-1||o.maxed)for(const id of wfxOf(w,t+1))out.add(id);}
    const ab=g.C&&WFX.AB[g.C.id];if(ab)for(const id of['wfx'+ab,'wfx'+ab+'2'])if(SPRITE_PACK[id])out.add(id);
    const m=g.modal,L=m&&(m.opts||m.rewards||m.offers);   /* a window offers new weapons: their first sheet */
    if(Array.isArray(L))for(const op of L){const id=op&&op.id;if(id&&WEAPONS[id]&&!g.weapons.has(id))for(const x of wfxOf(id,0))out.add(x);}
    return out;};
  /* while a run goes on (every 0.5 s): the sheets of the weapons it has or is offered, ahead of time; a tier a weapon has left behind goes
     once nothing has drawn it for 10 s (WFX.S stamps the sheets it hands out with Sprites.clk) */
  setInterval(()=>{const a=APP_REF,g=a&&a.game;if(!g||!Sprites.live||!g.weapons)return;Sprites.clk++;
    try{const want=wantW(g,new Set());for(const id of want)Sprites.prep(id);
      for(const [w,o] of g.weapons)for(let t=0;t<(o.evo|0);t++)for(const id of wfxOf(w,t)){const S=Sprites.sheets[id];if(S&&S.bm&&!want.has(id)&&Sprites.clk-(S.used||0)>20)Sprites.unpinOne(id);}
    }catch(e){}},500);
  {const tm0=App.prototype.toMenu;App.prototype.toMenu=function(){Sprites.live=false;return tm0.apply(this,arguments);};}   /* the sheets stay decoded until the next run picks its own */
  const sg0=App.prototype.startGame;
  App.prototype.startGame=function(o){
    const out=sg0.call(this,o),g=this.game;
    if(g)Sprites.live=true;
    if(g&&(o.coop||g.coopView||BOOT.on)){try{const keep=runSheets(g);Sprites.unpin(keep);for(const id of keep)Sprites.prep(id);}catch(e){}}   /* co-op: decoded in the background, nobody waits */
    if(!g||o.coop||g.coopView||BOOT.on)return out;
    const app=this,q=Sprites._wq||[],t0=performance.now();
    /* the hero's own frames for every form of the run (walk, attack, hurt, death, the arm-less pose bodies, the hit flash): painted when first shown otherwise */
    const C=g.C,pt=[];
    if(C)for(let fi=-1;fi<g.formMax;fi++){const key=C.id+':'+fi,cfg=cfgForForm(C,fi),sh=Sprites.sheetFor&&Sprites.sheetFor(key);
      for(let f=0;f<=9;f++)pt.push([key,cfg,f,false]);for(let f=0;f<=4;f++)pt.push([key,cfg,f,true]);if(!sh)for(const b of[20,30])for(let f=0;f<=4;f++)pt.push([key,cfg,b+f,false]);
      for(const ex of['blink','pain','hurt','happy','smug','wow'])pt.push([key,cfg,0,false,ex]);}   /* the faces of the run: blink, the emotes (Game.emote), the death */
    const one=()=>{if(pt.length){const w=pt.shift();try{Sprites.player(w[0],w[1],w[2],w[3],w[4]||null);}catch(e){}}else{const w=q.shift();try{Sprites.forSp(w[0],w[1],w[2]);}catch(e){}}};
    const lazyWait=()=>{const d=Sprites._dec;if(!d)return 0;let n=0;for(const id of d)if(!Sprites.sheets[id]&&SPRITE_PACK[id])n++;return n;};
    /* the sheets of the run, decoded off the main thread while the frames are painted (the lazy ones join once loaded, see Sprites.decode) */
    let keep=runSheets(g);Sprites.unpin(keep);for(const id of keep)Sprites.prep(id);
    const bmLeft=()=>{let n=0;for(const id of keep)if(!Sprites.ready(id))n++;return n;};
    /* a first slice right now: when that empties the work, the run just starts */
    /* (when the stage still decodes a big sheet, nothing is painted yet: a decoded sheet clears the sprite caches, see Sprites.decode) */
    if(!lazyWait())while((pt.length||q.length)&&performance.now()-t0<14)one();
    if(!pt.length&&!q.length&&!lazyWait()&&!bmLeft())return out;
    const st=g.stage,tr=x=>app.i18n.t(x),total=pt.length+q.length+1;
    app.state='loading';BOOT.on=true;
    const el=mkEl(),fill=el.querySelector('.bt-fill'),txt=el.querySelector('.bt-txt');el.querySelector('.bt-stage').textContent=tr(st.n);
    const set=p=>{fill.style.width=(clamp(p,0,1)*100).toFixed(1)+'%';txt.textContent=tr(PREP)+' '+tr(st.n)+'…  '+Math.round(clamp(p,0,1)*100)+'%';};set(0);
    (async()=>{
      try{
        for(let t1=performance.now();lazyWait()&&performance.now()-t1<10000;)await frame();   /* first the big sheets of the stage (at most 10 s) */
        while(pt.length||q.length){const s0=performance.now();while((pt.length||q.length)&&performance.now()-s0<12)one();set(.8*(1-(pt.length+q.length)/total));await frame();}
        {keep=runSheets(g);for(const id of keep)Sprites.prep(id);const n0=Math.max(1,bmLeft());   /* the sheets still decoding (at most 8 s) */
          for(const t1=performance.now();bmLeft()&&performance.now()-t1<8000;){set(.8+.12*(1-bmLeft()/n0));await frame();}}
        set(.92);await frame();
        if(app.game===g){app.renderer.draw(g,0);set(1);txt.textContent=tr(FIGHT);await frame();}   /* one whole frame: terrain tiles, props, lakes, HUD art */
      }catch(e){console.error('prep',e);}
      if(app.game===g&&app.state==='loading')app.state='play';
      BOOT.on=false;el.classList.add('done');setTimeout(()=>el.remove(),500);
    })();
    return out;
  };
})();
