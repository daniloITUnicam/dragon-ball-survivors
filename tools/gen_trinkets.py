# generates src/js/trinkets2.js: >100 extra stat trinkets (different stat combinations); a few also give "Quantità" (projectiles)
import itertools, json
TCAP={'might':.15,'spd':.30,'xp':.30,'gold':.60,'crit':.14,'dodge':.25,'area':.30,'magnet':1.4,'hpPct':.45,'lootRate':1,'armor':4,'regen':1.6,'cd':.20}
STATS=list(TCAP)
KJ={'might':'力','spd':'速','xp':'学','gold':'金','crit':'眼','dodge':'避','area':'範','magnet':'引','hpPct':'命','lootRate':'宝','armor':'盾','regen':'癒','cd':'修','proj':'弾'}
ITEMS=[('Cintura','Belt'),('Bracciale','Bracer'),('Amuleto','Amulet'),('Anello','Ring'),('Medaglione','Medallion'),('Collana','Necklace'),('Fascia','Sash'),('Guanti','Gloves'),('Stivali','Boots'),('Mantello','Cape'),('Elmo','Helm'),('Orecchino','Earring'),('Talismano','Talisman'),('Pergamena','Scroll'),('Capsula','Capsule'),('Bandana','Bandana'),('Distintivo','Badge'),('Emblema','Emblem'),('Cristallo','Crystal'),('Sfera','Orb'),('Bastone','Staff'),('Spilla','Brooch'),('Sigillo','Seal'),('Gemma','Gem'),('Scudo','Shield'),('Maschera','Mask'),('Diadema','Circlet'),('Polsiera','Wristband'),('Tunica','Tunic'),('Pendente','Pendant'),('Corona','Crown'),('Sandali','Sandals'),('Spallina','Pauldron'),('Corno','Horn'),('Fiala','Vial'),('Tessera','Card'),('Orologio','Watch')]
PH={
'might':[("del Guerriero","of the Warrior"),("della Furia","of Fury"),("del Pugno Ferreo","of the Iron Fist"),("del Gigante","of the Giant"),("del Campione","of the Champion"),("dell'Orgoglio Saiyan","of Saiyan Pride"),("del Torneo","of the Tournament")],
'spd':[("del Vento","of the Wind"),("del Lampo","of Lightning"),("della Corsa","of the Sprint"),("della Nuvola","of the Cloud"),("del Falco","of the Hawk"),("del Tuono","of Thunder"),("dello Scatto","of the Dash")],
'xp':[("del Saggio","of the Sage"),("dello Studio","of Study"),("della Meditazione","of Meditation"),("del Maestro","of the Master"),("dell'Allenamento","of Training"),("della Sapienza","of Wisdom"),("del Dojo","of the Dojo")],
'gold':[("del Mercante","of the Merchant"),("della Fortuna","of Fortune"),("del Tesoro","of the Treasure"),("dello Zenny","of Zenny"),("del Banchiere","of the Banker"),("della Capsule Corp.","of Capsule Corp."),("dell'Oro","of Gold")],
'crit':[("del Cecchino","of the Sniper"),("dell'Occhio Acuto","of the Keen Eye"),("della Precisione","of Precision"),("del Cacciatore","of the Hunter"),("dell'Assassino","of the Assassin"),("del Colpo Mortale","of the Killing Blow"),("dello Sguardo","of the Gaze")],
'dodge':[("dell'Ombra","of the Shadow"),("della Nebbia","of the Mist"),("del Fantasma","of the Ghost"),("della Danza","of the Dance"),("del Ninja","of the Ninja"),("dell'Illusione","of Illusion"),("del Miraggio","of the Mirage")],
'area':[("dell'Onda","of the Wave"),("della Tempesta","of the Storm"),("dell'Esplosione","of the Blast"),("del Vortice","of the Vortex"),("del Cataclisma","of the Cataclysm"),("della Cupola","of the Dome"),("dell'Eco","of the Echo")],
'magnet':[("della Calamita","of the Magnet"),("del Raccoglitore","of the Collector"),("del Radar","of the Radar"),("dell'Attrazione","of Attraction"),("del Richiamo","of the Call"),("dell'Esploratore","of the Explorer"),("del Drago","of the Dragon")],
'hpPct':[("della Vita","of Life"),("del Vigore","of Vigor"),("della Tartaruga","of the Turtle"),("dell'Eroe","of the Hero"),("della Resistenza","of Endurance"),("del Colosso","of the Colossus"),("della Salute","of Health")],
'lootRate':[("del Predatore","of the Predator"),("del Bottino","of Loot"),("del Saccheggio","of Plunder"),("del Corsaro","of the Pirate"),("della Caccia","of the Hunt"),("del Ladro","of the Thief"),("dell'Abbondanza","of Plenty")],
'armor':[("del Guardiano","of the Guardian"),("della Roccia","of Stone"),("dell'Acciaio","of Steel"),("della Fortezza","of the Fortress"),("del Muro","of the Wall"),("della Corazza","of the Carapace"),("del Bastione","of the Bastion")],
'regen':[("della Rinascita","of Rebirth"),("del Senzu","of the Senzu"),("del Fiore","of the Flower"),("della Guarigione","of Healing"),("della Fenice","of the Phoenix"),("della Sorgente","of the Spring"),("del Respiro","of Breath")],
'cd':[("del Tempo","of Time"),("dello Spirito","of the Spirit"),("dell'Orologio","of the Clock"),("del Ritmo","of Tempo"),("della Concentrazione","of Focus"),("del Kata","of the Kata"),("della Calma","of Calm")],
'proj':[("della Pioggia di Ki","of the Ki Rain"),("dei Mille Colpi","of a Thousand Blows"),("della Raffica","of the Barrage"),("dello Sciame","of the Swarm"),("della Tempesta di Ki","of the Ki Storm"),("dei Cento Pugni","of the Hundred Fists"),("della Moltitudine","of the Multitude")],
}
combos=[]  # (stats list, shares list, minR)
pairs=list(itertools.combinations(STATS,2))
for n,(a,b) in enumerate(pairs):
    sh=(.7,.5) if n%2==0 else (.5,.7)
    combos.append(([a,b],list(sh),None))
