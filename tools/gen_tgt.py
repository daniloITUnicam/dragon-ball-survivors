#!/usr/bin/env python3
"""Cuts the four weapon-target panels (Closest / HP+ / HP- / Boss) out of assets/src/tgt_src.jpg and writes assets/tgt.webp:
four cells of CW x CH px side by side, transparent background (flood fill of the dark navy around each panel).
Usage: python3 tools/gen_tgt.py   (needs Pillow). The cell size goes into src/js/tgtart.js (TGT_CELL)."""
from pathlib import Path
from PIL import Image, ImageDraw
import sys
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT/'assets'/'src'/'tgt_src.jpg'
OUT = ROOT/'assets'/'tgt.webp'
CW, CH = 232, 240          # one cell of the atlas
# crop boxes on the 1792x2400 source, in game order: closest, most HP, least HP, boss
BOXES = [(10, 610, 870, 1510), (915, 610, 1780, 1510), (10, 1535, 870, 2400), (915, 1535, 1780, 2400)]
im = Image.open(SRC).convert('RGB')
atlas = Image.new('RGBA', (CW*4, CH), (0, 0, 0, 0))
for i, b in enumerate(BOXES):
    c = im.crop(b).convert('RGB')
    w, h = c.size
    M = (255, 0, 255)
    for seed in [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1)]:
        if c.getpixel(seed) != M:
            ImageDraw.floodfill(c, seed, M, thresh=34)
    px = c.load()
    a = Image.new('L', c.size, 255)
    ap = a.load()
    for y in range(h):
        for x in range(w):
            if px[x, y] == M:
                ap[x, y] = 0
    c = c.convert('RGBA'); c.putalpha(a)
    bb = c.getbbox()
    c = c.crop(bb)
    s = min((CW-4)/c.width, (CH-4)/c.height)
    c = c.resize((max(1, round(c.width*s)), max(1, round(c.height*s))), Image.LANCZOS)
    atlas.paste(c, (i*CW+(CW-c.width)//2, (CH-c.height)//2), c)
atlas.save(OUT, 'WEBP', quality=88, method=6)
print('wrote', OUT, atlas.size, OUT.stat().st_size, 'bytes; cell', CW, CH)
