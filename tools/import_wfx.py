#!/usr/bin/env python3
"""Weapon effect sheets (AI art on a black background) -> assets/sprites/armi/wfx<id>.webp + sprites.json entries.
Usage: python3 tools/import_wfx.py "<folder with the .jpg/.png sheets>" [ids...]   (no ids = all of them)
Each source sheet is a regular grid (SPEC: file, columns, rows). Every cell is scaled to the target frame width, the black background
becomes transparency (alpha = brightest channel, colour un-premultiplied: on black it looks exactly like the source), and the cells are
packed again in the same grid. The hot spot (centre of the brightest pixels of row 0) is written as hx/hy so the game can put the core of
a projectile exactly where the projectile is."""
import sys, json, pathlib
from PIL import Image
import numpy as np
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT/'assets'/'sprites'/'armi'
SPEC = {   # id: (source file, columns, rows, frame width in the game sheet[, (y0, y1) band of the source to keep])
  'ki':      ('Colpo di ki.jpg', 8, 1, 160),
  'homing':  ('Colpi Eccentrici.jpg', 8, 1, 160),
  'javelin': ('Lancia Ribelle.jpg', 8, 2, 192),
  'disc':    ('disco.jpg', 8, 1, 160),
  'spirit':  ('Genkidama.jpg', 8, 1, 256),
  'aura':    ('Aura.jpg', 8, 1, 320),
  'flare':   ('Taiyoken.jpg', 8, 1, 288),
  'slash':   ('Spada.jpg', 6, 1, 288),
  'kame':    ('kamehameha.jpg', 8, 3, 256),
  'dbeam':   ('Raggio Perforante.jpg', 6, 3, 256),
  'bigbang': ('Attacco Big Bang.jpg', 8, 1, 256, (380, 960)),  # Vegeta - Big Bang Attack (charge 0-3, blast 4, ring 5-7)
  # character abilities (key R)
  'abff':    ('Lampo Finale.jpg', 4, 2, 320),            # Vegeta - Final Flash
  'abnova':  ('Supernova.jpg', 4, 2, 288),               # Frieza / Cooler - Supernova
  'abdb':    ('Raggio Letale.jpg', 8, 1, 256, (540, 800)),   # Frost - Death Beam
  'absbc':   ('Raggio Speciale.jpg', 8, 1, 256, (470, 870)), # Piccolo - Special Beam Cannon
  'abkib':   ('Lama di Ki.jpg', 8, 1, 256, (380, 980)),      # Goku Black - Ki Blade
  'abdodon': ('Raggio Dodon.jpg', 2, 4, 384),                # Tenshinhan / Chiaotzu - Dodon Ray
  'abmasenko': ('Masenko.jpg', 4, 2, 320),                   # Gohan - Masenko
  'abmeteor': ('Meteora Gigante.jpg', 4, 2, 320),            # Broly - Gigantic Meteor (comet flying right)
}
BLACK = 16   # JPEG noise under this level is background
def cut(src, cols, rows, fw, band=None):
    im = Image.open(src).convert('RGB')
    if band: im = im.crop((0, band[0], im.width, band[1]))
    W, H = im.size; cw, ch = W/cols, H/rows
    fh = max(1, round(fw*ch/cw)); out = Image.new('RGBA', (fw*cols, fh*rows))
    for r in range(rows):
        for c in range(cols):
            cell = im.crop((round(c*cw), round(r*ch), round((c+1)*cw), round((r+1)*ch))).resize((fw, fh), Image.LANCZOS)
            a = np.asarray(cell).astype(np.float32)
            m = a.max(axis=2); al = np.clip((m-BLACK)/(255-BLACK), 0, 1)
            rgb = np.where(al[..., None] > 0, np.clip(a/np.maximum(m[..., None], 1)*255, 0, 255), 0)
            px = np.dstack([rgb, al*255]).astype(np.uint8)
            out.paste(Image.fromarray(px, 'RGBA'), (c*fw, r*fh))
    return out, fh
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
    for wid, (fn, cols, rows, fw, *band) in SPEC.items():
        if only and wid not in only: continue
        f = src/fn
        if not f.exists(): print('missing', fn); continue
        sheet, fh = cut(f, cols, rows, fw, band[0] if band else None); hx, hy = hot(sheet, fw, fh, cols)
        sheet.save(OUT/f'wfx{wid}.webp', 'WEBP', quality=82, alpha_quality=90, method=6)
        meta[f'wfx{wid}'] = {'cols': cols, 'fw': fw, 'fh': fh, 'rows': rows, 'hx': hx, 'hy': hy, 'ppu': 1, 'has': []}
        print(f'wfx{wid}: {cols}x{rows} frames of {fw}x{fh}, hot spot {hx},{hy}, {(OUT/f"wfx{wid}.webp").stat().st_size//1024} KB')
    js.write_text(json.dumps(meta, separators=(',', ':')), encoding='utf8')
main()
