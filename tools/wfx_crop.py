"""Crop boxes of the weapon effect sheets: for every cell of every assets/sprites/armi/wfx*.webp the box of its visible pixels
(alpha > 0, 1 px of margin for the bilinear filter, clamped to the cell) goes in sprites.json as 'cb' = [x0, y0, x1, y1, ...] in
pixels of the cell, row by row (cell r * cols + c). WFX draws only that part of a frame: the same picture, without filling the
transparent rest of the cell (40% fewer pixels on average). Empty cells get [0, 0, 0, 0] (nothing is drawn).
Run after changing a sheet by hand; tools/import_wfx.py runs it on what it writes.
  python3 tools/wfx_crop.py [wfx<id> ...]"""
import sys, json, pathlib
from PIL import Image
import numpy as np
ROOT = pathlib.Path(__file__).resolve().parent.parent
ARMI = ROOT/'assets'/'sprites'/'armi'


def boxes(im, fw, fh, cols, rows):
    a = np.asarray(im.convert('RGBA'))[:, :, 3]
    out = []
    for r in range(rows):
        for c in range(cols):
            cell = a[r*fh:(r+1)*fh, c*fw:(c+1)*fw]
            ys, xs = np.nonzero(cell)
            if not len(xs): out += [0, 0, 0, 0]; continue
            out += [max(0, int(xs.min())-1), max(0, int(ys.min())-1), min(cell.shape[1], int(xs.max())+2), min(cell.shape[0], int(ys.max())+2)]
    return out


def refresh(meta, ids=None):
    for sid, m in meta.items():
        if not sid.startswith('wfx') or (ids and sid not in ids): continue
        f = ARMI/(sid + '.webp')
        if not f.exists() or not m.get('fw') or not m.get('fh'): continue
        m['cb'] = boxes(Image.open(f), m['fw'], m['fh'], m.get('cols', 1), m.get('rows', 1))


if __name__ == '__main__':
    js = ROOT/'assets'/'sprites'/'sprites.json'; meta = json.loads(js.read_text(encoding='utf8'))
    refresh(meta, set(sys.argv[1:]) or None)
    js.write_text(json.dumps(meta, separators=(',', ':')), encoding='utf8')
    print('crop boxes:', sum(1 for k, m in meta.items() if k.startswith('wfx') and 'cb' in m), 'sheets')
