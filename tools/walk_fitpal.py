#!/usr/bin/env python3
"""walk frames -> only the colours of the idle palette: explicit pairs first, every other foreign colour to its nearest idle colour (Lab).
usage: walk_fitpal.py <idle_x4.png> '<json [[from],[to]] pairs>' <png ...>"""
import sys, json
import numpy as np
from PIL import Image
from skimage.color import rgb2lab
z = np.asarray(Image.open(sys.argv[1]).convert('RGB'))[::4, ::4].reshape(-1, 3)
pal = np.unique(z[~((z[:, 0] == 255) & (z[:, 1] == 0) & (z[:, 2] == 255))], axis=0); pl = rgb2lab(pal[None].astype(np.uint8))[0]
pairs = {tuple(a): tuple(b) for a, b in json.loads(sys.argv[2])}; S = {tuple(c) for c in pal.tolist()}
for f in sys.argv[3:]:
    a = np.asarray(Image.open(f).convert('RGBA')).copy(); a0 = a.copy(); n = 0   # masks from the original: the pairs apply all at once (no chains)
    cols = np.unique(a[a[..., 3] > 0][:, :3], axis=0)
    for c in cols.tolist():
        c = tuple(c)
        if c in pairs: to = pairs[c]
        elif c in S: continue
        else: to = tuple(pal[((pl - rgb2lab(np.array([[c]], np.uint8))[0][0]) ** 2).sum(1).argmin()].tolist())
        m = (a0[..., :3] == np.array(c)).all(2) & (a0[..., 3] > 0); a[m, :3] = to; n += int(m.sum())
    Image.fromarray(a).save(f); print(f, n)
