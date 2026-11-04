#!/usr/bin/env python3
"""Painted ground textures of the planets: assets/sprites/terreni/<theme>ground.png (+ the entry in sprites.json).

  python3 tools/make_terrain.py [<folder with the painted images>] [--prev <folder>]

Input: one painted screenshot of the ground per planet (assets/sprites/_sorgenti/terreni/<theme>.(png|jpg) by default; names as in
SRC_NAMES are recognised too). Every image shows 10 tiles across (a tile = 64 world px). For each one:
  1. art grid: reduced to 32 art px per tile (1 art px = 2 world px, like the props), tiles made square;
  2. flatten: the slow light changes and the lighter / darker squares (the old checkerboard) are taken out - a median half a tile wide
     gives the local base colour (it keeps the hard steps of the squares), the image minus it plus the overall base is uniform;
  3. seamless: a window of GX x GY tiles is cut and its edges are cross-faded with what continues past them, so it repeats on all sides;
  4. the pixels within FLAT of the base colour become exactly the base (flat, clean ground; the details stay).
The game draws the texture in blocks of GX x GY tiles, mirrored at random per block column / row (Renderer.terrain), still without seams.
"""
import json, pathlib, re, sys
import numpy as np
from PIL import Image, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
SD = ROOT/'assets'/'sprites'
GX, GY = 9, 5          # tiles per texture block (the screenshots are 10 x 5.4 tiles)
ART = 32               # art px per tile
COLS_ACROSS = 10       # tiles across every source image
ASPECT = 283.5/275.2   # the screenshots were stretched: a tile is this much taller than wide
OV = .35               # cross-fade band, in tiles
FLAT = 5               # pixels this close to the base colour (max channel difference) become exactly the base: clean flat ground
# per planet: tiles per block (gx, gy) and where the window is cut (0 top .. 1 bottom); the sky image has lighter squares in its top two rows
CUT = {'sky': (GX, 3, 1.)}
SRC_NAMES = {'plains': r'sa[iy]+j?an|plain|pianur', 'namek': r'namek', 'waste': r'android|rovine|waste', 'other': r'buu?\b|bu\.|other',
             'redrock': r'vegeta|redrock', 'sky': r'dei|gods|sky|regn', 'beach': r'muten|beach|spiaggia', 'hell': r'infern|hell',
             'arena': r'arena|cell'}

def flatten(a):
    """a: HxWx3 float on the art grid. Removes everything wider than ~1/2 tile (gradients, lighter / darker squares) and keeps the mean
    colour: a median about half a tile wide gives the local base colour (it follows the hard steps of the squares, a blur would leave halos)"""
    bg = Image.fromarray(np.clip(a+.5, 0, 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(ART//2 | 1))
    bg = np.asarray(bg, np.float32)
    return a - bg + bg.reshape(-1, 3).mean(0)

def seamless(a, cw, ch, ow, oh):
    """a holds at least (ch+oh) x (cw+ow): returns ch x cw that repeats on all sides (edges cross-faded with what continues past them)"""
    a = a[:ch+oh, :cw+ow].copy()
    w = np.linspace(0, 1, ow, endpoint=False)[None, :, None]
    a[:, :ow] = a[:, cw:cw+ow]*(1-w) + a[:, :ow]*w; a = a[:, :cw]
    w = np.linspace(0, 1, oh, endpoint=False)[:, None, None]
    a[:oh] = a[ch:ch+oh]*(1-w) + a[:oh]*w
    return a[:ch]

def make(src, th):
    im = Image.open(src).convert('RGB'); px = im.width/COLS_ACROSS; py = px*ASPECT
    W, H = COLS_ACROSS*ART, int(im.height/py*ART)                    # the whole image on the art grid, tiles square
    a = flatten(np.asarray(im.resize((W, H), Image.BOX), np.float32))
    gx, gy, cy = CUT.get(th, (GX, GY, .5))
    cw, ch, ow = gx*ART, gy*ART, round(OV*ART)
    if cw+ow > W or ch+ow > H: sys.exit(f'{src.name}: too small for {gx}x{gy} tiles')
    x0, y0 = (W-cw-ow)//2, int((H-ch-ow)*cy)
    a = seamless(a[y0:, x0:], cw, ch, ow, ow)
    base = np.median(a.reshape(-1, 3), 0)
    a[np.abs(a-base).max(2) < FLAT] = base
    return Image.fromarray(np.clip(a+.5, 0, 255).astype(np.uint8)), gx, gy

def main():
    args = sys.argv[1:]; prev = None
    if '--prev' in args: i = args.index('--prev'); prev = pathlib.Path(args[i+1]); del args[i:i+2]
    src = pathlib.Path(args[0]) if args else SD/'_sorgenti'/'terreni'
    out = SD/'terreni'; out.mkdir(parents=True, exist_ok=True)
    js = json.loads((SD/'sprites.json').read_text(encoding='utf8'))
    for f in sorted(src.iterdir()):
        if f.suffix.lower() not in ('.png', '.jpg', '.jpeg', '.webp'): continue
        th = next((t for t, rx in SRC_NAMES.items() if f.stem == t or re.search(rx, f.stem.lower())), None)
        if not th: print('skipped', f.name, '(planet not recognised)'); continue
        t, gx, gy = make(f, th); sid = th + 'ground'; t.save(out/(sid + '.png'), optimize=True)
        js[sid] = {'cols': 1, 'gx': gx, 'gy': gy}
        print(f'{f.name} -> terreni/{sid}.png {t.width}x{t.height}')
        if prev:   # 3x2 blocks mirrored like in the game, at 2 px per art px: to check seams and repetition
            prev.mkdir(parents=True, exist_ok=True); c = Image.new('RGB', (t.width*3, t.height*2))
            for by in range(2):
                for bx in range(3):
                    b = t.transpose(Image.FLIP_LEFT_RIGHT) if bx == 1 else t
                    c.paste(b.transpose(Image.FLIP_TOP_BOTTOM) if by else b, (bx*t.width, by*t.height))
            c.resize((c.width*2, c.height*2), Image.NEAREST).save(prev/(th + '.png'))
    (SD/'sprites.json').write_text(json.dumps(js, ensure_ascii=False, separators=(',', ':')), encoding='utf8')

if __name__ == '__main__': main()
