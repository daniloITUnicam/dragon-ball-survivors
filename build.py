#!/usr/bin/env python3
"""Bundle src/ into a single self-contained HTML (dist/dragon-ball-survivors.html).
Usage: python3 build.py [--check]   (--check runs `node --check` on the bundled script)"""
import re, sys, subprocess, pathlib, urllib.parse
ROOT = pathlib.Path(__file__).parent
ORDER = ['util','guard','data','trinkets2','shop_icons','i18n','i18n2','i18n3','i18n4','i18n5','weapons','weapons2','weapon_elec','mapart','isle_obj','world','config','save','mastery','gacha','quests','cloud','online','coop','game','telemetry','skills','events','summon','clash','moments','mapx','bossx','progx','extras','hints','sprites','sprites_hd','sheets','pose','menubg','audio','input','ambient','sea','objlife','snake_art','top_arena','zeno_sprite','xpbar_meta','xpbar','hpbar_meta','hpbar','tgtart','renderer','corpse','tunnel','events_draw','uiicons','ui','ui2','ui3','ui4','ui_gacha','ui_pacts','ui_online','ui_career','ui_coop','ui_account','pausemap','grimoire','patches','ui_patch','update','coopnet','coopgame','app']
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
_res = (os.environ.get('SUPABASE_RESET') or ('1' if _cc.get('reset') else '')).strip().lower() in ('1','true','yes')
_ok = re.compile(r'^[A-Za-z0-9_\-.:/]*$')
if not (_ok.match(_url) and _ok.match(_key)):
    sys.exit('invalid characters in SUPABASE_URL / SUPABASE_ANON_KEY')
js = js.replace('__SUPABASE_URL__', _url).replace('__SUPABASE_KEY__', _key).replace('__SUPABASE_GOOGLE__', '1' if _goo else '').replace('__SUPABASE_RESET__', '1' if _res else '')
print('cloud:', 'ON ('+_url+')' if _url and _key else 'off (no Supabase settings)')
# ---- Test mode: owner + fixed whitelist from tester.config.json (git-ignored) or env TEST_OWNER / TEST_LIST; only their hashes go into the page (see testHash in config.js) ----
def _test_hash(t):
    M = 0xFFFFFFFF
    t = t.strip().lower().encode('utf-16-le')
    h1, h2 = 0xdeadbeef, 0x41c6ce57
    for i in range(0, len(t), 2):
        c = t[i] | (t[i+1] << 8)
        h1 = ((h1 ^ c) * 2654435761) & M
        h2 = ((h2 ^ c) * 1597334677) & M
    h1 = (((h1 ^ (h1 >> 16)) * 2246822507) & M) ^ (((h2 ^ (h2 >> 13)) * 3266489909) & M)
    h2 = (((h2 ^ (h2 >> 16)) * 2246822507) & M) ^ (((h1 ^ (h1 >> 13)) * 3266489909) & M)
    n = 4294967296 * (2097151 & h2) + h1
    d = '0123456789abcdefghijklmnopqrstuvwxyz'; out = ''
    while True:
        out = d[n % 36] + out; n //= 36
        if n == 0: return out
_tc = {}
_tf = ROOT/'tester.config.json'
if _tf.exists():
    _tc = json.loads(_tf.read_text(encoding='utf8'))
_to = (os.environ.get('TEST_OWNER') or _tc.get('owner') or '').strip()
_tl = [x.strip() for x in (os.environ.get('TEST_LIST').split(',') if os.environ.get('TEST_LIST') else _tc.get('testers') or []) if x.strip()]
_td = (os.environ.get('DBS_TEST') or '').strip().lower() in ('1','true','yes')
js = js.replace('__TEST_OWNER__', _test_hash(_to) if _to else '').replace('__TEST_LIST__', ','.join(_test_hash(x) for x in _tl)).replace('__TEST_DEV__', '1' if _td else '')
print('test mode:', 'for everybody (DBS_TEST)' if _td else ('owner' + (' + %d tester(s)' % len(_tl) if _tl else '') if _to else 'nobody (no tester.config.json)'))
_logo = ROOT/'assets'/'logo.webp'
js = js.replace('__LOGO__', base64.b64encode(_logo.read_bytes()).decode() if _logo.exists() else '')
_wip = ROOT/'assets'/'wip.webp'          # "W.I.P." badge bouncing on the right of the main menu
js = js.replace('__WIP__', base64.b64encode(_wip.read_bytes()).decode() if _wip.exists() else '')
_si = {}
for _f in sorted((ROOT/'assets'/'shopicons').glob('*.webp')) if (ROOT/'assets'/'shopicons').is_dir() else []:   # shop upgrade icons, file name = shop id
    _si[_f.stem] = 'data:image/webp;base64,' + base64.b64encode(_f.read_bytes()).decode()
