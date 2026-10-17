'use strict';
/* ============================================================
   Map events: every stage has its own Dragon Ball set piece (a few minutes apart, ~30-45 s), replacing the old generic "kamikaze wave".
   An event is a short script (MAP_EVENTS[theme].steps) run by Game.evUpdate:
     - 'spots'  places n markers around the player; each one plays its animation (seed sprouting, capsule falling, portal opening...) and after
                `tel` seconds the enemies of `mix` come out of it (optionally with a ground blast `hz` that hurts when you stand there)
     - 'morph'  the enemies named in `map` transform into their stronger form (aura, shockwave, new look) - the Dragon Ball "power up"
     - 'buff'   a war cry: the crowd on screen moves faster for a few seconds
     - 'tint'   the sky changes colour (the Full Moon)
   The drawing of the markers / the sky is in Renderer.drawEvents / eventOverlay. ============================================================ */
const T6=(it,en,es,fr,de,pt)=>({it,en,es,fr,de,pt});
const MAP_EVENTS={
  /* Saiyan Plains: the Saibaman seeds sprout, then the seedlings ripen into kamikazes */
  plains:{n:T6('SEMI DI SAIBAMAN!','SAIBAMAN SEEDS!','¡SEMILLAS DE SAIBAMAN!','GRAINES DE SAIBAIMAN !','SAIBAMAN-SAMEN!','SEMENTES DE SAIBAMAN!'),
    sub:T6('Germogliano intorno a te...','They sprout all around you...','Brotan a tu alrededor...','Elles germent autour de toi...','Sie sprießen um dich herum...','Brotam à tua volta...'),col:'#8be05a',dur:38,first:[260,330],gap:[300,400],steps:[
    {at:1,a:'spots',kind:'seed',n:6,r:[150,260],tel:3,mix:[['saiseed',1]],per:1},
    {at:10,a:'spots',kind:'seed',n:6,r:[170,280],tel:2.6,mix:[['saiseed',3],['sai',2]],per:1},
    {at:17,a:'morph',map:{saiseed:'bomb'},max:10,col:'#8be05a',l:T6('Maturi!','Ripe!','¡Maduros!','Mûrs !','Reif!','Maduros!')},
    {at:24,a:'spots',kind:'seed',n:7,r:[190,300],tel:2.4,mix:[['bomb',3],['bomb2',1]],per:1}]},
  /* Namek: Frieza's attack pods crash down */
  namek:{n:T6('NAVICELLE DI FREEZER!','FRIEZA\'S ATTACK PODS!','¡NAVES DE FREEZER!','CAPSULES DE FREEZER !','FRIEZAS RAUMKAPSELN!','NAVES DE FREEZA!'),
    sub:T6('Cadono dal cielo: non restare sotto!','They fall from the sky: do not stand under them!','Caen del cielo: ¡no te quedes debajo!','Elles tombent du ciel : ne reste pas dessous !','Sie fallen vom Himmel: nicht darunter stehen!','Caem do céu: não fiques por baixo!'),col:'#ff7ad0',dur:34,first:[170,240],gap:[260,360],steps:[
    {at:1,a:'spots',kind:'pod',n:5,r:[140,250],tel:2.3,mix:[['fsol',3],['nam',2],['fbomb',2]],per:2,hz:1},
    {at:12,a:'spots',kind:'pod',n:6,r:[160,280],tel:2.1,mix:[['fsol2',1],['ginyurec',2],['fsol',2]],per:2,hz:1},
    {at:23,a:'buff',col:'#ff7ad0',l:T6('Squadra Ginyu!','Ginyu Force!','¡Fuerza Ginyu!','Force Ginyu !','Ginyu-Force!','Força Ginyu!')},
    {at:24,a:'spots',kind:'pod',n:4,r:[170,290],tel:2,mix:[['ginyurec',1]],per:2,hz:1}]},
  /* Android Ruins: the lab capsules open, the cyborgs overload */
  waste:{n:T6('ANDROIDI RISVEGLIATI!','ANDROIDS ACTIVATED!','¡ANDROIDES ACTIVADOS!','ANDROÏDES ACTIVÉS !','ANDROIDEN AKTIVIERT!','ANDROIDES ATIVADOS!'),
    sub:T6('Le capsule del laboratorio si aprono.','The lab capsules are opening.','Las cápsulas del laboratorio se abren.','Les capsules du labo s\'ouvrent.','Die Laborkapseln öffnen sich.','As cápsulas do laboratório abrem.'),col:'#7aff9a',dur:36,first:[170,240],gap:[260,360],steps:[
    {at:1,a:'spots',kind:'capsule',n:6,r:[150,260],tel:2.6,mix:[['and',3],['cyber',3],['andgun',1]],per:1},
    {at:12,a:'morph',map:{cyber:'cyber2'},max:8,col:'#ff3b3b',l:T6('Sovraccarico!','Overload!','¡Sobrecarga!','Surcharge !','Überlastung!','Sobrecarga!')},
    {at:14,a:'spots',kind:'capsule',n:6,r:[170,290],tel:2.4,mix:[['kam',3],['cyber',2],['drn',1]],per:1},
    {at:24,a:'spots',kind:'capsule',n:4,r:[190,300],tel:2.2,mix:[['andtank',1],['cyber',2]],per:1}]},
  /* Buu's Dimension: pink portals, Buu inflates his minions */
  other:{n:T6('PORTALI DI MAJIN BU!','MAJIN BUU\'S PORTALS!','¡PORTALES DE MAJIN BU!','PORTAILS DE MAJIN BU !','MAJIN-BUUS PORTALE!','PORTAIS DE MAJIN BU!'),
    sub:T6('Bu gonfia i suoi servitori...','Buu swells his minions...','Bu hincha a sus sirvientes...','Bu gonfle ses serviteurs...','Buu bläst seine Diener auf...','Bu infla os seus servos...'),col:'#ff9ae0',dur:36,first:[180,250],gap:[260,360],steps:[
    {at:1,a:'spots',kind:'portal',n:6,r:[150,260],tel:2.5,mix:[['majinsol',3],['gel',1],['rubber',1]],per:1},
    {at:12,a:'morph',map:{majinsol:'majinsol2'},max:8,col:'#ff9ae0',l:T6('Gonfiato da Bu!','Inflated by Buu!','¡Hinchado por Bu!','Gonflé par Bu !','Von Buu aufgeblasen!','Inflado por Bu!')},
    {at:14,a:'spots',kind:'portal',n:6,r:[170,290],tel:2.3,mix:[['fus',2],['majinfury',2],['majinshot',1]],per:1},
    {at:25,a:'spots',kind:'portal',n:4,r:[190,300],tel:2.1,mix:[['majinsol',2],['fus',1]],per:2}]},
  /* Tournament of Power: Pride Troopers charge in formation, then ascend */
  void:{n:T6('ASSALTO DEI PRIDE TROOPERS!','PRIDE TROOPERS ASSAULT!','¡ASALTO DE LOS PRIDE TROOPERS!','ASSAUT DES PRIDE TROOPERS !','ANSTURM DER PRIDE TROOPERS!','ASSALTO DOS PRIDE TROOPERS!'),
    sub:T6('Avanzano in formazione compatta.','They advance in tight formation.','Avanzan en formación cerrada.','Ils avancent en formation serrée.','Sie rücken in enger Formation vor.','Avançam em formação cerrada.'),col:'#ff6a5a',dur:36,first:[180,250],gap:[260,360],steps:[
    {at:1,a:'spots',kind:'march',n:8,r:[300,330],tel:1.6,mix:[['fighter',1]],per:1,line:1},
    {at:11,a:'spots',kind:'march',n:8,r:[300,330],tel:1.6,mix:[['war',2],['phantom',1]],per:1,line:1},
    {at:19,a:'morph',map:{war:'war2'},max:8,col:'#8ad8ff',l:T6('Ascesa!','Ascension!','¡Ascenso!','Ascension !','Aufstieg!','Ascensão!')},
    {at:21,a:'spots',kind:'march',n:6,r:[300,330],tel:1.5,mix:[['unibomb',1]],per:1,line:1}]},
  /* Roshi's Island: Red Ribbon paratroopers */
  beach:{n:T6('PARACADUTISTI RED RIBBON!','RED RIBBON PARATROOPERS!','¡PARACAIDISTAS DE LA RED RIBBON!','PARACHUTISTES DU RED RIBBON !','RED-RIBBON-FALLSCHIRMJÄGER!','PARAQUEDISTAS DA RED RIBBON!'),
    sub:T6('Atterrano da ogni parte.','They land from every side.','Aterrizan por todas partes.','Ils atterrissent de partout.','Sie landen von allen Seiten.','Aterram por todo o lado.'),col:'#ff6a5a',dur:34,first:[170,240],gap:[260,360],steps:[
    {at:1,a:'spots',kind:'chute',n:6,r:[150,270],tel:2.8,mix:[['rrs',2],['gun',2],['pirate',1]],per:1},
    {at:11,a:'spots',kind:'chute',n:6,r:[170,290],tel:2.6,mix:[['rrbomb',3],['pirate',2]],per:1},
    {at:19,a:'morph',map:{pirate:'pirate2'},max:6,col:'#ff5a3d',l:T6('Capitano!','Captain!','¡Capitán!','Capitaine !','Kapitän!','Capitão!')},
    {at:21,a:'spots',kind:'chute',n:5,r:[190,300],tel:2.4,mix:[['rrs',1],['gun',1],['ninja',1]],per:2}]},
  /* Planet Vegeta: the Full Moon rises and the Saiyans become Great Apes */
  redrock:{n:T6('LUNA PIENA!','FULL MOON!','¡LUNA LLENA!','PLEINE LUNE !','VOLLMOND!','LUA CHEIA!'),
    sub:T6('I Saiyan si trasformano in Oozaru.','The Saiyans turn into Great Apes.','Los Saiyans se transforman en Oozaru.','Les Saiyans deviennent des Oozaru.','Die Saiyajin werden zu Oozaru.','Os Saiyans transformam-se em Oozaru.'),col:'#c8a0ff',dur:36,first:[170,240],gap:[270,370],steps:[
    {at:0.5,a:'tint',col:'#1a1048',k:.42,moon:1,dur:34},
    {at:2,a:'spots',kind:'march',n:8,r:[290,330],tel:1.4,mix:[['srenegade',3],['sberserk',1]],per:1},
    {at:9,a:'morph',map:{srenegade:'sberserk2',sberserk:'sberserk2'},max:5,col:'#ff5a3d',l:T6('OOZARU!','GREAT APE!','¡OOZARU!','OOZARU !','OOZARU!','OOZARU!'),roar:1},
    {at:15,a:'spots',kind:'meteor',n:5,r:[120,250],tel:2,mix:[['magmabomb',1]],per:1,hz:1},
    {at:23,a:'spots',kind:'march',n:6,r:[290,330],tel:1.4,mix:[['srenegade',2],['sberserk',1],['lakasei',1]],per:1}]},
  /* Cell Games: Cell Jr.s hatch from eggs, one by one they grow armored */
  arena:{n:T6('SCHIUSA DEI CELL JR.!','CELL JR. HATCHING!','¡ECLOSIÓN DE CELL JR.!','ÉCLOSION DES CELL JR. !','CELL-JR.-SCHLUPF!','ECLOSÃO DOS CELL JR.!'),
    sub:T6('Le uova si crepano sul ring.','The eggs crack open on the ring.','Los huevos se rompen en el ring.','Les œufs se fissurent sur le ring.','Die Eier reißen auf dem Ring auf.','Os ovos racham no ringue.'),col:'#8be05a',dur:36,first:[170,240],gap:[260,360],steps:[
    {at:1,a:'spots',kind:'egg',n:6,r:[150,260],tel:2.8,mix:[['cel',1]],per:1},
    {at:11,a:'morph',map:{cel:'celltank'},max:4,col:'#c8ffa0',l:T6('Si corazza!','Armored!','¡Se acoraza!','Cuirassé !','Gepanzert!','Blindado!')},
    {at:13,a:'spots',kind:'egg',n:6,r:[170,290],tel:2.5,mix:[['cel',3],['cellbomb',2]],per:1},
    {at:24,a:'spots',kind:'egg',n:5,r:[190,300],tel:2.3,mix:[['cellbomb',1]],per:2}]},
  /* Realm of the Gods: pillars of light, Hakai spheres */
  sky:{n:T6('DISCESA DEI CELESTI!','THE CELESTIALS DESCEND!','¡DESCENSO CELESTIAL!','DESCENTE DES CÉLESTES !','ABSTIEG DER HIMMLISCHEN!','DESCIDA DOS CELESTIAIS!'),
    sub:T6('Colonne di luce... e sfere della distruzione.','Pillars of light... and spheres of destruction.','Columnas de luz... y esferas de destrucción.','Colonnes de lumière... et sphères de destruction.','Lichtsäulen... und Kugeln der Zerstörung.','Colunas de luz... e esferas de destruição.'),col:'#ffe9a0',dur:36,first:[180,250],gap:[270,370],steps:[
    {at:1,a:'spots',kind:'pillar',n:6,r:[150,260],tel:2.6,mix:[['celsol',3],['monk',1],['cloudspirit',1]],per:1},
    {at:8,a:'spots',kind:'hakai',n:4,r:[60,200],tel:1.9,mix:[],per:0,hz:1.2},
    {at:13,a:'morph',map:{celsol:'celsol2'},max:8,col:'#ffe9a0',l:T6('Ascende!','Ascends!','¡Asciende!','Il s\'élève !','Er steigt auf!','Ascende!')},
    {at:16,a:'spots',kind:'hakai',n:5,r:[60,230],tel:1.8,mix:[],per:0,hz:1.2},
    {at:20,a:'spots',kind:'pillar',n:5,r:[170,290],tel:2.4,mix:[['holybomb',2],['seraph',1],['celsol',1]],per:1}]},
  /* Hell: fire erupts from fissures, the demons go berserk */
  hell:{n:T6('LE PORTE DELL\'INFERNO!','THE GATES OF HELL!','¡LAS PUERTAS DEL INFIERNO!','LES PORTES DE L\'ENFER !','DIE TORE DER HÖLLE!','OS PORTÕES DO INFERNO!'),
    sub:T6('Il suolo si spacca: i dannati fuggono.','The ground splits: the damned break free.','El suelo se parte: los condenados escapan.','Le sol se fend : les damnés s\'échappent.','Der Boden bricht auf: die Verdammten entkommen.','O chão racha: os condenados fogem.'),col:'#ff7a2a',dur:36,first:[180,250],gap:[270,370],steps:[
    {at:1,a:'spots',kind:'fissure',n:6,r:[140,250],tel:2.4,mix:[['dem',2],['imp',3],['damned',1]],per:1,hz:.8},
    {at:12,a:'morph',map:{dem:'dem2'},max:8,col:'#ff3b2a',l:T6('Infuriati!','Enraged!','¡Enfurecidos!','Enragés !','Wütend!','Enfurecidos!')},
    {at:14,a:'spots',kind:'fissure',n:6,r:[160,280],tel:2.2,mix:[['hellbomb',2],['gho',2],['dem',1]],per:1,hz:.8},
    {at:25,a:'spots',kind:'fissure',n:4,r:[180,290],tel:2,mix:[['ass',1],['imp',2]],per:2,hz:.8}]},
  /* Snake Way: the guardians of the afterlife march down the body, its champions ascend */
  snake:{n:T6('MARCIA DEI GUARDIANI!','MARCH OF THE GUARDIANS!','¡MARCHA DE LOS GUARDIANES!','MARCHE DES GARDIENS !','MARSCH DER WÄCHTER!','MARCHA DOS GUARDIÕES!'),
    sub:T6('Il sentiero trema sotto i loro passi.','The path trembles under their steps.','El sendero tiembla bajo sus pasos.','Le chemin tremble sous leurs pas.','Der Pfad bebt unter ihren Schritten.','O caminho treme sob os seus passos.'),col:'#ffe9a0',dur:36,first:[170,240],gap:[260,360],steps:[
    {at:1,a:'spots',kind:'march',n:8,r:[300,330],tel:1.5,mix:[['swguard',3],['swknight',1]],per:1,line:1},
    {at:9,a:'spots',kind:'march',n:4,r:[300,330],tel:1.5,mix:[['swwarrior',1]],per:1,line:1},
    {at:17,a:'morph',map:{swwarrior:'swwarrior2'},max:6,col:'#ff7a3a',l:T6('Campione!','Champion!','¡Campeón!','Champion !','Champion!','Campeão!')},
    {at:19,a:'spots',kind:'march',n:6,r:[300,330],tel:1.4,mix:[['swbomb',2],['swguard',1]],per:1,line:1}]}
};
const EV_COL={seed:'#8be05a',pod:'#ff7ad0',capsule:'#7aff9a',portal:'#ff9ae0',march:'#ff6a5a',chute:'#ff6a5a',egg:'#8be05a',pillar:'#ffe9a0',hakai:'#c060ff',fissure:'#ff7a2a',meteor:'#ff9a3a'};

