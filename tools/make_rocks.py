#!/usr/bin/env python3
"""Builds the rock atlases of the planets (see docs/SPRITES.md, "Rocce dei pianeti"):
  assets/sprites/rocce/rocks.png      Namek     <- assets/sprites/_sorgenti/rocce/rocks.png (transparent sheet of 20 rocks)
  assets/sprites/rocce/lavarocks.png  Inferno   <- assets/sprites/_sorgenti/rocce/lavarocks_sheet.png (static rocks, white background, drawn at 2x)
                                                   + assets/sprites/_sorgenti/rocce/lavarocks_anim.png, lavarocks_anim2.png (looping animation frames, dark background, 2x)
and writes their entries in assets/sprites/sprites.json:
  rects  [x,y,w,h] of every rock (the first frame of an animated one)      kinds  {name: [rock numbers]} the obstacle definitions of world.js pick from
  anim   {rock: [rect numbers of its other frames]}  (all the frames share one canvas size and one anchor)      pp  [rocks that play ping-pong]   fps  frames per second
  dry    [rocks without lava: no glow, no embers]
usage: python3 tools/make_rocks.py [namek] [lava]   (default both)"""
import sys, json, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = pathlib.Path(__file__).resolve().parent.parent
SP = ROOT / 'assets' / 'sprites'
ARC = SP / '_sorgenti' / 'rocce'      # source sheets
OUT = SP / 'rocce'                   # the atlases the game uses


def save_entry(sid, entry):
    jp = SP / 'sprites.json'
    j = json.loads(jp.read_text(encoding='utf8')) if jp.exists() else {}
    j[sid] = entry
    jp.write_text(json.dumps(j, indent=1, ensure_ascii=False) + '\n', encoding='utf8')


def components(alpha):
    lab, n = ndi.label(alpha, structure=np.ones((3, 3)))
    out = []
    for i, s in enumerate(ndi.find_objects(lab)):
        out.append(dict(id=i + 1, x0=s[1].start, y0=s[0].start, x1=s[1].stop, y1=s[0].stop, area=int((lab[s] == i + 1).sum())))
    return lab, out


# ---------------------------------------------------------------- Namek
def namek():
    im = Image.open(ARC / 'rocks.png').convert('RGBA')
    a = np.array(im)[:, :, 3] > 8
    lab, comps = components(a)
    big = [c for c in comps if c['area'] >= 40]
    for c in comps:   # stray lichen pixels belong to the nearest rock
        if c['area'] >= 40: continue
        cx, cy = (c['x0'] + c['x1']) / 2, (c['y0'] + c['y1']) / 2
        b = min(big, key=lambda b: max(b['x0'] - cx, 0, cx - b['x1']) ** 2 + max(b['y0'] - cy, 0, cy - b['y1']) ** 2)
        b['x0'], b['y0'], b['x1'], b['y1'] = min(b['x0'], c['x0']), min(b['y0'], c['y0']), max(b['x1'], c['x1']), max(b['y1'], c['y1'])
    big.sort(key=lambda c: (0 if c['y0'] < 100 else 1 if c['y0'] < 180 else 2, c['x0']))
    rects = [[c['x0'], c['y0'], c['x1'] - c['x0'], c['y1'] - c['y0']] for c in big]
    assert len(rects) == 20, len(rects)
    im.save(OUT / 'rocks.png', optimize=True)
    save_entry('rocks', {'cols': 1, 'rects': rects,
                         'kinds': {'big': [0, 1, 2, 3], 'spire': [4, 5, 9, 10, 11], 'mix': [6, 7, 8, 12, 15, 16, 17, 19, 3, 0]}})
    print('rocks.png:', len(rects), 'rocks')