js = js.replace('/*__SHOPICONS__*/{}', json.dumps(_si, separators=(',', ':')))
_xp = ROOT/'assets'/'xpbar.webp'         # the EXP bar atlas (tools/gen_xpbar.py)
js = js.replace('__XPBAR__', base64.b64encode(_xp.read_bytes()).decode() if _xp.exists() else '')
_hp = ROOT/'assets'/'hpbar.webp'         # the HP bar atlas (tools/gen_hpbar.py)
js = js.replace('__HPBAR__', base64.b64encode(_hp.read_bytes()).decode() if _hp.exists() else '')
_tg = ROOT/'assets'/'tgt.webp'            # the weapon-target (TAB) panels (tools/gen_tgt.py)
js = js.replace('__TGTART__', base64.b64encode(_tg.read_bytes()).decode() if _tg.exists() else '')
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
              9: ['realm of the gods', 'regno degli dei', 'gods', 'dei'], 10: ['hell', 'inferno'],
              11: ['snake way', 'via del serpente', 'serpente', 'snake']}
# Boss themes: the file plays during the FINAL boss of that stage (key 'fboss<id>'); without a file the synthesized boss music plays. A name that matches here is never used as the stage music.
# GENERIC_BOSS: the file plays during every other boss (not a stage's final boss), key 'bossgen'.
GENERIC_BOSS = ['generic boss battle', 'generic boss', 'boss battle']
BOSS_KEYS = {2: ['freezer theme', 'frieza theme', 'freezer boss', 'freezer', 'frieza'],
             8: ['perfect cell theme', 'perfect cells theme', 'perfect cell', 'cell boss', 'cell final boss']}
def _norm(t):
    t = unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode().lower()
    return ' '.join(re.sub(r'[^a-z0-9]+', ' ', t).split())
