#!/usr/bin/env python3
"""Builds the game's sprite sheets (assets/sprites/<id>[_<form>].png + sprites.json) from the third-party frame pack
(folders of numbered PNG frames) following tools/sprite_map.json.

usage: import_pack.py [--pack assets/sprites] [--map tools/sprite_map.json] [--out assets/sprites] [--review DIR] [only_id ...]

Sheet layout (10 frames in one row, see docs/SPRITES.md):
  0 idle | 1-4 walk | 5 attack wind-up | 6 attack thrust | 7 power-up (transformation) | 8 dash pose | 9 dash streak (speed lines)
map entry per form: {"src": "<folder>", "idle": n, "walk": [a,b,c,d], "wind": n, "thrust": n, "power": n|null, "dash": n|null,
                     "fx": ["<folder>", n] | null}   (numbers = trailing number of the frame file name)
Top-level "weapons": {"kame": ["<folder>", n]} adds effect sprites (fx<name>.png) used by the weapon drawing code.
A form may set "hip" (0-1, where the legs start, default .62) and "walk_pack": true (use the pack's own walk frames instead of the synthetic leg swing).
A form may also set "walk_dir": "<folder>" + "walk_n": [numbers] (+ "idle_n": number): a hand-made walk cycle of N frames (any N, already keyed to
transparent; files <name>_<n>.png) that replaces the idle and walk frames. It is scaled to the pack idle (same height as its frame "idle_n") and the sheet gets
extra columns after the 10 standard ones; sprites.json then carries "walk": [frame indexes] (see docs/SPRITES.md).
"keep_sheet": true takes the 10 standard frames from the sheet already in --out (used with "grid_use" when the pack folders are not at hand); "fx_keep": true does the same for the streak only.
A form may set "grid": "<folder>" (frames cut by tools/import_grid.py: f00 idle, f01-04 walk, f11 wind-up, f14 thrust, f20-23 charge, f30-33 dash, emote/e0-3 portraits)
and "h": <idle height in px>: the sheet is then built from that folder (idle, walk, wind-up, thrust, a 4-frame charge pose and a 4-frame dash pose; the streak "fx" still comes
from the pack). "grid_use": ["power","dash"] only replaces those poses of a normal form. The extra frames go after the 10 standard columns and sprites.json gets
"pw": [frames of the charge animation], "dh": [frames of the dash animation]. The portraits become the sheet emo<id>[_<form>].png (4 frames, used by the character screen).
(The rock atlases rocks.png / lavarocks.png are NOT built here any more: tools/make_rocks.py makes them, see docs/SPRITES.md; this script keeps their entries in sprites.json.)
A character may define "fx" / "power" / "dash" once at character level as defaults for its forms."""
import sys, os, re, json, glob, argparse
from PIL import Image, ImageDraw

UP = 2            # nearest-neighbour upscale of the pack frames (so the game scale stays >= 2 px/unit)
KEY_TOL = 24


def key(im):
    """white (or any flat) background -> transparent, flood fill from the borders only"""
    im = im.convert('RGBA'); w, h = im.size; px = im.load()
    if px[0, 0][3] == 0 or im.getchannel('A').getextrema()[0] < 255:      # already has transparency
        return im
    bg = px[0, 0][:3]; seen = bytearray(w * h); st = []
    for x in range(w): st += [(x, 0), (x, h - 1)]
    for y in range(h): st += [(0, y), (w - 1, y)]
    while st:
        x, y = st.pop()
        if x < 0 or y < 0 or x >= w or y >= h or seen[y * w + x]: continue
        p = px[x, y]
        if abs(p[0] - bg[0]) + abs(p[1] - bg[1]) + abs(p[2] - bg[2]) > KEY_TOL: continue
        seen[y * w + x] = 1; px[x, y] = (0, 0, 0, 0)
        st += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    return im


def num(f):
    m = re.findall(r'(\d+)', os.path.basename(f))
    return int(m[-1]) if m else 0


_cache = {}


def load(pack, folder, n, pat=None):
    k = (folder, n, pat)
    if k in _cache: return _cache[k]
    d = os.path.join(pack, folder)
    hit = [f for f in glob.glob(os.path.join(d, '*.png')) if num(f) == n and (not pat or pat.lower() in os.path.basename(f).lower())]
    if not hit:
        raise SystemExit(f'frame {n} not found in {folder}')
    im = key(Image.open(hit[0])); bb = im.getbbox()
    if not bb: raise SystemExit(f'frame {n} of {folder} is empty')
    im = im.crop(bb)
    _cache[k] = im
    return im


