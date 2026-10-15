#!/usr/bin/env python3
"""Creates a blank sprite-sheet template for the game (7 frames in one row).
   python3 tools/make_sprite_template.py [out.png] [--mannequin] [--fw 64] [--fh 96]
   --mannequin adds a plain generic stick-figure so you can see scale and the walk/attack poses to replace.
Needs Pillow (pip install pillow)."""
import sys
from PIL import Image, ImageDraw

args = [a for a in sys.argv[1:] if not a.startswith('--')]
def opt(name, d):
    return int(sys.argv[sys.argv.index(name) + 1]) if name in sys.argv else d
fw, fh = opt('--fw', 64), opt('--fh', 96)
out = args[0] if args else 'sprite_template.png'
NAMES = ['0 idle', '1 walk', '2 walk', '3 walk', '4 walk', '5 wind-up', '6 thrust']
img = Image.new('RGBA', (fw * 7, fh), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
ax, ay = fw // 2, fh - 2                      # default anchor: feet, bottom centre
for i, n in enumerate(NAMES):
    x0 = i * fw
    d.rectangle([x0, 0, x0 + fw - 1, fh - 1], outline=(90, 160, 255, 200))
    d.line([x0 + ax, 0, x0 + ax, fh - 1], fill=(255, 255, 255, 60))          # centre line
    d.line([x0, ay, x0 + fw - 1, ay], fill=(255, 90, 90, 160))               # feet line
    d.text((x0 + 3, 2), n, fill=(255, 255, 255, 230))
    if '--mannequin' in sys.argv:
        k = fh / 96
        w = [0, 6, 0, -6, 0, -3, 5][i]                                       # leg swing
        a = [0, -4, 0, 4, 0, -10, 12][i]                                     # arm swing / reach
        col = (200, 200, 210, 255)
        def L(p, q, wd=3):
            d.line([x0 + ax + p[0] * k, p[1] * k, x0 + ax + q[0] * k, q[1] * k], fill=col, width=max(1, int(wd * k)))
        d.ellipse([x0 + ax - 9 * k, 22 * k, x0 + ax + 9 * k, 40 * k], outline=col, width=max(1, int(2 * k)))
        L((0, 40), (0, 64)); L((0, 46), (-10, 58 + a / 2)); L((0, 46), (12 + a, 54))
        L((0, 64), (-6 + w, 90)); L((0, 64), (6 - w, 90))
img.save(out)
print('wrote', out, f'({fw}x{fh} per frame, 7 frames, anchor {ax},{ay})')