SFX_FILES = {'sphere sound': 'sphere', 'level up sound': 'levelup'}     # assets/sphere_sound.mp3 = the Dragon Ball pick-up sound (key 'sphere'); assets/level_up_sound.mp3 = the level-up sound (key 'levelup', played at x2 speed)
_MIME = {'.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.wav': 'audio/wav'}
_tracks = {}; _src = {}
for f in sorted((ROOT/'assets').glob('*')):
    if f.suffix.lower() not in _MIME: continue
    nm = _norm(f.stem)
    if nm in SFX_FILES: continue          # a sound effect, handled below
    if nm in ('menu', 'main menu', 'menu theme'): key = 'menu'
    elif nm in GENERIC_BOSS: key = 'bossgen'
    elif any(re.search(r'(^| )' + re.escape(k) + r'( |$)', nm) for ks in BOSS_KEYS.values() for k in ks):
        key = 'fboss%d' % next(sid for sid, ks in BOSS_KEYS.items() if any(re.search(r'(^| )' + re.escape(k) + r'( |$)', nm) for k in ks))
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
        durs = {k: _dur(f) for k, f in _src.items()}
        # bitrates the MP3 encoder offers: steps of 8 kbps up to 64 (16..32 only exist at 24 kHz or lower, so those tracks are mono), then 16
        RATES = [16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128]
        tot = sum(durs.values()) or 1
        limit = _budget * 1048576                                    # bytes of audio allowed
        base = max([r for r in RATES if r * 125 * tot <= limit] or [RATES[0]])   # highest rate for ALL tracks that fits the budget...
        alloc = {k: base for k in durs}
        left = limit - base * 125 * tot
        nxt = RATES[RATES.index(base) + 1] if base != RATES[-1] else base
        for k in sorted(durs, key=lambda k: -durs[k]):               # ...then the leftover promotes tracks (longest first) to the next rate
            extra = (nxt - base) * 125 * durs[k]
            if extra <= left: alloc[k] = nxt; left -= extra
        _low = {k.strip() for k in (os.environ.get('DBS_AUDIO_LOW') or '').split(',') if k.strip()}   # DBS_AUDIO_LOW=stage3,menu: those tracks one step lower (fine tuning under a size limit)
        cache = ROOT/'dist'/'.audio'; cache.mkdir(parents=True, exist_ok=True)
        for key, f in _src.items():
            kb = alloc[key]
            if key in _low and RATES.index(kb) > 0: kb = RATES[RATES.index(kb) - 1]
            h = hashlib.md5(f.read_bytes()).hexdigest()[:10]
            o = cache/('%s_%d_%s.mp3' % (key, kb, h))
            if not o.exists():
                mono = kb < 40
                subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(f), '-vn', '-ac', '1' if mono else '2', '-ar', '24000' if mono else ('44100' if kb >= 80 else '32000'),
                                '-c:a', 'libmp3lame', '-b:a', '%dk' % kb] + ([] if mono else ['-joint_stereo', '1']) + [str(o)], check=True)
            _enc[key] = o
        print('music: re-encoded (budget %.1f MB): %s' % (_budget, ', '.join('%s %dk' % (k, v) for k, v in sorted(alloc.items()))))
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
# ---- optional sprite sheets: assets/sprites/[<folder>/]<id>.png / <id>_<n>.png (+ sprites.json overrides) ----
# The sheets the game uses live in folders with a lowercase name (boss/, effetti/, rocce/, ...; loose files in assets/sprites/ work too). NOT scanned: folders that start
# with "_" (_sorgenti = source art of the generators, _inutilizzati = sheets the game does not use) and folders with capitals or spaces (raw frame packs, see assets/sprites/README.md).
import struct
def _webp(raw):
    """PNG bytes -> lossless WebP bytes (None without Pillow, or when it would not be smaller); results cached under dist/.cache/webp"""
    cd = ROOT/'dist'/'.cache'/'webp'; key = hashlib.sha1(raw).hexdigest(); cf = cd/(key + '.webp')
    if cf.exists(): out = cf.read_bytes(); return out if out else None
    try:
        from PIL import Image
        import io
    except ImportError: return None
    im = Image.open(io.BytesIO(raw)); im = im.convert('RGBA') if im.mode not in ('RGB', 'RGBA') else im
    bio = io.BytesIO(); im.save(bio, 'WEBP', lossless=True, quality=100, method=6, exact=True); out = bio.getvalue()
    if len(out) >= len(raw): out = b''
    cd.mkdir(parents=True, exist_ok=True); cf.write_bytes(out); return out or None