# ---------------------------------------------------------------- Inferno
def down2(path):
    a = np.array(Image.open(path).convert('RGB'))
    H, W = a.shape[0] // 2 * 2, a.shape[1] // 2 * 2
    blk = a[:H, :W].reshape(H // 2, 2, W // 2, 2, 3).transpose(0, 2, 1, 3, 4).reshape(H // 2, W // 2, 4, 3)
    return np.median(blk, axis=2).astype(np.uint8)       # the art is drawn in 2x2 blocks: one block = one pixel


def key_background(rgb, is_bg):
    """transparent where the background touches the border; light fringe pixels along the edge are peeled; specks removed"""
    lab, n = ndi.label(is_bg)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge))
    alpha = ~bg
    for _ in range(2):
        light = (rgb.min(axis=2) >= 140) & ((rgb.max(axis=2).astype(int) - rgb.min(axis=2)) < 45)
        edge_px = alpha & ndi.binary_dilation(~alpha) & light
        alpha &= ~edge_px
    l2, n2 = ndi.label(alpha, structure=np.ones((3, 3)))
    for i, s in enumerate(ndi.sum(alpha, l2, range(1, n2 + 1))):
        if s < 8: alpha[l2 == i + 1] = False
    return alpha


def crop(rgb, mask):
    ys, xs = np.where(mask)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    out = np.dstack([rgb[y0:y1, x0:x1], (mask[y0:y1, x0:x1] * 255).astype(np.uint8)])
    return out, (x0, y0, x1, y1)


def align_frames(arg, abg, regions):
    """regions: one (x0, y0, x1, y1) per frame of ONE animation. Every frame is pasted into a common canvas so that the base of the stone
    (lowest row, centre of its dark pixels) is the same point in all of them: the rock stays put while the lava moves."""
    fr = []
    sat = arg.max(axis=2).astype(int) - arg.min(axis=2)
    lum = arg.astype(int).sum(axis=2)
    for x0, y0, x1, y1 in regions:
        m = np.zeros_like(abg); m[y0:y1, x0:x1] = abg[y0:y1, x0:x1]
        ys, xs = np.where(m)
        yb = ys.max()
        low = np.zeros_like(m); low[max(0, yb - 24):yb + 1] = m[max(0, yb - 24):yb + 1]
        dark = low & (sat < 40) & (lum < 330)
        xb = int(round(np.where(dark)[1].mean())) if dark.any() else int(round(xs.mean()))
        fr.append((m, xb, yb))
    L = max(xb - np.where(m)[1].min() for m, xb, yb in fr); R = max(np.where(m)[1].max() + 1 - xb for m, xb, yb in fr)
    U = max(yb - np.where(m)[0].min() for m, xb, yb in fr)
    out = []
    for m, xb, yb in fr:
        cv = np.zeros((U + 1, L + R, 4), np.uint8)
        ys, xs = np.where(m)
        cv[ys - yb + U, xs - xb + L, :3] = arg[ys, xs]; cv[ys - yb + U, xs - xb + L, 3] = 255
        out.append(cv)
    return out