Object.assign(Game.prototype,{
  /* called every frame from update(): schedules the stage's event, runs it, cleans up */
  evUpdate(dt){
    const D=MAP_EVENTS[this.stage.theme],ev=this.ev;
    if(!D&&!this.bombOn)return;
    if(!this.bombOn){
      this.bombT-=dt;
      if(this.bombT<=0){
        if(this.bossAlive>0||this.finalSpawned||this.prog()>.9||this.wave.ph==='surge'||this.xform){this.bombT=12;return;}   /* never on top of a boss, a surge, a transformation or the closing minute */
        this.evStart(D);
      }
      return;
    }
    if(!ev){if(this.t>=this.bombEnd)this.evEnd();return;}   /* a flag set from outside (tests): behave like the old timed wave */
    if(this.bossAlive>0){this.evEnd(true);return;}          /* a boss arrives: the event is over */
    ev.t+=dt;
    for(const st of ev.steps)if(!st.done&&ev.t>=st.s.at){st.done=true;this.evStep(st.s);}
    for(const s of ev.spots){
      s.t+=dt;
      if(s.t>=0&&!s.hz0){s.hz0=true;if(s.hz)this.bz.push({x:s.x,y:s.y,r:s.hzr||56,t:0,dur:s.tel,dmg:s.hz,c:s.col});if(s.kind==='pod'||s.kind==='meteor'||s.kind==='hakai')this.audio.sfx('warn');}
      if(s.t>=s.tel&&!s.fired){s.fired=true;this.evFire(s);}
    }
    ev.spots=ev.spots.filter(s=>s.t<s.tel+.6);
    if(ev.tint&&ev.t>ev.tint.t0+ev.tint.dur)ev.tint=null;
    if(ev.t>=ev.D.dur&&!ev.spots.length)this.evEnd();
  },
  evStart(D){
    this.ev={D,t:0,spots:[],tint:null,steps:D.steps.map(s=>({s,done:false}))};
    this.bombOn=true;this.bombEnd=this.t+D.dur+8;
    this.say(this.env.tr(D.n),D.col,3,this.env.tr(D.sub));this.audio.sfx('boss');this.shake=Math.max(this.shake,.25);
  },
  evEnd(cut){
    const D=MAP_EVENTS[this.stage.theme];
    this.bombOn=false;this.ev=null;this.bombT=D?rnd(D.gap[0],D.gap[1])*this.evK:rnd(260,380)*this.evK;
    for(const e of this.en)if(e.ai==='explode'&&!(e.fuse>0)){e.dead=true;this.burst(e.x,e.y-8,5,'#ffb13b');}   /* the unlit kamikazes leave with the event */
  },
  evStep(s){
    const p=this.p,ev=this.ev,col=s.col||ev.D.col;
    if(s.a==='spots'){
      const n=s.n,a0=rnd(0,TAU),over=this.en.length>this.spawnCap()*1.3+14;
      if(over&&!s.hz)return;   /* the screen is already full: skip the enemies (the ground blasts still come) */
      const lineA=s.line?rnd(0,TAU):0;
      /* the enemies of the step come out in the proportions of the mix (a shuffled deck, not a coin toss per spot): a morph that follows always finds its targets */
      const deck=[];if(s.mix&&s.mix.length&&s.per)for(const m of s.mix)for(let q=0;q<Math.max(1,Math.round(m[1]));q++)deck.push(m[0]);
      shuffle(deck);
      for(let i=0;i<n;i++){
        let x,y;
        if(s.line&&this.stage.theme!=='snake'){const d=rnd(s.r[0],s.r[1]),sp=(i-(n-1)/2)*46;x=p.x+Math.cos(lineA)*d-Math.sin(lineA)*sp;y=p.y+Math.sin(lineA)*d+Math.cos(lineA)*sp;}
        else{const a=a0+i/n*TAU+rnd(-.25,.25);[x,y]=this.spawnSpot(a,rnd(s.r[0],s.r[1]),i);}
        const hz=s.hz?(8+3*this.sd)*this.dmgMul()*s.hz:0;
        ev.spots.push({x,y,t:-i*(s.line?.1:.14),tel:s.tel*rnd(.92,1.08),kind:s.kind,col:EV_COL[s.kind]||col,mix:s.mix,ids:deck.length?Array.from({length:s.per},(_,k)=>deck[(i*s.per+k)%deck.length]):null,per:s.per,hz,hzr:s.kind==='hakai'?70:56,ph:rnd(0,TAU)});
      }
    }else if(s.a==='morph'){
      let k=0;const vr=this.viewR*1.2;
      for(const e of this.en){
        if(k>=(s.max||6))break;
        const to=!e.dead&&!e.boss&&s.map[e.def.id];if(!to||!ENEMIES[to])continue;
        if(Math.hypot(e.x-p.x,e.y-p.y)>vr)continue;
        this.skMorph(e,ENEMIES[to]);e.enr=1;e.rc=s.col||col;e.fl=.2;k++;
        this.ring(e.x,e.y,110,e.rc,.6);this.ring(e.x,e.y,56,'#ffffff',.4);this.burst(e.x,e.y-e.r,14,e.rc);
        if(k<=3)this.floatText(e.x,e.y-e.r*2.6,this.env.tr(s.l),1);
      }
      if(k){this.audio.sfx('xburst');this.shake=Math.max(this.shake,s.roar?.4:.2);this.flash=Math.max(this.flash,.1);this.flashC=s.col||col;
        if(s.roar)this.say(this.env.tr(s.l),s.col||col,2.2);}
    }else if(s.a==='buff'){
      const vr=this.viewR;
      for(const e of this.en)if(!e.dead&&!e.boss&&Math.hypot(e.x-p.x,e.y-p.y)<vr){e.buff=4;}
      this.ring(p.x,p.y,vr*.9,col,.8);this.floatText(p.x,p.y-80,this.env.tr(s.l),1);this.audio.sfx('shrine');this.shake=Math.max(this.shake,.15);
    }else if(s.a==='tint'){
      ev.tint={col:s.col,k:s.k,moon:!!s.moon,t0:ev.t,dur:s.dur};
    }
  },
  /* a marker finished its animation: the enemies step out */
  evFire(s){
    this.ring(s.x,s.y,70,s.col,.5);this.burst(s.x,s.y-6,12,s.col);
    if(s.kind==='pod'||s.kind==='meteor'||s.kind==='hakai'){this.shake=Math.max(this.shake,.12);}
    else{this.audio.sfx('land');if(!FXL.on)this.pillar(s.x,s.y,s.col,.6);}
    if(!s.mix||!s.mix.length||!s.per)return;
    const cap=this.spawnCap()*1.35+16;
    for(let k=0;k<s.per&&this.en.length<cap;k++){
      const id=s.ids?s.ids[k]:wpick(s.mix,m=>m[1])[0],def=ENEMIES[id];if(!def)continue;
      this.en.push(this.mkEnemy(def,s.x+rnd(-12,12),s.y+rnd(-8,8)));
    }
  }
});