_sd = pathlib.Path(os.environ.get('DBS_SPRITES') or (ROOT/'assets'/'sprites'))
_pack = {}
if _sd.is_dir():
    _ov = {}
    if (_sd/'sprites.json').exists():
        _ov = json.loads((_sd/'sprites.json').read_text(encoding='utf8'))
    _files = sorted((f for f in [*_sd.rglob('*.png'), *_sd.rglob('*.webp')] if all(re.fullmatch(r'[a-z][a-z0-9-]*', q) for q in f.relative_to(_sd).parts[:-1])), key=lambda f: f.name)   # sorted by file name: same order as when everything was in one folder
    _seen = {}
    for f in _files:
        sid = f.stem
        if sid in _seen:
            print('sprites: skipped', f.relative_to(_sd), '(same id as', _seen[sid], ')'); continue
        _seen[sid] = f.relative_to(_sd)
        if not re.fullmatch(r'[a-z0-9]+(_\d+)?', sid):
            print('sprites: skipped', f.name, '(name must be <id>.png or <id>_<n>.png, lowercase)'); continue
        raw = f.read_bytes()
        if raw[:8] == b'\x89PNG\r\n\x1a\n': w, h = struct.unpack('>II', raw[16:24]); _mt = 'png'
        elif raw[:4] == b'RIFF' and raw[8:12] == b'WEBP':   # v112: WebP sheets too (the painted islands): size from the VP8X / VP8 / VP8L header
            _c = raw[12:16]; _mt = 'webp'
            if _c == b'VP8X': w, h = 1 + int.from_bytes(raw[24:27], 'little'), 1 + int.from_bytes(raw[27:30], 'little')
            elif _c == b'VP8L': _b = int.from_bytes(raw[21:25], 'little'); w, h = 1 + (_b & 0x3FFF), 1 + ((_b >> 14) & 0x3FFF)
            else: w, h = struct.unpack('<HH', raw[26:30]); w &= 0x3FFF; h &= 0x3FFF
        else:
            print('sprites: skipped', f.name, '(not a PNG / WebP)'); continue
        e = dict(_ov.get('default', {})); e.update(_ov.get(sid, {}))
        cols = e.get('cols', 7)
        if not e.get('fw') and w % cols:
            print(f'sprites: WARNING {f.name}: width {w} is not a multiple of {cols} frames')
        _ps = float(os.environ.get('DBS_PROP_SCALE') or 0)   # DBS_PROP_SCALE=.75: the prop atlases (sid ...props) are shrunk in the single-file build (size limit); sheet gets k = the factor
        if _ps and 0 < _ps < 1 and sid.endswith('props') and e.get('rects'):
            try:
                from PIL import Image
                import io
                im = Image.open(io.BytesIO(raw)).convert('RGBA'); im = im.resize((max(1, round(im.width*_ps)), max(1, round(im.height*_ps))), Image.LANCZOS)
                im = im.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE); bio = io.BytesIO(); im.save(bio, 'PNG', optimize=True); raw = bio.getvalue(); _mt = 'png'
                e = dict(e); e['rects'] = [[round(r[0]*_ps), round(r[1]*_ps), max(1, round(r[2]*_ps)), max(1, round(r[3]*_ps))] for r in e['rects']]
                e['anch'] = [[a_[0]*_ps, a_[1]*_ps] for a_ in e['anch']]; e['k'] = _ps
            except ImportError: print('sprites: DBS_PROP_SCALE needs Pillow - atlases left as they are')
        if _mt == 'png' and os.environ.get('DBS_WEBP') != '0':   # v121: PNG sheets go in as lossless WebP (same pixels, ~17% smaller); cached by content in dist/.cache
            _wk = _webp(raw)
            if _wk: raw, _mt = _wk, 'webp'
        e['u'] = 'data:image/' + _mt + ';base64,' + base64.b64encode(raw).decode()
        _pack[sid] = e
        print(f'sprites: {sid}  {w}x{h}px, {cols} frames')
js = js.replace('__SPRITE_PACK__', json.dumps(_pack, separators=(',', ':')))
css = '\n'.join((ROOT/'src/css'/f).read_text(encoding='utf8') for f in ['style.css','gacha.css','skin.css'])
html = (ROOT/'src/index.html').read_text(encoding='utf8')
glyphs = re.search(r"GLYPHS='([^']+)'", js).group(1)
html = html.replace('__GLYPHS__', urllib.parse.quote(''.join(dict.fromkeys(glyphs))))
# ---- build id: a hash of everything that ends up in the page. The game compares it with version.json (published next to the
# page by the deploy workflow) to notice a new release while somebody is playing (src/js/update.js). Same sources -> same id. ----
# ---- release vs dev: a release build (the default) runs the anti-cheat deterrents (src/js/guard.js) and wraps the whole game in one closure,
# so nothing of it is reachable from the page (no window.__app, no WEAPONS / BOSSES to edit from a console). DBS_DEV=1: the open build the tests use ----
_dev = (os.environ.get('DBS_DEV') or '').strip().lower() in ('1','true','yes')
js = js.replace("'__DEV__'", "'1'" if _dev else "''")
if not _dev:
    js = '(()=>{\n' + js + '\n})();'
