#!/usr/bin/env python3
"""Cleans single-pixel speckles of a converted walk frame: an opaque pixel whose colour none of its 4 neighbours shares, while 3+ of them agree
on another colour, takes that colour (the outline and the edge stay as they are). usage: walk_despeckle.py <png ...> (in place; run it on walk_1..N after walk_from_video.py / walk_from_strip.py)"""
import sys
import numpy as np
from PIL import Image
for f in sys.argv[1:]:
    a = np.asarray(Image.open(f).convert('RGBA')).copy(); h, w = a.shape[:2]; n = 0
    for _ in range(2):
        b = a.copy()
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                if a[y, x, 3] == 0: continue
                c = tuple(int(v) for v in a[y, x]); nb = [tuple(int(v) for v in a[y + j, x + i]) for j, i in ((0, 1), (0, -1), (1, 0), (-1, 0))]
                if any(q[3] == 0 for q in nb) or c in nb: continue
                if sum(c[:3]) < 60: continue                       # outline pixels stay
                best = max(set(nb), key=nb.count)
                if nb.count(best) >= 3: b[y, x] = best; n += 1
        a = b
    Image.fromarray(a).save(f); print(f, n)