trip=list(itertools.combinations(STATS,3))
sel=[];i=3
seen_stats={s:0 for s in STATS}
# 40 triples spread over the 286: step 7, then fill to cover every stat
for idx in range(0,len(trip),7):
    sel.append(trip[idx])
    if len(sel)==40:break
for t in sel: combos.append((list(t),[.5,.45,.4],None))
# a few that also give Quantità (Legendary and Mythic only)
for s in (['might'],['crit'],['cd'],['area'],['spd'],['hpPct'],['xp'],['armor'],['might','cd'],['area','crit']):
    combos.append((['proj']+s,[1]+([.5] if len(s)==1 else [.4,.4]),3))
used={'Pergamena della Tartaruga','Scroll of the Turtle'};cnt={s:0 for s in PH};out=[]
for n,(st,sh,minR) in enumerate(combos):
    prim=st[0] if st[0]=='proj' else st[n%len(st)]
    ph=PH[prim][cnt[prim]%len(PH[prim])];cnt[prim]+=1
    ii=(n*5+cnt[prim]*3)%len(ITEMS)
    while True:
        name=(ITEMS[ii][0]+' '+ph[0],ITEMS[ii][1]+' '+ph[1])
        if name[0] not in used and name[1] not in used:break
        ii=(ii+1)%len(ITEMS)
    used.add(name[0]);used.add(name[1])
    m={}
    for s,w in zip(st,sh):
        m[s]=1 if s=='proj' else round(TCAP[s]*w,3)
    tid='cx_'+'_'.join(st)
    out.append(dict(id=tid,r=3,k=KJ[prim if prim!='proj' else 'proj'],n=name,m=m,minR=minR))
js=["/* Extra stat trinkets (generated by tools/gen_trinkets.py): every combination of two or three stats exists once and, like all the stat trinkets, at every rarity (common .. mythic).",
    "   The numbers are the Legendary values (a share of each stat's cap, TCAP): the other rarities scale from them. proj = Quantità (+projectiles for every weapon): only Legendary and Mythic, 2-3 / 3-5 depending on the roll. */",
    "const TRINKETS_X=["]
for t in out:
    m=','.join(f"{k}:{v}" for k,v in t['m'].items())
    mr=f",minR:{t['minR']}" if t['minR'] else ''
    js.append(f" {{id:'{t['id']}',r:3,k:'{t['k']}',n:T({json.dumps(t['n'][0],ensure_ascii=False)},{json.dumps(t['n'][1])}),d:T('',''),m:{{{m}}}{mr}}},")
js[-1]=js[-1].rstrip(',')
js.append("];")
js.append("for(const t of TRINKETS_X){t.d=trinDesc(t,t.r);TRINKETS.push(t);}")
open('/home/claude/dbs/src/js/trinkets2.js','w',encoding='utf8').write('\n'.join(js)+'\n')
print(len(out),'trinkets;',len([o for o in out if o['minR']]),'with Quantità; names unique:',len(used)//2-1)