# ---- minify (esbuild, when it is installed: `npm i esbuild` in the repo, or on the PATH): a smaller page that parses faster.
# Default: on for release builds, off for DEV builds (readable stack traces in the tests). DBS_MINIFY=1 / 0 forces it. ----
def _esbuild():
    for c in [os.environ.get('DBS_ESBUILD'), str(ROOT/'node_modules'/'.bin'/'esbuild'), shutil.which('esbuild'), '/opt/npm-tools/node_modules/.bin/esbuild']:
        if c and pathlib.Path(c).exists(): return c
    return None
_min_env = os.environ.get('DBS_MINIFY')
if _min_env == '1' or (_min_env is None and not _dev):
    _eb = _esbuild()
    if not _eb: print('minify: esbuild not found - the page is built unminified (npm i esbuild to enable)')
    else:
        def _mini(code, loader):
            r = subprocess.run([_eb, '--minify', '--keep-names', '--loader=' + loader, '--charset=utf8', '--legal-comments=none', '--target=es2020', '--log-level=error'], input=code.encode('utf8'), capture_output=True)
            if r.returncode != 0: print('minify failed (' + loader + '), kept unminified:', r.stderr.decode('utf8', 'replace')[:400]); return code
            return r.stdout.decode('utf8').rstrip('\n')
        _n0 = len(js) + len(css); js = _mini(js, 'js'); css = _mini(css, 'css')
        print(f'minify: {_n0/1024:.0f} KB -> {(len(js)+len(css))/1024:.0f} KB (js + css)')
print('build:', 'DEV (open, for the tests)' if _dev else 'release (closed, anti-cheat on)')
_bid = hashlib.sha1((js + '\0' + css + '\0' + html).encode('utf8')).hexdigest()[:12]
js = js.replace('__BUILD_ID__', _bid)
js = js.replace('</script>', '<\\/script>')
# ---- Content-Security-Policy (a <meta> tag: GitHub Pages cannot send headers). The only inline script is the game itself and it is allowed BY HASH:
# an injected <script> or onclick="" would not run. Default: on for link builds (the published site), off for the single-file embed build
# (the Artifact wrapper adds its own scripts, which a page-level policy would block). DBS_CSP=1 / DBS_CSP=0 forces it. ----
_csp_env = os.environ.get('DBS_CSP')
if _csp_env == '1' or (_csp_env is None and _mode == 'link'):
    _sha = base64.b64encode(hashlib.sha256(('\n' + js + '\n').encode('utf8')).digest()).decode()
    _o = urllib.parse.urlsplit(_url) if _url else None
    _conn = " ".join(["'self'", "data:", "blob:"] + ([f'{_o.scheme}://{_o.netloc}'] if _o and _o.netloc else []))
    _csp = ("default-src 'none'; "
            f"script-src 'sha256-{_sha}'; "
            "style-src 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src https://fonts.gstatic.com data:; "
            "img-src 'self' data: blob:; media-src 'self' data: blob:; "
            f"connect-src {_conn}; "
            "worker-src 'self' blob:; manifest-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'")
    html = html.replace('<!--__CSP__-->', f'<meta http-equiv="Content-Security-Policy" content="{_csp}">')
else:
    html = html.replace('<!--__CSP__-->\n', '')
html = html.replace('/*__CSS__*/', css).replace('/*__JS__*/', js)
out = pathlib.Path(os.environ['DBS_OUT']) if os.environ.get('DBS_OUT') else ROOT/'dist'/'dragon-ball-survivors.html'
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding='utf8')
(out.parent/'version.json').write_text(json.dumps({'id': _bid}) + '\n', encoding='utf8')
print(f'built {out} ({out.stat().st_size/1024:.0f} KB) · build id {_bid}')
if '--check' in sys.argv:
    tmp = ROOT/'dist'/'_bundle.js'; tmp.write_text(js, encoding='utf8')
    r = subprocess.run(['node','--check',str(tmp)], capture_output=True, text=True); tmp.unlink()
    print('syntax OK' if r.returncode == 0 else r.stderr); sys.exit(r.returncode)
