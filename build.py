#!/usr/bin/env python3
"""Bundle src/ into a single self-contained HTML (dist/dragon-ball-survivors.html).
Usage: python3 build.py [--check]   (--check runs `node --check` on the bundled script)"""
import re, sys, subprocess, pathlib, urllib.parse
ROOT = pathlib.Path(__file__).parent
ORDER = ['util','data','i18n','i18n2','i18n3','i18n4','weapons','weapons2','weapon_elec','world','config','save','gacha','cloud','game','skills','sprites','sprites_hd','sheets','menubg','audio','input','ambient','zeno_sprite','renderer','uiicons','ui','ui2','ui_gacha','ui_account','grimoire','patches','ui_patch','update','app']
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
_logo = ROOT/'assets'/'logo.webp'
js = js.replace('__LOGO__', base64.b64encode(_logo.read_bytes()).decode() if _logo.exists() else '')
_wip = ROOT/'assets'/'wip.webp'          # "W.I.P." badge bouncing on the right of the main menu
js = js.replace('__WIP__', base64.b64encode(_wip.read_bytes()).decode() if _wip.exists() else '')
_db = ROOT/'assets'/'dragonballs.webp'   # the 7 Dragon Balls (1..7 stars), one 64x64 frame each, side by side
js = js.replace('__DBALLS__', base64.b64encode(_db.read_bytes()).decode() if _db.exists() else '')
# ---- music: assets/*.mp3 (also .ogg .m4a .wav) mapped to the menu / a stage by the FILE NAME ----
# "menu.mp3" -> menu;  "android ruins.mp3", "Buu Dimension.mp3"... -> the stage whose name (or alias below) the file name contains.
# DBS_AUDIO=embed (default): base64 inside the HTML (single file). DBS_AUDIO=link: relative URL "assets/<file>" (the site must serve
# the files next to index.html, see .github/workflows/deploy.yml). DBS_AUDIO_BUDGET_MB=<n>: when embedding, re-encode with ffmpeg
# (mp3, lower bitrate) if the files total more than n MB - needed for hosts with a size cap on the single HTML file.
import shutil, hashlib, unicodedata
STAGE_KEYS = {1: ['saiyan plains', 'plains', 'pianura saiyan', 'pianura'], 2: ['planet namek', 'namek'],
              3: ['android ruins', 'androids ruins', 'rovine degli androidi', 'rovine', 'ruins'],
              4: ['buu dimension', 'buus dimension', 'dimensione di bu', 'dimension', 'dimensione', 'buu'],
              5: ['tournament of power', 'torneo del potere', 'tournament', 'torneo'],
              6: ['muten island', 'roshi island', 'roshis island', 'isola di muten', 'kame house', 'muten', 'roshi'],
              7: ['planet vegeta', 'pianeta vegeta', 'vegeta'], 8: ['cell games', 'cell game', 'arena dei cell game', 'cell'],
              9: ['realm of the gods', 'regno degli dei', 'gods', 'dei'], 10: ['hell', 'inferno']}
def _norm(t):
    t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode().lower()
    return ' '.join(re.sub(r'[^a-z0-9]+', ' ', t).split())
SFX_FILES = {'sphere sound': 'sphere'}     # assets/sphere_sound.mp3 = the Dragon Ball pick-up sound (game key 'sphere')
_MIME = {'.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.wav': 'audio/wav'}
_tracks = {}; _src = {}
for f in sorted((ROOT/'assets').glob('*')):
    if f.suffix.lower() not in _MIME: continue
    nm = _norm(f.stem)
    if nm in SFX_FILES: continue          # a sound effect, handled below
    if nm in ('menu', 'main menu', 'menu theme'): key = 'menu'
    else:
        best = (0, None)
        for sid, ks in STAGE_KEYS.items():
            for k in ks:
                if re.search(r'(^| )' + re.escape(k) + r'( |$)', nm) and len(k) > best[0]: best = (len(k), sid)
        key = 'stage%d' % best[1] if best[1] else None
    if not key:
        print('music: skipped', f.name, '(name does not match the menu or any stage)'); continue
    if key in _src: print('music: WARNING', f.name, 'also maps to', key, '- keeping', _src[key].name); continue
    _src[key] = f
_mode = (os.environ.get('DBS_AUDIO') or 'embed').lower()
_budget = float(os.environ.get('DBS_AUDIO_BUDGET_MB') or 0)
_enc = {}
if _mode == 'embed' and _budget and _src and sum(f.stat().st_size for f in _src.values()) > _budget * 1048576:
    if not shutil.which('ffmpeg'):
        print('music: WARNING budget set but ffmpeg not found - embedding the originals')
    else:
        def _dur(f):
            r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', str(f)], capture_output=True, text=True)
            try: return float(r.stdout.strip())
            except ValueError: return 0.0
        tot = sum(_dur(f) for f in _src.values()) or 1
        kbps = max(40, min(128, int(_budget * 8192 / tot)))
        cache = ROOT/'dist'/'.audio'; cache.mkdir(parents=True, exist_ok=True)
        for key, f in _src.items():
            h = hashlib.md5(f.read_bytes()).hexdigest()[:10]
            o = cache/('%s_%d_%s.mp3' % (key, kbps, h))
            if not o.exists():
                subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(f), '-vn', '-ac', '2', '-ar', '44100' if kbps >= 80 else '32000',
                                '-c:a', 'libmp3lame', '-b:a', '%dk' % kbps, '-joint_stereo', '1', str(o)], check=True)
            _enc[key] = o
        print('music: re-encoded to %d kbps (budget %.1f MB)' % (kbps, _budget))