def foot_x(im):
    """x of the legs (centre of mass of the lowest 40% of the sprite): stable anchor between poses"""
    w, h = im.size; a = im.getchannel('A').load(); y0 = int(h * .6); s = n = 0
    for y in range(y0, h):
        for x in range(w):
            if a[x, y] > 40: s += x; n += 1
    return (s / n) if n else w / 2


def synth_walk(im, phase, hip=.62):
    """walk frame made from the idle frame: the upper body stays still (it only bobs 1 px on the passing frames) and the legs swing
    from the hip like a sheared pair of strides (phase 0: left leg forward, 1: passing, 2: right leg forward, 3: passing).
    The pack's own 'walk' frames are fight-stance poses (lunges, guards, arm swings): played in a loop they look like a dance."""
    w, h = im.size; cx = foot_x(im); yh = int(h * hip)
    S = max(2, round(h * .075)); st = (1, 0, -1, 0)[phase]; lift = (0, 1, 0, 1)[phase]
    out = Image.new('RGBA', (w + 2 * S, h + 2), (0, 0, 0, 0))
    up = im.crop((0, 0, w, yh)); out.alpha_composite(up, (S, 1 - lift))
    for side in (1, -1):                       # right half first, then the left one on top
        for y in range(yh, h):
            t = (y - yh + 1) / (h - yh)
            dx = int(round(-side * st * S * t)) if side else 0
            x0, x1 = (int(cx), w) if side == 1 else (0, int(cx))
            row = im.crop((x0, y, x1, y + 1))
            if row.getbbox(): out.alpha_composite(row, (S + x0 + dx, y + 1 - lift * 0))
    return out.crop(out.getbbox())


def scale_img(im, f, hard=True):
    r = im.resize((max(1, round(im.width * f)), max(1, round(im.height * f))), Image.LANCZOS)
    if hard: r.putalpha(r.getchannel('A').point(lambda v: 255 if v > 110 else 0))
    return r


