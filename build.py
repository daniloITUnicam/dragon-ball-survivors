#!/usr/bin/env python3
"""Bundle src/ into a single self-contained HTML (dist/dragon-ball-survivors.html).
Usage: python3 build.py [--check]   (--check runs `node --check` on the bundled script)"""
import re, sys, subprocess, pathlib, urllib.parse
ROOT = pathlib.Path(__file__).parent
ORDER = ['util','data','i18n','i18n2','i18n3','weapons','weapons2','world','config','save','cloud','game','sprites','sprites_hd','menubg','audio','input','renderer','uiicons','ui','ui2','ui_account','grimoire','app']
js = '\n'.join((ROOT/'src/js'/f'{n}.js').read_text(encoding='utf8') for n in ORDER)
import base64, os, json
# ---- cloud (Supabase) settings: env vars (CI) or cloud.config.json; empty = cloud features hidden ----
_cc = {}
_cf = ROOT/'cloud.config.json'
if _cf.exists():
    _cc = json.loads(_cf.read_text(encoding='utf8'))
_url = (os.environ.get('SUPABASE_URL') or _cc.get('url') or '').strip().rstrip('/')
_key = (os.environ.get('SUPABASE_ANON_KEY') or _cc.get('key') or '').strip()
_goo = (os.environ.get('SUPABASE_GOOGLE') or ('1' if _cc.get('google') else '')).strip().lower() in ('1','true','yes')
_ok = re.compile(r'^[A-Za-z0-9_\-.:/]*$')
if not (_ok.match(_url) and _ok.match(_key)):
    sys.exit('invalid characters in SUPABASE_URL / SUPABASE_ANON_KEY')
js = js.replace('__SUPABASE_URL__', _url).replace('__SUPABASE_KEY__', _key).replace('__SUPABASE_GOOGLE__', '1' if _goo else '')
print('cloud:', 'ON ('+_url+')' if _url and _key else 'off (no Supabase settings)')
_mp3 = ROOT/'assets'/'menu.mp3'
if _mp3.exists():
    js = js.replace('__MENU_MP3__', base64.b64encode(_mp3.read_bytes()).decode())
_logo = ROOT/'assets'/'logo.webp'
js = js.replace('__LOGO__', base64.b64encode(_logo.read_bytes()).decode() if _logo.exists() else '')
_nk = ROOT/'assets'/'namek.mp3'
if _nk.exists():
    js = js.replace('__NAMEK_MP3__', base64.b64encode(_nk.read_bytes()).decode())
css = (ROOT/'src/css/style.css').read_text(encoding='utf8')
html = (ROOT/'src/index.html').read_text(encoding='utf8')
glyphs = re.search(r"GLYPHS='([^']+)'", js).group(1)
html = html.replace('__GLYPHS__', urllib.parse.quote(''.join(dict.fromkeys(glyphs))))
html = html.replace('/*__CSS__*/', css).replace('/*__JS__*/', js.replace('</script>', '<\\/script>'))
out = pathlib.Path(os.environ['DBS_OUT']) if os.environ.get('DBS_OUT') else ROOT/'dist'/'dragon-ball-survivors.html'
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding='utf8')
print(f'built {out} ({out.stat().st_size/1024:.0f} KB)')
if '--check' in sys.argv:
    tmp = ROOT/'dist'/'_bundle.js'; tmp.write_text(js, encoding='utf8')
    r = subprocess.run(['node','--check',str(tmp)], capture_output=True, text=True); tmp.unlink()
    print('syntax OK' if r.returncode == 0 else r.stderr); sys.exit(r.returncode)