for key, f in _src.items():
    g = _enc.get(key, f)
    if _mode == 'link':
        _tracks[key] = 'assets/' + urllib.parse.quote(f.name)
    else:
        _tracks[key] = 'data:%s;base64,%s' % (_MIME[g.suffix.lower()], base64.b64encode(g.read_bytes()).decode())
    print('music: %-8s <- %s (%s, %.1f MB)' % (key, f.name, _mode, g.stat().st_size / 1048576))
js = js.replace('/*__TRACKS__*/{}', json.dumps(_tracks, separators=(',', ':')))
# ---- sound effects from files (small): always embedded as data: URIs when DBS_AUDIO=embed, linked in link mode ----
_sfx = {}
for f in sorted((ROOT/'assets').glob('*')):
    if f.suffix.lower() not in _MIME or _norm(f.stem) not in SFX_FILES: continue
    k = SFX_FILES[_norm(f.stem)]
    if k in _sfx: continue
    _sfx[k] = ('assets/' + urllib.parse.quote(f.name)) if _mode == 'link' else 'data:%s;base64,%s' % (_MIME[f.suffix.lower()], base64.b64encode(f.read_bytes()).decode())
    print('sfx:   %-8s <- %s (%s, %.0f KB)' % (k, f.name, _mode, f.stat().st_size / 1024))
js = js.replace('/*__SFX__*/{}', json.dumps(_sfx, separators=(',', ':')))
# ---- optional sprite sheets: assets/sprites/<id>.png / <id>_<n>.png (+ sprites.json overrides) ----
import struct
_sd = pathlib.Path(os.environ.get('DBS_SPRITES') or (ROOT/'assets'/'sprites'))
_pack = {}
if _sd.is_dir():
    _ov = {}
    if (_sd/'sprites.json').exists():
        _ov = json.loads((_sd/'sprites.json').read_text(encoding='utf8'))
    for f in sorted(_sd.glob('*.png')):
        sid = f.stem
        if not re.fullmatch(r'[a-z0-9]+(_\d+)?', sid):
            print('sprites: skipped', f.name, '(name must be <id>.png or <id>_<n>.png, lowercase)'); continue
        raw = f.read_bytes()
        if raw[:8] != b'\x89PNG\r\n\x1a\n':
            print('sprites: skipped', f.name, '(not a PNG)'); continue
        w, h = struct.unpack('>II', raw[16:24])
        e = dict(_ov.get('default', {})); e.update(_ov.get(sid, {}))
        cols = e.get('cols', 7)
        if not e.get('fw') and w % cols:
            print(f'sprites: WARNING {f.name}: width {w} is not a multiple of {cols} frames')
        e['u'] = 'data:image/png;base64,' + base64.b64encode(raw).decode()
        _pack[sid] = e
        print(f'sprites: {sid}  {w}x{h}px, {cols} frames')
js = js.replace('__SPRITE_PACK__', json.dumps(_pack, separators=(',', ':')))
css = '\n'.join((ROOT/'src/css'/f).read_text(encoding='utf8') for f in ['style.css','gacha.css'])
html = (ROOT/'src/index.html').read_text(encoding='utf8')
glyphs = re.search(r"GLYPHS='([^']+)'", js).group(1)
html = html.replace('__GLYPHS__', urllib.parse.quote(''.join(dict.fromkeys(glyphs))))
# ---- build id: a hash of everything that ends up in the page. The game compares it with version.json (published next to the
# page by the deploy workflow) to notice a new release while somebody is playing (src/js/update.js). Same sources -> same id. ----
_bid = hashlib.sha1((js + '\0' + css + '\0' + html).encode('utf8')).hexdigest()[:12]
js = js.replace('__BUILD_ID__', _bid)
html = html.replace('/*__CSS__*/', css).replace('/*__JS__*/', js.replace('</script>', '<\\/script>'))
out = pathlib.Path(os.environ['DBS_OUT']) if os.environ.get('DBS_OUT') else ROOT/'dist'/'dragon-ball-survivors.html'
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding='utf8')
(out.parent/'version.json').write_text(json.dumps({'id': _bid}) + '\n', encoding='utf8')
print(f'built {out} ({out.stat().st_size/1024:.0f} KB) · build id {_bid}')
if '--check' in sys.argv:
    tmp = ROOT/'dist'/'_bundle.js'; tmp.write_text(js, encoding='utf8')
    r = subprocess.run(['node','--check',str(tmp)], capture_output=True, text=True); tmp.unlink()
    print('syntax OK' if r.returncode == 0 else r.stderr); sys.exit(r.returncode)
