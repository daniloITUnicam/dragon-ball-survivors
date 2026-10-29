#!/usr/bin/env python3
"""Weapon effect sheets (AI art on a black background) -> assets/sprites/armi/wfx<id>.webp + sprites.json entries.
Usage: python3 tools/import_wfx.py "<folder with the .jpg/.png sheets>" [ids...]   (no ids = all of them)

The AI sheets are only roughly a grid: frames drift off their cell, some are wider than it, a row may hold fewer frames than the others.
So every row is cut by one of these layouts (SPEC 'lay', one letter per row, default 'g'):
  g  plain grid: cells of W/cols (the body of a beam, which is meant to tile edge to edge)
  c  the frames are found where the art is (columns with light, sparks merged into the nearest frame) and each one is centred in its cell
  l  same, the frame's left edge on the cell's left (beams that start from the hands: the start must not move from frame to frame)
  r  same, the right edge on the cell's right (the tip of a beam, the head of a comet: it must not jump)
  o  overlapping frames (an explosion wider than its cell): a round window on the cell centre, radius R x cell width, faded at the rim,
     and where two frames overlap each pixel fades toward the frame whose centre is nearer (no straight cut)
Options: ord = the order to play the frames in, n = frames in the row when the art has fewer than cols, pad = frames wider than their cell get a bigger cell instead of being cut:
the art is scaled down by pad inside the cell and pad goes in the metadata, so the game draws the cell pad times bigger (same size on screen).
Cut sides fade out (no square edges). The scale is the same for every frame: frame width in the game sheet / (W / cols) / pad.
A row with fewer frames than cols writes rc (frames per row) in the metadata; the hot spot (hx, hy) is the centre of the brightest
pixels of row 0, as a fraction of the frame."""
import sys, json, pathlib
from PIL import Image
import numpy as np
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT/'assets'/'sprites'/'armi'
SPEC = {   # id: (source file, columns, rows, frame width in the game sheet, options: band=(y0, y1) of the source, lay, R)
  'ki':      ('Colpo di ki.jpg', 8, 1, 160, {}),
  'homing':  ('Colpi Eccentrici.jpg', 8, 1, 160, {}),
  'javelin': ('Lancia Ribelle.jpg', 8, 2, 192, {}),
  'disc':    ('disco.jpg', 8, 1, 160, {}),
  'spirit':  ('Genkidama.jpg', 8, 1, 256, {}),
  'aura':    ('Aura.jpg', 8, 1, 320, {}),
  'flare':   ('Taiyoken.jpg', 8, 1, 288, {}),
  'slash':   ('Spada.jpg', 6, 1, 288, {'lay': 'c'}),
  'kame':    ('kamehameha.jpg', 8, 3, 256, {'lay': 'cgr'}),       # row 0 charge + muzzle, row 1 body tiles, row 2 the tip (6 frames)
  'dbeam':   ('Raggio Perforante.jpg', 6, 3, 256, {'lay': 'ggr'}),
  'bigbang': ('Attacco Big Bang.jpg', 8, 1, 256, {'band': (380, 960), 'lay': 'o', 'R': .56}),  # Vegeta - Big Bang Attack (charge 0-3, blast 4, ring 5-7)
  # character abilities (key R)
  'abff':    ('Lampo Finale.jpg', 4, 2, 320, {'lay': 'll', 'pad': 1}),     # Vegeta - Final Flash
  'abnova':  ('Supernova.jpg', 4, 2, 288, {'lay': 'cc'}),        # Frieza / Cooler - Supernova
  'abdb':    ('Raggio Letale.jpg', 8, 1, 256, {'band': (540, 800)}),   # Frost - Death Beam
  'absbc':   ('Raggio Speciale.jpg', 8, 1, 256, {'band': (470, 870), 'lay': 'l', 'n': 7, 'pad': 1}), # Piccolo - Special Beam Cannon (7 frames, the last one long)
  'abkib':   ('Lama di Ki.jpg', 8, 1, 256, {'band': (380, 980), 'lay': 'o', 'R': .62}),      # Goku Black - Ki Blade
  'abdodon': ('Raggio Dodon.jpg', 2, 4, 384, {'band': (212, 1157)}),   # Tenshinhan / Chiaotzu - Dodon Ray
  'abmasenko': ('Masenko.jpg', 4, 2, 320, {'lay': 'll', 'pad': 1}),        # Gohan - Masenko
  'abmeteor': ('Meteora Gigante.jpg', 4, 2, 320, {'lay': 'rr'}), # Broly - Gigantic Meteor (comet flying right)
}
BLACK = 16   # JPEG noise under this level is background
LIT = 40     # a column belongs to a frame when it has a few pixels brighter than this
def frames_of(m, cols):
    """x ranges of the frames of one row (m = brightest channel): runs of lit columns; small bits (sparks) go to the nearest frame
    until there are no more than cols"""
    occ = (m > LIT).sum(axis=0); on = occ > 2; W = len(on); s = []; i = 0
    while i < W:
        if not on[i]: i += 1; continue
        j = i
        while j < W and on[j:j+10].any(): j += 1
        s.append([i, j]); i = j
    while len(s) > cols:
        k = min(range(len(s)), key=lambda q: s[q][1]-s[q][0])
        if k == 0: n = 1
        elif k == len(s)-1: n = k-1
        else: n = k-1 if s[k][0]-s[k-1][1] < s[k+1][0]-s[k][1] else k+1
        a, b = sorted((k, n)); s[a] = [s[a][0], s[b][1]]; del s[b]
    return s