def lava():
    # ---- static rocks (white background)
    rgb = down2(ARC / 'lavarocks_sheet.png')
    alpha = key_background(rgb, rgb.min(axis=2) >= 222)
    lab, comps = components(alpha)

    def pick(seed, xr=None):
        sx, sy = seed
        cand = [c for c in comps if c['x0'] <= sx < c['x1'] and c['y0'] <= sy < c['y1'] and c['area'] > 40]
        c = min(cand, key=lambda c: (c['x1'] - c['x0']) * (c['y1'] - c['y0']))
        m = lab == c['id']
        if xr: m = m.copy(); m[:, :xr[0]] = False; m[:, xr[1]:] = False
        return m
    # rock number -> (seed point on the 512 px grid, optional x range when two rocks touch); None = comes from an animation (below)
    ST = [('slab', (45, 28), (0, 93)), ('hugeslab', (175, 55), (93, 999)), ('boulder', (339, 47), None), None, None, ('boulder2', (60, 150), (0, 124)),
          None, ('rubble', (187, 143), None), None, ('flat', (331, 125), None),
          ('yellow', (374, 129), None), ('spire2', (413, 139), None), ('spire3', (448, 134), None), ('spire4', (469, 124), None),
          ('spire5', (490, 141), None), ('cone', (442, 89), None), ('cone2', (491, 91), None), None,
          ('pile', (410, 200), None), ('craters', (485, 198), None), ('lavaslab', (22, 206), None), ('pebbles', (73, 201), None),
          ('stone', (121, 207), None), ('stone2', (167, 207), None), ('stone3', (217, 207), None), ('cracked', (279, 205), None),
          ('stone4', (321, 208), None), ('stone5', (347, 210), None)]
    # ---- animated rocks: dark background. (sheet, rock number or 'new', regions of the frames on the 512 px grid)
    def cells(rows, cols=((0, 128), (128, 258), (258, 386), (386, 512))):
        return [[(c0, r0, c1, r1) for c0, c1 in cols] for r0, r1 in rows]
    a1, a2 = down2(ARC / 'lavarocks_anim.png'), down2(ARC / 'lavarocks_anim2.png')
    k1 = key_background(a1, np.abs(a1.astype(int) - 21).max(axis=2) <= 8)
    k2 = key_background(a2, np.abs(a2.astype(int) - 21).max(axis=2) <= 8)
    pad = lambda b: (b[0] - 2, b[1] - 2, b[0] + b[2] + 2, b[1] + b[3] + 2)
    r1 = cells([(0, 90), (92, 174), (176, 286)])
    ANIM = [(3, a1, k1, r1[0], 0),                                   # big volcano with smoke
            ('new', a1, k1, r1[1], 0),                                # slab with a lava drip (a second, smaller slab)
            (4, a1, k1, r1[2], 0),                                    # twin crater mound
            ('new', a2, k2, [pad(b) for b in ([136, 6, 114, 67], [265, 6, 115, 68], [395, 4, 114, 69])], 0),            # cracked boulder, sparks
            (8, a2, k2, [pad(b) for b in ([24, 82, 81, 54], [153, 82, 82, 56], [281, 82, 84, 53], [411, 82, 81, 53])], 1),   # lava pouring over a boulder (back and forth)
            (6, a2, k2, [pad(b) for b in ([17, 148, 44, 72], [77, 146, 45, 74], [141, 148, 45, 72])], 0),             # lava spire, tip flaring
            (17, a2, k2, [pad(b) for b in ([323, 154, 56, 65], [387, 151, 56, 68], [450, 152, 55, 67])], 0)]          # small volcano with smoke
    sprites = [None] * len(ST)
    for i, d in enumerate(ST):
        if d is not None:
            sprites[i] = crop(rgb, pick(d[1], d[2]))[0]
    extra, anim, pingpong, newkinds = [], {}, [], []
    for k, arg, abg, regs, pp in ANIM:
        fr = align_frames(arg, abg, regs)
        if k == 'new': k = len(sprites); sprites.append(fr[0]); newkinds.append(k)
        else: sprites[k] = fr[0]
        anim[k] = (len(extra), len(fr) - 1); extra += fr[1:]
        if pp: pingpong.append(k)
    n = len(sprites)
    anim = {str(k): list(range(n + s, n + s + c)) for k, (s, c) in anim.items()}
    allspr = sprites + extra
    # ---- shelf packing into a 512 px wide atlas
    W = 512; x = y = rowh = 0; rects = []; place = []
    for sp in allspr:
        h, w = sp.shape[:2]
        if x + w + 1 > W: x = 0; y += rowh + 1; rowh = 0
        rects.append([x, y, w, h]); place.append((x, y)); x += w + 1; rowh = max(rowh, h)
    atlas = np.zeros((y + rowh, W, 4), np.uint8)
    for sp, (px, py) in zip(allspr, place):
        atlas[py:py + sp.shape[0], px:px + sp.shape[1]] = sp
    Image.fromarray(atlas, 'RGBA').save(OUT / 'lavarocks.png', optimize=True)
    kinds = {'big': [0, 1, 2, 5] + newkinds, 'crater': [3, 4, 15, 16, 17, 19], 'spire': [6, 7, 11, 12, 13, 14], 'mix': [8, 9, 10, 18, 20, 21, 22, 23, 24, 25, 26, 27]}
    save_entry('lavarocks', {'cols': 1, 'rects': rects, 'kinds': kinds, 'anim': anim, 'pp': pingpong, 'fps': 5, 'dry': [22, 23, 24, 26, 27]})
    print('lavarocks.png:', atlas.shape[1], 'x', atlas.shape[0], '|', n, 'rocks +', len(extra), 'animation frames |', len(anim), 'animated')


if __name__ == '__main__':
    todo = sys.argv[1:] or ['namek', 'lava']
    if 'namek' in todo: namek()
    if 'lava' in todo: lava()