def build_form(pack, e, base_idle_h, prev=None):
    """returns (sheet image, meta, idle height in px)"""
    src = e.get('src')
    names = ['idle', 'w1', 'w2', 'w3', 'w4', 'wind', 'thrust', 'power', 'dash', 'fx']
    grid = e.get('grid'); guse = e.get('grid_use')
    full = bool(grid) and not guse
    fx = e.get('fx')
    frames = []
    if full:                                  # everything but the streak comes from the grid folder
        frames = [None] * 9 + [load(pack, fx[0], fx[1]) if fx else (prev(9) if e.get('fx_keep') and prev else None)]
    elif e.get('keep_sheet') and prev:        # the frames of the sheet already built (no pack folders needed)
        frames = [prev(i) for i in range(10)]
    else:
        walk = e['walk']
        spec = [('idle', src, e['idle'])] + [('w%d' % (i + 1), src, walk[i]) for i in range(4)] + \
               [('wind', src, e['wind']), ('thrust', src, e['thrust'])]
        spec.append(('power', src, e['power']) if e.get('power') else ('power', None, None))
        spec.append(('dash', src, e['dash']) if e.get('dash') else ('dash', None, None))
        spec.append(('fx', fx[0], fx[1]) if fx else ('fx', None, None))
        for nm, folder, n in spec:
            frames.append(None if folder is None else load(pack, folder, n, ((fx[2] if len(fx) > 2 else None) if nm == 'fx' else e.get('pat'))))
    idle = frames[0]
    extra = []; walk_idx = None; pw_idx = None; dh_idx = None
    if grid:
        g = lambda n: load(pack, grid, n)
        if full:
            f1 = e['h'] / g(0).height
            frames[0] = scale_img(g(0), f1)
            for i in range(4): frames[1 + i] = scale_img(g(1 + i), f1)
            frames[5] = scale_img(g(11), f1); frames[6] = scale_img(g(14), f1)
            idle = frames[0]; H0 = e['h']
        else:
            H0 = idle.height
        f2 = H0 / (g(20).height / e.get('cs', .9))      # the charge/dash image has its own scale; the charge pose is a crouch (cs = crouch / standing height)
        pw = [scale_img(g(20 + i), f2, False) for i in range(4)]; dh = [scale_img(g(30 + i), f2, False) for i in range(4)]
        if not guse or 'power' in guse: frames[7] = pw[0]; extra += pw[1:]; pw_idx = [7] + [10 + len(extra) - 3 + i for i in range(3)]
        if not guse or 'dash' in guse:
            frames[8] = dh[0]; base = 10 + len(extra); extra += dh[1:]; dh_idx = [8] + [base + i for i in range(3)]
    if full: pass
    elif e.get('walk_dir'):                    # custom N-frame walk cycle replacing idle + walk (see docstring)
        wd = e['walk_dir']; wn = e['walk_n']; ref = load(pack, wd, e.get('idle_n', wn[0]))
        f = idle.height / ref.height
        def sc(n):
            im = load(pack, wd, n); r = im.resize((max(1, round(im.width * f)), max(1, round(im.height * f))), Image.LANCZOS)
            r.putalpha(r.getchannel('A').point(lambda v: 255 if v > 110 else 0)); return r
        frames[0] = sc(e.get('idle_n', wn[0])); wf = [sc(n) for n in wn]
        frames[1:5] = [wf[i % len(wf)] for i in range(4)]
        extra = wf[4:]; walk_idx = [1, 2, 3, 4] + [10 + i for i in range(len(extra))] if extra else None
    elif not e.get('walk_pack'):               # synthetic leg-only walk cycle (see synth_walk); "walk_pack": true keeps the pack frames
        for i in range(4):
            frames[1 + i] = synth_walk(idle, i, e.get('hip', .62))
    names = names + ['x%d' % i for i in range(len(extra))]; frames = frames + extra
    # cell: wide/tall enough for every frame (feet-aligned, legs-centred)
    lw = rw = 0; H = 0
    for nm, im in zip(names, frames):
        if im is None or nm == 'fx': continue
        fx0 = foot_x(im)
        lw = max(lw, fx0); rw = max(rw, im.width - fx0); H = max(H, im.height)
    fxim = frames[9]
    if fxim is not None:
        H = max(H, fxim.height)
    cw = int(max(lw, rw) * 2 + 2); ch = H + 2
    if fxim is not None: cw = max(cw, fxim.width + 2)
    cw += cw % 2
    ncol = 10 + len(extra)
    sheet = Image.new('RGBA', (cw * ncol, ch), (0, 0, 0, 0))
    for i, (nm, im) in enumerate(zip(names, frames)):
        if im is None: continue
        if nm == 'fx':
            x = i * cw + (cw - im.width) // 2; y = (ch - im.height) // 2
        else:
            x = i * cw + int(round(cw / 2 - foot_x(im))); y = ch - 2 - im.height
        sheet.alpha_composite(im, (x, y))
    meta = dict(cols=ncol, fw=cw, fh=ch, ax=cw // 2, ay=ch - 2, has=[i for i in (7, 8, 9) if frames[i] is not None])
    if walk_idx: meta['walk'] = walk_idx
    if pw_idx: meta['pw'] = pw_idx
    if dh_idx: meta['dh'] = dh_idx
    return sheet, meta, idle.height


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pack', default='assets/sprites'); ap.add_argument('--map', default='tools/sprite_map.json')
    ap.add_argument('--out', default='assets/sprites'); ap.add_argument('--review')
    ap.add_argument('only', nargs='*')
    a = ap.parse_args()
    mp = json.load(open(a.map, encoding='utf8'))
    here = os.path.dirname(os.path.abspath(__file__))
    heights = json.load(open(os.path.join(here, 'proc_heights.json')))
    meta_all = {}
    if os.path.exists(os.path.join(a.out, 'sprites.json')):
        meta_all = json.load(open(os.path.join(a.out, 'sprites.json'), encoding='utf8'))
    if a.review: os.makedirs(a.review, exist_ok=True)
    for cid, c in mp['chars'].items():
        if a.only and cid not in a.only: continue
        forms = c['forms']; keys = list(forms.keys())  # 'base', '0', '1' ...
        dflt = {k: c[k] for k in ('fx', 'power', 'dash') if k in c}
        base_idle = None; ppu = None; rev = []
        for k in keys:
            e = dict(dflt); e.update(forms[k])
            if 'fx' in forms[k] and forms[k]['fx'] is None: e['fx'] = None
            sid = cid if k == 'base' else cid + '_' + k
            def prev(i, sid=sid):
                pm = meta_all.get(sid); fp = os.path.join(a.out, sid + '.png')
                if not pm or not os.path.exists(fp): return None
                sh = Image.open(fp).convert('RGBA'); fw = pm['fw']
                cell = sh.crop((i * fw, 0, (i + 1) * fw, pm['fh'])); bb = cell.getbbox()
                if not bb or (i < 9 and i not in pm.get('has', []) and i >= 7): return None
                c = cell.crop(bb); return c.resize((c.width // UP, c.height // UP), Image.NEAREST)
            try:
                sheet, meta, ih = build_form(a.pack, e, base_idle, prev)
            except SystemExit as ex:
                print(f'!! {cid}:{k}: {ex}'); continue
            if ppu is None:                       # scale of the whole character = that of its first (base) idle
                ppu = ih * UP * 6.0 / heights.get(cid, 262)
                ppu = round(ppu * 20) / 20.0
            sheet = sheet.resize((sheet.width * UP, sheet.height * UP), Image.NEAREST)
            m2 = dict(cols=meta['cols'], fw=meta['fw'] * UP, fh=meta['fh'] * UP, ax=meta['ax'] * UP, ay=meta['ay'] * UP, ppu=ppu, has=meta['has'])
            for k_ in ('walk', 'pw', 'dh'):
                if k_ in meta: m2[k_] = meta[k_]
            # portraits of the grid (emote/e0-3.png) -> emo<id>[_<form>].png
            if e.get('grid') and os.path.isdir(os.path.join(a.pack, e['grid'], 'emote')):
                fs_ = sorted(glob.glob(os.path.join(a.pack, e['grid'], 'emote', 'e*.png')), key=num); ims_ = [Image.open(f_).convert('RGBA') for f_ in fs_]
                if ims_:
                    ew, eh = ims_[0].size; es = Image.new('RGBA', (ew * len(ims_), eh))
                    for j_, im_ in enumerate(ims_): es.paste(im_, (j_ * ew, 0))
                    eid = 'emo' + cid + ('' if k == 'base' else '_' + k); es.save(os.path.join(a.out, eid + '.png'), optimize=True)
                    meta_all[eid] = dict(cols=len(ims_), fw=ew, fh=eh, ppu=1, has=[])
            meta = m2
            sid = cid if k == 'base' else f'{cid}_{k}'
            sheet.save(os.path.join(a.out, sid + '.png'), optimize=True)
            meta_all[sid] = meta
            rev.append((sid, sheet))
            print(f'{sid:12} {sheet.width}x{sheet.height} ppu={ppu}')
        if a.review and rev:
            W = max(s.width for _, s in rev); Hh = sum(s.height + 4 for _, s in rev)
            R = Image.new('RGB', (W, Hh), (70, 80, 96)); y = 0
            for sid, s in rev:
                bg = Image.new('RGBA', s.size, (70, 80, 96, 255)); bg.alpha_composite(s)
                R.paste(bg.convert('RGB'), (0, y)); y += s.height + 4
            R.save(os.path.join(a.review, cid + '.png'))
    # weapon / effect sprites: one cropped frame each, saved as fx<name>.png (e.g. fxkame.png = Kamehameha beam: muzzle burst, body, head)
    for name, (folder, n) in mp.get('weapons', {}).items():
        if a.only and ('fx' + name) not in a.only: continue
        try:
            im = load(a.pack, folder, n)
        except SystemExit as ex:
            print(f'!! fx{name}: {ex}'); continue
        im.save(os.path.join(a.out, f'fx{name}.png'), optimize=True)
        meta_all[f'fx{name}'] = dict(cols=1, fw=im.width, fh=im.height, ax=im.width // 2, ay=im.height // 2, ppu=1, has=[])
        print(f'fx{name:10} {im.width}x{im.height}')
    json.dump(meta_all, open(os.path.join(a.out, 'sprites.json'), 'w', encoding='utf8'), indent=1)


if __name__ == '__main__':
    main()