def alpha_of(cell):
    a = np.asarray(cell).astype(np.float32); m = a.max(axis=2); al = np.clip((m-BLACK)/(255-BLACK), 0, 1)
    rgb = np.where(al[..., None] > 0, np.clip(a/np.maximum(m[..., None], 1)*255, 0, 255), 0)
    return np.dstack([rgb, al*255])
def fade(px, sides, k=.07):
    """sides 'lrtb' that were cut: alpha goes to 0 over the last k of the frame"""
    h, w = px.shape[:2]; x = np.arange(w)[None, :]; y = np.arange(h)[:, None]; f = np.ones((h, w), np.float32)
    if 'l' in sides: f = np.minimum(f, np.clip(x/(k*w), 0, 1))
    if 'r' in sides: f = np.minimum(f, np.clip((w-1-x)/(k*w), 0, 1))
    if 't' in sides: f = np.minimum(f, np.clip(y/(k*h), 0, 1))
    if 'b' in sides: f = np.minimum(f, np.clip((h-1-y)/(k*h), 0, 1))
    px[..., 3] *= f; return px
def cut(src, cols, rows, fw, opt):
    im = Image.open(src).convert('RGB'); band = opt.get('band')
    if band: im = im.crop((0, band[0], im.width, band[1]))
    W, H = im.size; cw, ch = W/cols, H/rows; m_all = np.asarray(im).max(axis=2); lay = (opt.get('lay') or 'g').ljust(rows, 'g')
    def spans_of(r):
        y0, y1 = round(r*ch), round((r+1)*ch); mode = lay[r]
        if mode == 'g': return [(round(c*cw), round((c+1)*cw)) for c in range(cols)]
        if mode == 'o': return [(round((c+.5)*cw)-round(opt['R']*cw), round((c+.5)*cw)+round(opt['R']*cw)) for c in range(cols)]
        return [tuple(x) for x in frames_of(m_all[y0:y1], opt.get('n', cols))]
    allspans = [spans_of(r) for r in range(rows)]
    pad = 1.0
    if opt.get('pad') or 'o' in lay:   # the widest frame decides how much bigger the cell has to be
        pad = max([1.0]+[(b-a)/cw*1.02 for r in range(rows) if lay[r] != 'g' for a, b in allspans[r]])
    s = fw/cw/pad
    fh = max(1, round(fw*ch/cw)); out = Image.new('RGBA', (fw*cols, fh*rows)); rc = []; bx = []
    for r in range(rows):
        y0, y1 = round(r*ch), round((r+1)*ch); mode = lay[r]; spans = allspans[r]; fhr = max(1, round((y1-y0)*s))
        rc.append(len(spans))
        for c, (a, b) in enumerate(spans):
            if mode == 'o':   # a square around the cell centre (as tall as the row), shown through a round window
                R = (b-a)/2; cy = (y0+y1)/2
                crop = im.crop((a, round(cy-R), b, round(cy+R))); side = max(1, round(2*R*s))
                px = alpha_of(crop.resize((side, side), Image.LANCZOS))
                yy, xx = np.mgrid[0:side, 0:side]; d = np.hypot(xx-side/2, yy-side/2)/(side/2)
                own = d*R; near = np.full_like(own, 1e9)   # distance (source px) to this frame's centre and to the nearest other one
                for dc in (-1, 1):
                    if 0 <= c+dc < cols: near = np.minimum(near, np.hypot((xx-side/2)/s-dc*cw, (yy-side/2)/s))
                px[..., 3] *= np.clip((1-d)/.22, 0, 1)*np.clip((near-own)/(.18*cw)+.5, 0, 1)
                cell = Image.fromarray(px.astype(np.uint8), 'RGBA')
                out.alpha_composite(cell, (c*fw+(fw-cell.width)//2, r*fh+(fh-cell.height)//2)); bx.append(.5); continue
            ww = max(1, round((b-a)*s)); px = alpha_of(im.crop((a, y0, b, y1)).resize((ww, fhr), Image.LANCZOS))
            sides = ('t' if r > 0 and mode != 'g' else '')+('l' if mode == 'r' else '')   # a tip lies over the beam body: its left side always fades
            if mode != 'g' and ww > fw:   # wider than the cell: keep the side that matters, fade the cut one
                if mode == 'l': px = px[:, :fw]; sides += 'r'
                elif mode == 'r': px = px[:, ww-fw:]; sides += 'l'
                else: o = (ww-fw)//2; px = px[:, o:o+fw]; sides += 'lr'
                ww = fw
            if mode != 'g': px = fade(px, sides+('b' if r < rows-1 else ''), .05)
            x = c*fw+(0 if mode in 'gl' else fw-ww if mode == 'r' else (fw-ww)//2); bx.append(round((x-c*fw+ww/2)/fw, 3) if mode != 'g' else .5)
            out.alpha_composite(Image.fromarray(px.astype(np.uint8), 'RGBA'), (x, r*fh+(fh-fhr)//2))
    return out, fh, rc, pad, bx
def hot(sheet, fw, fh, cols):
    a = np.asarray(sheet).astype(np.float32); xs = ys = n = 0
    for c in range(cols):
        cell = a[:fh, c*fw:(c+1)*fw]; lum = cell[..., :3].mean(axis=2)*cell[..., 3]/255
        if lum.max() <= 0: continue
        yy, xx = np.nonzero(lum >= lum.max()*.85); xs += xx.mean(); ys += yy.mean(); n += 1
    return (round(xs/n/fw, 3), round(ys/n/fh, 3)) if n else (.5, .5)
def main():
    src = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
    js = ROOT/'assets'/'sprites'/'sprites.json'; meta = json.loads(js.read_text(encoding='utf8'))
    only = set(sys.argv[2:])
    for wid, (fn, cols, rows, fw, opt) in SPEC.items():
        if only and wid not in only: continue
        f = src/fn
        if not f.exists(): print('missing', fn); continue
        sheet, fh, rc, pad, bx = cut(f, cols, rows, fw, opt); hx, hy = hot(sheet, fw, fh, rc[0])
        sheet.save(OUT/f'wfx{wid}.webp', 'WEBP', quality=82, alpha_quality=90, method=6)
        m = {'cols': cols, 'fw': fw, 'fh': fh, 'rows': rows, 'hx': hx, 'hy': hy, 'ppu': 1, 'has': []}
        if any(n != cols for n in rc): m['rc'] = rc
        if pad > 1.001: m['pad'] = round(pad, 3)
        if any(v != .5 for v in bx): m['bx'] = bx   # centre of the art of every frame (row by row), as a fraction of the frame
        if opt.get('ord'): m['ord'] = opt['ord']
        meta[f'wfx{wid}'] = m
        print(f'wfx{wid}: {cols}x{rows} frames of {fw}x{fh}, frames per row {rc}, pad {pad:.2f}, hot spot {hx},{hy}, {(OUT/f"wfx{wid}.webp").stat().st_size//1024} KB')
    js.write_text(json.dumps(meta, separators=(',', ':')), encoding='utf8')
main()
