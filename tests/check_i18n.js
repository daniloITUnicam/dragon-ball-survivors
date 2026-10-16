const fs=require('fs'),path=require('path');
const SRC=path.join(__dirname,'..','src','js');
let code=['i18n','i18n2','i18n3'].map(f=>fs.readFileSync(path.join(SRC,f+'.js'),'utf8')).join('\n')+';globalThis.__S=STR;';(0,eval)(code);
const S=globalThis.__S,keys=new Set();
const extra=[];for(const a of['up','down','left','right','confirm','cancel','pause','interact','pet','debug'])extra.push('act_'+a);
for(const a of['general','audio','video','controls'])extra.push('tab_'+a);for(const a of['coins','kills','time','bosses','clear'])extra.push('rw_'+a);
extra.push('level','bossKills','time');
for(const f of['ui.js','ui2.js','ui_patch.js','update.js','renderer.js','app.js','game.js']){
  const s=fs.readFileSync(path.join(SRC,f),'utf8');
  for(const m of s.matchAll(/(?:this\.t|\bt|tt|this\.app\.t|this\.tt|this\.btn|this\.header)\(\s*'([A-Za-z0-9_]+)'/g))keys.add(m[1]);
}
for(const e of extra)keys.add(e);
let bad=0;
for(const k of keys){if(k==='act_'||k==='tab_')continue;for(const l of['it','en','es','fr','de','pt'])if(!S[l][k]){console.log('MISSING',l,k);bad++;}}
for(const k of Object.keys(S.it))if(!S.en[k]){console.log('EN missing',k);bad++;}
for(const k of Object.keys(S.en))if(!S.it[k]){console.log('IT missing',k);bad++;}
console.log(bad?'FAIL '+bad:'i18n OK ('+keys.size+' keys, '+Object.keys(S.it).length+' strings)');
process.exit(bad?1:0);
